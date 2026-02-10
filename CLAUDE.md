# Claude Code Rules (Project Boulder)

このファイルは Anthropic の Claude Code CLI 用の設定ファイルです。
Project Boulder のルールとスクリプトを Claude Code で再利用するための設定を記述しています。

## プロジェクト概要
- **名称**: Project Boulder
- **目的**: 高度なエージェント・コーディング環境の構築
- **スタック**: Bun, TypeScript, Playwright, Git Master

## 開発コマンド
Claude Code は以下のコマンドを自動的に認識し、必要に応じて実行します。

### ビルド・実行
- プロジェクトのビルド: `bun run build`
- 依存関係のインストール: `bun install`

### テスト
- 全テストの実行: `bun run test`
- 特定のテストの実行: `bun run test <file_path>`
- サニティチェック: `bun test boulder-sanity.test.ts`

### リンター・フォーマット
- コードのチェック: `bun run lint`
- 自動修正: `bun run format`

## コーディング規約 (Project Boulder 互換)
以下のルールに従ってコードを作成してください。

- **型安全性**: すべての新しいコードには TypeScript を使用し、可能な限り `any` を避けてください。
- **ドキュメント**: 新しい機能を追加する際は `specs.md` を更新してください。
- **Git 操作**: コミットメッセージは日本語で、変更内容を簡潔に記述してください。

## ルールの参照 (アダプター)
もし `rules/*.mdc` が存在する場合、以下のように参照してコンテキストに追加できます。

- @rules/boulder-sisyphus.mdc
- @rules/boulder-tool-ast-grep.mdc

## メモリバンクの運用
タスクの開始前と終了後に、プロジェクトの状態を同期するために以下のファイルを活用してください。
- @specs.md (プロジェクト仕様)
- @.kiro/specs/*/tasks.md (機能別の詳細タスク一覧)
