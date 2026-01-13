---
name: Workflows rules
description: GitHub Actions ワークフローの実務ルール
applyTo:
  - ".github/workflows/**/*.yml"
  - ".github/workflows/**/*.yaml"
---
- 最小権限の `permissions` を明示し、Secrets は必要最小限で参照する。ログに Secrets/PII を出さない。
- アクションはバージョン固定（タグまたは commit SHA）で利用し、Deprecated アクションは避ける。
- lint / typecheck / test / security など必須ジョブを required status checks に設定し、失敗時マージ不可にする。
- キャッシュはキーを明示し、再現性を損なう場合は無効化する。冪等性を保つため外部リソースへの依存を最小化する。
- 並列・マトリクス実行時は `concurrency` で二重実行を防ぎ、フェイルファストで早期に失敗させる。
