#!/usr/bin/env node
// 全局规则同步: ~/.claude/CLAUDE.md(正本) → cursor 镜像 global.mdc;
// manshawar 本机另加 tkt-skills 留档(~/.claude/skills/global-rules-sync 目录执行即本机)。
// 用法: node scripts/sync.mjs [--dry-run]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const home = homedir();
const canonPath = `${home}/.claude/CLAUDE.md`;
const cursorPath = `${home}/.cursor/rules/global.mdc`;

const dryRun = process.argv.includes("--dry-run");

const canon = readFileSync(canonPath, "utf8").trimEnd();

const frontmatter = [
  "---",
  "description: 全局协作规则 — 回复风格 + Session Receipt",
  "alwaysApply: true",
  "---",
  "",
].join("\n");

const targets = [
  { name: "Cursor", path: cursorPath, content: frontmatter + canon + "\n" },
];
// 仅 manshawar 本机补 tkt-skills 留档(纯正文); 他人安装无该目录则跳过
const TKT_HOME = "/Users/manshawar/utils/tkt-skills";
if (existsSync(`${TKT_HOME}/global`)) {
  targets.push({
    name: "tkt-skills",
    path: `${TKT_HOME}/global/CLAUDE.md`,
    content: canon + "\n",
  });
}

for (const { name, path, content } of targets) {
  let old = "";
  if (existsSync(path)) old = readFileSync(path, "utf8");

  if (old === content) {
    console.log(`[${name}] 无变化  ${path}`);
    continue;
  }

  const action = old === "" ? "新建" : "更新";
  if (dryRun) {
    console.log(`[${name}] 将${action}  ${path}`);
    if (old !== "") {
      const tmp = `${tmpdir()}/global-rules-sync-${name.replaceAll(" ", "-")}`;
      writeFileSync(tmp, content);
      try {
        execFileSync("diff", ["-u", path, tmp], { stdio: "inherit" });
      } catch {
        // diff 退出码 1 = 有差异，输出已打印
      }
    }
    continue;
  }

  writeFileSync(path, content);
  console.log(`[${name}] 已${action}  ${path}`);
}

console.log(dryRun ? "dry-run 完成，未写入" : "同步完成");
