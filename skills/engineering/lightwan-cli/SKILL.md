---
name: lightwan-cli
description: 用 CLI + HTTP 手动连接/断开 LightWAN SD-WAN 客户端，免 GUI 交互。当用户要连接/断开 LightWAN、或 GUI 连不上而需要命令行控制时使用。
---

# LightWAN CLI 手动控制

连接/断开本机 LightWAN（贝斯达 SD-WAN）客户端。核心是两条腿，**缺一不可**：

1. **orch HTTP 连接事件**——先告诉服务端"本机要连接"，隧道才会被放行。只起数据面不调这个接口，服务端立刻下发 `enable=0`（日志：`Orch forcibly disconnects`）。
2. **UDS 控制命令**——`lightwan -D` 向守护进程（root）发命令，启停数据面进程。

所有凭据从配置文件读取，不硬编码：序列号/token 在 `~/.config/LightWAN/setting.conf`（`SERIAL`/`TOKEN`），客户 ID 在 `/opt/apps/com.lightwan/files/cpeagent.conf`（`customerid`）。

## 连接

### 1. 读取配置

```bash
SERIAL=$(grep '^SERIAL=' ~/.config/LightWAN/setting.conf | cut -d= -f2)
TOKEN=$(grep '^TOKEN=' ~/.config/LightWAN/setting.conf | cut -d= -f2)
CUSTOMERID=$(grep '^customerid=' /opt/apps/com.lightwan/files/cpeagent.conf | cut -d= -f2)
```

### 2. 调 orch 连接事件接口

```bash
curl -sS -X POST "https://orch.bestsdwan.com/api/mobile/v2/connect" \
  -H "sn: $SERIAL" -H "customerId: $CUSTOMERID" \
  -H "X-LW-AUTH-HEADER: $TOKEN" -H "type: linux" \
  -H "Content-Type: application/json" \
  -d '{"supportHttps":true,"supportHeartBeat":true,"supportIpFilterDownloadUrlV2":true,"supportCheckToken":true,"deviceModel":"linux","mobileVersion":"6.1.20","sn":"'"$SERIAL"'","deviceSupportMode":"native","internalIp":"'"$(ip -4 -o addr show | awk '$4 !~ /^127\./ {print $4}' | head -1)"'","mobileActionLogType":1}'
```

成功标志：HTTP 200，返回体含 `lanAssignIp`。失败看错误码（见边界情况表）。

### 3. 启动数据面

```bash
/opt/apps/com.lightwan/files/lightwan -D -p /opt/apps/com.lightwan/files -S "$SERIAL" -T "$TOKEN" start
```

守护进程 fork 出 datapath + agent，agent 读 `cpeagent.conf` 登录 comm 服务器。

### 4. 验证连接

```bash
grep -aE 'CONNECTED -> UP' /opt/apps/com.lightwan/files/lightwan_datapath.log | tail -1   # 隧道 UP
grep -aE 'LinkNotify.*Link UP' /opt/apps/com.lightwan/files/lightwan_datapath.log | tail -3   # 链路 UP
grep -aE 'Agent is in status' /opt/apps/com.lightwan/files/lw_agent.log | tail -1        # agent 心跳
ip link show tun99
```

## 断开

### 1. 本地停止数据面

```bash
/opt/apps/com.lightwan/files/lightwan -D -p /opt/apps/com.lightwan/files stop
```

守护进程依次停 datapath → agent，`tun99` 删除。这条命令就是 GUI 断开按钮内部执行的命令。

### 2. orch 断开通知（可选但推荐）

```bash
curl -sS -X POST "https://orch.bestsdwan.com/api/mobile/v2/disconnect" \
  -H "sn: $SERIAL" -H "customerId: $CUSTOMERID" \
  -H "X-LW-AUTH-HEADER: $TOKEN" -H "type: linux" \
  -H "Content-Type: application/json" \
  -d '{"customerId":'"$CUSTOMERID"',"mobileVersion":"6.1.20","sn":"'"$SERIAL"'","mobileActionLogType":1}'
```

成功标志：`{"success":true}`。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| orch 返回 1000/1003（内部错误/并发超限） | 账号在线数超限：让用户关闭其他设备的同账号会话，重启 agent 再连 |
| orch 返回 1040（clientVersionLow） | 请求体缺 `mobileVersion` 或 `deviceModel` 值不对：填 `"6.1.20"` 和 `"linux"`（不是设备型号名） |
| orch 返回 1025（token 失效） | 告知用户需打开 GUI 重新登录获取新 token，无法纯 CLI 续期 |
| 隧道反复 `INIT -> PROBE -> DOWN`，链路全 Down | 同账号其他会话未关：先 `stop`，关掉其他会话后重新走连接流程 |
| `lightwan -D` 报错或 UDS 连不上 | 检查 `lightwan_serviced` 服务是否在跑（systemctl status com.lightwan.service） |
| tun99 没有 IPv4 地址 | 正常现象：本地模式是纯用户态 NFQUEUE 引擎，虚拟 IP 只在数据面内部 |
| GUI 还开着且显示"已断开" | CLI 连接不受影响；但之后在 GUI 里点连接/断开可能覆盖 CLI 会话，提醒用户二选一 |
| 序列号/token 从配置文件读不到 | 用户从未登录过 GUI：先让用户用 GUI 登录一次生成配置 |

## Checkpoint

- **断开前必须确认**：断开会中断用户当前 VPN 连接，先问用户再执行。
- **token 失效**时停下来告知用户，不尝试绕过鉴权。
- 连接过程本身是用户明确要求的行为，自主执行完再汇报。

## 完成条件

- 连接：orch 返回 200 且含 `lanAssignIp`；datapath/agent 进程在跑；日志出现 `[CONNECTED -> UP]` 且链路 `Link UP`；`tun99` 存在。
- 断开：datapath/agent 进程消失、`tun99` 删除、orch 返回 `{"success":true}`。

## 参考

协议细节、逆向过程、常见坑的完整说明见 [blog.md](blog.md)。
