# 00 Index — Copilot 仕様の入口（SSOT）

このディレクトリは Copilot / 自動エージェント向けの **仕様の単一情報源（SSOT）** です。必須ルールは `.github/copilot-instructions.md` に集約します。`.github/instructions/**/*.instructions.md` は設計書・背景資料・適用範囲のメタ情報を置く場所であり、GitHub Copilot によって**公式機能として自動的に解釈・適用される実務ルール**です。必ず以下の順で参照してください。

## 参照順（優先度順）
※ 構成定義レイヤはリポジトリ全体の前提となるため最初に参照してください。番号は通常の昇順で付与しています。

1. [構成定義レイヤ](05-structure/monorepo.md) — モノレポ運用ルール
2. [copilot-instructions.md](../copilot-instructions.md) — 規範層（短く強いルール）
3. [.github/instructions/**/*.instructions.md](../instructions) — 補助的な設計/背景資料レイヤ（`applyTo` は適用範囲を示すメタ情報）
4. [10-requirements.md](10-requirements.md) — 要件とスコープ/受入条件
5. [20-architecture.md](20-architecture.md) — 設計方針・責務分担
6. [30-coding-standards.md](30-coding-standards.md) — コーディング規約
7. [40-testing-strategy.md](40-testing-strategy.md) — テスト戦略
8. [50-security.md](50-security.md) — セキュリティ要求
9. [60-ci-quality-gates.md](60-ci-quality-gates.md) — CI 品質ゲート
10. [70-adr/](70-adr/) — 重要判断の履歴
11. [80-templates/](80-templates/) — plan / PR / review のテンプレート
12. [plans/](plans/) — フェーズ別の実装/設計計画（例: 33-implementation-plan.md）
13. [90-research/](90-research/) — RESEARCH フェーズの成果物。DESIGN、IMPLEMENT フェーズのインプット資料でもあります。

## 使い方
- PR作成時は、`80-templates/pr-checklist.md`の品質ゲートを通過させること。
- PR種別に応じて対応するテンプレートを必ず使用する：
  - DESIGN PR → [.github/PULL_REQUEST_TEMPLATE/design.md](../PULL_REQUEST_TEMPLATE/design.md)
  - IMPLEMENT PR → [.github/PULL_REQUEST_TEMPLATE/implement.md](../PULL_REQUEST_TEMPLATE/implement.md)
  - RESEARCH PR → [.github/PULL_REQUEST_TEMPLATE/research.md](../PULL_REQUEST_TEMPLATE/research.md)
  - BLIND PR → [.github/PULL_REQUEST_TEMPLATE/blind.md](../PULL_REQUEST_TEMPLATE/blind.md)
- **設計フェーズ (Phase A)**: `80-templates/implementation-plan.md` に沿って plan を作成し、`10-60` の仕様を満たすこと。
- **実装フェーズ (Phase B)**: 確定 plan の範囲内で実装し、`60-ci-quality-gates.md` の品質ゲートを通過させること。
- 仕様変更・追記は本ディレクトリに集約し、重複や分散を避ける。
