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
  - 設計 PR での調査証跡（必須・実測値）:
    - 取得日時: `2026-10-25T10:09:13Z`（ローカル実測）
    - 実測コマンド:
      - `npm audit --json` → exit code `1`, `high 38 / critical 4`（= 42 packages）
      - `npm audit --omit=dev --json` → exit code `0`, vulnerabilities `0`（prod 依存は clean）
    - 対象一覧: package / 依存経路 / 勧告ID / 影響範囲 / 分類（React 19 内修正 / 期限付き例外 / 別 Issue） / 根拠 / 例外レコード対応関係
    - 例外レコード数対応関係: `42 package` と `例外レコード数` は 1:1 ではない。`npm audit --json` の `via` は 1 package に複数 advisory / via ノードを持ち得るため、例外キーは「package × advisoryID × severity × job」単位で管理する。`brace-expansion` を例に取ると、1 package に 7 個の一意 GHSA と 14 件の `via` エントリが存在するが、例外レコードは GHSA 単位で生成される。
    - `dependencyPath` は `node_modules/...` のインストール経路であり、`npm audit --json` に含まれる node 参照の最も近い実体パスである。完全な依存木（`A -> B -> C`）は `nodes` が示すが、各行の `dependencyPath` は実測上の配置パスに置換し、`impact` は package 直下の影響スコープ（`dev/build tooling` / `publish tooling`）に変換する。
    - `advisoryIds` が `—` の行は、`via` に advisory オブジェクトが無く、間接的な package 依存として検出されたか、あるいは `npm audit --json` がオブジェクト形式で ID を返していないケースを指す。この場合、例外キー生成時は `package` と `severity` を優先し、GHSA が明示されない行は `source` / `title` の補完を要する。実運用では `—` を「不明」ではなく「GHSA なしの indirect finding」として扱う。
    - 実測一覧 (high/critical):

      | package | severity | dependencyPath | advisoryIds | impactScope | classification | reason |
      | --- | --- | --- | --- | --- | --- | --- |
      | `@babel/plugin-transform-modules-systemjs` | high | `node_modules/@babel/plugin-transform-modules-systemjs` | `GHSA-fv7c-fp4j-7gwp` | dev/build tooling | 期限付き例外 | 既存 dev toolchain / 実測 JSON により高重大度を確認 |
      | `@rollup/plugin-node-resolve` | high | `node_modules/@rollup/plugin-node-resolve` | — | dev/build tooling | 期限付き例外 | advisory metadata が `via` で明示されず、package 単位の例外対象として扱う |
      | `@svgr/plugin-svgo` | high | `node_modules/@svgr/plugin-svgo` | — | dev/build tooling | 期限付き例外 | advisory metadata が `via` で明示されず、package 単位の例外対象として扱う |
      | `@svgr/rollup` | high | `node_modules/@svgr/rollup` | — | dev/build tooling | 期限付き例外 | advisory metadata が `via` で明示されず、package 単位の例外対象として扱う |
      | `@svgr/webpack` | high | `node_modules/@svgr/webpack` | — | dev/build tooling | 期限付き例外 | advisory metadata が `via` で明示されず、package 単位の例外対象として扱う |
      | `body-parser` | high | `node_modules/body-parser` | `GHSA-v422-hmwv-36x6`, `GHSA-27r3-jxmh-p828` | dev/build tooling | 期限付き例外 | 複数 advisory を持つ dev-only dependency |
      | `brace-expansion` | high | `node_modules/brace-expansion > node_modules/filelist/node_modules/brace-expansion` | `GHSA-f886-m6hf-6m8v`, `GHSA-3jxr-9vmj-r5cp`, `GHSA-mh99-v99m-4gvg`, `GHSA-rgw5-rvv9-x895`, `GHSA-q2hr-2g5m-vwhr`, `GHSA-qhr7-859c-m2p7`, `GHSA-6j4f-fj2g-mc7p` | dev/build tooling | 期限付き例外 | 1 package に 7 unique GHSA、14 via entries を持つ |
      | `browserslist` | high | `node_modules/browserslist` | `GHSA-c83g-rgw3-j3cx`, `GHSA-73wf-gq98-2v4g` | dev/build tooling | 期限付き例外 | 2 advisory を持つ dev-only dependency |
      | `compression` | high | `node_modules/compression` | `GHSA-vc2v-76pw-4v95` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `css-select` | high | `node_modules/svgo/node_modules/css-select` | — | dev/build tooling | 期限付き例外 | indirect dependency / GHSA 未明示 |
      | `fast-uri` | high | `node_modules/fast-uri` | `GHSA-v2hh-gcrm-f6hx`, `GHSA-7p8r-x3mc-p8w7`, `GHSA-q3j6-qgpj-74h6`, `GHSA-v39h-62p7-jpjc`, `GHSA-f65p-4m7j-42xc`, `GHSA-jqff-g426-hqxp`, `GHSA-4c8g-83qw-93j6`, `GHSA-qw65-cvwx-89v3`, `GHSA-hrr3-gc8f-f4qj`, `GHSA-w74x-v6f9-j3xg`, `GHSA-xhq7-xmqj-769h`, `GHSA-333x-w4r6-6crp` | dev/build tooling | 期限付き例外 | 1 package に多重 advisory を持つ |
      | `flatted` | high | `node_modules/flatted` | `GHSA-25h7-pfq9-p65f`, `GHSA-rf6f-7fwh-wjgh` | dev/build tooling | 期限付き例外 | 2 advisory を持つ dev-only dependency |
      | `form-data` | high | `node_modules/form-data` | `GHSA-hmw2-7cc7-3qxx` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `gh-pages` | critical | `node_modules/gh-pages` | `GHSA-8mmm-9v2q-x3f9` | publish tooling | 別 Issue | `gh-pages` はメジャー更新が前提で React 19 本体とは別スコープ |
      | `js-yaml` | high | `node_modules/@eslint/eslintrc/node_modules/js-yaml > node_modules/eslint/node_modules/js-yaml > node_modules/js-yaml` | `GHSA-h67p-54hq-rp68`, `GHSA-52cp-r559-cp3m`, `GHSA-5p4m-2wfm-xmqj`, `GHSA-2883-xcg3-v3hh` | dev/build tooling | 期限付き例外 | 一つの package に複数 advisory が紐づく |
      | `jsonpath` | high | `node_modules/jsonpath` | `GHSA-6c59-mwgh-r2x6`, `GHSA-87r5-mp6g-5w5j` | dev/build tooling | 期限付き例外 | 2 advisory を持つ dev-only dependency |
      | `launch-editor` | high | `node_modules/launch-editor` | `GHSA-v6wh-96g9-6wx3`, `GHSA-698v-4r3x-3vcv`, `GHSA-r825-w8mm-5pxw`, `GHSA-587h-7wmj-h5pm` | dev/build tooling | 期限付き例外 | 4 advisory を持つ dev-only dependency |
      | `lodash` | high | `node_modules/lodash` | `GHSA-r5fr-rjxr-66jc`, `GHSA-f23m-r3pf-42rh` | dev/build tooling | 期限付き例外 | 2 advisory を持つ dev-only dependency |
      | `microbundle-crl` | high | `node_modules/microbundle-crl` | — | build tooling | 別 Issue | `react-scripts` / `microbundle-crl` 系は修正方針検討が別件 |
      | `minimatch` | high | `node_modules/filelist/node_modules/minimatch > node_modules/minimatch` | `GHSA-3ppc-4f35-3m26`, `GHSA-7r86-cg39-jmmj`, `GHSA-23c5-xmqv-rm74` | dev/build tooling | 期限付き例外 | 一つの package に複数 advisory が紐づく |
      | `nanoid` | high | `node_modules/nanoid` | `GHSA-28wg-ghj8-5hjv`, `GHSA-2v37-7h3g-55p8`, `GHSA-xwg4-73v4-xw9w` | dev/build tooling | 期限付き例外 | 3 advisory を持つ dev-only dependency |
      | `node-forge` | high | `node_modules/node-forge` | `GHSA-2328-f5f3-gj25`, `GHSA-q67f-28xg-22rw`, `GHSA-5m6q-g25r-mvwx`, `GHSA-ppp5-5v6c-4jwp`, `GHSA-86w9-cpqp-85rv` | dev/build tooling | 期限付き例外 | 5 advisory を持つ dev-only dependency |
      | `nth-check` | high | `node_modules/svgo/node_modules/nth-check` | `GHSA-rp65-9cf3-cjxr` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `path-to-regexp` | high | `node_modules/path-to-regexp` | `GHSA-37ch-88jc-xwx2` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `picomatch` | high | `node_modules/picomatch > node_modules/tinyglobby/node_modules/picomatch` | `GHSA-3v7f-55p6-f55p`, `GHSA-c2c7-rcm5-vvqj` | dev/build tooling | 期限付き例外 | 2 advisory を持つ indirect dependency |
      | `postcss` | high | `node_modules/autoprefixer/node_modules/postcss > ... > node_modules/stylehacks/node_modules/postcss` | `GHSA-566m-qj78-rww5`, `GHSA-7fh5-64p2-3v2j`, `GHSA-qx2v-qp2m-jg93`, `GHSA-6g55-p6wh-862q`, `GHSA-fxqj-rqcc-2cmp`, `GHSA-r28c-9q8g-f849` | dev/build tooling | 期限付き例外 | 6 advisory を持つ deeply nested dev dependency |
      | `postcss-svgo` | high | `node_modules/postcss-svgo` | — | dev/build tooling | 期限付き例外 | indirect dependency / GHSA 未明示 |
      | `proxy-addr` | critical | `node_modules/proxy-addr` | `GHSA-jqcg-44mw-7w3h` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `react-scripts` | high | `node_modules/react-scripts` | — | app build tooling | 別 Issue | React 19 対応と切り分けが必要な dev toolchain |
      | `rollup` | high | `node_modules/rollup > node_modules/workbox-build/node_modules/rollup` | `GHSA-gcx4-mw62-g8wm`, `GHSA-mw96-cpmx-2vgc` | dev/build tooling | 期限付き例外 | 2 advisory を持つ dev-only dependency |
      | `rollup-plugin-terser` | high | `node_modules/rollup-plugin-terser > node_modules/workbox-build/node_modules/rollup-plugin-terser` | — | dev/build tooling | 期限付き例外 | indirect dependency / GHSA 未明示 |
      | `serialize-javascript` | high | `node_modules/rollup-plugin-terser/node_modules/serialize-javascript > ... > node_modules/workbox-build/node_modules/serialize-javascript` | `GHSA-5c6j-r48x-rmvq`, `GHSA-qj8w-gfj5-8c6v`, `GHSA-m5mm-p8h7-m29v` | dev/build tooling | 期限付き例外 | 3 advisory を持つ deeply nested dev dependency |
      | `shell-quote` | critical | `node_modules/shell-quote` | `GHSA-w7jw-789q-3m8p`, `GHSA-395f-4hp3-45gv` | dev/build tooling | 期限付き例外 | 2 advisory を持つ dev-only dependency |
      | `source-map-js` | high | `node_modules/source-map-js` | `GHSA-68fv-2mgg-jv7q` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `svgo` | high | `node_modules/css-minimizer-webpack-plugin/node_modules/svgo > node_modules/svgo` | `GHSA-xpqw-6gx7-v673`, `GHSA-2p49-hgcm-8545`, `GHSA-w27v-7q3p-w38r`, `GHSA-4vpr-x523-8j87` | dev/build tooling | 期限付き例外 | 4 advisory を持つ dev-only dependency |
      | `underscore` | high | `node_modules/underscore` | `GHSA-qpx9-hpmf-5gmw` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `webpack-dev-middleware` | high | `node_modules/webpack-dev-middleware` | `GHSA-g84c-rxfj-3j2c` | dev/build tooling | 期限付き例外 | 実測 JSON 上で単一 advisory |
      | `webpack-dev-server` | high | `node_modules/webpack-dev-server` | `GHSA-9jgg-88mc-972h`, `GHSA-4v9v-hfq4-rm2v`, `GHSA-79cf-xcqc-c78w`, `GHSA-mx8g-39q3-5c79`, `GHSA-f5vj-f2hx-8m93`, `GHSA-m28w-2pqf-7qgj` | dev/build tooling | 期限付き例外 | 6 advisory を持つ dev-only dependency |
      | `websocket-driver` | critical | `node_modules/websocket-driver` | `GHSA-mp7j-qc5w-4988`, `GHSA-xv26-6w52-cph6` | dev/build tooling | 期限付き例外 | 2 advisory を持つ dev-only dependency |
      | `workbox-build` | high | `node_modules/workbox-build` | — | dev/build tooling | 期限付き例外 | indirect dependency / GHSA 未明示 |
      | `workbox-webpack-plugin` | high | `node_modules/workbox-webpack-plugin` | — | dev/build tooling | 期限付き例外 | indirect dependency / GHSA 未明示 |
      | `ws` | high | `node_modules/webpack-dev-server/node_modules/ws > node_modules/ws` | `GHSA-58qx-3vcg-4xpx`, `GHSA-96hv-2xvq-fx4p` | dev/build tooling | 期限付き例外 | 2 advisory を持つ nested dependency |

    - 分類の整合: 25/1/16 は「修正方法別の分類（fix available / exception / separate issue）」であり、上記 `classification` 列は「設計上の例外管理カテゴリ」そのものである。`gh-pages` / `microbundle-crl` / `react-scripts` は `25/1/16` の別 Issue 側に当てはまり、残りの package は `期限付き例外` として扱う。React 19 自体の実測は本表では行わず、当該ロックファイルの実測結果であることを明記する。
    - 結論: 実測上、`npm audit --omit=dev --json` は 0 件のため、公開依存の影響なし。残る 42 件は dev/build tooling を中心に、1 package に複数 advisory / `via` が発生するため、例外レコード数は package 数と一致しない。設計上の例外キーは `id × package × severity × job` を主軸とし、`via` の複数 advisory は同一 package 内でまとめて判定する。実データに基づき、未実測の雛形は `TBD` としない。
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

## コードレビューフィードバック対応（Review Feedback Response）

## 追記（今回分）

- フィードバック（要約）：`npm audit --json` の終了コードを区別せず、脆弱性検出とコマンド異常を混同していた
  - 対応（何を変えた）：`# 3. 設計方針` と `# 5. CI 品質ゲート` に、解析可能な脆弱性検出と fail-closed のコマンド異常/不正 JSON を分けて判定するルールを追加し、両方を fixture 受入条件へ明記した。
  - 対象（見出し/ADR/Commit）：`# 3. 設計方針` / `# 5. CI 品質ゲート` / `# 7. オープンな課題 / ADR 要否` / `525f6c8`
  - 状態（対応済）：対応済
- フィードバック（要約）：42 件と例外キーの単位がズレており、`via` や正規化方針が曖昧だった
  - 対応（何を変えた）：`# 2. スコープと変更対象` と `# 7. オープンな課題 / ADR 要否` に、42 件は package 数、例外キーは `id × package × severity × job` で扱うこと、そして `via` の複数勧告や文字列項目の正規化方針を追記した。初期台帳作成前の TBD と BLOCKER 判定も実態に合わせて整理した。
  - 対象（見出し/ADR/Commit）：`# 2. スコープと変更対象` / `# 3. 設計方針` / `# 7. オープンな課題 / ADR 要否` / `525f6c8`
  - 状態（対応済）：対応済
- フィードバック（要約）：React 19 テスト計画が監査ゲート追加で消えており、旧 plan の回帰箇所が失われていた
  - 対応（何を変えた）：`# 4. テスト戦略` に、バー日付・進捗変更、セル編集とオーバーレイ、列ドラッグ・リサイズ、カレンダー、選択/折りたたみといった旧 plan の具体的な回帰対象、および公開 Props 型と `dist` 型生成確認を追加し、監査ゲート追加と併存させる形に復元した。
  - 対象（見出し/ADR/Commit）：`# 4. テスト戦略` / `# 5. CI 品質ゲート` / `525f6c8`
  - 状態（対応済）：対応済
- フィードバック（要約）：Issue #150 の再取得・全件記録要件が満たされていない
  - 対応（何を変えた）：`# 2. スコープと変更対象` に実測値を追記し、`npm audit --json` / `npm audit --omit=dev --json` の取得日時、42 package の一覧、依存経路、advisory ID、影響範囲、分類理由、および `package × advisory × severity × job` で例外レコード数が 1:1 ではないことを明示した。`TBD` を削除し、実数に基づく調査証跡へ置換した。
  - 対象（見出し/ADR/Commit）：`# 2. スコープと変更対象` / `# 7. オープンな課題 / ADR 要否` / `c5c5bd1`
  - 状態（対応済）：対応済
- フィードバック（要約）：PR 本文の既存記述と末尾追記の優先順位が曖昧だった
  - 対応（何を変えた）：既存 PR 本文は維持し、末尾の `コードレビューフィードバック対応` に今回の対応内容を構造化して追記する方針を明確化した。対応内容は本追記を最新方針の優先記録とし、原文は履歴として残す。
  - 対象（見出し/ADR/Commit）：`# コードレビューフィードバック対応` / `本PR本文末尾記録` / `c5c5bd1`
  - 状態（対応済）：対応済

## 既存ログ（前回まで）

```text
<<keep_existing_lines>>
```
