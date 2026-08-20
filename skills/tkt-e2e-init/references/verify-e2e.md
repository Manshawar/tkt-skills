# Verify E2E — 回归测试平台使用

e2e/ 初始化完成后,后续的用例查看、触发跑、结果留痕走 `tkt test` 平台(全局 CLI,多项目共享)。

## 命令(`tkt test`)

| 命令 | 行为 |
| --- | --- |
| `tkt test init <路径>` | 生成 e2e/ 骨架 + 追加 .gitignore + 登记项目 |
| `tkt test run [项目] [-g 分组]` | 跑项目用例(按 cwd 或显式项目名定位),归档;`-g` 只跑某分组 |
| `tkt test list` | 列已登记项目 + 最近一轮红绿 |
| `tkt test scan` | 自动发现 searchRoots 下含 e2e/ 的项目 |
| `tkt test config add/remove/list <dir>` | 自由增删自动发现的搜索根 |
| `tkt test ui` | 打开平台 UI(`/test`) |

跑前先装依赖:`pnpm --dir <项目>/e2e install`,并填 `e2e/.env` 的 `MIDSCENE_MODEL_*` 四项。

## 平台 UI(`/test`)

- 项目选择器(每个项目显示最近红绿)+ 重新扫描
- 左:用例清单按分组/优先级(spec 用例名 × cases.json)
- 右:触发跑(分组按钮 + 跑全量)、进度条、最新一轮红绿 + 失败理由 + midscene 报告链接、历史格子(每用例最近几轮)
- 用例清单 5s 自动刷新(项目里新增/改动用例自动跟上)
- 搜索根目录管理(增删,配合「重新扫描」发现新项目)

## 归档(`~/.config/tkt/test/runs/`)

```
~/.config/tkt/test/runs/<项目>/run-<ts+pid>/
├── result.json       # git 元数据 + 版本快照 + 每用例红绿/失败理由/报告链接
├── raw-report.json   # playwright json 原始输出
└── report/           # 失败用例的 midscene HTML 报告
```

保留最近 50 轮。平台 UI 聚合读归档展示各项目历史。

## 测试环境(被测功能依赖本机服务时)

被测功能若依赖本机常驻服务(如 tkt 平台页 `/test` 依赖 tkt ui API 38471),e2e 测该模块时需**同时起该服务**——playwright 的 `webServer` 只起被测试前端。服务未起时,依赖 API 的 P1 用例会 `skip`,P0 确定性用例照常绿。

## 约定

- `playwright.config.ts` 的 reporter 配 midscene **separate** + json 固定输出(**不要**用 CLI `--reporter` 覆盖——会重置 midscene 为 merged、删 per-test 报告):
  ```ts
  reporter: [
    ['list'],
    ['@midscene/web/playwright-reporter', { type: 'separate' }],
    ['json', { outputFile: 'midscene_run/last-run.json' }],
  ]
  ```
  `separate` 保留 per-test 报告(平台按用例挂报告链接);json 固定路径供平台跑完解析归档。config 内 json 的 `outputFile` 优先于 `PLAYWRIGHT_JSON_OUTPUT_NAME` env。
- cases.json 必选:每个 spec 用例名登记分组/优先级,平台才可按分组触发。
