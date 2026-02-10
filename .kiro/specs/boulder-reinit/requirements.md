# Requirements: boulder-reinit

## 概要

Project Boulder の再初期化。以下を実現する：

1. **グローバル配置**: Boulder ルールを `~/.config/boulder/` に配置し、複数プロジェクトで共有
2. **セットアップスクリプト**: `boulder init` コマンドで各プロジェクトへのシンボリックリンクを自動作成
3. **Devcontainer**: 検証環境（Linter / テスト / ビルド）の構築
4. **Biome 統合**: 統合 Linter/Formatter の導入

## 背景

- 既存の Project Boulder は Bun + TypeScript で構築されている
- ルールがプロジェクトローカル（`.cursor/rules/`）に配置されており、複数プロジェクトで共有できない
- Cursor IDE はグローバルな MDC ファイル配置をサポートしていない
- Linter/Formatter が未導入で、コード品質の一貫性が保証されていない

## 環境モデル

| 環境 | 用途 | 備考 |
|------|------|------|
| **Devcontainer** | 検証（lint, test, build） | 隔離された再現可能な環境 |
| **ホスト環境** | 実運用 | 本番実行はホストで行う |

> **Note**: Devcontainer は開発・検証ツールとして使用し、実運用はホスト環境で行う。

## ディレクトリ構成

### グローバル配置（Boulder 本体）

```text
~/.config/boulder/              # グローバル Boulder 設定
├── rules/                      # 共有ルール
│   ├── boulder-sisyphus.mdc    # Identity Layer
│   └── boulder-tool-ast-grep.mdc
├── scripts/
│   └── boulder-doctor.ts       # [FUTURE] ヘルスチェック（将来実装予定）
└── config.json                 # Boulder 設定（将来用）
```

### プロジェクト側（シンボリックリンク）

```text
<Project>/
├── .cursor/rules/              # → ~/.config/boulder/rules/ へのシンボリックリンク
├── .devcontainer/
│   └── devcontainer.json
├── scripts/
│   └── boulder-doctor.ts       # プロジェクトローカルのヘルスチェック
├── biome.json
├── package.json                # oh-my-opencode を依存に持つ
└── ...
```

## ユーザーストーリー

**US-1**: 
**As a** 開発者  
**I want** `boulder init` コマンドで Boulder ルールをプロジェクトにリンクしたい  
**So that** 複数プロジェクトで同じルールを共有でき、更新が一箇所で済む

**US-2**:
**As a** 開発者（または AI エージェント）  
**I want** Devcontainer で lint/test/build を実行したい  
**So that** ホスト環境を汚染せず、一貫した検証環境を保証できる

---

## 前提条件 (Prerequisites)

本プロジェクトを使用するには、以下のソフトウェアが必要です。

| ソフトウェア | バージョン | 必須/推奨 | 備考 |
|-------------|-----------|----------|------|
| **Docker** | 最新版 | 必須 | Devcontainer の実行に必要 |
| **devcontainer CLI** | 最新版 | 推奨 | `npm install -g @devcontainers/cli` でインストール |
| **Bun** | 1.0+ | 推奨 | ホスト環境での実運用時に使用 |
| **Git** | 2.0+ | 必須 | バージョン管理 |
| **エディタ** | 任意 | - | Neovim, Vim, Cursor, VS Code 等（エディタ非依存） |

---

## クイックスタートガイド (Quick Start)

### 初回セットアップ（Boulder のインストール）

```bash
# 1. Boulder をグローバルにインストール
git clone https://github.com/yohi/boulder.git ~/.config/boulder
cd ~/.config/boulder
bun install

# 2. PATH に追加（任意）
echo 'export PATH="$HOME/.config/boulder/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### プロジェクトへの適用

```bash
# 1. 対象プロジェクトに移動
cd /path/to/your-project

# 2. Boulder を初期化（シンボリックリンク作成）
boulder init

# または直接実行
~/.config/boulder/bin/boulder init

# 3. 環境確認
bun run doctor
```

### Devcontainer での検証

```bash
# devcontainer CLI でコンテナを起動（推奨）
devcontainer up --workspace-folder .

# または Docker CLI で直接起動
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  oven/bun:latest \
  /bin/bash

# コンテナ内で依存関係をインストール
bun install
bun run doctor
```

### 日常の開発フロー

```bash
# Devcontainer 内で実行（検証）

# コード変更後の検証 (Ralph Loop)
bun run check   # Biome lint + format
bun test        # テスト実行
bun run build   # ビルド確認

# ホスト環境での実運用
# (Devcontainer 外で実行)
bun run start   # または実運用コマンド
```

### Neovim での自動フォーマット（任意）

Biome を Neovim で使用する場合、以下の設定を追加できます：

```lua
-- autocmd でファイル保存時に自動フォーマット
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx", "*.json" },
  callback = function()
    vim.cmd("!bunx biome check --write " .. vim.fn.expand("%"))
  end,
})

-- または null-ls / none-ls 経由で統合
```

---

## 機能要件 (Functional Requirements)

### FR-1: Devcontainer 環境

| ID | 要件 (EARS記法) |
|----|----------------|
| FR-1.1 | The system **shall** provide a Devcontainer configuration using `oven/bun:latest` as the base image. |
| FR-1.2 | When the Devcontainer is created, the system **shall** automatically run `bun install` to install dependencies. |
| FR-1.3 | The system **shall** include Git feature in the Devcontainer for version control operations. |

### FR-2: Biome 統合 (Linter + Formatter)

| ID | 要件 (EARS記法) |
|----|----------------|
| FR-2.1 | The system **shall** use Biome as the unified linter and formatter. |
| FR-2.2 | The system **should** support automatic formatting on file save via editor configuration (editor-agnostic). |
| FR-2.3 | The system **shall** provide `bun run lint` command to execute linting. |
| FR-2.4 | The system **shall** provide `bun run format` command to execute formatting. |
| FR-2.5 | The system **shall** provide `bun run check` command to execute both linting and formatting with auto-fix. |

### FR-3: Ralph Loop (検証プロトコル)

| ID | 要件 (EARS記法) |
|----|----------------|
| FR-3.1 | After each implementation task, the system **shall** execute verification in the following order: `bun run check` → `bun test` → `bun run build`. |
| FR-3.2 | The system **shall** output verification results in the standardized format (Command, ExitCode, Output). |
| FR-3.3 | If verification fails, the system **shall** retry up to 3 times before escalating. |

### FR-4: ヘルスチェック (Boulder Doctor)

| ID | 要件 (EARS記法) |
|----|----------------|
| FR-4.1 | The system **shall** provide `bun run doctor` command to verify environment integrity. |
| FR-4.2 | The doctor script **shall** verify that Biome is installed and functional. |
| FR-4.3 | The doctor script **shall** verify that `bun test` runner is operational. *(Future: not yet implemented)* |

### FR-5: 初期セットアップ

| ID | 要件 (EARS記法) |
|----|----------------|
| FR-5.1 | The system **shall** provide a documented setup procedure for new developers. |
| FR-5.2 | When the Devcontainer is first opened, the system **shall** automatically install all dependencies via `bun install`. |
| FR-5.3 | The system **shall** provide a Quick Start guide in the documentation. |
| FR-5.4 | The setup procedure **shall** verify successful environment configuration via `bun run doctor`. |

### FR-6: Boulder Init コマンド

| ID | 要件 (EARS記法) |
|----|----------------|
| FR-6.1 | The system **shall** provide a `boulder init` command to initialize Boulder in a project. |
| FR-6.2 | When `boulder init` is executed, the system **shall** create a symbolic link from `<Project>/.cursor/rules/` to `~/.config/boulder/rules/`. |
| FR-6.3 | If `.cursor/rules/` already exists, the system **shall** prompt the user for confirmation before overwriting. |
| FR-6.4 | The `boulder init` command **shall** support `--force` flag to skip confirmation prompts. |
| FR-6.5 | The system **shall** handle Windows, macOS, and Linux symlink differences automatically. |
| FR-6.6 | After successful initialization, the system **shall** run `boulder doctor` to verify the setup. |

---

## 技術的制約 (Technical Constraints)

| ID | 制約 (EARS記法) |
|----|----------------|
| TC-1 | The system **must** use **Bun** as the JavaScript/TypeScript runtime. |
| TC-2 | The system **must** use **TypeScript** as the primary language. |
| TC-3 | Verification commands (test, build, lint, format) **should** be executed within the **Devcontainer** environment for consistency. |
| TC-4 | Production execution **shall** occur on the **host environment**. |
| TC-5 | The system **must** use **Biome** for linting and formatting. ESLint and Prettier are **prohibited**. |

---

## 非機能要件 (Non-Functional Requirements)

| ID | 要件 (EARS記法) |
|----|----------------|
| NFR-1 | The system **should** support Windows, macOS, and Linux via Devcontainer abstraction. |
| NFR-2 | The system **should** maintain compatibility with both Cursor IDE and Claude Code CLI. |
| NFR-3 | The Devcontainer startup time **should** be under 60 seconds on a typical development machine. |

---

## 受け入れ条件 (Acceptance Criteria)

### AC-1: Devcontainer が正常に起動する

- [ ] `.devcontainer/devcontainer.json` が存在する
- [ ] `devcontainer up` または `docker run` でコンテナが起動する
- [ ] `bun --version` がコンテナ内で実行可能

### AC-2: Biome が機能する

- [ ] `biome.json` が存在する
- [ ] `bun run lint` がエラーなく完了する
- [ ] `bun run format` がファイルをフォーマットする
- [ ] `bun run check` が lint + format を実行する

### AC-3: Ralph Loop が機能する

- [ ] `bun run check` → `bun test` → `bun run build` の順で実行可能
- [ ] 各コマンドの出力が標準フォーマットで表示される

### AC-4: Boulder Doctor が機能する

- [ ] `bun run doctor` が正常終了する
- [ ] Biome のチェックが doctor に含まれている
- [ ] シンボリックリンクの状態がチェックされる

### AC-5: セットアップ手順が機能する

- [ ] Prerequisites（前提条件）がドキュメントに記載されている
- [ ] Quick Start ガイドに従って新規開発者がセットアップできる
- [ ] `bun run doctor` でセットアップ完了を確認できる

### AC-6: Boulder Init が機能する

- [ ] `boulder init` コマンドが実行可能
- [ ] 実行後、`.cursor/rules/` が `~/.config/boulder/rules/` へのシンボリックリンクになる
- [ ] 既存の `.cursor/rules/` がある場合、確認プロンプトが表示される
- [ ] `--force` フラグで確認をスキップできる
- [ ] 初期化後、自動的に `boulder doctor` が実行される

---

## 成果物 (Deliverables)

### グローバル配置（~/.config/boulder/）

| ファイル | 説明 |
|---------|------|
| `bin/boulder` | Boulder CLI エントリーポイント |
| `scripts/boulder-init.ts` | `boulder init` コマンド実装 |
| `rules/boulder-sisyphus.mdc` | Identity Layer ルール |
| `rules/boulder-tool-ast-grep.mdc` | ast-grep ツールルール |

### プロジェクト側（テンプレート / 生成物）

| ファイル | 説明 |
|---------|------|
| `.devcontainer/devcontainer.json` | Devcontainer 設定 |
| `scripts/boulder-doctor.ts` | プロジェクトローカルのヘルスチェックスクリプト（新規追加） |
| `biome.json` | Biome 設定 |
| `package.json` | scripts / devDependencies 更新 |
| `.cursor/rules/` | シンボリックリンク → `~/.config/boulder/rules/` |
