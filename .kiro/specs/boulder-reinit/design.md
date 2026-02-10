# Design: boulder-reinit

## 概要

本ドキュメントは `requirements.md` で定義された要件を満たすための技術設計を記述する。

---

## アーキテクチャ概要

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           Host Machine                                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    ~/.config/boulder/                           │    │
│  │                    (グローバル配置)                              │    │
│  │                                                                 │    │
│  │  ├── bin/boulder          # CLI エントリーポイント              │    │
│  │  ├── scripts/                                                   │    │
│  │  │   ├── boulder-init.ts  # init コマンド                       │    │
│  │  │   └── boulder-doctor.ts # doctor コマンド                    │    │
│  │  └── rules/                                                     │    │
│  │      ├── boulder-sisyphus.mdc                                   │    │
│  │      └── boulder-tool-ast-grep.mdc                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              │ symlink                                  │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      <Project>/                                 │    │
│  │                                                                 │    │
│  │  ├── .cursor/rules/ ──────→ ~/.config/boulder/rules/            │    │
│  │  ├── .devcontainer/devcontainer.json                            │    │
│  │  ├── biome.json                                                 │    │
│  │  └── package.json (depends on oh-my-opencode)                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────────────────┐  ┌─────────────────────────┐          │
│  │       Devcontainer          │  │      Host Runtime       │          │
│  │    (検証環境 / Verification) │  │    (実運用 / Production)│          │
│  └──────────────────────────────┘  └─────────────────────────┘          │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐                               │
│  │   Cursor IDE    │  │   Claude Code   │                               │
│  │   (Composer)    │  │     (CLI)       │                               │
│  └─────────────────┘  └─────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
```

**用途の分離**:

| 環境 | 用途 | コマンド例 |
|------|------|-----------|
| **Devcontainer** | 検証（lint, test） | `bun run check`, `bun test` |
| **ホスト環境** | 実運用 | `bun run start`, 本番コマンド |

---

## コンポーネント設計

### 0. Boulder Init コマンド (FR-6) [NEW]

**ファイル**: `~/.config/boulder/scripts/boulder-init.ts`

**処理フロー**:

```text
boulder init [--force]
     │
     ▼
┌─────────────────────────────────────┐
│ 1. カレントディレクトリがプロジェクトか確認 │
│    - package.json の存在確認         │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 2. .cursor/rules/ の状態確認         │
│    - 存在しない → 作成               │
│    - ファイルあり → 確認プロンプト    │
│    - シンボリックリンク済み → スキップ │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 3. シンボリックリンク作成             │
│    - Linux/macOS: ln -s            │
│    - Windows: mklink /D            │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ 4. boulder doctor 実行               │
└─────────────────────────────────────┘
```

**実装方針**:

```typescript
#!/usr/bin/env bun
import { existsSync, lstatSync, symlinkSync, mkdirSync, rmSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";

const BOULDER_HOME = join(homedir(), ".config", "boulder");
const RULES_SOURCE = join(BOULDER_HOME, "rules");
const TARGET_DIR = ".cursor";
const RULES_TARGET = join(TARGET_DIR, "rules");

async function main() {
  const force = process.argv.includes("--force");
  const cwd = process.cwd();

  try {
    // 1. プロジェクト確認
    if (!existsSync(join(cwd, "package.json"))) {
      console.error("❌ package.json not found. Is this a project directory?");
      process.exit(1);
    }

    // 2. .cursor ディレクトリ作成
    if (!existsSync(TARGET_DIR)) {
      mkdirSync(TARGET_DIR, { recursive: true });
    }

    // 3. 既存の rules 確認
    if (existsSync(RULES_TARGET)) {
      const stat = lstatSync(RULES_TARGET);
      if (stat.isSymbolicLink()) {
        console.log("✅ Already linked to Boulder rules.");
        return;
      }
      if (!force) {
        console.error("⚠️  .cursor/rules/ already exists.");
        console.error("   Use --force to overwrite.");
        process.exit(1);
      }
      rmSync(RULES_TARGET, { recursive: true });
    }

    // 4. シンボリックリンク作成
    const symlinkType = process.platform === "win32" ? "junction" : "dir";
    symlinkSync(RULES_SOURCE, RULES_TARGET, symlinkType);
    console.log(`✅ Linked: ${RULES_TARGET} → ${RULES_SOURCE}`);

    // 5. Doctor 実行
    const doctor = Bun.spawn(["bun", "run", join(BOULDER_HOME, "scripts", "boulder-doctor.ts")]);
    const exitCode = await doctor.exited;
    if (exitCode !== 0) {
      throw new Error(`boulder doctor failed with exit code ${exitCode}`);
    }
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
```

**CLI エントリーポイント** (`bin/boulder`):

> **注記**: グローバル配置の `bin/boulder` と `~/.config/boulder/scripts/boulder-doctor.ts` は将来的に実装予定です。  
> 現状は `package.json` の `doctor` スクリプトがプロジェクトローカルの `scripts/boulder-doctor.ts` を呼び出します。

```typescript
#!/usr/bin/env bun
import { join } from "path";
import { homedir } from "os";

const BOULDER_HOME = join(homedir(), ".config", "boulder");
const command = process.argv[2];

(async () => {
  switch (command) {
    case "init":
      await import(join(BOULDER_HOME, "scripts", "boulder-init.ts"));
      break;
    case "doctor":
      await import(join(BOULDER_HOME, "scripts", "boulder-doctor.ts"));
      break;
    default:
      console.log("Usage: boulder <command>");
      console.log("Commands:");
      console.log("  init    Initialize Boulder in current project");
      console.log("  doctor  Check environment health");
  }
})();
```

### 1. Devcontainer 設定 (FR-1)

**ファイル**: `.devcontainer/devcontainer.json`

| 設定項目 | 値 | 根拠 |
|---------|-----|------|
| `image` | `oven/bun:latest` | Bun 公式イメージ、軽量で最適化済み (FR-1.1) |
| `features.git` | `ghcr.io/devcontainers/features/git:1` | バージョン管理に必須 (FR-1.3) |
| `postCreateCommand` | `bun install` | 依存関係の自動インストール (FR-1.2) |
| `remoteUser` | `bun` | 公式イメージのデフォルトユーザー |

**起動方法**:

```bash
# 方法 1: devcontainer CLI（推奨）
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . bun run doctor

# 方法 2: Docker CLI
docker run -it --rm -v $(pwd):/workspace -w /workspace oven/bun:latest /bin/bash
```

**エディタ統合（任意）**:

エディタは問わない。Neovim, Vim, Cursor, VS Code 等で利用可能。
自動フォーマットが必要な場合は、各エディタで以下のように設定：

| エディタ | 設定方法 |
|---------|---------|
| Neovim | `BufWritePre` autocmd で `bunx biome check --write` を実行 |
| VS Code | Biome 拡張機能 + `formatOnSave: true` |
| Cursor | VS Code と同様 |

---

### 2. Biome 設定 (FR-2)

**ファイル**: `biome.json`

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

**設計判断**:

| 項目 | 選択 | 理由 |
|------|------|------|
| インデント | 2 spaces | 業界標準、TypeScript プロジェクトで一般的 |
| クォート | double | JSON との一貫性 |
| セミコロン | always | 明示的で安全 |
| 推奨ルール | enabled | バランスの取れたデフォルト |

---

### 3. Package.json Scripts (FR-2, FR-3, FR-4)

**更新箇所**: `package.json`

| スクリプト | コマンド | 要件マッピング |
|-----------|---------|---------------|
| `test` | `bun test` | FR-3.1 |
| `lint` | `biome lint .` | FR-2.3 |
| `format` | `biome format --write .` | FR-2.4 |
| `check` | `biome check --write .` | FR-2.5 |
| `doctor` | `bun run scripts/boulder-doctor.ts` | FR-4.1 |

> **注記**: `doctor` は現状プロジェクトローカル配置。グローバル配置への移行は将来的に実装予定。

---

### 4. Boulder Doctor 更新 (FR-4)

**ファイル**: `scripts/boulder-doctor.ts` (プロジェクトローカル配置)

> **注記**: 現状はプロジェクトローカルに配置。グローバル配置（`~/.config/boulder/scripts/boulder-doctor.ts`）への移行は将来的に実装予定です。

**追加チェック項目**:

| チェック | コマンド | 成功条件 |
|---------|---------|---------|
| Biome 存在確認 | `bunx biome --version` | ExitCode 0 |
| Biome Lint 動作 | `bunx biome lint --max-diagnostics=0 .` | ExitCode 0 |
| ast-grep 動作 | `bun run oh-my-opencode ast-grep --version` | ExitCode 0, 出力に "ast-grep" 含む |
| Test Runner 動作 | `bun test` (probe file) | ExitCode 0 |

**実装方針**:
```typescript
// Biome Check (新規追加)
{
  const r = run(["bunx", "biome", "--version"]);
  if (r.exitCode !== 0) {
    console.error("❌ Biome not found or broken");
    console.error("   -> Try: bun add -D @biomejs/biome");
    process.exit(1);
  }
  console.log("✅ Biome Check: OK");
}
```

---

### 5. MDC ルール更新 (FR-3)

**ファイル**: `.cursor/rules/boulder-sisyphus.mdc`

**変更内容**:

Ralph Loop の検証コマンドを更新:

```diff
- 1. `bun test` (if tests exist)
- 2. `bun run lint` (minimal syntax check)
+ 1. `bun run check` (Biome lint + format)
+ 2. `bun test` (if tests exist)
```

---

## ファイル構成 (変更後)

### グローバル配置 (~/.config/boulder/)

```text
~/.config/boulder/
├── bin/
│   └── boulder             # [FUTURE] CLI エントリーポイント（将来実装）
├── scripts/
│   ├── boulder-init.ts     # [FUTURE] init コマンド（将来実装）
│   └── boulder-doctor.ts   # [FUTURE] グローバル版（将来実装）
├── rules/
│   ├── boulder-sisyphus.mdc      # [UPDATE] Biome 統合
│   └── boulder-tool-ast-grep.mdc
├── package.json            # Boulder 本体の依存関係
└── bun.lockb
```

### プロジェクト側

```text
<Project>/
├── .cursor/
│   └── rules/              # [SYMLINK] → ~/.config/boulder/rules/
├── .devcontainer/
│   └── devcontainer.json   # [NEW] Devcontainer 設定
├── scripts/
│   └── boulder-doctor.ts   # [NEW] プロジェクト環境チェック（ローカル版）
├── biome.json              # [NEW] Biome 設定
├── package.json            # [UPDATE] oh-my-opencode 依存追加
└── ...
```

---

## 要件トレーサビリティマトリクス

| 要件 ID | 設計コンポーネント | ファイル |
|---------|-------------------|---------|
| FR-1.1 | Devcontainer image | `.devcontainer/devcontainer.json` |
| FR-1.2 | postCreateCommand | `.devcontainer/devcontainer.json` |
| FR-1.3 | Git feature | `.devcontainer/devcontainer.json` |
| FR-2.1 | Biome config | `biome.json` |
| FR-2.2 | エディタ統合（任意） | 各エディタの設定ファイル |
| FR-2.3 | lint script | `package.json` |
| FR-2.4 | format script | `package.json` |
| FR-2.5 | check script | `package.json` |
| FR-3.1 | Ralph Loop update | `~/.config/boulder/rules/boulder-sisyphus.mdc` |
| FR-3.2 | 既存ルール維持 | `~/.config/boulder/rules/boulder-sisyphus.mdc` |
| FR-3.3 | 既存ルール維持 | `~/.config/boulder/rules/boulder-sisyphus.mdc` |
| FR-4.1 | doctor script | `scripts/boulder-doctor.ts` |
| FR-4.2 | Biome check | `scripts/boulder-doctor.ts` |
| FR-4.3 | 既存機能維持 | `scripts/boulder-doctor.ts` |
| FR-5.1 | Quick Start ガイド | `README.md` |
| FR-5.2 | postCreateCommand | `.devcontainer/devcontainer.json` |
| FR-5.3 | Quick Start ガイド | `README.md` |
| FR-5.4 | doctor script | `scripts/boulder-doctor.ts` |
| FR-6.1 | boulder CLI | `~/.config/boulder/bin/boulder` |
| FR-6.2 | init script (symlink) | `~/.config/boulder/scripts/boulder-init.ts` |
| FR-6.3 | init script (confirmation) | `~/.config/boulder/scripts/boulder-init.ts` |
| FR-6.4 | init script (--force) | `~/.config/boulder/scripts/boulder-init.ts` |
| FR-6.5 | init script (cross-platform) | `~/.config/boulder/scripts/boulder-init.ts` |
| FR-6.6 | init script (doctor) | `~/.config/boulder/scripts/boulder-init.ts` |
| TC-3 | 検証は Devcontainer 推奨 | `.devcontainer/devcontainer.json` |
| TC-4 | 実運用はホスト環境 | ドキュメント記載 |
| TC-5 | Biome 採用 | `biome.json`, `package.json` |

---

## リスクと軽減策

| リスク | 影響 | 軽減策 |
|--------|------|--------|
| Biome バージョン互換性 | Lint ルール変更で CI 破損 | `$schema` で明示的バージョン固定 |
| Devcontainer 起動遅延 | 開発効率低下 | 軽量な `oven/bun` イメージ採用 |
| 環境の混同 | 検証と実運用の混乱 | Quick Start ガイドで明確に区別 |
| 前提条件の不備 | セットアップ失敗 | Prerequisites を明文化、doctor で検証 |
| Windows シンボリックリンク | 管理者権限が必要 | `junction` タイプを使用（権限不要） |
| グローバル配置のバージョン不整合 | プロジェクト間で挙動が異なる | `boulder doctor` でバージョン確認 |
| シンボリックリンクの破損 | Cursor がルールを読み込めない | `boulder doctor` でリンク状態確認 |
