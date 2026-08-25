# JIRA 表单字段与技术要点

「已修复」工作流内联表单的字段 id、取值、以及 agent-browser 操作细节。2026-08-25 在 LXAPP-17278/17275 实操验证。内网地址用 `<JIRA_BASE>` 占位，实际值从 `~/.tkt/jira.json` 读。

## 字段映射

| 字段 | select id / 元素 | 取值 | 操作 |
| --- | --- | --- | --- |
| 解决结果 * | `#resolution` | `FIXED` | JS 设值 |
| 是否历史BUG * | `#customfield_14900` | `否` | JS 设值 |
| 问题分类 * | `#customfield_13933` | `正常编码缺陷`（按 bug 类别选） | JS 设值 |
| Bug责任人 | `#customfield_12205` | 可选 | — |
| BUG原因分类 | `#customfield_20708` | 可选 | — |
| 引入版本 | `#customfield_12211` | 可选 | — |
| 修复的版本 | `#fixVersions-textarea`（输入） | 项目版本名 | 输入+选建议 |
| Bug出现原因 * | label 定位的 textbox | 根因 | `agent-browser fill` |
| 修复方法 * | label 定位的 textbox | 改了什么 | `agent-browser fill` |
| 影响范围 * | label 定位的 textbox | 影响面 | `agent-browser fill` |
| 备注（开始处理） | `#comment` | 处理说明 | `agent-browser fill` 或 JS |

> `*` = 必填。带 label 的文本字段 id 可能变化，用 `div.field-group > label` 文本定位。

## 下拉操作（JS，勿点 option）

JIRA 下拉（aui-select）直接点 option 会报 `CDP error (DOM.getBoxModel): Could not compute box model`。用 JS：

```js
function setSel(id, text) {
  var sel = document.querySelector('select#' + id);
  for (var i = 0; i < sel.options.length; i++) {
    if (sel.options[i].text === text) {
      sel.value = sel.options[i].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
  }
}
setSel('resolution', 'FIXED');
setSel('customfield_14900', '否');
setSel('customfield_13933', '正常编码缺陷');
```

## 修复版本选择器（frother multiselect）

`select#fixVersions` 是隐藏的多选，UI 是 `#fixVersions-multi-select`（textarea 输入 + 建议列表）。流程：

1. 聚焦 `#fixVersions-textarea`，输入版本名（如「车辆调度」）
2. 等 `#fixVersions-suggestions` 出现建议 li
3. 点建议 li（JS `li.click()`）
4. 验证：`select#fixVersions` 有选中项 且 chip 显示版本名

```js
var ta = document.querySelector('#fixVersions-textarea');
ta.value = '车辆调度';
ta.dispatchEvent(new Event('input', { bubbles: true }));
ta.dispatchEvent(new Event('keyup', { bubbles: true }));
// wait, then:
document.querySelector('#fixVersions-suggestions li').click();
```

## 文本字段定位

表单内带 label 的文本框，id 动态。定位方式：

```js
document.querySelectorAll('div.field-group').forEach(function (fg) {
  var lab = fg.querySelector('label');
  if (lab && lab.textContent.indexOf('Bug出现原因') > -1) {
    var inp = fg.querySelector('input[type=text], textarea');
    // inp.value = '...'; inp.dispatchEvent(new Event('input', {bubbles:true}));
  }
});
```

也可用 agent-browser 的 `snapshot -i` 拿到 textbox ref 后 `fill`。

## 状态与错误验证

- 状态徽章：`.jira-issue-status-lozenge` 的 `textContent`（New / 已分配 / 已解决）
- 提交被拦：`.aui-message-error` 有文本（如「问题分类 is required.」）→ 补填对应字段重提
- 提交成功：状态徽章变「已解决」且无错误消息

## 登录

JIRA 与 WIKI 共用同一套账号密码（agent-browser auth vault 已有 `wiki-qianxin` profile，见 `~/.tkt/jira.json` 的 `authProfile`）。无 session 时：

```bash
agent-browser auth login <authProfile> --url "<JIRA_BASE>/login.jsp"
# 若未自动跳转，需手动点登录按钮
```
