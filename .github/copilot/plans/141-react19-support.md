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
  - `25 / 1 / 16` 分類は修正方法別で、表の `classification` は例外運用別のカテゴリである。両者は別軸であり、要件では「どの package が lockfile のみ更新で解決可能か」「どれが major update 必須か」「どれが upstream fix 未確定で別 Issue か」を個別に追跡する。
  - 実装着手時に `npm audit --json` / `npm audit --omit=dev --json` を再取得し、取得日時・依存元（manifest での直依存）・勧告ID・影響範囲・検出件数と `fixAvailable` / `requiredUpdate` を記録する。分類根拠は「React 19 対応で直せるもの」「期限付き例外にするもの」「別 Issue で直すもの」に整理し、plan 実装 PR に記録する（件数変動を許容）。
  - `via` の複数勧告・文字列項目の正規化方針を明記する: 例外キーは `id` を優先し、`via` が配列/オブジェクトを含む場合は `via[<n>].source` / `url` / `title` を正規化し、同一アドバイスが複数経路で出ても一意へマップする。`advisoryIds` が `—` の行は自動許容しない; その行は `source` / `title` / `url` の補完が可能な場合のみ `identityKey` を生成し、未補完のままなら fail-closed で要確認扱いとする。
  - 例外照合と識別キー（重要）:
    - 正常系の照合キーは `package + advisoryId + severity + job` を優先し、`advisoryId` は GHSA/CVE 値そのものまたは `via[*].source` / `url` / `title` の正規化値を使用する。
    - `advisoryId` が取れない行は `package + severity + job` だけで例外一致させない。識別不能な脆弱性は「未登録・不明」扱いで fail-closed にし、新規検出として失敗させる。
    - `dependencyPath` は `node_modules/...` の設置場所であり、依存木の「誰がどこから到達したか」を表すものではない。依存経路の正確な起点は `package.json` / lockfile の `nodes` と manifest 解析で補う。設計 PR の表では `dependencyPath` を「設置場所」、`directDependency` を「依存元の補足情報」、`affectedRange` を「advisory の影響バージョン範囲」などに分離し、取得できない値は `unknown` と明示し、`auto-allow` しない。
  - 修正方法別分類（25 / 1 / 16）:
    - 25 件: compatible bump で解消可能（lockfile / patch / minor update の範囲で処理可能）
    - 1 件: major update 必須（`gh-pages` のメジャー更新が前提）
    - 16 件: 対応手段が別 Issue / upstream fix 未定（`react-scripts`, `microbundle-crl` 等）
    - ここでの「1」および「16」は修正方法別分類であり、例外運用別の `classification`（期限付き例外 / 別 Issue / 修正内）とは別軸である。個別 package には両方の分類が並ぶことを要件とする。`gh-pages` は `1` に属するが、期限付き例外ではない。`microbundle-crl` は `1` または `16` のどちらか一方へ割り当てて集計し、併記しない。
  - 設計 PR での調査証跡（必須・実測値）:
    - 取得日時: `2026-10-25T10:09:13Z`（ローカル実測）
    - 実測コマンド:
      - `npm audit --json` → exit code `1`, `high 38 / critical 4`（= 42 packages）
      - `npm audit --omit=dev --json` → exit code `0`, vulnerabilities `0`（prod 依存は clean）
    - 対象一覧: package / directDependency / dependencyPath / advisoryIds / affectedRange / fixAvailable / requiredUpdate / classification / reason
    - 実測一覧 (high/critical; React 18 現行 lockfile 実測, React 19 job は未実測):
      - `@babel/plugin-transform-modules-systemjs`: directDependency=transitive via build tooling; dependencyPath=`node_modules/@babel/plugin-transform-modules-systemjs`; advisoryIds=`GHSA-fv7c-fp4j-7gwp`; affectedRange=`>=7.12.0 <=7.29.3`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=dev toolchain; fix available but outside the React 19 code change scope.
      - `@rollup/plugin-node-resolve`: directDependency=transitive via build tooling; dependencyPath=`node_modules/@rollup/plugin-node-resolve`; advisoryIds=`unknown`; affectedRange=`<=7.1.1`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=`via` に advisory id が無く、補完不能なら fail-closed; 現状は `unknown` を保持.
      - `@svgr/plugin-svgo`: directDependency=transitive via `react-scripts`; dependencyPath=`node_modules/@svgr/plugin-svgo`; advisoryIds=`unknown`; affectedRange=`<=5.5.0`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`react-scripts` 系の追跡が必要; `id` 未補完のため fail-closed 適用を要する.
      - `@svgr/rollup`: directDependency=transitive via `react-scripts`; dependencyPath=`node_modules/@svgr/rollup`; advisoryIds=`unknown`; affectedRange=`4.0.0 - 5.5.0`; fixAvailable=No; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`id` 未補完; 一時許容ではなく要確認扱い.
      - `@svgr/webpack`: directDependency=transitive via `react-scripts`; dependencyPath=`node_modules/@svgr/webpack`; advisoryIds=`unknown`; affectedRange=`4.0.0 - 5.5.0`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`id` 未補完; `react-scripts` 側の更新が切り分け要因.
      - `body-parser`: directDependency=transitive via `react-scripts` / build tooling; dependencyPath=`node_modules/body-parser`; advisoryIds=`GHSA-v422-hmwv-36x6`, `GHSA-27r3-jxmh-p828`; affectedRange=`<1.20.6` / `<=1.20.8 || 2.0.0-beta.1 - 2.0.2`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories inherited from the toolchain; root origin is not the project manifest.
      - `brace-expansion`: directDependency=transitive via `filelist`; dependencyPath=`node_modules/brace-expansion > node_modules/filelist/node_modules/brace-expansion`; advisoryIds=`GHSA-f886-m6hf-6m8v`, `GHSA-3jxr-9vmj-r5cp`, `GHSA-mh99-v99m-4gvg`, `GHSA-rgw5-rvv9-x895`, `GHSA-q2hr-2g5m-vwhr`, `GHSA-qhr7-859c-m2p7`, `GHSA-6j4f-fj2g-mc7p`; affectedRange=`<1.1.13` / `<=1.1.20 || 2.0.0 - 2.1.6`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=1 package with 7 unique GHSA and 14 via entries; exception records keyed by GHSA.
      - `browserslist`: directDependency=transitive via build tooling; dependencyPath=`node_modules/browserslist`; advisoryIds=`GHSA-c83g-rgw3-j3cx`, `GHSA-73wf-gq98-2v4g`; affectedRange=`<=4.28.6`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories but fix available.
      - `compression`: directDependency=transitive via build tooling; dependencyPath=`node_modules/compression`; advisoryIds=`GHSA-vc2v-76pw-4v95`; affectedRange=`<1.8.2`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory; fix available.
      - `css-select`: directDependency=transitive via `svgo`; dependencyPath=`node_modules/svgo/node_modules/css-select`; advisoryIds=`unknown`; affectedRange=`<=3.1.0`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=no stable advisory id from this entry; treat as fail-closed if unresolved.
      - `fast-uri`: directDependency=transitive via build tooling; dependencyPath=`node_modules/fast-uri`; advisoryIds=`GHSA-v2hh-gcrm-f6hx`, `GHSA-7p8r-x3mc-p8w7`, `GHSA-q3j6-qgpj-74h6`, `GHSA-v39h-62p7-jpjc`, `GHSA-f65p-4m7j-42xc`, `GHSA-jqff-g426-hqxp`, `GHSA-4c8g-83qw-93j6`, `GHSA-qw65-cvwx-89v3`, `GHSA-hrr3-gc8f-f4qj`, `GHSA-w74x-v6f9-j3xg`, `GHSA-xhq7-xmqj-769h`, `GHSA-333x-w4r6-6crp`; affectedRange=`>=3.0.0 <=3.1.3` / `3.0.0 - 3.1.8`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=many advisories on a single package; unique GHSA count is the exception key.
      - `flatted`: directDependency=transitive via build tooling; dependencyPath=`node_modules/flatted`; advisoryIds=`GHSA-25h7-pfq9-p65f`, `GHSA-rf6f-7fwh-wjgh`; affectedRange=`<=3.4.1`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=fix available.
      - `form-data`: directDependency=transitive via build tooling; dependencyPath=`node_modules/form-data`; advisoryIds=`GHSA-hmw2-7cc7-3qxx`; affectedRange=`>=3.0.0 <3.0.5`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory; direct update path available.
      - `gh-pages`: directDependency=root dev dependency; dependencyPath=`node_modules/gh-pages`; advisoryIds=`GHSA-8mmm-9v2q-x3f9`; affectedRange=`<5.0.0`; fixAvailable=No; requiredUpdate=major update required; classification=別 Issue; reason=major update required; this is the `25/1/16` category `1` and is distinct from a temporary exception record.
      - `js-yaml`: directDependency=transitive via `eslint` / `@eslint/eslintrc`; dependencyPath=`node_modules/@eslint/eslintrc/node_modules/js-yaml > node_modules/eslint/node_modules/js-yaml > node_modules/js-yaml`; advisoryIds=`GHSA-h67p-54hq-rp68`, `GHSA-52cp-r559-cp3m`, `GHSA-5p4m-2wfm-xmqj`, `GHSA-2883-xcg3-v3hh`; affectedRange=`<3.15.0` / `<=3.15.1 || 4.0.0 - 4.3.1`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories in a nested install path.
      - `jsonpath`: directDependency=transitive via build tooling; dependencyPath=`node_modules/jsonpath`; advisoryIds=`GHSA-6c59-mwgh-r2x6`, `GHSA-87r5-mp6g-5w5j`; affectedRange=`<1.2.0`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `launch-editor`: directDependency=transitive via build tooling; dependencyPath=`node_modules/launch-editor`; advisoryIds=`GHSA-v6wh-96g9-6wx3`, `GHSA-698v-4r3x-3vcv`, `GHSA-r825-w8mm-5pxw`, `GHSA-587h-7wmj-h5pm`; affectedRange=`<=2.14.0` / `<=2.14.1`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=4 advisories, single package.
      - `lodash`: directDependency=transitive via build tooling; dependencyPath=`node_modules/lodash`; advisoryIds=`GHSA-r5fr-rjxr-66jc`, `GHSA-f23m-r3pf-42rh`; affectedRange=`>=4.0.0 <=4.17.23`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=fix available.
      - `microbundle-crl`: directDependency=direct dev dependency; dependencyPath=`node_modules/microbundle-crl`; advisoryIds=`unknown`; affectedRange=`*`; fixAvailable=No; requiredUpdate=major update or upstream fix; classification=別 Issue; reason=vulnerable package with no stable advisory id in current output; treat as fail-closed if unresolved.
      - `minimatch`: directDependency=transitive via `filelist`; dependencyPath=`node_modules/filelist/node_modules/minimatch > node_modules/minimatch`; advisoryIds=`GHSA-3ppc-4f35-3m26`, `GHSA-7r86-cg39-jmmj`, `GHSA-23c5-xmqv-rm74`; affectedRange=`<3.1.3` / `<=3.1.3 || 5.0.0 - 5.1.7`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=3 advisories from nested install path.
      - `nanoid`: directDependency=transitive via build tooling; dependencyPath=`node_modules/nanoid`; advisoryIds=`GHSA-28wg-ghj8-5hjv`, `GHSA-2v37-7h3g-55p8`, `GHSA-xwg4-73v4-xw9w`; affectedRange=`<=3.3.17`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `node-forge`: directDependency=transitive via build tooling; dependencyPath=`node_modules/node-forge`; advisoryIds=`GHSA-2328-f5f3-gj25`, `GHSA-q67f-28xg-22rw`, `GHSA-5m6q-g25r-mvwx`, `GHSA-ppp5-5v6c-4jwp`, `GHSA-86w9-cpqp-85rv`; affectedRange=`<=1.3.3` / `*`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `nth-check`: directDependency=transitive via `svgo`; dependencyPath=`node_modules/svgo/node_modules/nth-check`; advisoryIds=`GHSA-rp65-9cf3-cjxr`; affectedRange=`<2.0.1`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`react-scripts` / `svgo` chain; no stable direct fix within scope.
      - `path-to-regexp`: directDependency=transitive via build tooling; dependencyPath=`node_modules/path-to-regexp`; advisoryIds=`GHSA-37ch-88jc-xwx2`; affectedRange=`<0.1.13`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory.
      - `picomatch`: directDependency=transitive via `tinyglobby`; dependencyPath=`node_modules/picomatch > node_modules/tinyglobby/node_modules/picomatch`; advisoryIds=`GHSA-3v7f-55p6-f55p`, `GHSA-c2c7-rcm5-vvqj`; affectedRange=`<=2.3.1 || 4.0.0 - 4.0.3`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=two advisories in nested path.
      - `postcss`: directDependency=transitive via `autoprefixer` / `stylehacks`; dependencyPath=`node_modules/autoprefixer/node_modules/postcss > ... > node_modules/stylehacks/node_modules/postcss`; advisoryIds=`GHSA-566m-qj78-rww5`, `GHSA-7fh5-64p2-3v2j`, `GHSA-qx2v-qp2m-jg93`, `GHSA-6g55-p6wh-862q`, `GHSA-fxqj-rqcc-2cmp`, `GHSA-r28c-9q8g-f849`; affectedRange=`<=8.5.22`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=many advisories on nested package; fix path exists upstream but outside the immediate React 19 scope.
      - `postcss-svgo`: directDependency=transitive via build tooling; dependencyPath=`node_modules/postcss-svgo`; advisoryIds=`unknown`; affectedRange=`<=5.0.0-rc.2`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=`via` lacks stable advisory id; require `source/title/url` fallback or fail-closed.
      - `proxy-addr`: directDependency=transitive via build tooling; dependencyPath=`node_modules/proxy-addr`; advisoryIds=`GHSA-jqcg-44mw-7w3h`; affectedRange=`>=1.1.0 <2.0.8`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory in dev dependency chain.
      - `react-scripts`: directDependency=root dev dependency; dependencyPath=`node_modules/react-scripts`; advisoryIds=`unknown`; affectedRange=`>=0.1.0`; fixAvailable=No; requiredUpdate=major update or upstream fix; classification=別 Issue; reason=the manifest lists it as a direct dev dependency, but the current audit output does not provide a stable advisory ID; unresolved identifiers remain fail-closed and cannot be auto-allowed.
      - `rollup`: directDependency=transitive via `workbox-build`; dependencyPath=`node_modules/rollup > node_modules/workbox-build/node_modules/rollup`; advisoryIds=`GHSA-gcx4-mw62-g8wm`, `GHSA-mw96-cpmx-2vgc`; affectedRange=`<=2.79.2`; fixAvailable=No; requiredUpdate=major update or upstream fix; classification=期限付き例外; reason=fix available only via upstream update; keep exception until resolved.
      - `rollup-plugin-terser`: directDependency=transitive via `workbox-build`; dependencyPath=`node_modules/rollup-plugin-terser > node_modules/workbox-build/node_modules/rollup-plugin-terser`; advisoryIds=`unknown`; affectedRange=`3.0.0 || >=4.0.4`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`via` lacks stable advisory id; do not allow automatically.
      - `serialize-javascript`: directDependency=transitive via `workbox-build` / `rollup-plugin-terser`; dependencyPath=`node_modules/rollup-plugin-terser/node_modules/serialize-javascript > ... > node_modules/workbox-build/node_modules/serialize-javascript`; advisoryIds=`GHSA-5c6j-r48x-rmvq`, `GHSA-qj8w-gfj5-8c6v`, `GHSA-m5mm-p8h7-m29v`; affectedRange=`<=7.0.2` / `<=7.1.2`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=nested package chain with multiple advisories.
      - `shell-quote`: directDependency=transitive via build tooling; dependencyPath=`node_modules/shell-quote`; advisoryIds=`GHSA-w7jw-789q-3m8p`, `GHSA-395f-4hp3-45gv`; affectedRange=`>=1.1.0 <=1.8.3` / `<=1.8.4`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `source-map-js`: directDependency=transitive via build tooling; dependencyPath=`node_modules/source-map-js`; advisoryIds=`GHSA-68fv-2mgg-jv7q`; affectedRange=`>=1.0.0 <1.2.2`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory.
      - `svgo`: directDependency=transitive via `css-minimizer-webpack-plugin`; dependencyPath=`node_modules/css-minimizer-webpack-plugin/node_modules/svgo > node_modules/svgo`; advisoryIds=`GHSA-xpqw-6gx7-v673`, `GHSA-2p49-hgcm-8545`, `GHSA-w27v-7q3p-w38r`, `GHSA-4vpr-x523-8j87`; affectedRange=`>=2.1.0 <2.8.1` / `1.0.0 - 2.8.3`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=many advisories in a nested SVGO install path.
      - `underscore`: directDependency=transitive via build tooling; dependencyPath=`node_modules/underscore`; advisoryIds=`GHSA-qpx9-hpmf-5gmw`; affectedRange=`<=1.13.7`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory; fix available.
      - `webpack-dev-middleware`: directDependency=transitive via build tooling; dependencyPath=`node_modules/webpack-dev-middleware`; advisoryIds=`GHSA-g84c-rxfj-3j2c`; affectedRange=`<7.4.5`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=direct resolution is in upstream toolchain.
      - `webpack-dev-server`: directDependency=transitive via `react-scripts`; dependencyPath=`node_modules/webpack-dev-server`; advisoryIds=`GHSA-9jgg-88mc-972h`, `GHSA-4v9v-hfq4-rm2v`, `GHSA-79cf-xcqc-c78w`, `GHSA-mx8g-39q3-5c79`, `GHSA-f5vj-f2hx-8m93`, `GHSA-m28w-2pqf-7qgj`; affectedRange=`<=5.2.0` / `<=5.2.7`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=the root cause is `react-scripts` pulling `webpack-dev-server`; the project manifest does not list it directly.
      - `websocket-driver`: directDependency=transitive via build tooling; dependencyPath=`node_modules/websocket-driver`; advisoryIds=`GHSA-mp7j-qc5w-4988`, `GHSA-xv26-6w52-cph6`; affectedRange=`<0.7.5` / `<=0.7.4`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `workbox-build`: directDependency=transitive via build tooling; dependencyPath=`node_modules/workbox-build`; advisoryIds=`unknown`; affectedRange=`5.0.0-alpha.0 - 7.0.0`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`via` lacks stable id; use source/title/url fallback or fail closed.
      - `workbox-webpack-plugin`: directDependency=transitive via build tooling; dependencyPath=`node_modules/workbox-webpack-plugin`; advisoryIds=`unknown`; affectedRange=`5.0.0-alpha.0 - 7.0.0`; fixAvailable=Yes; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`via` lacks stable id; use source/title/url fallback or fail closed.
      - `ws`: directDependency=transitive via `webpack-dev-server`; dependencyPath=`node_modules/webpack-dev-server/node_modules/ws > node_modules/ws`; advisoryIds=`GHSA-58qx-3vcg-4xpx`, `GHSA-96hv-2xvq-fx4p`; affectedRange=`>=8.0.0 <8.20.1` / `7.0.0 - 7.5.10 || 8.0.0 - 8.20.1`; fixAvailable=Yes; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=nested dependency with multiple advisories.

      `directDependency` と `affectedRange` は `npm audit --json` の標準出力から完全には導出できないため、表中の値が確認できたものは `manifest` / lockfile / advisory `range` を併用して補完し、確認できないものは `unknown` を明示する。`advisoryIds` が `unknown` / `—` の項目は、自動許容の対象にしない。`identityKey` を生成できない場合は fail-closed とする。
    - 例外レコード数対応関係: `42 package` と `例外レコード数` は 1:1 ではない。`npm audit --json` の `via` は 1 package に複数 advisory / via ノードを持ち得るため、例外キーは「package × advisoryID × severity × job」単位で管理する。`brace-expansion` は 1 package で 7 unique GHSA と 14 via entries のため、例外レコードは GHSA 単位で生成される。最終的な例外レコード数は GHSA / advisories の総数に依存し、42 package 数と同一ではない。
    - 例外ID不明項目と CI 成功条件の整合:
      - `advisoryIds: unknown` または `—` を含む package は、`package + severity` で自動例外許可しない。
      - `via[*].source` / `url` / `title` で安定識別子が得られない場合は fail-closed とし、承認済みの既存分だけで CI が失敗することを許容する。識別不能な package は `BLOCKER` と扱い、正常系の受入条件には含めない。
      - そのため正常系の fixture は「全件が安定識別子付き or 例外台帳に登録済みで期限内」になっており、識別不能項目が残る状態では 4章の正常系は成立しない。
      - React 19 job は未実測として保持し、React 18 の現行 lockfile 実測と区別する。
    - `25 / 1 / 16` 分類と実測一覧の対応:

      | 区分 | 件数 | 代表例 | root cause | 運用分類 |
      | --- | ---: | --- | --- | --- |
      | 修正方法別: compatible bump / lockfile update | 25 | `body-parser`, `browserslist`, `lodash` | `fixAvailable` と依存範囲が明示される | 期限付き例外または修正内 |
      | 修正方法別: major update required | 1 | `gh-pages` | メジャー更新が前提 | 別 Issue |
      | 修正方法別: upstream fix unavailable | 16 | `react-scripts`, `microbundle-crl`, `webpack-dev-server` | 既存のパッケージ自体の修正版が未確定 | 別 Issue |

      ここでの 25 + 1 + 16 = 42 であり、各 package は修正方法別分類のいずれか 1 つへのみ割り当てる。`fixAvailable=Yes` と `requiredUpdate=major update or upstream fix` は別軸であり、`fixAvailable` は npm audit の有無を示す一方、`requiredUpdate` は実際の修正経路（lockfile / patch / major / upstream）を示す。`gh-pages` は `1` に属し、期限付き例外ではない。`microbundle-crl` は `requiredUpdate` と `trackingIssue` を併記し、運用上は `16` に寄せるが、例外運用別の `classification` と同一視しない。
    - 結論: 実測上、`npm audit --omit=dev --json` は 0 件のため、公開依存の影響なし。残る 42 件は dev/build tooling を中心に、1 package に複数 advisory / `via` が発生するため、例外レコード数は package 数と一致しない。設計上の例外キーは `id × package × severity × job` を主軸とし、`via` の複数 advisory は同一 package 内でまとめて判定する。`id` が取得不能な行は `package + severity` で自動例外許可しない; 代わりに `source` / `title` / `url` の補完を試み、補完できない場合は fail-closed で失敗する。実データに基づき、未実測の雛形は `TBD` としない。
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
