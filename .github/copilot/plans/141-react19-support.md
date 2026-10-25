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
  - `via` の正規化: `vulnerabilities[package].via` に勧告オブジェクトがあれば `url` の GHSA ID（なければ `source`）を採用する。文字列の `via` は別の脆弱パッケージ名への参照なので、`vulnerabilities[参照先].via` を循環検出付きで再帰的にたどり、元の勧告オブジェクトへ解決する。参照先ごとに得た全 ID を重複排除し、パッケージとの組を例外台帳と照合する。`title` だけでは安定識別子とみなさない。参照先欠落・循環のみで元勧告が得られない・ID 欠落の場合は fail-closed とする。`via` の文字列や設置場所だけから root 直接依存を推定せず、`package.json` で判定する。42 件中の root 直接依存は `gh-pages` / `microbundle-crl` / `react-scripts` の 3 件である。
  - 例外照合と識別キー（重要）:
    - 照合キーは `package + advisoryId + severity + job`。`advisoryId` は上記の再帰解決で得た GHSA ID、または GHSA がなければ `via` 勧告オブジェクトの `source` を名前空間付きで用いる。URL・source の対応が変わった場合は不一致として停止する。同一 package の複数 ID はすべて個別に照合し、一つでも未承認なら失敗する。
    - `advisoryId` が取れない行は `package + severity + job` だけで例外一致させない。識別不能な脆弱性は「未登録・不明」扱いで fail-closed にし、新規検出として失敗させる。
    - `dependencyPath` は `npm audit` の `nodes` が示す設置場所で、依存元そのものではない。依存起点は `package.json` の直接依存と lockfile の依存辺をたどり、各行の `rootDevDependencies` / `exampleDependencyChain` に分けて記録する。経路が確認できない新規項目は自動許容しない。
  - 修正方法別分類（25 / 1 / 16）:
    - 25 件: compatible bump で解消可能（lockfile / patch / minor update の範囲で処理可能）
    - 1 件: major update 必須（`gh-pages` のメジャー更新が前提）
    - 16 件: 対応手段が別 Issue / upstream fix 未定（`react-scripts`, `microbundle-crl` 等）
    - ここでの「1」および「16」は修正方法別分類であり、例外運用別の `classification`（期限付き例外 / 別 Issue / 修正内）とは別軸である。個別 package には両方の分類が並ぶことを要件とする。`gh-pages` は修正方法別の `1`、`microbundle-crl` は `16` に一意に属する。別 Issue で恒久対応する間、CI で許容する場合は両者とも期限付き・承認済みの例外台帳レコードを要する。
  - 設計 PR での調査証跡（必須・実測値）:
    - 取得日時: 全依存 `2026-10-25T12:27:10Z`、`--omit=dev` `2026-10-25T12:51:13Z`（React 18 lockfile を再取得）
    - 実測コマンド:
      - `npm audit --json` → exit code `1`, `high 38 / critical 4`（= 42 packages）
      - `npm audit --omit=dev --json` → exit code `0`, vulnerabilities `0`（prod 依存は clean）
    - 対象一覧: package / directDependency / dependencyPath / advisoryIds / affectedRange / fixAvailable / requiredUpdate / classification / reason
    - 実測一覧 (high/critical; React 18 現行 lockfile 実測, React 19 job は未実測):
      - `@babel/plugin-transform-modules-systemjs`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → @babel/preset-env → @babel/plugin-transform-modules-systemjs`; dependencyPath=`node_modules/@babel/plugin-transform-modules-systemjs`; advisoryIds=`GHSA-fv7c-fp4j-7gwp`; affectedRange=`7.12.0 - 7.29.0`; advisoryRanges=`GHSA-fv7c-fp4j-7gwp: >=7.12.0 <=7.29.3`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=dev toolchain; fix available but outside the React 19 code change scope.
      - `@rollup/plugin-node-resolve`: rootDevDependencies=`microbundle-crl`; exampleDependencyChain=`microbundle-crl → @rollup/plugin-node-resolve`; dependencyPath=`node_modules/@rollup/plugin-node-resolve`; advisoryIds=`GHSA-gcx4-mw62-g8wm, GHSA-mw96-cpmx-2vgc`; affectedRange=`<=7.1.1`; advisoryRanges=`GHSA-gcx4-mw62-g8wm: <2.79.2; GHSA-mw96-cpmx-2vgc: <2.80.0`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先 `rollup` の勧告を再帰解決する。
      - `@svgr/plugin-svgo`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → @svgr/rollup → @svgr/plugin-svgo`; dependencyPath=`node_modules/@svgr/plugin-svgo`; advisoryIds=`GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r, GHSA-xpqw-6gx7-v673`; affectedRange=`<=5.5.0`; advisoryRanges=`GHSA-2p49-hgcm-8545: >=1.0.0 <2.8.3; GHSA-4vpr-x523-8j87: >=1.0.0 <2.8.4; GHSA-rp65-9cf3-cjxr: <2.0.1; GHSA-w27v-7q3p-w38r: >=1.0.0 <2.8.4; GHSA-xpqw-6gx7-v673: >=2.1.0 <2.8.1`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先 `svgo` 系の元勧告へ再帰解決する。
      - `@svgr/rollup`: rootDevDependencies=`microbundle-crl`; exampleDependencyChain=`microbundle-crl → @svgr/rollup`; dependencyPath=`node_modules/@svgr/rollup`; advisoryIds=`GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r, GHSA-xpqw-6gx7-v673`; affectedRange=`4.0.0 - 5.5.0`; advisoryRanges=`GHSA-2p49-hgcm-8545: >=1.0.0 <2.8.3; GHSA-4vpr-x523-8j87: >=1.0.0 <2.8.4; GHSA-rp65-9cf3-cjxr: <2.0.1; GHSA-w27v-7q3p-w38r: >=1.0.0 <2.8.4; GHSA-xpqw-6gx7-v673: >=2.1.0 <2.8.1`; fixAvailable=`false`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先の元勧告へ再帰解決する。
      - `@svgr/webpack`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → @svgr/webpack`; dependencyPath=`node_modules/@svgr/webpack`; advisoryIds=`GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r, GHSA-xpqw-6gx7-v673`; affectedRange=`4.0.0 - 5.5.0`; advisoryRanges=`GHSA-2p49-hgcm-8545: >=1.0.0 <2.8.3; GHSA-4vpr-x523-8j87: >=1.0.0 <2.8.4; GHSA-rp65-9cf3-cjxr: <2.0.1; GHSA-w27v-7q3p-w38r: >=1.0.0 <2.8.4; GHSA-xpqw-6gx7-v673: >=2.1.0 <2.8.1`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先の元勧告へ再帰解決する。
      - `body-parser`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → express → body-parser`; dependencyPath=`node_modules/body-parser`; advisoryIds=`GHSA-27r3-jxmh-p828, GHSA-4mjr-xmp4-gh2g, GHSA-q8mj-m7cp-5q26, GHSA-v422-hmwv-36x6, GHSA-w7fw-mjwx-w883`; affectedRange=`<=1.20.8 || 2.0.0-beta.1 - 2.0.2`; advisoryRanges=`GHSA-27r3-jxmh-p828: <1.20.9; GHSA-4mjr-xmp4-gh2g: >=2.2.5 <6.16.0; GHSA-q8mj-m7cp-5q26: >=6.11.1 <=6.15.1; GHSA-v422-hmwv-36x6: <1.20.6; GHSA-w7fw-mjwx-w883: >=6.7.0 <=6.14.1`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories inherited from the toolchain; root origin is not the project manifest.
      - `brace-expansion`: rootDevDependencies=`gh-pages, microbundle-crl, npm-run-all, react-scripts`; exampleDependencyChain=`npm-run-all → minimatch → brace-expansion`; dependencyPath=`node_modules/brace-expansion, node_modules/filelist/node_modules/brace-expansion`; advisoryIds=`GHSA-3jxr-9vmj-r5cp, GHSA-6j4f-fj2g-mc7p, GHSA-f886-m6hf-6m8v, GHSA-mh99-v99m-4gvg, GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-rgw5-rvv9-x895`; affectedRange=`<=1.1.20 || 2.0.0 - 2.1.6`; advisoryRanges=`GHSA-3jxr-9vmj-r5cp: <1.1.16, >=2.0.0 <2.1.2; GHSA-6j4f-fj2g-mc7p: <1.1.19, >=2.0.0 <2.1.5; GHSA-f886-m6hf-6m8v: <1.1.13, >=2.0.0 <2.0.3; GHSA-mh99-v99m-4gvg: <1.1.17, >=2.0.0 <2.1.3; GHSA-q2hr-2g5m-vwhr: <1.1.21, >=2.0.0 <2.1.7; GHSA-qhr7-859c-m2p7: <1.1.20, >=2.0.0 <2.1.6; GHSA-rgw5-rvv9-x895: <1.1.18, >=2.0.0 <2.1.4`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=1 package with 7 unique GHSA and 14 via entries; exception records keyed by GHSA.
      - `browserslist`: rootDevDependencies=`microbundle-crl, postcss-preset-env, react-scripts`; exampleDependencyChain=`postcss-preset-env → browserslist`; dependencyPath=`node_modules/browserslist`; advisoryIds=`GHSA-73wf-gq98-2v4g, GHSA-c83g-rgw3-j3cx`; affectedRange=`<=4.28.6`; advisoryRanges=`GHSA-73wf-gq98-2v4g: <=4.28.6; GHSA-c83g-rgw3-j3cx: <=4.28.6`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories but fix available.
      - `compression`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → compression`; dependencyPath=`node_modules/compression`; advisoryIds=`GHSA-vc2v-76pw-4v95`; affectedRange=`<1.8.2`; advisoryRanges=`GHSA-vc2v-76pw-4v95: <1.8.2`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory; fix available.
      - `css-select`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → @svgr/rollup → @svgr/plugin-svgo → svgo → css-select`; dependencyPath=`node_modules/svgo/node_modules/css-select`; advisoryIds=`GHSA-rp65-9cf3-cjxr`; affectedRange=`<=3.1.0`; advisoryRanges=`GHSA-rp65-9cf3-cjxr: <2.0.1`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先 `nth-check` の元勧告へ再帰解決する。
      - `fast-uri`: rootDevDependencies=`mini-css-extract-plugin, react-scripts`; exampleDependencyChain=`mini-css-extract-plugin → schema-utils → ajv → fast-uri`; dependencyPath=`node_modules/fast-uri`; advisoryIds=`GHSA-333x-w4r6-6crp, GHSA-4c8g-83qw-93j6, GHSA-7p8r-x3mc-p8w7, GHSA-f65p-4m7j-42xc, GHSA-hrr3-gc8f-f4qj, GHSA-jqff-g426-hqxp, GHSA-q3j6-qgpj-74h6, GHSA-qw65-cvwx-89v3, GHSA-v2hh-gcrm-f6hx, GHSA-v39h-62p7-jpjc, GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h`; affectedRange=`3.0.0 - 3.1.8`; advisoryRanges=`GHSA-333x-w4r6-6crp: >=3.0.0 <3.1.9; GHSA-4c8g-83qw-93j6: >=3.0.0 <3.1.3; GHSA-7p8r-x3mc-p8w7: >=3.0.0 <3.1.5; GHSA-f65p-4m7j-42xc: >=3.0.0 <3.1.6; GHSA-hrr3-gc8f-f4qj: >=3.0.0 <3.1.8; GHSA-jqff-g426-hqxp: >=3.0.0 <3.1.6; GHSA-q3j6-qgpj-74h6: >=3.0.0 <=3.1.0; GHSA-qw65-cvwx-89v3: >=3.0.0 <3.1.7; GHSA-v2hh-gcrm-f6hx: >=3.0.0 <=3.1.3; GHSA-v39h-62p7-jpjc: >=3.0.0 <=3.1.1; GHSA-w74x-v6f9-j3xg: >=3.0.0 <3.1.9; GHSA-xhq7-xmqj-769h: >=3.0.0 <3.1.9`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=many advisories on a single package; unique GHSA count is the exception key.
      - `flatted`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → eslint → file-entry-cache → flat-cache → flatted`; dependencyPath=`node_modules/flatted`; advisoryIds=`GHSA-25h7-pfq9-p65f, GHSA-rf6f-7fwh-wjgh`; affectedRange=`<=3.4.1`; advisoryRanges=`GHSA-25h7-pfq9-p65f: <3.4.0; GHSA-rf6f-7fwh-wjgh: <=3.4.1`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=fix available.
      - `form-data`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → jest → @jest/core → jest-config → jest-environment-jsdom → jsdom → form-data`; dependencyPath=`node_modules/form-data`; advisoryIds=`GHSA-hmw2-7cc7-3qxx`; affectedRange=`3.0.0 - 3.0.4`; advisoryRanges=`GHSA-hmw2-7cc7-3qxx: >=3.0.0 <3.0.5`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory; direct update path available.
      - `gh-pages`: rootDevDependencies=`gh-pages`; exampleDependencyChain=`gh-pages`; dependencyPath=`node_modules/gh-pages`; advisoryIds=`GHSA-8mmm-9v2q-x3f9`; affectedRange=`<5.0.0`; advisoryRanges=`GHSA-8mmm-9v2q-x3f9: <5.0.0`; fixAvailable=`gh-pages@6.3.0 (major)`; requiredUpdate=major update required; classification=別 Issue; reason=修正方法別の `1`。別 Issue で更新するまで、CI で許容するには期限付きの承認済み例外を要する。
      - `js-yaml`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`react-scripts → eslint → js-yaml`; dependencyPath=`node_modules/@eslint/eslintrc/node_modules/js-yaml, node_modules/eslint/node_modules/js-yaml, node_modules/js-yaml`; advisoryIds=`GHSA-2883-xcg3-v3hh, GHSA-52cp-r559-cp3m, GHSA-5p4m-2wfm-xmqj, GHSA-h67p-54hq-rp68`; affectedRange=`<=3.15.1 || 4.0.0 - 4.3.1`; advisoryRanges=`GHSA-2883-xcg3-v3hh: >=3.0.0 <3.15.2, >=4.0.0 <4.3.2; GHSA-52cp-r559-cp3m: >=3.0.0 <3.15.0, >=4.0.0 <4.3.0; GHSA-5p4m-2wfm-xmqj: >=3.0.0 <3.15.1, >=4.0.0 <4.3.1; GHSA-h67p-54hq-rp68: <3.15.0, >=4.0.0 <=4.1.1`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories in a nested install path.
      - `jsonpath`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → bfj → jsonpath`; dependencyPath=`node_modules/jsonpath`; advisoryIds=`GHSA-6c59-mwgh-r2x6, GHSA-87r5-mp6g-5w5j, GHSA-qpx9-hpmf-5gmw`; affectedRange=`*`; advisoryRanges=`GHSA-6c59-mwgh-r2x6: <1.2.0; GHSA-87r5-mp6g-5w5j: <=1.2.1; GHSA-qpx9-hpmf-5gmw: <=1.13.7`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `launch-editor`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → launch-editor`; dependencyPath=`node_modules/launch-editor`; advisoryIds=`GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-v6wh-96g9-6wx3`; affectedRange=`<=2.14.1`; advisoryRanges=`GHSA-587h-7wmj-h5pm: <=2.14.1; GHSA-698v-4r3x-3vcv: <=2.14.1; GHSA-r825-w8mm-5pxw: <=2.14.1; GHSA-v6wh-96g9-6wx3: <=2.14.0`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=4 advisories, single package.
      - `lodash`: rootDevDependencies=`@testing-library/jest-dom, gh-pages, react-scripts`; exampleDependencyChain=`@testing-library/jest-dom → lodash`; dependencyPath=`node_modules/lodash`; advisoryIds=`GHSA-f23m-r3pf-42rh, GHSA-r5fr-rjxr-66jc`; affectedRange=`<=4.17.23`; advisoryRanges=`GHSA-f23m-r3pf-42rh: <=4.17.23; GHSA-r5fr-rjxr-66jc: >=4.0.0 <=4.17.23`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=fix available.
      - `microbundle-crl`: rootDevDependencies=`microbundle-crl`; exampleDependencyChain=`microbundle-crl`; dependencyPath=`node_modules/microbundle-crl`; advisoryIds=`GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-566m-qj78-rww5, GHSA-5c6j-r48x-rmvq, GHSA-6g55-p6wh-862q, GHSA-7fh5-64p2-3v2j, GHSA-fxqj-rqcc-2cmp, GHSA-gcx4-mw62-g8wm, GHSA-m5mm-p8h7-m29v, GHSA-mw96-cpmx-2vgc, GHSA-qj8w-gfj5-8c6v, GHSA-qx2v-qp2m-jg93, GHSA-r28c-9q8g-f849, GHSA-rj75-hqrm-r3gf, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r, GHSA-w9m9-85wc-3x92, GHSA-xpqw-6gx7-v673`; affectedRange=`*`; advisoryRanges=`GHSA-2p49-hgcm-8545: >=1.0.0 <2.8.3; GHSA-4vpr-x523-8j87: >=1.0.0 <2.8.4; GHSA-566m-qj78-rww5: <7.0.36; GHSA-5c6j-r48x-rmvq: <=7.0.2; GHSA-6g55-p6wh-862q: <=8.5.11; GHSA-7fh5-64p2-3v2j: <8.4.31; GHSA-fxqj-rqcc-2cmp: <=8.5.22; GHSA-gcx4-mw62-g8wm: <2.79.2; GHSA-m5mm-p8h7-m29v: <7.1.3; GHSA-mw96-cpmx-2vgc: <2.80.0; GHSA-qj8w-gfj5-8c6v: >=5.0.0 <7.0.5; GHSA-qx2v-qp2m-jg93: <8.5.10; GHSA-r28c-9q8g-f849: <=8.5.17; GHSA-rj75-hqrm-r3gf: <7.1.6; GHSA-rp65-9cf3-cjxr: <2.0.1; GHSA-w27v-7q3p-w38r: >=1.0.0 <2.8.4; GHSA-w9m9-85wc-3x92: >=6.1.0 <6.1.3, >=7.1.0 <7.1.3; GHSA-xpqw-6gx7-v673: >=2.1.0 <2.8.1`; fixAvailable=`false`; requiredUpdate=major update or upstream fix; classification=別 Issue; reason=直接の `via` は参照名のみ。参照先の元勧告へ再帰解決する。
      - `minimatch`: rootDevDependencies=`gh-pages, microbundle-crl, npm-run-all, react-scripts`; exampleDependencyChain=`npm-run-all → minimatch`; dependencyPath=`node_modules/filelist/node_modules/minimatch, node_modules/minimatch`; advisoryIds=`GHSA-23c5-xmqv-rm74, GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj`; affectedRange=`<=3.1.3 || 5.0.0 - 5.1.7`; advisoryRanges=`GHSA-23c5-xmqv-rm74: <3.1.4, >=5.0.0 <5.1.8; GHSA-3ppc-4f35-3m26: <3.1.3, >=5.0.0 <5.1.7; GHSA-7r86-cg39-jmmj: <3.1.3, >=5.0.0 <5.1.8`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=3 advisories from nested install path.
      - `nanoid`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → postcss → nanoid`; dependencyPath=`node_modules/nanoid`; advisoryIds=`GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8, GHSA-xwg4-73v4-xw9w`; affectedRange=`<=3.3.17`; advisoryRanges=`GHSA-28wg-ghj8-5hjv: <3.3.16; GHSA-2v37-7h3g-55p8: <3.3.18; GHSA-xwg4-73v4-xw9w: <3.3.12`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `node-forge`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → selfsigned → node-forge`; dependencyPath=`node_modules/node-forge`; advisoryIds=`GHSA-2328-f5f3-gj25, GHSA-5m6q-g25r-mvwx, GHSA-86w9-cpqp-85rv, GHSA-ppp5-5v6c-4jwp, GHSA-q67f-28xg-22rw`; affectedRange=`*`; advisoryRanges=`GHSA-2328-f5f3-gj25: <=1.3.3; GHSA-5m6q-g25r-mvwx: <1.4.0; GHSA-86w9-cpqp-85rv: <=1.4.0; GHSA-ppp5-5v6c-4jwp: <1.4.0; GHSA-q67f-28xg-22rw: <1.4.0`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `nth-check`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → @svgr/rollup → @svgr/plugin-svgo → svgo → css-select → nth-check`; dependencyPath=`node_modules/svgo/node_modules/nth-check`; advisoryIds=`GHSA-rp65-9cf3-cjxr`; affectedRange=`<2.0.1`; advisoryRanges=`GHSA-rp65-9cf3-cjxr: <2.0.1`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=`react-scripts` / `svgo` chain; no stable direct fix within scope.
      - `path-to-regexp`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → express → path-to-regexp`; dependencyPath=`node_modules/path-to-regexp`; advisoryIds=`GHSA-37ch-88jc-xwx2`; affectedRange=`<0.1.13`; advisoryRanges=`GHSA-37ch-88jc-xwx2: <0.1.13`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory.
      - `picomatch`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → @rollup/plugin-commonjs → @rollup/pluginutils → picomatch`; dependencyPath=`node_modules/picomatch, node_modules/tinyglobby/node_modules/picomatch`; advisoryIds=`GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj`; affectedRange=`<=2.3.1 || 4.0.0 - 4.0.3`; advisoryRanges=`GHSA-3v7f-55p6-f55p: <2.3.2, >=4.0.0 <4.0.4; GHSA-c2c7-rcm5-vvqj: <2.3.2, >=4.0.0 <4.0.4`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=two advisories in nested path.
      - `postcss`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`react-scripts → postcss`; dependencyPath=`node_modules/autoprefixer/node_modules/postcss, node_modules/css-declaration-sorter/node_modules/postcss, node_modules/css-modules-loader-core/node_modules/postcss, node_modules/cssnano-preset-default/node_modules/postcss, node_modules/cssnano-util-raw-cache/node_modules/postcss, node_modules/cssnano/node_modules/postcss, node_modules/postcss, node_modules/postcss-calc/node_modules/postcss, node_modules/postcss-colormin/node_modules/postcss, node_modules/postcss-convert-values/node_modules/postcss, node_modules/postcss-discard-comments/node_modules/postcss, node_modules/postcss-discard-duplicates/node_modules/postcss, node_modules/postcss-discard-empty/node_modules/postcss, node_modules/postcss-discard-overridden/node_modules/postcss, node_modules/postcss-merge-longhand/node_modules/postcss, node_modules/postcss-merge-rules/node_modules/postcss, node_modules/postcss-minify-font-values/node_modules/postcss, node_modules/postcss-minify-gradients/node_modules/postcss, node_modules/postcss-minify-params/node_modules/postcss, node_modules/postcss-minify-selectors/node_modules/postcss, node_modules/postcss-modules/node_modules/postcss, node_modules/postcss-normalize-charset/node_modules/postcss, node_modules/postcss-normalize-display-values/node_modules/postcss, node_modules/postcss-normalize-positions/node_modules/postcss, node_modules/postcss-normalize-repeat-style/node_modules/postcss, node_modules/postcss-normalize-string/node_modules/postcss, node_modules/postcss-normalize-timing-functions/node_modules/postcss, node_modules/postcss-normalize-unicode/node_modules/postcss, node_modules/postcss-normalize-url/node_modules/postcss, node_modules/postcss-normalize-whitespace/node_modules/postcss, node_modules/postcss-ordered-values/node_modules/postcss, node_modules/postcss-reduce-initial/node_modules/postcss, node_modules/postcss-reduce-transforms/node_modules/postcss, node_modules/postcss-svgo/node_modules/postcss, node_modules/postcss-unique-selectors/node_modules/postcss, node_modules/resolve-url-loader/node_modules/postcss, node_modules/rollup-plugin-postcss/node_modules/postcss, node_modules/stylehacks/node_modules/postcss`; advisoryIds=`GHSA-566m-qj78-rww5, GHSA-6g55-p6wh-862q, GHSA-7fh5-64p2-3v2j, GHSA-fxqj-rqcc-2cmp, GHSA-qx2v-qp2m-jg93, GHSA-r28c-9q8g-f849`; affectedRange=`<=8.5.22`; advisoryRanges=`GHSA-566m-qj78-rww5: <7.0.36; GHSA-6g55-p6wh-862q: <=8.5.11; GHSA-7fh5-64p2-3v2j: <8.4.31; GHSA-fxqj-rqcc-2cmp: <=8.5.22; GHSA-qx2v-qp2m-jg93: <8.5.10; GHSA-r28c-9q8g-f849: <=8.5.17`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=many advisories on nested package; fix path exists upstream but outside the immediate React 19 scope.
      - `postcss-svgo`: rootDevDependencies=`microbundle-crl`; exampleDependencyChain=`microbundle-crl → cssnano → cssnano-preset-default → postcss-svgo`; dependencyPath=`node_modules/postcss-svgo`; advisoryIds=`GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-566m-qj78-rww5, GHSA-6g55-p6wh-862q, GHSA-7fh5-64p2-3v2j, GHSA-fxqj-rqcc-2cmp, GHSA-qx2v-qp2m-jg93, GHSA-r28c-9q8g-f849, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r, GHSA-xpqw-6gx7-v673`; affectedRange=`<=5.0.0-rc.2`; advisoryRanges=`GHSA-2p49-hgcm-8545: >=1.0.0 <2.8.3; GHSA-4vpr-x523-8j87: >=1.0.0 <2.8.4; GHSA-566m-qj78-rww5: <7.0.36; GHSA-6g55-p6wh-862q: <=8.5.11; GHSA-7fh5-64p2-3v2j: <8.4.31; GHSA-fxqj-rqcc-2cmp: <=8.5.22; GHSA-qx2v-qp2m-jg93: <8.5.10; GHSA-r28c-9q8g-f849: <=8.5.17; GHSA-rp65-9cf3-cjxr: <2.0.1; GHSA-w27v-7q3p-w38r: >=1.0.0 <2.8.4; GHSA-xpqw-6gx7-v673: >=2.1.0 <2.8.1`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先の元勧告へ再帰解決する。
      - `proxy-addr`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → express → proxy-addr`; dependencyPath=`node_modules/proxy-addr`; advisoryIds=`GHSA-jqcg-44mw-7w3h`; affectedRange=`1.1.0 - 2.0.7`; advisoryRanges=`GHSA-jqcg-44mw-7w3h: >=1.1.0 <2.0.8`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory in dev dependency chain.
      - `react-scripts`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts`; dependencyPath=`node_modules/react-scripts`; advisoryIds=`GHSA-2p49-hgcm-8545, GHSA-4v9v-hfq4-rm2v, GHSA-4vpr-x523-8j87, GHSA-566m-qj78-rww5, GHSA-5c6j-r48x-rmvq, GHSA-6g55-p6wh-862q, GHSA-79cf-xcqc-c78w, GHSA-7fh5-64p2-3v2j, GHSA-9jgg-88mc-972h, GHSA-f5vj-f2hx-8m93, GHSA-fxqj-rqcc-2cmp, GHSA-g84c-rxfj-3j2c, GHSA-m28w-2pqf-7qgj, GHSA-m5mm-p8h7-m29v, GHSA-mx8g-39q3-5c79, GHSA-qj8w-gfj5-8c6v, GHSA-qx2v-qp2m-jg93, GHSA-r28c-9q8g-f849, GHSA-rj75-hqrm-r3gf, GHSA-rp65-9cf3-cjxr, GHSA-vpq2-c234-7xj6, GHSA-w27v-7q3p-w38r, GHSA-w5hq-g745-h8pq, GHSA-w9m9-85wc-3x92, GHSA-xpqw-6gx7-v673`; affectedRange=`>=0.1.0`; advisoryRanges=`GHSA-2p49-hgcm-8545: >=1.0.0 <2.8.3; GHSA-4v9v-hfq4-rm2v: <=5.2.0; GHSA-4vpr-x523-8j87: >=1.0.0 <2.8.4; GHSA-566m-qj78-rww5: <7.0.36; GHSA-5c6j-r48x-rmvq: <=7.0.2; GHSA-6g55-p6wh-862q: <=8.5.11; GHSA-79cf-xcqc-c78w: <=5.2.3; GHSA-7fh5-64p2-3v2j: <8.4.31; GHSA-9jgg-88mc-972h: <=5.2.0; GHSA-f5vj-f2hx-8m93: <=5.2.5; GHSA-fxqj-rqcc-2cmp: <=8.5.22; GHSA-g84c-rxfj-3j2c: <7.4.5; GHSA-m28w-2pqf-7qgj: <=5.2.5; GHSA-m5mm-p8h7-m29v: <7.1.3; GHSA-mx8g-39q3-5c79: <5.2.5; GHSA-qj8w-gfj5-8c6v: >=5.0.0 <7.0.5; GHSA-qx2v-qp2m-jg93: <8.5.10; GHSA-r28c-9q8g-f849: <=8.5.17; GHSA-rj75-hqrm-r3gf: <7.1.6; GHSA-rp65-9cf3-cjxr: <2.0.1; GHSA-vpq2-c234-7xj6: <2.0.1; GHSA-w27v-7q3p-w38r: >=1.0.0 <2.8.4; GHSA-w5hq-g745-h8pq: <11.1.1; GHSA-w9m9-85wc-3x92: >=6.1.0 <6.1.3, >=7.1.0 <7.1.3; GHSA-xpqw-6gx7-v673: >=2.1.0 <2.8.1`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream fix; classification=別 Issue; reason=root の devDependency。直接の `via` は参照名のみだが、参照先を再帰解決して元勧告を特定する。
      - `rollup`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → rollup`; dependencyPath=`node_modules/rollup, node_modules/workbox-build/node_modules/rollup`; advisoryIds=`GHSA-gcx4-mw62-g8wm, GHSA-mw96-cpmx-2vgc`; affectedRange=`<=2.79.2`; advisoryRanges=`GHSA-gcx4-mw62-g8wm: <2.79.2; GHSA-mw96-cpmx-2vgc: <2.80.0`; fixAvailable=`false`; requiredUpdate=major update or upstream fix; classification=期限付き例外; reason=fix available only via upstream update; keep exception until resolved.
      - `rollup-plugin-terser`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → rollup-plugin-terser`; dependencyPath=`node_modules/rollup-plugin-terser, node_modules/workbox-build/node_modules/rollup-plugin-terser`; advisoryIds=`GHSA-5c6j-r48x-rmvq, GHSA-m5mm-p8h7-m29v, GHSA-qj8w-gfj5-8c6v`; affectedRange=`3.0.0 || >=4.0.4`; advisoryRanges=`GHSA-5c6j-r48x-rmvq: <=7.0.2; GHSA-m5mm-p8h7-m29v: <7.1.3; GHSA-qj8w-gfj5-8c6v: >=5.0.0 <7.0.5`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先 `serialize-javascript` の元勧告へ再帰解決する。
      - `serialize-javascript`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → rollup-plugin-terser → serialize-javascript`; dependencyPath=`node_modules/rollup-plugin-terser/node_modules/serialize-javascript, node_modules/serialize-javascript, node_modules/workbox-build/node_modules/serialize-javascript`; advisoryIds=`GHSA-5c6j-r48x-rmvq, GHSA-m5mm-p8h7-m29v, GHSA-qj8w-gfj5-8c6v`; affectedRange=`<=7.1.2`; advisoryRanges=`GHSA-5c6j-r48x-rmvq: <=7.0.2; GHSA-m5mm-p8h7-m29v: <7.1.3; GHSA-qj8w-gfj5-8c6v: >=5.0.0 <7.0.5`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=nested package chain with multiple advisories.
      - `shell-quote`: rootDevDependencies=`npm-run-all, react-scripts`; exampleDependencyChain=`npm-run-all → shell-quote`; dependencyPath=`node_modules/shell-quote`; advisoryIds=`GHSA-395f-4hp3-45gv, GHSA-w7jw-789q-3m8p`; affectedRange=`<=1.8.4`; advisoryRanges=`GHSA-395f-4hp3-45gv: <=1.8.4; GHSA-w7jw-789q-3m8p: >=1.1.0 <=1.8.3`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `source-map-js`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → postcss → source-map-js`; dependencyPath=`node_modules/source-map-js`; advisoryIds=`GHSA-68fv-2mgg-jv7q`; affectedRange=`1.0.0 - 1.2.1`; advisoryRanges=`GHSA-68fv-2mgg-jv7q: >=1.0.0 <1.2.2`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory.
      - `svgo`: rootDevDependencies=`microbundle-crl, react-scripts`; exampleDependencyChain=`microbundle-crl → @svgr/rollup → @svgr/plugin-svgo → svgo`; dependencyPath=`node_modules/css-minimizer-webpack-plugin/node_modules/svgo, node_modules/svgo`; advisoryIds=`GHSA-2p49-hgcm-8545, GHSA-4vpr-x523-8j87, GHSA-rp65-9cf3-cjxr, GHSA-w27v-7q3p-w38r, GHSA-xpqw-6gx7-v673`; affectedRange=`1.0.0 - 2.8.3`; advisoryRanges=`GHSA-2p49-hgcm-8545: >=1.0.0 <2.8.3; GHSA-4vpr-x523-8j87: >=1.0.0 <2.8.4; GHSA-rp65-9cf3-cjxr: <2.0.1; GHSA-w27v-7q3p-w38r: >=1.0.0 <2.8.4; GHSA-xpqw-6gx7-v673: >=2.1.0 <2.8.1`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=many advisories in a nested SVGO install path.
      - `underscore`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → bfj → jsonpath → underscore`; dependencyPath=`node_modules/underscore`; advisoryIds=`GHSA-qpx9-hpmf-5gmw`; affectedRange=`<=1.13.7`; advisoryRanges=`GHSA-qpx9-hpmf-5gmw: <=1.13.7`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=single advisory; fix available.
      - `webpack-dev-middleware`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → webpack-dev-middleware`; dependencyPath=`node_modules/webpack-dev-middleware`; advisoryIds=`GHSA-g84c-rxfj-3j2c`; affectedRange=`<7.4.5`; advisoryRanges=`GHSA-g84c-rxfj-3j2c: <7.4.5`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=direct resolution is in upstream toolchain.
      - `webpack-dev-server`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server`; dependencyPath=`node_modules/webpack-dev-server`; advisoryIds=`GHSA-4v9v-hfq4-rm2v, GHSA-79cf-xcqc-c78w, GHSA-9jgg-88mc-972h, GHSA-f5vj-f2hx-8m93, GHSA-g84c-rxfj-3j2c, GHSA-m28w-2pqf-7qgj, GHSA-mx8g-39q3-5c79, GHSA-w5hq-g745-h8pq`; affectedRange=`<=5.2.7`; advisoryRanges=`GHSA-4v9v-hfq4-rm2v: <=5.2.0; GHSA-79cf-xcqc-c78w: <=5.2.3; GHSA-9jgg-88mc-972h: <=5.2.0; GHSA-f5vj-f2hx-8m93: <=5.2.5; GHSA-g84c-rxfj-3j2c: <7.4.5; GHSA-m28w-2pqf-7qgj: <=5.2.5; GHSA-mx8g-39q3-5c79: <5.2.5; GHSA-w5hq-g745-h8pq: <11.1.1`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=the root cause is `react-scripts` pulling `webpack-dev-server`; the project manifest does not list it directly.
      - `websocket-driver`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → sockjs → websocket-driver`; dependencyPath=`node_modules/websocket-driver`; advisoryIds=`GHSA-mp7j-qc5w-4988, GHSA-xv26-6w52-cph6`; affectedRange=`<=0.7.4`; advisoryRanges=`GHSA-mp7j-qc5w-4988: <0.7.5; GHSA-xv26-6w52-cph6: <0.7.5`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=multiple advisories; fix available.
      - `workbox-build`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → workbox-webpack-plugin → workbox-build`; dependencyPath=`node_modules/workbox-build`; advisoryIds=`GHSA-5c6j-r48x-rmvq, GHSA-m5mm-p8h7-m29v, GHSA-qj8w-gfj5-8c6v`; affectedRange=`5.0.0-alpha.0 - 7.0.0`; advisoryRanges=`GHSA-5c6j-r48x-rmvq: <=7.0.2; GHSA-m5mm-p8h7-m29v: <7.1.3; GHSA-qj8w-gfj5-8c6v: >=5.0.0 <7.0.5`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先の元勧告へ再帰解決する。
      - `workbox-webpack-plugin`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → workbox-webpack-plugin`; dependencyPath=`node_modules/workbox-webpack-plugin`; advisoryIds=`GHSA-5c6j-r48x-rmvq, GHSA-m5mm-p8h7-m29v, GHSA-qj8w-gfj5-8c6v`; affectedRange=`5.0.0-alpha.0 - 7.0.0`; advisoryRanges=`GHSA-5c6j-r48x-rmvq: <=7.0.2; GHSA-m5mm-p8h7-m29v: <7.1.3; GHSA-qj8w-gfj5-8c6v: >=5.0.0 <7.0.5`; fixAvailable=`react-scripts@0.0.0 (major)`; requiredUpdate=major update or upstream patch; classification=期限付き例外; reason=直接の `via` は参照名のみ。参照先の元勧告へ再帰解決する。
      - `ws`: rootDevDependencies=`react-scripts`; exampleDependencyChain=`react-scripts → webpack-dev-server → ws`; dependencyPath=`node_modules/webpack-dev-server/node_modules/ws, node_modules/ws`; advisoryIds=`GHSA-58qx-3vcg-4xpx, GHSA-96hv-2xvq-fx4p`; affectedRange=`7.0.0 - 7.5.10 || 8.0.0 - 8.20.1`; advisoryRanges=`GHSA-58qx-3vcg-4xpx: >=8.0.0 <8.20.1; GHSA-96hv-2xvq-fx4p: >=7.0.0 <7.5.11, >=8.0.0 <8.21.0`; fixAvailable=`true`; requiredUpdate=lockfile / patch bump; classification=期限付き例外; reason=nested dependency with multiple advisories.

      各行の `rootDevDependencies` と `exampleDependencyChain` は lockfile の依存辺から確認した起点と代表経路で、`dependencyPath` は npm audit の設置場所を列挙する。`advisoryIds` / `advisoryRanges` は文字列 `via` を再帰解決して得た全元勧告と個別影響範囲、`affectedRange` は npm audit が報告する package 全体の範囲である。`fixAvailable` は npm audit の生値（`react-scripts@0.0.0` のような実用不能な提示を含む）であり、修正方法別 25/1/16 分類と混同しない。
    - 例外レコード数対応関係: 現行 React 18 監査では high/critical が `42 package`、再帰解決した `package × advisory ID` が **175 組**（重複排除した元勧告 ID は 94 種）である。`severity × react18 job` を付けた初期台帳候補は 175 レコードで、承認済み例外になる前に各レコードの承認・期限・追跡先を確認する。React 19 job の数は未実測。`42 package` と `例外レコード数` は 1:1 ではない。`npm audit --json` の `via` は 1 package に複数 advisory / via ノードを持ち得るため、例外キーは「package × advisoryID × severity × job」単位で管理する。`brace-expansion` は 1 package で 7 unique GHSA と 14 via entries のため、例外レコードは GHSA 単位で生成される。最終的な例外レコード数は GHSA / advisories の総数に依存し、42 package 数と同一ではない。
    - 例外ID不明項目と CI 成功条件の整合:
      - 2026-10-25 の現行 lockfile に対する `npm audit --json` の high 38 / critical 4（42 package）を上記の再帰規則で照合した結果、元勧告 ID に解決できない package は 0 件だった。初期例外台帳はこの解決済み ID を用いて作成できる。全件について表の `advisoryIds` に解決済み ID を列挙した。
      - 初期台帳は 42 package に対する全ての解決済み ID・重大度・ジョブを漏れなく列挙し、承認者・理由・期限・追跡 Issue を満たした場合にのみ既存分を許容する。承認前または再取得時に解決不能な参照が現れた場合は失敗し、原因を解消するまで CI 成功とはしない。`package + severity` だけの包括例外は禁止。
      - React 19 job は未実測であり、初回実行時に同じ規則で再取得・照合する。React 18 の42件を無条件に React 19 側へ流用しない。
    - `25 / 1 / 16` 分類と実測一覧の対応（Issue #150 の修正方法別区分。運用上の例外分類とは別軸）:
      - 互換範囲の更新で解消可能な 25 package: `proxy-addr`, `shell-quote`, `websocket-driver`, `@babel/plugin-transform-modules-systemjs`, `@rollup/plugin-node-resolve`, `body-parser`, `brace-expansion`, `browserslist`, `compression`, `fast-uri`, `flatted`, `form-data`, `js-yaml`, `jsonpath`, `launch-editor`, `lodash`, `minimatch`, `nanoid`, `node-forge`, `path-to-regexp`, `picomatch`, `postcss-svgo`, `source-map-js`, `underscore`, `ws`。
      - メジャー更新が必要な 1 package: `gh-pages`。
      - 別 Issue / upstream 対応を要する 16 package: `react-scripts`, `@svgr/webpack`, `postcss`, `rollup-plugin-terser`, `serialize-javascript`, `webpack-dev-middleware`, `webpack-dev-server`, `workbox-build`, `workbox-webpack-plugin`, `microbundle-crl`, `rollup`, `@svgr/rollup`, `@svgr/plugin-svgo`, `svgo`, `css-select`, `nth-check`。
      - 25 + 1 + 16 = 42。各 package は上記の一分類にのみ属する。今回の `fixAvailable` では25件は `true`、`gh-pages` は `gh-pages@6.3.0` の major、16件は `false`（3件）または実用不能な `react-scripts@0.0.0` の提示（13件）だった。`microbundle-crl` は16に属する。実装着手時に再監査して分類の変化を記録する。
    - 結論: 実測上、`npm audit --omit=dev --json` は 0 件。残る 42 package には複数勧告・伝播した `via` があり、例外レコード数は package 数と一致しない。再帰解決した全 ID を `id × package × severity × job` で個別照合し、解決不能・未承認は fail-closed とする。
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
    - 判定は 2 種類に分ける: (1) `npm audit --json` が終了コード 1 でも、有効な JSON（`vulnerabilities` と `metadata.vulnerabilities` が揃い、実行エラーを含まず、検出内容と件数が整合）を返す場合は解析可能な脆弱性検出として例外台帳と照合する。(2) 通信・実行失敗、異常な終了コード、不正または不完全な JSON、監査エラーは fail-closed で即失敗する。終了コード 1 を無条件に成功扱いせず、0 でも不正 JSON なら失敗させる。
    - 例外単位は「勧告ID（GHSA/CVE/`via.source`）× パッケージ名 × 重大度 × 対象ジョブ（react18/react19/both）」とし、パッケージ単位より粒度を細かくする。
    - 例外台帳（`.github/security/npm-audit-exceptions.json`）の必須項目は `id`, `package`, `severity`, `appliesTo`, `approvedBy`, `approvedAt`, `reason`, `trackingIssue`, `expiresAt`。
    - 合否ルール:
      - `--omit=dev` 側に `high` / `critical` が 1 件でもあれば即失敗（公開パッケージ利用者影響のため例外不可）。
      - 全依存側で `high` / `critical` が検出された場合、未登録の検出は失敗。解析可能な脆弱性検出のみを対象とし、実行失敗・不正 JSON は別途 fail-closed で失敗。
      - 登録済みでも `expiresAt` 超過は失敗（期限切れを自動検出）。
      - 実行失敗（ネットワーク障害・JSON 壊れ・`npm audit` 命令の異常終了）は失敗（fail-closed）。
    - 受入条件（fixture）:
      - 正常系: 終了コード 1 と有効 JSON の既存42件相当（文字列 `via` の再帰解決・複数勧告を含む）が全件承認済み・期限内なら成功する。
      - 異常系: 終了コード 1 でも未承認の新規勧告があれば失敗する。通信・実行失敗、終了コードと JSON の不整合、不正 JSON、参照先欠落・循環のみで ID を解決できない `via` は失敗する。
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
  - TBD（理由: React 19 job の依存上書き後の監査結果は未実測で、npm advisory も更新され得る／決定条件: React 19 CI で監査 JSON を取得し、再帰解決した全 ID・例外照合・React 18 との差分を確定する／期限: #141 IMPLEMENT PR の最初の CI 通過前）。解決不能な参照や承認されていない新規 ID があれば CI は fail-closed とし、台帳承認または修正まで通過させない。
  - 42 件の具体的な各項目は、`npm audit --json` の実データで依存元・勧告ID・影響範囲・`via` を再確認してから初期例外台帳への記録を確定する。
- ADR に残すべき判断:
  - **要: 依存脆弱性の「期限付き例外 + 新規検出ブロック」運用は長期ルールのため ADR 化する。**
  - ただし本 Issue では plan 反映までとし、ADR 文書化は別 DESIGN/ADR Issue で実施する。
- BLOCKER 判定:
  - 現行 React 18 監査の42 package は元勧告 ID を全件解決できるため、この時点の識別不能 BLOCKER は 0 件。React 19 実測で元勧告を解決できない場合、または必要な例外承認が得られない場合は、そのジョブの CI 通過に対する BLOCKER として扱う。

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
  - 対応（何を変えた）：`# 2. スコープと変更対象` に実測値を追記し、`npm audit --json` / `npm audit --omit=dev --json` の取得日時、42 package の一覧、依存経路、advisory ID、影響範囲、分類理由、および `package × advisory × severity × job` で例外レコード数が 1:1 ではないことを明示した。React 18 側の雛形 `TBD` を実数に基づく調査証跡へ置換した。React 19 側の未実測事項は 7章に条件・期限付きで残した。
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
