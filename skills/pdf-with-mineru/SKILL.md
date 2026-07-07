---
name: pdf-with-mineru
description: 用本地 MinerU（~/codes/MinerU）把 PDF 转成 markdown 再读取内容。当用户要读取、解析、提取、总结、引用 PDF 内容，或消息中出现 .pdf 路径或 PDF 附件时使用。
---

# PDF with MinerU

读 PDF 时，先调用本地 MinerU 把 PDF 转成 markdown，再读 markdown 内容做事。不要直接用文本提取工具硬读 PDF（漏图、漏表格），也不要凭空猜 PDF 内容。

MinerU 仓库在 `~/codes/MinerU`。`pyproject.toml` 的 `[project.scripts]` 定义了 CLI 入口 `mineru = "mineru.cli.client:main"`。具体可调参数和 demo 见 `~/codes/MinerU/demo/demo.py`。

## 步骤

### 1. 确认输入与 CLI 可用

- 拿到 PDF 的**绝对路径**。用户给相对路径或文件名，先 `Path(...).expanduser().resolve()` 扩展，并确认文件存在、后缀是 `.pdf`。
- `which mineru` 验证 CLI 已安装；为空则停下来提示用户安装（见边界情况）。

### 2. 调用 mineru 转 markdown

默认参数即可覆盖大多数中文文档场景：

```bash
mineru -p <pdf 绝对路径> -o ./.mineru-out/<pdf-stem> -b hybrid-engine -m auto -l ch
```

要点：

- `-b hybrid-engine` 是默认 backend，速度/精度平衡；扫描件可改 `pipeline` 或 `vlm-engine`。
- `-m auto` 让 MinerU 自选文本提取或 OCR；明确文本型 PDF 用 `txt`，纯扫描件用 `ocr`。
- `-l ch` 默认中文；其他语言用对应代码（合法值见 `mineru --help`）。
- 公式 `-f`、表格 `-t`、图片分析 `--image-analysis` 默认开启，一般不用动。
- 输出目录建议 `./.mineru-out/<pdf-stem>/`（当前工作目录下），不污染源码树。`.gitignore` 由用户自己管。
- 大文件想分页用 `-s <start> -e <end>`（0-based，含端点）。
- 用户已有 mineru-api 服务在跑，传 `--api-url http://127.0.0.1:<port>` 复用，跳过自起服务。

精确参数和更多示例见 `~/codes/MinerU/demo/demo.py` 注释；不必复制 demo 自己写脚本。

### 3. 读 markdown 做事

转换结束后从输出目录里找 `*.md`（位置一般是 `<output_dir>/<stem>/<backend>/<method>/<stem>.md`，以实际产出为准）。引用、总结、提取段落都从 markdown 走，不要回头再碰原始 PDF。

### 4. 中间产物

默认保留输出供后续参考；如不应留中间产物，任务结尾提示用户是否删除 `./.mineru-out/`。

## 边界情况

| 情况 | 处理方式 |
|------|----------|
| `which mineru` 为空 | 提示用户在 `~/codes/MinerU` 下 `uv sync` 或 `pip install -e .` 安装后再试，不要自己乱改 PATH |
| PDF 路径不存在或不是 .pdf | `Path(...).expanduser().resolve()` 后 `assert exists`；缺失或后缀不对则问用户要正确路径 |
| PDF 受密码保护 | mineru 直接拒绝；停下来问用户密码或换无密码版本 |
| 转换失败报模型未下载 | 提示用户跑 `mineru-models-download`，或设置 `MINERU_MODEL_SOURCE=modelscope`（见 `~/codes/MinerU/demo/demo.py` 注释） |
| 转换失败报缺 GPU / 缺依赖 | 把 mineru 的报错原样转给用户，不擅自改 backend 或换实现 |
| 输出目录已有同名文件 | 让 mineru 自己处理；不要预先 `rm -rf` 用户的目录 |
| 任务要的不是内容而是元数据（页数、作者等） | 本 skill 不擅长，告诉用户走别的工具 |

## Checkpoint

- `mineru` 未安装、PDF 不存在/后缀错、PDF 加密：停下来告知用户，不自行安装或解密。
- 其余情况（CLI 可用、路径正常）转完再汇报。

## 完成条件

- `./.mineru-out/<pdf-stem>/` 下产出 markdown
- agent 已读到 markdown 内容并基于它继续后续工作