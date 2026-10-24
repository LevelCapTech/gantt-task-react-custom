# React 18との後方互換性を維持したReact 19正式対応 plan

## 1. 機能要件 / 非機能要件

- 機能要件:
  - `react` / `react-dom` の `peerDependencies` を React 18・19 の両方を許容する定義へ更新する。
  - React 19 で削除・変更された API/型（`ReactChild`、グローバル `JSX` など）の利用箇所を洗い出し、React 18・19 双方で型が通る実装へ統一する。
  - 公開 API（`src/index.tsx` の export、`src/types/public-types.ts` の公開 Props/型）の後方互換性を維持する。
  - React 18・19 それぞれで `npm test`（unit/lint/build）を実行できる CI マトリクスを整備する。
  - README の対応バージョン表記を React 18/19 正式対応に更新する。
- 非機能要件:
  - 既存利用者の導入手順・ランタイム挙動を壊さない（破壊的変更なし）。
  - CI 品質ゲート（install/test/security）を React 18・19 の両軸で再現可能にする。
  - 依存追加/更新は最小限とし、理由と影響範囲を明記する。
  - Secrets/PII を差分・ログ・ドキュメントに含めない。

## 2. スコープと変更対象

- 変更ファイル（新規/修正/削除）:
  - **本 DESIGN Issue の成果物**: `/.github/copilot/plans/141-react19-support.md`（新規）
  - **IMPLEMENT フェーズでの予定変更対象**:
    - `package.json`（peer/dev dependencies、scripts 追加が必要な場合）
    - `src/components/calendar/calendar.tsx`（`ReactChild` 置換）
    - `src/components/grid/grid-body.tsx`（`ReactChild` 置換）
    - `src/components/task-item/task-item.tsx`（`JSX.Element` 型参照方式の置換）
    - `src/types/public-types.ts`（公開 Props 型互換性の確認と必要最小限の調整）
    - `src/index.tsx`（公開型 export の互換性確認）
    - `src/test/**/*.test.tsx`（必要な回帰テスト追加・更新）
    - `.github/workflows/ci.yml`（React 18/19 マトリクス化）
    - `README.md`（サポート React バージョン表記更新）
- 影響範囲・互換性リスク:
  - ランタイム API は維持し、互換性リスクは主に型定義・依存解決・CI 設定に集中する。
  - 公開 Props（`TooltipContent` / `TaskListHeader` / `TaskListTable`）の受け口は維持し、利用者コンポーネントをそのまま渡せることを受入条件に固定する。
  - 破壊的変更（export 削除、Props 必須化、型名削除）は行わない。
- 外部依存・Secrets の扱い:
  - 依存更新は React 18/19 両対応に必要な最小限（`@testing-library/react`、`@types/react*`、必要時 TypeScript）に限定する。
  - `npm audit` の結果は重大度と直接/間接依存を記録し、修正可否を判断する。
  - シークレット値は扱わない（固定値・トークンの追加禁止）。

## 3. 設計方針

- 責務分離 / データフロー（依存・型・CI）:
  - 依存契約:
    - `peerDependencies.react` / `react-dom` は `^18.0.0 || ^19.0.0` を採用する。
    - `@dnd-kit/*` は現行のまま維持し、React 上限を持たないことを再確認する。
  - 型互換:
    - `ReactChild` は `React.ReactNode`（または用途に応じた `ReactElement`）へ置換し、React 19 型での削除影響を解消する。
    - グローバル `JSX.Element` は `React.JSX.Element` または `ReactElement` へ置換し、React 19 型空間に合わせる。
    - `useRef()` 引数省略の有無を再走査し、該当があれば初期値を明示する。
  - 公開 API:
    - `TooltipContent` / `TaskListHeader` / `TaskListTable` の公開契約は維持し、型の受け口のみ互換的に調整する。
    - 生成される `dist/*.d.ts` に `ReactChild` / グローバル `JSX` が残らないことを確認する。
  - CI マトリクス:
    - `matrix.react: [18, 19]` を導入し、各ジョブで `npm ci` 後に対象バージョンの `react` / `react-dom` / `@types/react*` を `--no-save` で上書きインストールして `npm test` を実行する。
    - `package-lock.json` は固定しつつ、CI では検証目的の一時上書きで両バージョンの互換を担保する。
- テスト環境方針:
  - `react-scripts` 5 + Jest 27 を維持してまず両バージョンで検証する。
  - `@testing-library/react` は React 18/19 両対応版へ更新（候補: 16系）し、Jest 27 との組み合わせで失敗した場合のみ段階的に代替案（バージョン再選定）を適用する。
- エッジケース / 例外系 / リトライ方針:
  - React 19 型のみで失敗するケース（`ReactChild`、`JSX`、ref 初期値）を優先修正し、React 18 型での後方互換を回帰テストで固定する。
  - CI マトリクスの片系統失敗時は、依存上書き手順・型差分・ランタイム差分を分離して原因を記録し、修正後に両系統を再実行する。
- ログと観測性（漏洩防止を含む）:
  - 追加ログは原則不要。必要時も依存名/バージョン/エラー種別のみを扱い、機密情報は出力しない。

## 4. テスト戦略

- 対象（コンポーネント/ヘルパ一覧）:
  - 既存テスト一式（`src/test/*.test.tsx`）を React 18・19 で再実行し、既存機能回帰を確認する。
  - 重点確認対象:
    - ガント描画（timeline / bar 描画）
    - バードラッグによる日付・進捗更新
    - タスク選択
    - 展開・折りたたみ
    - タスクリストセル編集とオーバーレイエディタ
    - 列ドラッグ・リサイズ
    - カレンダー表示
  - 型互換確認対象:
    - `TooltipContent` / `TaskListHeader` / `TaskListTable` に利用者定義コンポーネントを渡せること（React 18/19 型の双方）。
- 方式（何で守るか）:
  - ヘルパ/ロジック: 既存ユニットテストを継続利用。
  - UI/相互作用: React Testing Library の既存コンポーネントテストを継続利用し、不足ケースのみ追加。
  - 型: `test:build`（microbundle + TS）で `dist` 型生成を含めて検証。
- ケース（正常 / 例外 / 境界 / 回帰）:
  - 正常系: React 18/19 で `npm run test:unit` 成功。
  - 例外系: React 19 型定義下での型エラー（`ReactChild`/`JSX` 由来）が再発しない。
  - 境界値: カスタムコンポーネント Props を最小構成で渡した場合も型が成立。
  - 回帰: 既存テストの全成功を前提とし、機能挙動に差分が出ない。
- モック方針:
  - 時刻・DOM 計測など既存モック戦略を維持し、React バージョン差異による非決定性を持ち込まない。
- 配置先:
  - 既存: `src/test/*.test.tsx`
  - 追加が必要な場合: `src/test/<対象>.test.tsx` に最小追加。
- 実行コマンド:
  - ローカル最小確認: `npm run test:unit` / `npm run test:build`
  - CI 基準: `npm test`

## 5. CI 品質ゲート

- 実行コマンド（format / lint / typecheck / test / security）:
  - install: `npm ci`
  - test: `npm test`
    - `test:unit`: `cross-env CI=1 react-scripts test --env=jsdom`
    - `test:lint`: `eslint --ext .tsx src/**/*`
    - `test:build`: `microbundle-crl --no-compress --format modern,cjs --tsconfig tsconfig.build.json`
  - security: `npm audit`
- React 18・19 の CI マトリクス実行方法:
  - `strategy.matrix.react: [18, 19]` を設定。
  - 各ジョブで `npm ci` 実行後、`npm install --no-save react@<matrix> react-dom@<matrix> @types/react@<matrix対応> @types/react-dom@<matrix対応>` を適用し `npm test` を実行。
  - lockfile はコミット対象にせず、検証の再現性は workflow 手順で担保する。
- 通過基準と失敗時の対応:
  - React 18・19 の両ジョブで `npm test` 成功。
  - `npm audit` で高/critical が出た場合は修正または受容理由を記録し、未解消時は別 Issue へ切り出して追跡する。
- example アプリ動作確認（`docs/REBUILD.md` 準拠）:
  - ルート: `npm ci && npm run build`
  - `example/`: `rm -rf node_modules && npm install && npm start`
  - React 19 検証時は `example` でも対象 React バージョンを上書きして起動確認し、主要操作（描画・編集・ドラッグ）を目視確認する。

## 6. ロールアウト・運用

- ロールバック方法:
  - 互換性問題が発生した場合は、`peerDependencies` と型置換コミットを個別に revert できる粒度で実装 PR を分割する。
  - 緊急時は README のサポート表記を一時的に React 18 のみに戻し、React 19 対応を feature branch で継続する。
- 監視・運用上の注意:
  - npm publish 前に React 18/19 両ジョブの最終成功を release 判定条件にする。
  - 互換性問い合わせに備え、README に「検証済み Node/React 組み合わせ」を明記する。

## 7. オープンな課題 / ADR 要否

- 未確定事項:
  - TBD（理由: React 19 公式アップグレードガイド照合結果を実装PRの証跡として固定するため / 決定条件: React 19 で削除・非推奨 API の未使用をチェックリストで全件確認 / 期限: IMPLEMENT PR の初回レビュー提出時）
  - TBD（理由: TypeScript 4.9 + `microbundle-crl` が `@types/react` 19 で問題ないか実測が必要なため / 決定条件: React 19 ジョブで `test:build` が安定成功すること / 期限: IMPLEMENT PR 内で CI 2回連続成功時）
- ADR に残すべき判断:
  - **要否: 原則不要（公開 API 破壊なし前提）**
  - ただし公開型の意味変更や必須化が必要になった場合のみ、`.github/copilot/70-adr/` に ADR を追加してから実装する。
- BLOCKER 判定:
  - BLOCKER となる TBD は 0 件。
