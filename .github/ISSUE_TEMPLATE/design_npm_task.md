---
name: "[DESIGN] npmライブラリ 機能設計"
about: React/TypeScript npmライブラリ（gantt-task-react-custom）の機能設計向けIssueテンプレートです
title: "[DESIGN] ★ここに機能名★"
labels: "design"
assignees: ""
---

<!--
置換手順:
1. ★ここに機能名★: 対象機能名に置換する（例: タスク一覧の進捗列追加）
2. <issue-number>: GitHub Issue番号に置換する（例: 42）
3. <slug>: ファイル名用のkebab-caseに置換する（例: task-table-progress-column）

プレースホルダー種類: 3種類（★ここに機能名★ / <issue-number> / <slug>）
-->

## [DESIGN] ★ここに機能名★

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
* **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
* **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
* 要件参照先: `.github/copilot/10-requirements.md`
* 背景 / 解決したい課題:

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 SSOT（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/10-requirements.md`
* `.github/copilot/20-architecture.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/40-testing-strategy.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/80-templates/implementation-plan.md`（planテンプレート）

### 2.2 前フェーズ成果物（あれば）

* RESEARCH Issue / 成果物（`.github/copilot/90-research/`）: <リンクまたは「なし」>
* 関連ADR（`.github/copilot/70-adr/`）: <リンクまたは「なし」>

### 2.3 UIモック/スクリーンショット（UIの形状合わせ用・仕様追加は禁止）

* <モックパスまたはリンク。なければ「なし」>

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/<issue-number>-<slug>.md` を新規作成する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* コード実装（`src/` / `example/` の変更）
* `package.json` の version 変更・npm publish・リリースタグ作成
* 依存関係（dependencies / peerDependencies / devDependencies）の実際の追加・更新
* CI / publish ワークフロー（`.github/workflows/`）の変更

## 4. ライブラリ構成前提（現行実装）

### 4.1 ディレクトリ構成と責務

| 配置先 | 責務 |
| --- | --- |
| `src/index.tsx` | 公開APIのエントリポイント（ここからexportされるものが公開API） |
| `src/types/public-types.ts` | 公開型定義（`GanttProps` / `Task` など） |
| `src/components/` | Reactコンポーネント（gantt / task-list / task-item / calendar / grid / other） |
| `src/helpers/` | 日付・バー計算などの純粋関数ヘルパ |
| `src/constants/` | 定数（タスク工程/ステータス等） |
| `src/components/task-list/` | ドラッグ&ドロップ関連（`@dnd-kit`。現状は専用 `src/dnd/` ではなく task-list 配下に実装） |
| `src/test/` | ユニットテスト（Jest + React Testing Library） |
| `example/` | 動作確認用デモアプリ（手順は `docs/REBUILD.md` がSSOT） |

### 4.2 公開APIと互換性

* 公開APIは `src/index.tsx` のexportと `src/types/public-types.ts` の型で定義される
* 互換性維持をデフォルトとする。公開Props/型/exportの削除・意味変更（破壊的変更）を行う場合は、移行策と理由をplan（必要ならADR）に記載する
* 新規Propsは原則オプショナルとし、未指定時に既存挙動が変わらないことを受入条件で固定する

### 4.3 依存とビルド

* `react` / `react-dom` / `@dnd-kit/*` は peerDependencies（バンドルに含めない）
* ビルドは `microbundle-crl`（`tsconfig.build.json`）で `dist/` に modern / cjs を出力する
* 依存追加は最小限とし、追加する場合は peerDependencies / dependencies の区別と理由をplanに記載する

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. 変更対象ファイル（新規/修正/削除）と責務分離がplanに明記されている
3. 公開API（Props/型/export）への影響と互換性（後方互換/破壊的変更）がplanに明記されている
4. テスト計画（Jest + React Testing Library）がplanに明記されている
5. CI品質ゲート（`npm test`: unit / lint / build）の実行計画がplanに明記されている

## 6. 品質ゲート（planに必ず記載する項目）

* `install`: `npm ci`
* `test`（CI必須ジョブ）: `npm test`
  * `test:unit`: `cross-env CI=1 react-scripts test --env=jsdom`
  * `test:lint`: `eslint --ext .tsx src/**/*`
  * `test:build`: `microbundle-crl ...`（TypeScript型チェックを含むビルド）
* `security`: `npm audit`（依存脆弱性スキャン。結果の扱いをplanに記載）
* planに公開API変更の有無と互換性の受入条件があること
* planに example アプリでの動作確認手順（`docs/REBUILD.md` 準拠）があること

## 7. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

* 対象: どのコンポーネント/ヘルパをテストするか（一覧）
* 方式: ヘルパのユニットテスト / React Testing Library によるコンポーネントテストのどれで守るか
* ケース: 正常系/例外系/境界値（最低ライン）と回帰テスト
* モック方針: 時刻・DOM計測などの環境依存の隔離方法
* 配置先: `src/test/<対象>.test.tsx`
* 実行コマンド: `npm run test:unit`（CIでは `npm test`）

## 8. Done

* `.github/copilot/plans/<issue-number>-<slug>.md` が新規作成されている
* 他のファイルに変更がない
* planの「1. 機能要件 / 非機能要件」〜「7. オープンな課題 / ADR 要否」が全て記載されている
* TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
* SSOTと矛盾がない

## 9. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>
