# React 18との後方互換性を維持したReact 19正式対応 plan

## 1. 機能要件 / 非機能要件

- 機能要件:
  - `react` / `react-dom` の `peerDependencies` を React 18・19 の両方を許容する定義へ更新する。
  - React 19 で削除・変更された API/型（`ReactChild`、グローバル `JSX` など）の利用箇所を洗い出し、React 18・19 双方で型が通る実装へ統一する。
  - 公開 API（`src/index.tsx` の export、`src/types/public-types.ts` の公開 Props/型）の後方互換性を維持する。
  - React 18・19 それぞれで `npm test`（unit/lint/build）を実行できる CI マトリクスを整備する。
  - React 18・19 の各 CI ジョブで、既存の `high` / `critical` を例外管理しつつ、新規 `high` / `critical` を確実に検出して停止できる `npm audit` ゲートを導入する。
  - `example/` の公開版・GitHub Pages は React 18 のまま維持し、React 19 の検証は一時的な依存上書きで行う。`example/package.json` と lockfile は恒久更新せず、公開版へ残さない。
  - README の対応バージョン表記を React 18/19 正式対応に更新する。
- 非機能要件:
  - 既存利用者の導入手順・ランタイム挙動を壊さない（破壊的変更なし）。
  - CI 品質ゲート（install/test/security）を React 18・19 の両軸で再現可能にする。
  - 既存 42 件（high 38 / critical 4）が存在する状態でも、同一ルールで CI 合否を一意に判定できる。
  - 依存追加/更新は最小限とし、理由と影響範囲を明記する。
  - Secrets/PII を差分・ログ・ドキュメントに含めない。

## 2. スコープと変更対象

- 変更ファイル（新規/修正/削除）:
  - **本 DESIGN Issue の成果物**: `/.github/copilot/plans/141-react19-support.md`（更新）
  - **IMPLEMENT フェーズでの予定変更対象**:
    - `package.json`（peer/dev dependencies、scripts 追加が必要な場合）
    - `package-lock.json`（React 19 対応で必須の最小差分のみ）
    - `src/components/calendar/calendar.tsx`（`ReactChild` 置換）
    - `src/components/grid/grid-body.tsx`（`ReactChild` 置換）
    - `src/components/task-item/task-item.tsx`（`JSX.Element` 型参照方式の置換）
    - `src/typings.d.ts`（SVG 型定義の `React.StatelessComponent` を `React.FunctionComponent`/`React.FC` へ置換）
    - `src/types/public-types.ts`（公開 Props 型互換性の確認と必要最小限の調整）
    - `src/index.tsx`（公開型 export の互換性確認）
    - `src/test/**/*.test.tsx`（必要な回帰テスト追加・更新）
    - `.github/workflows/ci.yml`（React 18/19 マトリクス化 + audit ゲート導入）
    - `scripts/ci/check-npm-audit-gate.mjs`（新規、依存追加なし）
    - `.github/security/npm-audit-exceptions.json`（新規、例外管理台帳）
    - `README.md`（サポート React バージョン表記更新）
- 影響範囲・互換性リスク:
  - ランタイム API は維持し、互換性リスクは型定義・依存解決・CI 設定に集中する。
  - 公開 Props（`TooltipContent` / `TaskListHeader` / `TaskListTable`）の受け口は維持し、利用者コンポーネントをそのまま渡せることを受入条件に固定する。
  - 破壊的変更（export 削除、Props 必須化、型名削除）は行わない。
- 既存脆弱性 42 件の扱い（本 Issue での設計判断）:
  - #141（React 19 対応）では「React 19 両対応に必要な最小依存更新」のみを実施し、既存 42 件の一括解消はスコープ外とする。
  - 既存 42 件は初期例外台帳に登録し、`approvedBy`・`reason`・`expiresAt`・`trackingIssue` を必須化する。ただし、例外キーは「勧告ID×パッケージ×重大度×ジョブ」で定義し、42 件は package 数の総数であり、例外レコード数はそのまま 42 と同一ではない（同一 package に複数勧告や `via` の分岐があるため）ことを明記する。
  - 25 件（互換範囲更新で解消可能）/ 1 件（`gh-pages` メジャー更新）/ 16 件（`react-scripts`・`microbundle-crl` 系で修正手段なしまたは修正版なし）は、React 19 実装 PR とは分離してセキュリティ対応 Issue 群へ切り出す。
  - 実装着手時に `npm audit --json` / `npm audit --omit=dev --json` を再取得し、取得日時・全件の依存元・勧告ID・影響範囲・検出件数を記録する。分類根拠は「React 19 対応で直せるもの」「期限付き例外にするもの」「別 Issue で直すもの」に整理し、plan 実装 PR に記録する（件数変動を許容）。
  - `via` の複数勧告・文字列項目の正規化方針を明記する: 例外キーは `id` を優先し、`via` が配列/オブジェクトを含む場合は `via[<n>].source` / `url` / `title` を正規化し、同一アドバイスが複数経路で出ても一意へマップする。未確定事項は初期台帳作成前の `TBD` とし、BLOCKER は「同一勧告の正規化が不安定な場合のみ」に限定する。
- 外部依存・Secrets の扱い:
  - audit 判定は Node.js 標準機能のみで実装し、追加 npm パッケージは導入しない。
  - シークレット値は扱わない（固定値・トークンの追加禁止）。

## 3. 設計方針

- 責務分離 / データフロー（依存・型・CI）:
  - 依存契約:
    - `peerDependencies.react` / `react-dom` は `^18.0.0 || ^19.0.0` を採用する。
    - `@dnd-kit/*` は現行のまま維持し、React 上限を持たないことを再確認する。
  - 型互換:
    - `ReactChild` は `React.ReactNode`（または用途に応じた `ReactElement`）へ置換し、React 19 型での削除影響を解消する。
    - グローバル `JSX.Element` は `React.JSX.Element` または `ReactElement` へ置換し、React 19 型空間に合わせる。
    - `src/typings.d.ts` の `React.StatelessComponent` は `React.FunctionComponent` / `React.FC` へ置換する。
    - `useRef()` 引数省略の有無を再走査し、該当があれば初期値を明示する。
  - 監査ゲート（例外あり fail-closed）:
    - `scripts/ci/check-npm-audit-gate.mjs` が各ジョブで `npm audit --json` と `npm audit --omit=dev --json` を実行し、JSON 解析結果で合否を判定する。
    - 判定は 2 種類に分ける: (1) `audit` が有効な JSON を返しながら脆弱性の検出結果を持つ場合（解析可能な脆弱性検出）と、(2) 実行失敗・JSON 破損・通信異常・コマンド異常の場合（fail-closed）。前者は例外台帳と照合して判定し、後者は即失敗とする。
    - 例外単位は「勧告ID（GHSA/CVE/`via.source`）× パッケージ名 × 重大度 × 対象ジョブ（react18/react19/both）」とし、パッケージ単位より粒度を細かくする。
    - 例外台帳（`.github/security/npm-audit-exceptions.json`）の必須項目は `id`, `package`, `severity`, `appliesTo`, `approvedBy`, `approvedAt`, `reason`, `trackingIssue`, `expiresAt`。
    - 合否ルール:
      - `--omit=dev` 側に `high` / `critical` が 1 件でもあれば即失敗（公開パッケージ利用者影響のため例外不可）。
      - 全依存側で `high` / `critical` が検出された場合、未登録の検出は失敗。解析可能な脆弱性検出のみを対象とし、実行失敗・不正 JSON は別途 fail-closed で失敗。
      - 登録済みでも `expiresAt` 超過は失敗（期限切れを自動検出）。
      - 実行失敗（ネットワーク障害・JSON 壊れ・`npm audit` 命令の異常終了）は失敗（fail-closed）。
    - 受入条件（fixture）:
      - 正常系: 解析可能な脆弱性が存在し、例外台帳に登録済みかつ期限内のケースは成功する。
      - 異常系: `npm audit` の実行失敗 / 不正 JSON / コマンド異常は失敗する。
      - 境界値: `expiresAt` 当日/翌日で判定が変わることを確認する。
  - React 18/19 差分の扱い:
    - 同一ルールを両ジョブに適用し、CI 全体成功条件は「react18 と react19 の両方が成功」。
    - 片系統のみで出る検出は `appliesTo` で個別管理し、未承認なら当該ジョブを失敗させる。
- エッジケース / 例外系 / リトライ方針:
  - npm advisory 更新により無関係 PR が失敗した場合も、ルールどおり失敗を維持する（監査無視は禁止）。
  - 運用上は、期限付き例外を追加する PR（または同一 PR への追コミット）を作成し、同時に追跡 Issue を起票して恒久対処へ接続する。
- ログと観測性（漏洩防止を含む）:
  - CI ログには「検出キー、重大度、ジョブ種別、例外一致/期限切れ、判定結果」のみを出力し、脆弱性詳細 JSON 全量は artifact として保存する。

## 4. テスト戦略

- 対象（コンポーネント/ヘルパ一覧）:
  - 既存テスト一式（`src/test/*.test.tsx`）を React 18・19 で再実行し、既存機能回帰を確認する。
  - 監査ゲート検証対象: `scripts/ci/check-npm-audit-gate.mjs`（ユニット相当の fixture テスト or `node` 実行テスト）。
  - React 19 回帰重点確認対象（旧 plan 維持）: ガントのバー日付更新・進捗変更、セル編集とオーバーレイ、列ドラッグ・リサイズ、カレンダー、選択 / 折りたたみ等の描画/編集/操作観点を変更せず維持する。
  - 公開 Props 型互換確認対象: `TooltipContent` / `TaskListHeader` / `TaskListTable` への利用者コンポーネント代入を維持する。
  - 型生成確認対象: `npm run test:build` で `dist` 型生成と公開 Props の互換性が失われないことを確認する。
- 方式（何で守るか）:
  - ヘルパ/ロジック: 既存ユニットテストを継続利用。
  - UI/相互作用: React Testing Library の既存コンポーネントテストを継続利用し、不足ケースのみ追加。
  - 型検証: `test:build` による `dist` 型生成の確認を継続し、公開 Props の型互換性を確認する。
  - 監査ゲート: 固定 fixture（既存42件相当・新規検出・期限切れ・コマンド失敗・不正 JSON）を与えて判定を検証する。
- ケース（正常 / 例外 / 境界 / 回帰）:
  - 正常系: 既存 42 件のみ（すべて期限内かつ承認済み）の場合に react18/react19 とも成功。
  - 例外系: 例外未登録の `high` / `critical` が 1 件でも増えた場合に失敗。
  - 境界値: 例外の `expiresAt` 当日/翌日で判定が切り替わること。
  - 例外系: `npm audit` 実行失敗時（通信障害・コマンド異常・不正 JSON）に失敗。
  - 回帰: 既存 React 19 対応テスト方針（バー日付・進捗変更、セル編集とオーバーレイ、列ドラッグ・リサイズ、カレンダー、選択/折りたたみ等）を変更せず維持し、監査ゲート追加を併存させる。
  - 型互換: 既存公開 Props の利用者コンポーネント代入が React 18・19 双方で維持されることを確認する。
- モック方針:
  - 時刻依存（`expiresAt` 判定）は固定日時注入でテストし、環境依存を排除する。
- 配置先:
  - 既存: `src/test/*.test.tsx`
  - 追加: `src/test/check-npm-audit-gate.test.ts`（または既存 CI テスト配置方針に準拠）
- 実行コマンド:
  - `npm run test:unit`（CI では `npm test`）
  - `npm run test:build`（`dist` 型生成と公開 Props 型互換の確認）

## 5. CI 品質ゲート

- 実行コマンド（format / lint / typecheck / test / security）:
  - install: `npm ci`
  - test: `npm test`
    - `test:unit`: `cross-env CI=1 react-scripts test --env=jsdom`
    - `test:lint`: `eslint --ext .tsx src/**/*`
    - `test:build`: `microbundle-crl --no-compress --format modern,cjs --tsconfig tsconfig.build.json`
  - security:
    - `node scripts/ci/check-npm-audit-gate.mjs --react=18`
    - `node scripts/ci/check-npm-audit-gate.mjs --react=19`
- React 18・19 の CI マトリクス実行方法:
  - `strategy.matrix.react: [18, 19]` を設定。
  - 各ジョブは `npm ci` 後、`react@<matrix>` / `react-dom@<matrix>` / `@types/react*` を `--no-save` で上書きして `npm test` と audit gate を実行する。
  - `continue-on-error`、`|| true`、失敗無視は使用しない。
- 通過基準と失敗時の対応（一意判定ルール）:
  - CI 全体成功条件: react18/react19 の両ジョブで install + security + test がすべて成功。
  - 失敗条件:
    - `--omit=dev` で `high` / `critical` を検出。
    - 全依存監査で例外未登録の `high` / `critical` を検出。
    - 例外期限切れを検出。
    - audit 実行自体の失敗。
  - 失敗時は PR に「検出キー / 重大度 / 発生ジョブ / 既存例外との差分 / 対応方針（修正 or 期限付き例外）」を追記する。
- 実行タイミング:
  - 必須: `pull_request` / `push(main)`。
  - 早期検知: `schedule`（日次）でも同ゲートを実行し、main 側で新規勧告を先に検知する。
- example アプリ動作確認（`docs/REBUILD.md` 準拠）:
  - ルート: `npm ci && npm run build`
  - `example/`: `rm -rf node_modules && npm install && npm start`
  - React 19 検証は一時上書き（`npm install --no-save react@19 react-dom@19 @types/react@19 @types/react-dom@19`）で実施し、公開版 lockfile に残さない。

## 6. ロールアウト・運用

- ロールバック方法:
  - 監査ゲート導入で想定外停止が起きた場合は、例外台帳更新コミットと React 19 対応本体コミットを分離して revert 可能にする。
- 監視・運用上の注意:
  - 例外承認者はリポジトリ maintainer（最低 1 名）とし、承認は「例外台帳変更 PR レビュー」で記録する。
  - 例外期限は原則 30 日以内。延長には再承認と新しい期限設定を必須化する。
  - 例外ごとに追跡 Issue を必須化し、修正完了時に例外台帳から削除する。
  - #141 範囲外の対応は以下の優先度で別 Issue 化する:
    - P1: `gh-pages` メジャー更新（critical）
    - P1: `react-scripts` / `microbundle-crl` 起因の高重大度（置換方針検討を含む）
    - P2: 互換範囲更新で解消可能な 25 件のまとめ対応

## 7. オープンな課題 / ADR 要否

- 未確定事項:
  - `npm audit --json` の実データで例外キー正規化ロジックの揺れを最終確認する必要がある（TBD）。決定条件は、React18・19 の最新 JSON を再取得し、同一勧告が安定して同一キーへ写像できることを確認すること。初期台帳作成前に `via` の複数勧告や `source` 値の揺れを確認し、正規化の境界条件を確定する。期限: #141 IMPLEMENT PR の最初の CI 通過前。
  - 42 件の具体的な各項目は、`npm audit --json` の実データで依存元・勧告ID・影響範囲・`via` を再確認してから初期例外台帳への記録を確定する。
- ADR に残すべき判断:
  - **要: 依存脆弱性の「期限付き例外 + 新規検出ブロック」運用は長期ルールのため ADR 化する。**
  - ただし本 Issue では plan 反映までとし、ADR 文書化は別 DESIGN/ADR Issue で実施する。
- BLOCKER 判定:
  - BLOCKER となる TBD は 0 件。未確定事項は初期台帳作成前に検証して解消するが、設計が成立するための必須条件としては除外する。
