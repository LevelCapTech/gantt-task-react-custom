# 大規模タスク（10k〜50k件）向け描画仮想化と依存描画最適化 plan

> 本PRはIssue #140の設計成果物1ファイルのみを変更する。以下のコード・テスト・ベンチマーク・設定は実装フェーズの予定であり、計測結果や実装完了を意味しない。Issue起票時の「依存探索は`findIndex`」という前提は現headでは古い。`convertToBarTasks`は既に`barTaskMap`/`childrenMap`/`edgeMap`を利用する。一方、`removeHiddenTasks`/`getChildren`には配列の`filter`/`indexOf`が残る（`other-helper.ts`）。

## 1. 機能要件 / 非機能要件

- 最初に1k/10k/50k件の実ブラウザ・純関数ベンチマークを整備し、未変更コードのbaselineを保存する。その結果からボトルネックと実装優先順位を決め、同条件で改善後を計測する。
- 行一覧・グリッド背景・タスクバーは実viewportと前後3行（`OVERSCAN_ROWS=3`）のみ描画する。全高と既存の絶対座標は保つ。依存線は§3.3の仕様で候補化する。
- 任意の公開Prop `enableVirtualization?: boolean`（既定`false`）を追加する。`enableVirtualization === true`かつ有限の`ganttHeight > 0`かつ有限の`rowHeight > 0`のときのみ仮想化を有効にする。それ以外は既存の全行描画を維持する。`ganttHeight > 0`だけでは有効にしない。
- 現行の依存正規化・Map索引を再利用する。追加対象は可視辺を両方向から取得する索引、不要な再計算と無関係行の再描画の抑制であり、既存Mapへの「置換」ではない。
- 折りたたみ・並べ替え・スクロール同期・選択・キーボード・overlay編集・バー操作・依存線を維持する。仮想化無効時の公開APIと表示・編集動作を回帰させない。
- 行コンポーネント数は `ceil(H/rh)+1+2*OVERSCAN_ROWS+PINNED_MAX` 以下（§3.4、H=viewport高、rh=行高、PINNED_MAX=4）。総タスク数に比例する行DOM/バーSVGの増加を禁止する。依存線の本数は可視行の接続次数に依存するため、この行数上限を矢印本数や日付列数に誤用しない。スクロール時の候補抽出はO(可視行に接続する辺数)を目標とし、全件filter/全辺走査をしない。

## 2. スコープと変更対象

本PRの変更は本planのみ。実装フェーズでの責務は次のとおり。

- `src/types/public-types.ts`: 任意Propを後方互換に追加。`src/index.tsx`のexportは維持。
- `src/components/gantt/gantt.tsx`: 既存`scrollY`を単一stateとし、有効条件・範囲・全高・同期を管理。
- `src/helpers/virtualization-helper.ts`（新規）: §3.1の純関数。`src/components/task-list/task-list.tsx`/`task-list-table.tsx`: 行の部分描画と全高spacer。
- `src/components/gantt/task-gantt-content.tsx`: 範囲内`TaskItem`、§3.3の矢印のみ描画。`src/components/grid/grid-body.tsx`: 範囲内行背景・区切り。日付列ごとの縦線・非稼働日rectは従来どおり（§7）。
- `src/helpers/bar-helper.ts`: 既存の依存正規化とMapを維持し、入辺索引・行番号索引・可視候補抽出を追加。`src/helpers/other-helper.ts`: 折りたたみ後に範囲を算出し、残る`filter`/`indexOf`のホットパスはbaselineで測定して必要なら索引化する。
- `src/test/`、`src/test/perf/`、`docs/perf/large-scale-virtualization/`、`example/`: §4・§5のテスト、計測、手動確認。ベンチマークscriptと必要なブラウザ用devDependencyは実装フェーズの`package.json`変更として扱い、このPRには含めない。

固定行高の自前実装を初案とし、外部仮想化ライブラリは今回追加しない。計測で自前方式が確定目標を満たせず、原因が仮想化方式にある場合のみ、React 18互換、bundle、`dependencies`/`peerDependencies`を比較してADRで再判断する。可変行高・CPM・Web Worker・Canvas/WebGL・サーバー側paginationは対象外。合成データのみを使用し、秘密情報・実顧客データは計測に使わない。

## 3. 設計方針

### 3.1 範囲計算

対象配列はソート・`removeHiddenTasks`適用後の表示行配列とする。Nはその長さ。範囲は半開区間`[start,end)`、実viewportは`[viewStart,viewEnd)`で統一する。

```text
仮想化無効: start=0, end=N（既存経路）
仮想化有効かつN=0: start=end=viewStart=viewEnd=0
maxScroll=max(0,N*rh-H); s=clamp(finite(scrollY)?scrollY:0,0,maxScroll)
viewStart=floor(s/rh); viewEnd=min(N,ceil((s+H)/rh))
start=max(0,viewStart-3); end=min(N,viewEnd+3)
描画行=displayTasks.slice(start,end)
```

`scrollY`が負値・NaN・Infinityなら0、上限超過なら`maxScroll`へ丸める。`H`または`rh`が非有限/0以下なら仮想化しない。スクロール端、空配列、viewportより短い配列もこの式で扱う。`rh=32,H=96,N=100`では`scrollY=0`→viewport`[0,3)`/描画`[0,6)`、64→`[2,5)`/`[0,8)`、48→`[1,5)`/`[0,8)`、下端→`[97,100)`/`[94,100)`。N=0なら`slice(0,0)`で空になる。

### 3.2 座標とスクロール同期

`gantt.tsx`の`scrollY`を唯一の縦スクロールstateとし、左一覧とタイムラインの既存onScrollは値が変わったときのみ更新する。他方へ反映したプログラムスクロールが再度書き戻されないよう、同値判定/既存ignore refを保つ。wheel/keyboardも同stateを更新する。viewport範囲が変化したときのみ範囲依存の描画を更新し、`scrollY`自体の精度は失わない。

全高は`N*rh`。`convertToBarTasks`が算出する全件`BarTask.y`/`x1`/`x2`は維持し、仮想化用に再計算しない。リスト行のtop/グリッド行のyは`index*rh`、バー・Arrowは既存の絶対SVG座標を使う。SVGは全高の座標系を保ちつつ、可視要素のみReactで生成し、外側のスクロールviewportでクリップする。DOM spacerとSVGのスクロールオフセットを同一`scrollY`で同期する。`viewBox`移動と`translateY`の二重補正は行わない。横スクロール・RTL・ヘッダ高さは既存の座標式を維持する。

### 3.3 依存線

実viewport内に少なくとも片端の**表示行**がある辺を1本描く。overscanは行の先読みであり、依存線の可視性を変えない。両端ともviewport外（線だけが横切る場合を含む）は描画しない。折りたたみで端点が表示配列から消えた場合は描画しない。依存モデル自体は削除しない。

現行の`barDependencyChildren`は出辺のみなので、依存元が画面外・依存先のみ可視の辺を検出できない。依存正規化/BarTask変換時に`outgoingEdgeMap`と`incomingEdgeMap`を一度構築し、表示行ID→行番号のMapも作る。スクロールごとに`[viewStart,viewEnd)`の行を走査して各IDの出辺・入辺を取り、`sourceId,toId,type,lagMinutes`を含む安定キーのSetで重複除去する。全タスク/全辺の再走査をしない。依存先/元が画面外でも全件計算済みのBarTask座標を使う。Arrowの経路座標はclampせず、実viewportのSVGクリップ領域で見える部分だけ表示する（線の端がviewport境界で切れる）。可視端点を含む辺でも描画パスがviewportと交差しない場合は視覚要素が見えないことを許容する。

- 両端可視: 1本。元のみ可視/先のみ可視: それぞれ1本（出辺/入辺で取得）。両端不可視・overscanのみ: 0本。折りたたみ端点を含む: 0本。ドラッグ中の範囲外端点の辺は§3.4のpinned対象として操作中のみ候補化する。
- `normalizeTaskDependencies`の現行挙動を維持する。`type===undefined`は`FS`、無効な非undefined型は除外。存在しないIDは除外。`dependencyLinks`と`dependencies`の重複・優先順位は現行関数のcharacterizationテストで固定し、Issue #139との整合を確認する。

### 3.4 画面外操作状態

描画対象は範囲行とpinned行の和集合を`task.id`で重複除去したもの。同一の親・安定keyを使い、範囲内↔pinned移動で再マウントしない。pinnedは選択/編集/ドラッグ/フォーカス各1行まで（`PINNED_MAX=4`）。状態は`gantt.tsx`等の範囲外の親で保持し、画面外でも該当行だけマウントを維持する。既存イベント/状態の配置は実装時に確認し、親保持が不可能なものは操作開始前に親へ引き上げる。無制限のkeep-aliveは禁止。

- 編集overlay: 入力値とフォーカスを保持し、Enter/blurで確定、Escapeで取消してからpin解除。位置は元の絶対Yを維持し、viewport外では表示領域外に置く。終了後、範囲外ならアンマウント。
- ドラッグ/リサイズ/進捗: pointerup/pointercancel/ウィンドウblurで終了し、変更callbackの成否を処理した後にpin解除。ドラッグ中は接続辺も候補へ加える。
- 選択/フォーカス: 選択解除・別行選択/行外focusoutで解除。キーボードで範囲外の行へ移るときは先にscrollYを更新し、マウント後にfocusを移す。tooltip等のhoverのみの一時表示はpinしない。
- `getBBox()`はマウント後に測り、再マウント時に再測定する。Arrow座標はBarTaskから求め、DOM計測へ依存させない。

## 4. テスト・ベンチマーク戦略

### 4.1 ユニット/コンポーネント（Jest + RTL）

- `src/test/virtualization-range.test.ts`: §3.1の空・先頭・中間（境界ちょうど/途中）・末尾・短い配列・不正scrollY/H/rh、opt-in全組合せ。範囲と描画数を数値で照合。
- `src/test/virtualization.test.tsx`: 1k/10k/50kでも行/バー数が§1の上限内、行切替と全高/絶対Y一致、無効時の全行描画を確認。
- `src/test/bar-helper-dependency.test.tsx`: §3.3の両端/片端各方向/両端外/overscanのみ/折りたたみ/ドラッグ、重複排除、存在しないID、`undefined`→FS、無効型除外、`dependencyLinks`と`dependencies`の現行優先順位を確認。
- `src/test/gantt-scroll-sync.test.tsx`: 左右スクロール、wheel/keyboard、同値イベントのループ防止、先頭/末尾。`src/test/virtualization-pinned.test.tsx`: 編集・選択・フォーカス・ドラッグの画面外移動、DOM同一性、解除時アンマウント、pin上限、overlayと`getBBox`再測定。
- 既存回帰: 展開/折りたたみ、並べ替え、選択、編集、バーdrag、無関係行のrender回数が1件更新で増えないこと。jsdomは寸法/scrollTop/`getBoundingClientRect`/`getBBox`を明示的にモックし、時間値で合否判定しない。

### 4.2 実ブラウザ計測（最初に実施）

1. 実装フェーズでブラウザ用devDependencyと`benchmark:large-gantt` scriptを追加。`src/test/perf/`にブラウザハーネスと純関数計測を配置。Jestの通常テスト対象から除外する。未変更コードのbaselineを**先に**測り`docs/perf/large-scale-virtualization/`へ保存する。
2. 固定seed=42、基準日2024-01-01、IDは連番、1k/10k/50k、Day表示、`columnWidth=60`、`rowHeight=32`、`ganttHeight=600`、viewport=1200×700。開始日を365日範囲、期間1〜30日、1%は180〜365日の長期タスク。約10%をproject、階層最大3、初期は全展開。各タスクに確率50%で直前50件内のFS依存1本、1%で長距離先行依存1本を追加し循環を避ける。生成アルゴリズムと件数/辺数を結果に保存する。
3. Chrome/Chromium版、OS、CPU、実行SHAを記録。warmup 5回、計測30回。初期描画はrender呼出直前→commit後2回目rAF、スクロールはscrollTop変更直前→2回目rAF（先頭/中間/末尾の固定位置を巡回）、1件更新はprops変更直前→2回目rAF、折りたたみはtoggle直前→2回目rAF。依存構築は純関数開始→`normalizeTaskDependencies`+`convertToBarTasks`完了、可視候補抽出は別区間で測る。スクロールはフレーム間隔と50ms超のlong taskも記録する。
4. baseline→仮想化→再計算抑制の同条件比較。median/p95、DOM/SVGノード数、描画行/バー/矢印数、メモリ（取得可能なブラウザのみ）を`benchmark-results.csv`に、環境・件数/辺数・before/after・判断を`benchmark-summary.md`に保存。コマンドは実装時に追加する予定の `npm run benchmark:large-gantt -- --sizes=1000,10000,50000 --seed=42 --viewport=1200x700 --warmup=5 --iterations=30`。現PRでは実行不可・数値未計測と明記する。
5. 行/バー数上限と毎スクロール全件走査禁止は確定受入条件。性能の暫定目標は10k初期描画medianでbaseline比2倍、50kスクロールmedianで3倍、編集/依存構築p95の退行10%以内。baseline取得後に環境・実測を踏まえて数値を確定し、実装PRへ理由付きで記録する。未達なら原因（縦行/横列/依存/その他）と次の対応を記録し、受入未完として扱う。数値を実測値として記載しない。

## 5. CI品質ゲート・example確認

- 実装フェーズ: `npm ci`、`npm test`（現`package.json`では`test:unit`/`test:lint`/`test:build`を順に実行）、`npm audit`。auditが非0なら脆弱性・既存/新規の区別、対処または例外根拠をPRに記録し、無根拠に通過扱いしない。ブラウザ性能計測は通常CIのJestとは分離し手動/専用ジョブで実行する。
- `docs/REBUILD.md`は**package.json変更時**のビルド・example反映手順である。ベンチ用devDependency/script追加時は同手順（ライブラリとexampleの依存再導入・再ビルド）に従い、exampleで10k件・opt-in on/offを切り替える。先頭/末尾スクロール、左右同期、依存元のみ/先のみ可視、折りたたみ、編集中/drag中の画面外移動を確認し、スクリーンショットまたは所見を実装PRに残す。
- 本設計PRの確認: 変更ファイルがplanのみ、Markdownチェック、本文とplanの整合。コード・ベンチ未実装のため実測値や実行済みと主張しない。

## 6. ロールアウト・運用

opt-inは既定false。異常時は`enableVirtualization=false`で既存描画に戻す。依存の逆引き索引、行仮想化、再計算抑制は実装PRで分けてレビューする。性能悪化は保存したbaselineと同一条件で再測定し、範囲計算・依存候補抽出・日付列を順に分析する。表示差分（両端画面外の横切り線を非描画）は実装PR/リリースノートに明示する。

## 7. オープンな課題 / ADR要否

- 外部仮想化ライブラリ: 今回は導入しない。§4の確定後性能目標が未達かつ自前方式が原因と実測された場合、実装担当が実装PRレビュー時にbundle/React 18/依存区分を比較し、ADRで再判断する。
- 水平方向の日付列・非稼働日rect: 今回は対象外。§4で支配的なボトルネックと判明した場合は実装PRレビュー時に別Issueを起票する。
- 可変行高: 対象外。要件化された時点で別Issue/ADR。両端画面外だが線がviewportを横切る辺も今回非描画と決定し、要望と性能根拠が揃えば別Issueで検討する。
- 公開APIは任意Propの後方互換追加のみ、固定行高・opt-inであり、本Issueに新ADRは不要。実装開始を止める未決定事項はない。性能目標の確定時期・判断条件は§4.2に定義した。

## 8. 実装受入条件

- [ ] §1のopt-in真理値表と従来表示の互換性、§3.1の範囲境界・空配列がテストで確認される。
- [ ] 行/バー数上限、全高/座標、左右同期、依存線の両方向可視性と重複排除、折りたたみ、pinned操作、`getBBox`、無関係行の再描画抑制が§4.1のテストとexampleで確認される。
- [ ] スクロール時に全件/全辺走査を新設せず、既存の依存Mapを維持する。
- [ ] baselineと改善後の1k/10k/50k計測・環境・結果・数値目標の確定と達成（未達なら受入未完）が§4.2の保存先に残る。
- [ ] `npm test`/`npm audit`/exampleの結果と後方互換な公開API変更が実装PRに記録される。

## コードレビューフィードバック対応（Review Feedback Response）

- 前回レビュー: 依存探索の現状はMapベースへ訂正済み。本改訂では折りたたみ側に残る`filter`/`indexOf`と描画/再計算の残作業を区別した（§冒頭、§2）。
- 今回レビュー: 範囲を半開区間へ修正し空配列/境界を確定（§3.1）。出辺だけでは先のみ可視を拾えないため入辺索引を追加（§3.3）。端点座標をclampせずSVGでクリップ（§3.3）。pinned行と解除規則を定義（§3.4）。ベンチ生成・計測区間・暫定目標・CI/exampleを具体化（§4〜§5）。
- PR本文の古い`findIndex`説明と`tasks.filter(...)`例は本文末尾の正誤追記で訂正する。既存本文は保持する。コード変更・実測は本PRに含まれない。
- 追加レビュー対応: 未使用の `extractVisibleArrows` を削除し、利用実装と一致している `extractVisibleArrowsFromTasks` のみに整理した（`src/helpers/bar-helper.ts`）。恒真アサーションを除去し、`fullHeight = N * rowHeight` を実際に検証する形に変更した（`src/test/virtualization.test.tsx`）。Markdown table の列整形を修正して reviewdog MD060 を解消した（`docs/perf/large-scale-virtualization/benchmark-summary.md`）。
