#!/usr/bin/env python3
"""Distribute canonical.md: copy body as-is, replace existing files, rename per product."""

from __future__ import annotations

import argparse
import difflib
import shutil
import sys
from pathlib import Path

HOME = Path.home()
SKILL_ROOT = Path(__file__).resolve().parent.parent
CANONICAL = SKILL_ROOT / "references" / "canonical.md"

CURSOR_FRONTMATTER = """\
---
description: 全局协作规则 — 回复风格 + Session Receipt
alwaysApply: true
---

"""

# rename: dest filename per product. Body is canonical bytes (Cursor prepends mdc header only).
TARGETS = {
    "claude": HOME / ".claude" / "CLAUDE.md",
    "cursor": HOME / ".cursor" / "rules" / "global.mdc",
}


def original() -> str:
    return CANONICAL.read_text(encoding="utf-8")


def payload(name: str) -> str:
    text = original()
    if not text.endswith("\n"):
        text += "\n"
    if name == "cursor":
        return CURSOR_FRONTMATTER + text
    return text


def replace_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink() or path.exists():
        path.unlink()
    path.write_text(content, encoding="utf-8")


def status() -> int:
    print(f"canonical: {CANONICAL}")
    rc = 0
    for name, path in TARGETS.items():
        want = payload(name)
        if not path.exists():
            print(f"MISSING {name}: {path}")
            rc = 1
            continue
        if path.is_symlink():
            print(f"SYMLINK {name}: {path} -> {path.resolve()}")
            rc = 1
            continue
        ok = path.read_text(encoding="utf-8") == want
        print(f"{'OK' if ok else 'DRIFT'} {name}: {path}")
        if not ok:
            rc = 1
    return rc


def apply() -> None:
    for name, path in TARGETS.items():
        replace_file(path, payload(name))
        print(f"copied → {path.name}: {path}")


def diff() -> None:
    for name, path in TARGETS.items():
        want = payload(name).splitlines(keepends=True)
        got = path.read_text(encoding="utf-8").splitlines(keepends=True) if path.exists() else []
        delta = list(difflib.unified_diff(got, want, fromfile=str(path), tofile=f"canonical→{path.name}"))
        print("".join(delta) if delta else f"no diff: {name}")


def main() -> None:
    p = argparse.ArgumentParser(description="Copy canonical.md into Claude / Cursor globals")
    p.add_argument("cmd", choices=["status", "apply", "diff"])
    args = p.parse_args()
    if not CANONICAL.exists():
        print(f"missing {CANONICAL}", file=sys.stderr)
        sys.exit(2)
    if args.cmd == "status":
        sys.exit(status())
    if args.cmd == "diff":
        diff()
        return
    apply()
    shutil.copytree(SKILL_ROOT, HOME / ".agents" / "skills" / "global-rules", dirs_exist_ok=True)


if __name__ == "__main__":
    main()
