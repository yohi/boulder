# Project Boulder: The Sisyphus-Native Architecture

**Version:** 1.0.1 (Refined / Based on Momus Review)
**Codename:** "Push the Rock"
**Target:** Cursor IDE (Composer / Agent)
**Philosophy:** "Immutability, Reproducibility, & Zero-Inference"

## 1. コンセプト: Project Boulder とは

**Project Boulder** は、AIエージェントフレームワーク `oh-my-opencode` (OMO) の強力な資産を、Cursor IDE という「脳」に直結させるための統合アーキテクチャである。

その名は、シーシュポス（Sisyphus）が永遠に転がし続ける「岩（Boulder）」に由来する。
開発における「検証・修正・再検証」という重厚な無限ループを、AI任せにするのではなく、**「厳格なルール」と「強靭なツール」によって確実に前に進める（Push）** ことを目的とする。

## 2. ディレクトリ構成 (The Boulder Structure)

Boulder の実体は、**プロジェクトのルートディレクトリ**の `.cursor/` 内に配置し、Gitでバージョン管理する。これにより、チーム全体で「不屈の精神」とルールを共有・再現（Reproducibility）する。

> **Note:** プロジェクトごとの挙動の一貫性を保証するため、必ず**リポジトリ内配置 (`<Project Root>/.cursor/rules`)** とする。

```text
<Your Project Root>/     <-- Target Project (Git Repo)
├── .cursor/
│   └── rules/
│       ├── boulder-sisyphus.mdc      # [Prefix for safety & sorting]
│       └── boulder-tool-ast-grep.mdc
├── scripts/
│   └── boulder-doctor.ts     # [Health Check Script]
├── package.json              # [Dependencies: "oh-my-opencode"]
├── node_modules/
│   └── oh-my-opencode/
└── ...
```

## 3. ルール定義 (The Boulder Laws)

### 3.1 `boulder-sisyphus.mdc` (Identity Layer)

シーシュポスとしての人格と、"Ralph Loop"（思考・実行・検証のループ）を強制する最重要プロトコル。
ファイル名に `boulder-` プレフィックスを付与することで、他のルールとの衝突を避けつつ、フラット配置での確実な読み込みを保証する。

```markdown
---
description: "Boulder Protocol: Identity, Ralph Loop, and Constraints. ALWAYS ACTIVE."
globs: 
  - "**/*"
alwaysApply: true
---

# Identity: Sisyphus (Project Boulder)

You are **Sisyphus**, a Senior Software Engineer AI powering Project Boulder.
Your mission is to "Push the Rock" — complete difficult tasks through relentless verification.

## 1. The Ralph Loop (Verification Protocol)
You must adhere to this loop. **SHOW EVIDENCE IN STRICT FORMAT.**

1.  **Plan:** List steps clearly.
2.  **Act:** Modify the code.
3.  **Verify (Critical):**
    - **MUST RUN** one of the following immediately after changes (in order of preference):
      1. `bun test` (if tests exist)
      2. `bun run build` (to check compilation)
      3. `bun run lint` (minimal syntax check)
    - ❌ **BAN:** "It should work", "I verified it" (without logs).
    - ✅ **MUST:** Show the actual terminal logs using this format:
      ```text
      Command: [command used]
      ExitCode: [0 or 1]
      Output:
      [Paste actual terminal output here. Do not Hallucinate.]
      ```
    - If it fails, fix it yourself (max 3 retries). Do not ask permission.

## 2. Constraints
- **No External Server:** Do not spawn OpenCode servers. Use CLI tools directly via `bun run`.
- **No Background Tasks:** Do not use background processes unless explicitly requested.

```

### 3.2 `boulder-tool-ast-grep.mdc` (Muscle Layer)

既存の `ast-grep` ツールを「Boulderの筋肉」として定義し、Windows環境での自己修復手順を組み込む。

````markdown
---
# Description must be explicitly empty string or text to avoid parser errors
description: "Structural search tool using ast-grep"
globs: 
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
alwaysApply: false
---

# Tool: ast-grep (Boulder Edition)

Use this tool for structural code search instead of regex `grep`.

## Usage Policy
- **Environment:** Execute via `bun run` to avoid command collisions.
- **Output:** Always request `--json` for precise parsing.

## Commands

Use the following syntax in the terminal (Project Local Execution):

```bash
# Pattern Search
bun run oh-my-opencode ast-grep --pattern "class $NAME { $$$ }" --json

# API Usage Search
bun run oh-my-opencode ast-grep --pattern "console.log($$$)" --json
```

## Troubleshooting (Self-Healing)

### 1. General Failure

If execution fails, verify that `oh-my-opencode` is installed in the project:

```bash
bun add -D oh-my-opencode
```

### 2. Windows / Binary Issues

If you encounter `EPERM` or binary loading errors on Windows, run this in PowerShell:

```powershell
# Relocate cache to avoid permission locks, then reinstall
$env:BUN_INSTALL_CACHE_DIR="C:\bun-cache"
bun pm cache rm
bun install
```
````

## 4. 運用ワークフロー (Pushing the Rock)

### Step 1: 初期化 (Boulder Doctor)

チーム全員が同じ状態で「岩」を押し始めるための、完全な環境診断スクリプト。
Windows/Mac/Linux 全対応のため、ワンライナーではなくファイル (`scripts/boulder-doctor.ts`) として作成・実行する。

**`scripts/boulder-doctor.ts`**:
```typescript
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

console.log("🪨 Project Boulder Doctor Checking...");
console.log(`✅ Bun Version: ${Bun.version}`);

const run = (cmd: string[], cwd = process.cwd()) => {
  try {
    const p = Bun.spawnSync(cmd, { 
      cwd,
      stdout: "pipe", 
      stderr: "pipe", 
    });
    const dec = new TextDecoder();
    return { 
      exitCode: p.exitCode, 
      text: dec.decode(p.stdout) + dec.decode(p.stderr) 
    };
  } catch (e) {
    return { exitCode: 1, text: String(e) };
  }
};

// Check 1: ast-grep tool (Muscle Check)
{
  // Try bun run first
  const r = run(["bun", "run", "oh-my-opencode", "ast-grep", "--version"]);
  
  if (r.exitCode !== 0 || !/ast-grep/i.test(r.text)) {
    console.error("❌ Muscle Atrophy: ast-grep FAILED (Dependency missing or Corrupted)");
    console.error("   -> Try: bun add -D oh-my-opencode");
    console.error("   -> Or:  bun pm cache rm && bun install");
    console.error(`   -> Log: ${r.text}`);
    process.exit(1);
  }
  console.log("✅ Muscle Check: ast-grep OK");
}

// Check 2: Test/Build Runner (Reflex Check)
{
  const packageJsonPath = join(process.cwd(), "package.json");
  if (!existsSync(packageJsonPath)) {
      console.error("❌ Fatal: package.json not found in root.");
      process.exit(1);
  }

  let pkg: any;
  try {
      pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  } catch (e) {
      console.error("❌ Fatal: package.json is invalid JSON.");
      process.exit(1);
  }

  const scripts = pkg.scripts || {};
  const hasTest = !!scripts.test;
  const hasBuild = !!scripts.build;

  if (hasTest) {
    // Verify it actually runs
    const probeTest = "boulder-probe.test.ts";
    writeFileSync(probeTest, "import { test } from 'bun:test'; test('probe', () => {});");
    const testRun = run(["bun", "test", probeTest]);
    unlinkSync(probeTest);

    if (testRun.exitCode === 0) {
        console.log("✅ Reflex Check: Test script detected and runner is alive.");
    } else {
        console.warn("⚠️ Reflex Check: 'test' script exists but runner failed.");
    }
  } else if (hasBuild) {
     console.log("⚠️ Reflex Check: No 'test' script, but 'build' script detected.");
  } else {
    console.error("❌ Reflex Check: Neither 'test' nor 'build' scripts found in package.json.");
    console.error("   -> Sisyphus needs a way to verify his work.");
    process.exit(1);
  }
}

console.log("🪨 All Systems Green. Ready to Push.");
```

実行コマンド:
```bash
# 1. Install Dependencies
bun install --frozen-lockfile

# 2. Run Doctor
bun run scripts/boulder-doctor.ts
```

### Step 2: 開発実行

1. **Composer (Cmd+I) を開く。**

2. **対象ファイルをチャットに追加 (`@src/index.ts`)。**
   * `.cursor/rules/` 配下のルール (`boulder-tool-ast-grep.mdc` など) がコンテキストに応じて適用される。

3. **指示を出す:**
   > 「このバグを修正せよ。検証ログを見せろ。」

## 5. 結び

**Project Boulder** は、あなたのローカル環境に「不屈の精神」をインストールします。
サーバーも、複雑なセットアップも不要です。ただ `.cursor/` を**プロジェクトルート**に配置し、必要なツールをインストールするだけです。

さあ、岩を転がしましょう。
**"One must imagine Sisyphus happy."**
