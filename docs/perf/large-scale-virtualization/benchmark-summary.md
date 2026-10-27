# 大規模タスク仮想化ベンチマーク要約

## 実行環境

| 項目 | 値 |
|------|-----|
| ブラウザ | 未計測 |
| OS | 未計測 |
| CPU | 未計測 |
| 実行 SHA | 未計測 |
| 計測日 | 未計測 |

## 計測条件

- データ生成: seed=42、基準日 2024-01-01、Day 表示
- columnWidth=60、rowHeight=32、ganttHeight=600、viewport=1200×700
- warmup=5、iterations=30
- コマンド: `npm run benchmark:large-gantt -- --sizes=1000,10000,50000 --seed=42 --viewport=1200x700 --warmup=5 --iterations=30`

## baseline（仮想化前・未計測）

> **注意**: このセクションは実ブラウザでベンチマークを実行してから埋めること。
> 計測していない数値を記載することは禁止（plan §4.2）。

| サイズ | 辺数 | 区間 | median (ms) | p95 (ms) | DOM ノード | SVG ノード | 描画行数 |
|--------|------|------|-------------|----------|------------|------------|---------|
| 1k     | TBD  | 初期描画 | TBD | TBD | TBD | TBD | TBD |
| 10k    | TBD  | 初期描画 | TBD | TBD | TBD | TBD | TBD |
| 50k    | TBD  | 初期描画 | TBD | TBD | TBD | TBD | TBD |
| 1k     | TBD  | スクロール | TBD | TBD | TBD | TBD | TBD |
| 10k    | TBD  | スクロール | TBD | TBD | TBD | TBD | TBD |
| 50k    | TBD  | スクロール | TBD | TBD | TBD | TBD | TBD |

## 仮想化後（未計測）

| サイズ | 辺数 | 区間 | median (ms) | p95 (ms) | DOM ノード | SVG ノード | 描画行数 | 改善率 |
|--------|------|------|-------------|----------|------------|------------|---------|--------|
| 1k     | TBD  | 初期描画 | TBD | TBD | TBD | TBD | TBD | TBD |
| 10k    | TBD  | 初期描画 | TBD | TBD | TBD | TBD | TBD | TBD |
| 50k    | TBD  | 初期描画 | TBD | TBD | TBD | TBD | TBD | TBD |
| 1k     | TBD  | スクロール | TBD | TBD | TBD | TBD | TBD | TBD |
| 10k    | TBD  | スクロール | TBD | TBD | TBD | TBD | TBD | TBD |
| 50k    | TBD  | スクロール | TBD | TBD | TBD | TBD | TBD | TBD |

## 性能目標（暫定、baseline 取得後に確定）

plan §4.2 より暫定目標:

- 10k 初期描画 median: baseline 比 **2倍以上**の改善
- 50k スクロール median: baseline 比 **3倍以上**の改善
- 編集/依存構築 p95: baseline 比 **10% 以内**の退行

> baseline 取得後に、実測値を踏まえて数値を確定し、この表を更新すること。
> 未達の場合は「受入未完」と明記し、原因（縦行/横列/依存/その他）と次の対応を記録すること。

## 受入状況

- **受入未完**: baseline の実ブラウザ計測が未実施のため、性能目標の達成可否を判定できない。
- ブラウザを使える環境で `npm run benchmark:large-gantt` を実行し、結果を `benchmark-results.csv` と本ファイルに記録すること。

## 実装判断（裁量）

- `enableVirtualization`: 既定 `false`（opt-in）。異常時は `false` で既存描画に戻せる。
- ベンチマーク用 devDependency: 本 PR 時点では `ts-node` のみ追加。ブラウザハーネスは別途必要に応じて追加する（plan §4.2「必要なブラウザ用 devDependency」は裁量）。

## 表示差分

- 両端ともに viewport 外で線だけが横切る依存線を **描画しない**（plan §3.3 / §6）。
  - 片端が viewport 内にある辺は従来通り描画される。

## npm audit 結果

`npm audit` の結果は PR 本文に記録。高/クリティカルの新規脆弱性が出た場合は例外台帳への無断追加禁止（plan §5）。
