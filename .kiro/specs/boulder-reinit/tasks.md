# Tasks: boulder-reinit

## Task 0: グローバル配置の準備 [NEW]

* [ ] REINIT-1: `~/.config/boulder/` ディレクトリ構造を作成する (Scope: `~/.config/boulder/`)
* [ ] REINIT-2: 既存の `scripts/boulder-doctor.ts` を移動する (Scope: `~/.config/boulder/scripts/`)
* [ ] REINIT-3: 既存の `.cursor/rules/*.mdc` を移動する (Scope: `~/.config/boulder/rules/`)
* [ ] REINIT-4: `package.json` を作成し依存関係を定義する (Scope: `~/.config/boulder/package.json`)

---

## Task 1: Boulder Init コマンド作成 [NEW]

* [ ] REINIT-5: CLI エントリーポイントを作成する (Scope: `~/.config/boulder/bin/boulder`)
* [ ] REINIT-6: `boulder-init.ts` を実装する (Scope: `~/.config/boulder/scripts/boulder-init.ts`)
* [ ] REINIT-7: シンボリックリンク作成処理を実装する (Scope: `~/.config/boulder/scripts/boulder-init.ts`)
* [ ] REINIT-8: 既存ディレクトリの確認・上書き確認ロジックを実装する (Scope: `~/.config/boulder/scripts/boulder-init.ts`)
* [ ] REINIT-9: `--force` フラグを実装する (Scope: `~/.config/boulder/scripts/boulder-init.ts`)
* [ ] REINIT-10: 初期化後の `boulder doctor` 自動実行を実装する (Scope: `~/.config/boulder/scripts/boulder-init.ts`)

**Acceptance Criteria (AC-6)**:
- `boulder init` コマンドが実行可能
- 実行後、`.cursor/rules/` がシンボリックリンクになる
- 既存の `.cursor/rules/` がある場合、確認プロンプトが表示される
- `--force` フラグで確認をスキップできる
- 初期化後、自動的に `boulder doctor` が実行される

---

## Task 2: Devcontainer 設定作成 [NEW]

* [ ] REINIT-11: `.devcontainer/` ディレクトリを作成する (Scope: `.devcontainer/`)
* [ ] REINIT-12: `devcontainer.json` を作成する (Scope: `.devcontainer/devcontainer.json`)
* [ ] REINIT-13: `postCreateCommand` を設定する (Scope: `.devcontainer/devcontainer.json`)

**Acceptance Criteria (AC-1)**:
- `.devcontainer/devcontainer.json` が存在する
- `devcontainer up` でコンテナが起動する
- `bun --version` がコンテナ内で実行可能

---

## Task 3: Biome 設定作成 [NEW]

* [ ] REINIT-14: `@biomejs/biome` を devDependencies に追加する (Scope: `package.json`)
* [ ] REINIT-15: `biome.json` を作成する (Scope: `biome.json`)
* [ ] REINIT-16: npm スクリプトを追加する (Scope: `package.json`)

**Acceptance Criteria (AC-2)**:
- `biome.json` が存在する
- `bun run lint` がエラーなく完了する
- `bun run format` がファイルをフォーマットする
- `bun run check` が lint + format を実行する

---

## Task 4: Boulder Doctor 更新 [NEW]

* [ ] REINIT-17: Biome 存在確認チェックを追加する (Scope: `~/.config/boulder/scripts/boulder-doctor.ts`)
* [ ] REINIT-18: エラーメッセージとリカバリ手順を追加する (Scope: `~/.config/boulder/scripts/boulder-doctor.ts`)
* [ ] REINIT-19: シンボリックリンク状態確認を追加する (Scope: `~/.config/boulder/scripts/boulder-doctor.ts`)

**Acceptance Criteria (AC-4)**:
- `boulder doctor` が正常終了する
- Biome のチェックが doctor に含まれている
- シンボリックリンクの状態がチェックされる

---

## Task 5: MDC ルール更新 [NEW]

* [ ] REINIT-20: Ralph Loop 検証順序を更新する (Scope: `~/.config/boulder/rules/boulder-sisyphus.mdc`)
* [ ] REINIT-21: Biome コマンドの説明を追加する (Scope: `~/.config/boulder/rules/boulder-sisyphus.mdc`)

**Acceptance Criteria (AC-3)**:
- `bun run check` → `bun test` → `bun run build` の順で実行可能
- 各コマンドの出力が標準フォーマットで表示される

---

## Task 6: 統合テスト [NEW]

* [ ] REINIT-22: `boulder init` でシンボリックリンクを確認する (Scope: `.cursor/rules/`)
* [ ] REINIT-23: `devcontainer up` でコンテナを起動する (Scope: `.devcontainer/`)
* [ ] REINIT-24: `boulder doctor` が全チェックをパスすることを確認する (Scope: `scripts/`)
* [ ] REINIT-25: `bun run check` が正常に動作することを確認する (Scope: `biome.json`)
* [ ] REINIT-26: `bun test` が正常に動作することを確認する (Scope: `tests/`)

---

## Task 7: ドキュメント更新 [NEW]

* [ ] REINIT-27: `README.md` にインストール手順を記述する (Scope: `~/.config/boulder/README.md`)
* [ ] REINIT-28: グローバル配置とプロジェクト適用手順を記述する (Scope: `~/.config/boulder/README.md`)
* [ ] REINIT-29: コマンドの使い方を記述する (Scope: `~/.config/boulder/README.md`)
* [ ] REINIT-30: 環境モデルを記述する (Scope: `~/.config/boulder/README.md`)
* [ ] REINIT-31: 前提条件を記述する (Scope: `~/.config/boulder/README.md`)

**Acceptance Criteria (AC-5)**:
- Prerequisites がドキュメントに記載されている
- Quick Start ガイドに従って新規開発者がセットアップできる
- `boulder doctor` でセットアップ完了を確認できる
