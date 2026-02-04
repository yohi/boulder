# Boulder: Sisyphus-Native Architecture

**Version:** 10.0.0 (Obsidian Edition / Final)
**Target:** Cursor IDE (Composer / Agent)
**Philosophy:** "Immutability, Reproducibility, & Zero-Inference"

## 1. エグゼクティブサマリー

本設計は、AIエージェントフレームワーク `oh-my-opencode` (OMO) の既存資産を、Cursor IDE上でネイティブかつ極めて堅牢に動作させるための統合仕様である。

## 2. ディレクトリ構成（Standard: Direct Integration）

パス解決の事故を防ぐため、リポジトリルートに `.cursor/` を直接配置する構成を標準とする。このディレクトリはGit管理対象とし、チーム全員に同じ「Sisyphusの脳」を配布する。

```text
oh-my-opencode/  <-- Project Root
├── .cursor/                  # [New] Cursor設定（Gitコミット必須）
│   └── rules/
│       ├── 00-sisyphus.mdc   # Core Protocol (Always Apply)
│       └── tool-ast-grep.mdc # Tool Skill (Auto-Attach via Globs)
├── src/                      # [Existing] ツール群（そのまま利用）
│   └── tools/
│       └── ast-grep/
├── package.json              # [Existing] 依存関係定義
└── ...

```

## 3. ルール定義 (.cursor/rules/*.mdc)

### 3.1 `00-sisyphus.mdc` (Core Identity)

Sisyphusの人格、検証プロセス、および禁止事項を定義する。`alwaysApply: true` により、すべてのセッションで常駐させる。

```markdown
---
description: "Sisyphus Core Protocol: Identity, Ralph Loop, and Constraints. ALWAYS ACTIVE."
globs: 
  - "**/*"
alwaysApply: true
---

# Sisyphus Protocol

You are "Sisyphus", a Senior Software Engineer AI.
Strictly adhere to the following protocol.

## 1. The Ralph Loop (Verification is King)
All tasks must follow this cycle. SHOW EVIDENCE.

1.  **Plan:** List steps.
2.  **Act:** Modify code.
3.  **Verify (Critical):**
    - Run `bun test` or build command.
    - ❌ **BAN:** "It should work", "I verified it" (without logs).
    - ✅ **MUST:** Show the actual terminal logs/output.
    - If it fails, fix it yourself (max 3 retries). Do not ask permission.

## 2. Constraints
- **No External Server:** Do not spawn OpenCode servers. Use CLI tools directly.
- **No Background Tasks:** Do not use background processes unless explicitly requested.

```

### 3.2 `tool-ast-grep.mdc` (Code Analysis Skill)

`ast-grep` ツールの使用方法とトラブルシューティングを定義する。
**重要:** `description` を空に設定し、`globs` にマッチした際（ファイルがコンテキストに追加された際）に確実にAuto-Attachさせる。

````markdown
---
# Leave description empty to ensure Auto-Attach works based on globs.
description:
globs: 
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
alwaysApply: false
---

# Tool: ast-grep usage

Use this tool for structural code search instead of regex `grep`.

## Usage Policy
- **Environment:** Execute via `bun run` to avoid `sg` command collision.
- **Output:** Always request `--json` for better parsing.

## Commands

Use the following syntax in the terminal:

```bash
# Pattern Search
bun run src/tools/ast-grep/cli.ts --pattern "class $NAME { $$$ }" --json

# API Usage Search
bun run src/tools/ast-grep/cli.ts --pattern "console.log($$$)" --json
```

## Troubleshooting

### 1. General Failure

If execution fails, verify dependencies:

```bash
bun install
```

### 2. Windows / Binary Issues

If you encounter `EPERM` or binary loading errors on Windows, run this in PowerShell:

```powershell
# Relocate cache to avoid permission issues, then reinstall
$env:BUN_INSTALL_CACHE_DIR="C:\bun-cache"
bun pm cache rm
bun install
```

````

## 4. 導入・運用フロー (The Obsidian Workflow)

### Step 1: 環境セットアップ (Reproducible Setup)

チーム全員が同一の依存関係ツリーを利用するため、`--frozen-lockfile` の使用を推奨する。

Cursorのターミナルで以下を実行：

```bash
# 1. 依存関係インストール (再現性重視)
bun install --frozen-lockfile

# 2. Sisyphus Doctor (Obsidian Edition)
# 以下のコマンドを一括コピー＆ペーストして実行
bun -e '
console.log("🩺 Sisyphus Doctor Checking...");
console.log(`✅ Bun Version: ${Bun.version}`);

const dec = new TextDecoder();

function run(cmd) {
  // SIGKILL & maxBuffer でハングアップとバッファ溢れを防止
  const p = Bun.spawnSync(cmd, { 
    stdout: "pipe", 
    stderr: "pipe", 
    timeout: 15000, 
    killSignal: "SIGKILL", 
    maxBuffer: 1024 * 1024 
  });
  const out = dec.decode(p.stdout ?? new Uint8Array());
  const err = dec.decode(p.stderr ?? new Uint8Array());
  return { exitCode: p.exitCode, text: out + err };
}

// Check 1: ast-grep tool (Identity Check)
{
  const r = run(["bun", "run", "src/tools/ast-grep/cli.ts", "--version"]);
  
  // exit code 0 以外、または出力に実体名が含まれない場合は失敗とみなす
  if (r.exitCode !== 0 || !/ast-grep/i.test(r.text)) {
    console.error("❌ ast-grep Tool: FAILED (Collision or Corrupted)");
    // ルール内のトラブルシューティングと整合した復旧コマンドを案内
    console.error("   -> Try: bun pm cache rm && bun install");
    console.error(r.text);
    process.exit(1);
  }
  console.log("✅ ast-grep Tool: OK");
}

// Check 2: bun test available
{
  const r = run(["bun", "test", "--help"]);
  if (r.exitCode !== 0) {
    console.error("❌ Test Runner: FAILED");
    console.error(r.text);
    process.exit(1);
  }
  console.log("✅ Test Runner: OK");
}

console.log("✅ Doctor: ALL GREEN");
'

```

### Step 2: コンテキストの読み込み (Explicit Trigger)

1. **Composer (Cmd+I) を開く。**
2. 作業対象のファイルをチャットに追加する（例: `@src/cli/index.ts`）。
* *Note:* これにより `tool-ast-grep.mdc` が自動的に Attach される（コンテキスト欄下部に表示）。

### Step 3: フォールバック（もしルールが読み込まれない場合）

UIにルールが表示されない場合でも内部的に有効な場合が多いが、確実性を期す場合は手動で追加する。

* **入力:** `@.cursor/rules/tool-ast-grep.mdc`

### Step 4: 開発実行

Sisyphusへの指示例：

> 「このファイルのバリデーションロジックを修正して。Ralph Loopに従い、検証ログを必ず提示すること。」
