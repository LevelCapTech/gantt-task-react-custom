---
name: Documentation rules
description: Markdown ドキュメントに適用する実務ルール
applyTo:
  - "docs/**/*.md"
  - "README.md"
  - ".github/copilot/**/*.md"
---
- 見出しは階層を崩さずに使用し、一覧・手順は箇条書きで簡潔にまとめる。
- 相対リンクを優先し、`00-index.md` から辿れるようにする。重複した記述は SSOT に統合する。
- Mermaid を使う場合は ```mermaid フェンスを用い、フローの入口・分岐・終了を明示する。
- Secrets/PII を記載しない。サンプル値はダミーを用いる。
- テンプレートは `80-templates` を参照し、改変時は互換性を考慮して最小限の差分にとどめる。
