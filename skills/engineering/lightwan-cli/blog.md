# 用 CLI 手动连接/断开 LightWAN SD-WAN 客户端

> Linux 桌面端无头操作 LightWAN（贝斯达 SD-WAN 移动 CPE）的完整方案。
> 从逆向进程架构到最终可复现的两条命令 + 两个 HTTP 请求。

## 背景

LightWAN 是贝斯达（bestsdwan）的 SD-WAN 移动客户端，桌面版是个 Qt GUI 应用。正常情况下连接/断开都靠点击 GUI 完成，但存在两个痛点：

1. **无显示环境**下 GUI 不可交互（Qt 甚至会 fallback 到 offscreen 假屏幕）
2. GUI 的自动化接口（AT-SPI 无障碍树）是**空的**，驱动不了按钮

经过逆向分析，发现客户端底层有一套完整的 CLI + HTTP 控制通道，完全可以绕开 GUI 手动控制。

## 进程架构

```
┌─ LightWAN (GUI, 用户态) ────── Qt 界面；调 orch HTTP 接口；发 UDS 控制命令
├─ lightwan_serviced (root) ──── 服务守护进程；fork 子进程；UDS 控制服务器
├─ lightwan_datapath (root) ──── 数据面（用户态 NFQUEUE 引擎，纯用户态转发）
└─ lightwan_agent (root) ─────── 代理；与 comm 服务器通信；下发隧道配置
```

关键点：`/opt/apps/com.lightwan/files/lightwan` **一个二进制身兼多职**：

- 服务守护进程（systemd ExecStart 运行它，fork 出 `lightwan_serviced`）
- CLI 控制引擎（`-D` 命令行模式，向守护进程发命令）
- 数据面引擎（`-e` 模式，被守护进程 fork 成 `lightwan_datapath`）

## 控制通道：抽象 Unix 域套接字

GUI 和 CLI 都通过抽象套接字 **`@cfg.service.lightwan`** 与守护进程通信（文件系统里看不到，`ss -x` 或 `/proc/net/unix` 里可见）。

从二进制（未 strip，带符号）反汇编 `LW_BaseCfgUdsServerRequest_STRING` + `_LWEnv_ServiceCommandHandler` 得到完整命令集：

| 命令 | 作用 |
|------|------|
| `start` | 启动 datapath + agent 进程 |
| `stop` | 停止 datapath + agent 进程 |
| `exit` | 退出守护进程 |
| `quit` | 退出（另一入口） |
| `meminfo` | 打印内存统计（调试用） |
| 含 `agent` 的串 | 转发给 cpeagent 模块解析 |

> 有意思的发现：GUI 自己的断开按钮（`DlgMain::stopDP`）内部就是 `QProcess` 执行 `lightwan -D stop`——和我们用 CLI 完全一样。

## 连接方案（两条腿缺一不可）

### ① orch HTTP「连接事件」——告诉服务端"我要连接"

服务端（orch）有在线状态管理：**必须先调 HTTP 接口声明连接意图，隧道才会被放行**。只启动 agent 不调这个接口，服务端会立刻下发 `enable=0`（日志：`Orch forcibly disconnects`）。

```
POST https://orch.bestsdwan.com/api/mobile/v2/connect
Headers:
  sn: <序列号>
  customerId: <客户ID>
  X-LW-AUTH-HEADER: <token>
  type: linux
  Content-Type: application/json

Body:
{"supportHttps":true,"supportHeartBeat":true,"supportIpFilterDownloadUrlV2":true,
 "supportCheckToken":true,"deviceModel":"linux","mobileVersion":"6.1.20",
 "sn":"<序列号>","deviceSupportMode":"native","internalIp":"192.168.1.103/24",
 "mobileActionLogType":1}
```

成功返回 200 + 完整连接配置（含 `lanAssignIp`、`commuServerAddr`、`remoteIps` 等）。

### ② 本地启动数据面

```bash
cd /opt/apps/com.lightwan/files
./lightwan -D -p /opt/apps/com.lightwan/files \
  -S <序列号> -T <token> start
```

守护进程 fork 出 datapath + agent，agent 读取 `cpeagent.conf` 登录 comm 服务器，隧道建立：

```
[PROBE -> CONNECTED]   ← 隧道探测成功
[CONNECTED -> UP]      ← 隧道 UP
[LinkNotify] Type=32[Link UP]  ← 三条链路全部 UP
```

### 参数来源

序列号和 token 都存在 `~/.config/LightWAN/setting.conf`：

```ini
SERIAL=00D9A0D9830A435ED1276C6D82114E33
TOKEN=afe1e2d715c9446ab79b7a1ea23b1d68
USERNAME=15211166832
CUSTOMERID=212920001
```

客户 ID 与 comm 地址在 `/opt/apps/com.lightwan/files/cpeagent.conf`。

## 断开方案

### ① 本地停止数据面

```bash
./lightwan -D -p /opt/apps/com.lightwan/files stop
```

守护进程依次停止 datapath → agent，`tun99` 接口被删除。整个过程几秒内完成：

```
stop datapath process...
health monitor received datapath-exit signal.
stop agent process...
health monitor received agent-exit signal.
```

### ② orch HTTP 断开通知（可选但推荐）

```
POST https://orch.bestsdwan.com/api/mobile/v2/disconnect
（Headers 同上）

Body:
{"customerId":212920001,"mobileVersion":"6.1.20",
 "sn":"<序列号>","mobileActionLogType":1}

→ {"success":true}
```

另外还有一个 `/api/mobile/v2/signout` 端点（GUI 退出登录时用，同样的 headers）。

## 常见问题排查

### 隧道一直 `INIT -> PROBE` 然后 `PROBE -> DOWN`

链路全 Down、隧道每 30 秒重建失败。典型原因：**账号并发在线数超限**（服务端错误码 1003 `MOBILE_LIMITATION_FOR_ACCOUNT`）。另一个设备/客户端还挂着同一账号的会话。解决：关掉其他会话后重启 agent：

```bash
./lightwan -D -p /opt/apps/com.lightwan/files stop   # 先停
# 再走一遍「连接方案」
```

### orch 返回 1040 "clientVersionLow"

请求体里必须带 `mobileVersion`（如 `"6.1.20"`），且 `deviceModel` 字段的值要符合服务端 `TerminalType` 枚举（填 `linux`，不是设备型号名）。

### 为什么 tun99 上没有 IPv4？

这是**正常现象**。移动 CPE「本地模式」下数据面是纯用户态 NFQUEUE 引擎（iptables mangle 把流量导进 NFQUEUE，数据面自己封装/解封装），虚拟 IP（`172.30.x.x`）只存在于数据面内部状态：

```
Virtual IP set to 172.30.5.137 LocalIp set to 192.168.1.103.
```

`{type:6, vpnIntfIp}` 通知只是给 GUI 显示用的。

## 关键命令速查

```bash
LW=/opt/apps/com.lightwan/files/lightwan
DIR=/opt/apps/com.lightwan/files
SERIAL=00D9A0D9830A435ED1276C6D82114E33     # 从 setting.conf 取
TOKEN=afe1e2d715c9446ab79b7a1ea23b1d68      # 从 setting.conf 取

# 连接
curl -sS -X POST https://orch.bestsdwan.com/api/mobile/v2/connect \
  -H "sn: $SERIAL" -H "customerId: 212920001" \
  -H "X-LW-AUTH-HEADER: $TOKEN" -H "type: linux" \
  -H "Content-Type: application/json" \
  -d '{"supportHttps":true,"supportHeartBeat":true,"supportIpFilterDownloadUrlV2":true,"supportCheckToken":true,"deviceModel":"linux","mobileVersion":"6.1.20","sn":"'"$SERIAL"'","deviceSupportMode":"native","internalIp":"192.168.1.103/24","mobileActionLogType":1}'
$LW -D -p $DIR -S $SERIAL -T $TOKEN start

# 断开
$LW -D -p $DIR stop
curl -sS -X POST https://orch.bestsdwan.com/api/mobile/v2/disconnect \
  -H "sn: $SERIAL" -H "customerId: 212920001" \
  -H "X-LW-AUTH-HEADER: $TOKEN" -H "type: linux" \
  -H "Content-Type: application/json" \
  -d '{"customerId":212920001,"mobileVersion":"6.1.20","sn":"'"$SERIAL"'","mobileActionLogType":1}'
```

## 验证连接状态

```bash
# 隧道状态
grep -aE 'CONNECTED -> UP' /opt/apps/com.lightwan/files/lightwan_datapath.log | tail -1
# 链路状态
grep -aE 'LinkNotify' /opt/apps/com.lightwan/files/lightwan_datapath.log | tail -3
# agent 心跳
grep -aE 'Agent is in status' /opt/apps/com.lightwan/files/lw_agent.log | tail -1
# 接口
ip link show tun99
```

## 注意事项

1. **token 会过期**：`X-LW-AUTH-HEADER` 里的 token 失效后（错误码 1025 `AUTH_WITHOUT_PSW_FAILED`），需要重新打开 GUI 登录获取新 token
2. **并发限制**：同一账号同时在线的客户端数量受限，别在多个设备上同时连
3. **与 GUI 的冲突**：GUI 还开着时，如果它显示"已断开"，用 CLI 连接没问题；但之后若在 GUI 里点连接/断开，GUI 会按自己的状态走，可能覆盖 CLI 建立的会话
4. **需要 root**：`lightwan` 控制命令走 UDS，虽然普通用户能连上套接字，但 start/stop 的实际 fork 由 root 守护进程完成

---

*逆向工具链：`strings` + `nm` + `objdump -d`（二进制未 strip）、`/proc/net/unix`（UDS 枚举）、`ss`/`lsof`（套接字归属）、应用日志（`ui.log`/`lightwan_serviced.log` 泄露了大量协议细节）。*
