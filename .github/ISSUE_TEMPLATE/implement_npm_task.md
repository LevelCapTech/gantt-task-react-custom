---
name: "[IMPLEMENT] npmライブラリ 実装"
about: React/TypeScript npmライブラリ（gantt-task-react-custom）の実装向けIssueテンプレートです
title: "[IMPLEMENT] ★ここに機能名★"
labels: "implement"
assignees: ""
---

<!--
置換手順:
1. ★ここに機能名★: 対象機能名に置換する（例: タスク一覧の進捗列追加）
2. <issue-number>: GitHub Issue番号に置換する（例: 42）
3. <slug>: ファイル名用のkebab-caseに置換する（例: task-table-progress-column）
4. <design-issue-number>: DESIGN IssueのIssue番号に置換する（例: 41）
5. <design-pr-number>: DESIGN PRのPR番号に置換する（例: 43）
6. <owner>/<repo>: リポジトリのオーナー名とリポジトリ名に置換する（例: LevelCapTech/gantt-task-react-custom）

プレースホルダー種類: 6種類（★ここに機能名★ / <issue-number> / <slug> / <design-issue-number> / <design-pr-number> / <owner>/<repo>）
-->

# [IMPLEMENT] ★ここに機能名★

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: planどおりにライブラリ実装を完了し、CI品質ゲートをすべて通す
* 前提: React 18 / TypeScript / microbundle-crl / Jest + React Testing Library

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/<issue-number>-<slug>.md`

### 2.2 DESIGN Issue（仕様の背景・補助）

* https://github.com/<owner>/<repo>/issues/<design-issue-number>

### 2.3 DESIGN PR（設計差分・合意点）

* https://github.com/<owner>/<repo>/pull/<design-pr-number>

### 2.4 UIモック/画像（UIの形状合わせ用・仕様追加は禁止）

* <mock-path または「なし」>

## 3. スコープ / 非ゴール

* 対象: planに記載された変更のみ
* 非ゴール:
  * plan外の機能追加
  * 大規模リファクタリング
  * plan外の公開API（Props/型/export）の変更
  * `package.json` の version 変更・npm publish・リリースタグ作成
  * CI / publish ワークフロー（`.github/workflows/`）の変更

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> **この表が埋まっていない場合は実装開始禁止**。
> ここに書かれたものだけを作る（planを転記する）。テンプレ側で成果物を決めない。

| 区分 | action（add/modify/delete） | path（リポジトリルート相対） | コンポーネント名/関数名/型名 | 依存（どこ→どこ） | tests（追加/更新） |
| --- | --- | --- | --- | --- | --- |
| 公開型（`src/types/`） | | | | | |
| 公開export（`src/index.tsx`） | | | | | |
| Component（`src/components/`） | | | | | |
| Helper（`src/helpers/`） | | | | | |
| Constants（`src/constants/`） | | | | | |
| Test（`src/test/`） | | | | | |
| Example（`example/`） | | | | | |
| Docs（`README.md` / `docs/`） | | | | | |
| Other | | | | | |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planのAcceptance Criteriaをそのまま列挙（AIが増やさない）。

*
*
*

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE（該当があれば列挙。なければ「なし」）:
  * <例: 既存の公開Props（`GanttProps`）のシグネチャ>
  * <例: `src/index.tsx` の既存export>
* plan外の仕様追加禁止（推測補完を含む）

## 8. ライブラリ制約（公開API / 依存 / ビルド）

* 互換性維持をデフォルトとする。新規Propsは原則オプショナルとし、未指定時に既存挙動を変えない
* 公開APIは `src/index.tsx` のexportと `src/types/public-types.ts` の型のみ。内部モジュールを新たに公開しない（planで指定された場合を除く）
* `react` / `react-dom` / `@dnd-kit/*` は peerDependencies のまま扱い、バンドルに含めない
* 依存追加はplanに記載がある場合のみ。追加時は peerDependencies / dependencies の区別をplanに従う
* example の動作確認は `docs/REBUILD.md` に従う（`npm link` / 手動 symlink は禁止）
* 依存関係やビルド設定を変更した場合は、ルートの build と example の再インストール手順をPR本文に記載する

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`

## 10. 実行・品質ゲート（Done直結）

```bash
# 依存インストール
npm ci

# CI必須ジョブ（unit / lint / build を順に実行）
npm test

# 個別実行する場合
npm run test:unit   # Jest + React Testing Library
npm run test:lint   # ESLint
npm run test:build  # microbundle-crl ビルド（型チェックを含む）

# 依存脆弱性スキャン
npm audit
```

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

* 参照したSSOT: plan / DESIGN Issue / DESIGN PR / docs
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェストの項目がすべて実装済み
* 受入条件がすべて満たされる（Jestテストで担保。planに従う）
* CI品質ゲートがすべて緑（`npm test`: unit / lint / build）
* 公開APIの変更がplanの範囲内であり、既存利用者への互換性がplanどおり保たれている
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / DESIGN Issue / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
