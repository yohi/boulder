# Project Boulder

**Codename:** "Push the Rock"  
**Target:** Cursor IDE (Composer / Agent) & Claude Code (CLI)  
**Philosophy:** "Immutability, Reproducibility, & Zero-Inference"

Project Boulder は、AIエージェントフレームワーク `oh-my-opencode` (OMO) の強力な資産を、Cursor IDE や Claude Code と統合するためのアーキテクチャです。

その名は、シーシュポス（Sisyphus）が永遠に転がし続ける「岩（Boulder）」に由来します。開発における「検証・修正・再検証」という重厚な無限ループを、AI任せにするのではなく、**「厳格なルール」と「強靭なツール」によって確実に前に進める（Push）** ことを目的としています。

## Getting Started

To initialize the project in your local environment, run:

```bash
bun run bin/boulder init
```

For development mode (working on Boulder itself):

```bash
bun run bin/boulder doctor
```

## Directory Structure (The Boulder Structure)

Boulder の実体は、プロジェクトルートの `rules/` 内に配置され、Gitでバージョン管理されます。これにより、チーム全体でルールを共有・再現（Reproducibility）します。

```text
<Your Project Root>/
├── rules/
│   ├── boulder-sisyphus.mdc      # Identity & Protocol (Ralph Loop)
│   └── boulder-tool-ast-grep.mdc # Tool definitions
├── scripts/
│   └── boulder-doctor.ts         # Health Check Script
├── CLAUDE.md                     # Adapter for Claude Code
└── package.json
```

## Core Components

### 1. The Boulder Laws (`rules/*.mdc`)

- **`boulder-sisyphus.mdc` (Identity Layer)**:  
  シーシュポスとしての人格と、"Ralph Loop"（思考・実行・検証のループ）を強制する最重要プロトコルです。常にアクティブになります。

- **`boulder-tool-ast-grep.mdc` (Muscle Layer)**:  
  `ast-grep` を用いた構造的コード検索ツールを定義します。

### 2. The Ralph Loop (Verification Protocol)

Sisyphus (AI) は以下のループを遵守します：

1.  **Plan**: 手順をリスト化する。
2.  **Act**: コードを変更する。
3.  **Verify**: 変更直後に `bun test`, `bun run build` 等を実行し、**実際のターミナルログ**を証拠として提示する。

### 3. Claude Code Adapter

ルートディレクトリに `CLAUDE.md` を配置することで、Anthropic の CLI ツール "Claude Code" とも完全な互換性を持ちます。Cursor と同じルールセットを CLI 環境でも利用可能です。

---

> **"One must imagine Sisyphus happy."**
