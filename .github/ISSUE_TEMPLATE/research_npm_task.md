---
name: "[RESEARCH] npmライブラリ 調査"
about: React/TypeScript npmライブラリ（gantt-task-react-custom）開発における不確実性解消のための調査テンプレートです
title: "[RESEARCH] ★ここに調査テーマ★"
labels: "research"
assignees: ""
---

<!--
置換手順:
1. ★ここに調査テーマ★: 調査テーマを置換する（例: @dnd-kit による行並べ替えの挙動）
2. <issue-number>: GitHub Issue番号に置換する（例: 45）
3. <slug>: 成果物ファイル名用のkebab-caseに置換する（例: dnd-kit-row-sorting）
4. <関連Issue/ADRのリンク>: 関連するIssueやADRのリンクに置換する（なければ「なし」）
-->

# [RESEARCH] ★ここに調査テーマ★

## 0. AI Agent 契約（最初に読む）

* あなたは **AI調査Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **コード変更は禁止**。成果物はドキュメント（`.github/copilot/90-research/` または Issue/PRコメント）に限定する。
* **入力不足/矛盾** がある場合、調査を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* 調査結論は ADR または Requirements への昇格候補を必ず明記する（Designフェーズへの引き渡しが目的）。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/research.md`** を使用すること。

## 1. 調査目的

* 解消したい不確実性:
* この調査がなければ何が決められないか:
* Designフェーズで必要な結論の形:

## 2. 入力（SSOT参照セット）

### 2.1 前提ドキュメント（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/copilot/10-requirements.md`
* `.github/copilot/20-architecture.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`

### 2.2 関連Issue/ADR

* <関連Issue/ADRのリンク>

## 3. スコープ / 非ゴール

### In Scope

* <調査する範囲を具体的に列挙（例: 対象コンポーネント / 依存ライブラリのバージョン / ブラウザ挙動）>

### Out of Scope

* コード変更（`src/` / `example/` / `package.json` の修正を行わない）
* 依存関係の追加・更新
* 設計決定（調査結論を受けて `[DESIGN]` フェーズで実施する）
* 実装（`[IMPLEMENT]` フェーズで実施する）

## 4. 調査観点

> **この表が埋まっていない場合は調査開始禁止**。

| No. | 調査観点 | 期待する答えの形 | 優先度（高/中/低） |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |

> 観点の例: 公開API（Props/型）への影響、既存利用者への互換性、peerDependencies（React / @dnd-kit）のバージョン制約、バンドルサイズ、ブラウザ互換性、既存テストへの影響

## 5. 成果物

* 調査結果を以下のいずれかにまとめ、PRを作成する（コード変更なし）:
  * `.github/copilot/90-research/<issue-number>-<slug>.md`（推奨）
  * または本IssueコメントにまとめてPRなしで完結
* **結論**には以下を必ず含める:
  * 各調査観点への回答
  * ADR昇格候補（`.github/copilot/70-adr/`）または Requirements更新候補（`.github/copilot/10-requirements.md`）の明記
  * Designフェーズへの引き継ぎ事項

## 6. 必読（規約）

* `.github/copilot-instructions.md`
* `.github/copilot/50-security.md`（Secrets/PIIを調査ドキュメントに含めない）

## 7. Done（必須）

* 調査観点4章の全項目に回答がある
* 結論が `[DESIGN]` フェーズへ引き継げる形でまとめられている
* ADR/Requirements昇格候補が明記されている
* コード変更が一切ない
* Secrets/PIIが成果物ドキュメントに含まれていない

## 8. BLOCKER（入力不足時の返却フォーマット）

> 調査開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと調査できないか>
