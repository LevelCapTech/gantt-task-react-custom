---
name: DESIGN PR
about: 設計フェーズの設計差分を共有するためのテンプレートです（実装なし）。編集対象ファイルはIssue指示を参照。
---

# 概要（Summary）

このプルリクエストは **<<unknown>>** の設計を行います。

| 項目 | 値 |
|---|---|
| 実装差分（ソースコード変更） | なし |
| 編集対象ファイル | Issueの指示を参照 |

---

# 背景・経緯（Context / Facts）

* トリガーとなった事象（Issue / PR / 指摘 / 要望 / 差分 等）：<<unknown>>
* 参照した情報・資料（URL/Doc/チケット/議事メモ等）：<<unknown>>
* 作業開始時点で確認できていた事実（観測/制約/前提）：<<unknown>>

---

# 実行区分（AIが実行したこと／人間が追加で行うこと）

同一フォーマットで、必要なだけ行を追加します。

| 区分 | タスク（何をする） | 対象（どのサイト/システム） | 実行場所（URL/画面/コマンド） | 実行方法（どうやって） | 入力（必要な情報）  | 出力（得られるもの/保存先） | 証跡（ログ/URL/スクショ等） |
| -- | --------- | -------------- | ----------------- | ----------- | ---------- | -------------- | ---------------- |
| AI | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| AI | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| AI | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |

---

# ADR（Architectural Decision Records）

## ADR変更サマリ（インデックス）

| ADR | 状態（proposed/accepted/superseded） | 何を決めたか（要約） | 変更理由（事実/制約） | 影響（設計としての結論） | 根拠（Issue/議論/観測） |
|---|---|---|---|---|---|
| <<adr_link_or_path>> | <<status>> | <<what>> | <<why>> | <<impact>> | <<evidence>> |
| <<adr_link_or_path>> | <<status>> | <<what>> | <<why>> | <<impact>> | <<evidence>> |

---

# 設計の要点（Decision Summary）

レビューで最初に押さえるべき「結論」を短く記載します（決定/合意した事実のみ）。

* 結論1：<<decision>>
* 結論2：<<decision>>
* 結論3：<<decision>>

---

# レビュー議題（Review Agenda）

codingAgent / codingReviewAgent が同じPR本文だけで抜け漏れなく往復できるように、レビューしてほしい観点を先に固定します。

| 議題（レビューしてほしい観点） | 期待する結論（OK/要修正/要議論） | 参照（章/ADR/見出し） | ステータス（未/OK/要対応） | 根拠（Issue/ADR/観測） |
|---|---|---|---|---|
| <<agenda>> | <<expected>> | <<where>> | <<status>> | <<evidence>> |
| <<agenda>> | <<expected>> | <<where>> | <<status>> | <<evidence>> |

---

# 仮定・不変条件（Assumptions / Invariants）

暗黙の前提ズレを潰します（「推測で埋めない」。不明は未確定へ）。

| 種別 | 前提/不変条件 | 変更可能性（固定/変動/未確定） | 破ると何が壊れるか（影響） | 根拠（Issue/ADR/観測） |
|---|---|---|---|---|
| assumption | <<assumption>> | <<stability>> | <<impact>> | <<evidence>> |
| invariant | <<invariant>> | <<stability>> | <<impact>> | <<evidence>> |

---

# 合意境界（Decided vs Not Decided）

「確定」と「未確定」を分離して、往復コミュニケーションの事故を防ぎます。

## 確定（Decided）

| 項目 | 決定内容（要約） | 根拠（ADR#/該当見出し） |
|---|---|---|
| <<topic>> | <<decision>> | <<evidence>> |
| <<topic>> | <<decision>> | <<evidence>> |

## 未確定（Not Decided）

| 項目 | 未確定の理由（事実/制約） | 決め方（誰が/いつ/条件） | 根拠 |
|---|---|---|---|
| <<topic>> | <<why>> | <<plan>> | <<evidence>> |
| <<topic>> | <<why>> | <<plan>> | <<evidence>> |

---

# 要件・成功条件（Requirements / Success Criteria）

設計として満たすべき条件を「判定可能」な形で列挙します。

| 種別 | 項目 | 成功条件（どうなればOKか） | 根拠（Issue/ADR/議論/観測） |
|---|---|---|---|
| 機能 | <<req>> | <<criteria>> | <<evidence>> |
| 非機能 | <<req>> | <<criteria>> | <<evidence>> |
| 運用 | <<req>> | <<criteria>> | <<evidence>> |

---

# 製造スコープ（実装時に影響する機能・契約・運用）

**ここは「成果物（設計書/ADR）を書くこと」ではなく、製造した場合に“何が変わるか”を記録する欄です。**

## 影響するもの（In-Scope）

| ユーザー影響/機能名 | 入口（画面/操作/API/Job） | 変更タイプ（追加/変更/削除） | 影響レベル（S/M/L） | 互換性（破壊/非破壊/未確定） | 具体的に変わること（1〜2行） | 根拠（ADR#/該当見出し） |
|---|---|---|---|---|---|---|
| <<feature>> | <<entrypoint>> | <<type>> | <<level>> | <<compat>> | <<delta>> | <<evidence>> |
| <<feature>> | <<entrypoint>> | <<type>> | <<level>> | <<compat>> | <<delta>> | <<evidence>> |

## 影響しないもの（Out-of-Scope）

| 対象（機能/契約/運用） | 影響しない理由（事実/制約） | 根拠（ADR#/該当見出し） |
|---|---|---|
| <<target>> | <<why_not>> | <<evidence>> |
| <<target>> | <<why_not>> | <<evidence>> |

## 未確定（TBD）

| 論点（何が決まっていないか） | 影響しそうな範囲 | いつ/誰が決めるか（予定） | 根拠 |
|---|---|---|---|
| <<tbd>> | <<scope>> | <<plan>> | <<evidence>> |

---

# 互換性・移行（Compatibility / Migration）

製造時の互換性と移行の要否を固定します（未確定は未確定のまま）。

| 対象（API/DB/設定/イベント/Job 等） | 互換性（破壊/非破壊/未確定） | 移行要否（Yes/No/TBD） | 移行の要点（短く） | ロールバック方針（短く） | 根拠（ADR#/該当見出し） |
|---|---|---|---|---|---|
| <<target>> | <<compat>> | <<need_migration>> | <<migration>> | <<rollback>> | <<evidence>> |
| <<target>> | <<compat>> | <<need_migration>> | <<migration>> | <<rollback>> | <<evidence>> |

---

# 代替案とトレードオフ（Trade-offs）

差分から読み取れない「なぜAでなくBか」を記録します。必要なだけ行を追加します。

| 判断テーマ | プランA | プランB | 採用プラン | 採用理由（事実/制約/評価軸） | 不採用理由（トレードオフ） | 根拠（Issue/ADR/測定/議論ログ） |
|---|---|---|---|---|---|---|
| <<topic>> | <<plan_a>> | <<plan_b>> | <<chosen>> | <<reason_facts>> | <<tradeoff>> | <<evidence>> |

---

# 影響範囲（設計が示す影響と根拠）

「影響する/しない」を根拠付きで記録します。

| 影響対象 | 結論（影響あり/なし/未確定） | 影響内容（何が変わる） | 根拠（ADR/議論/観測） |
|---|---|---|---|
| アプリケーション挙動 | <<unknown>> | <<unknown>> | <<unknown>> |
| DB/データ互換性 | <<unknown>> | <<unknown>> | <<unknown>> |
| API/外部連携 | <<unknown>> | <<unknown>> | <<unknown>> |
| 環境設定・デプロイ手順 | <<unknown>> | <<unknown>> | <<unknown>> |
| 監視/アラート/運用 | <<unknown>> | <<unknown>> | <<unknown>> |
| セキュリティ/権限/監査 | <<unknown>> | <<unknown>> | <<unknown>> |
| コスト（課金/性能/リソース） | <<unknown>> | <<unknown>> | <<unknown>> |

---

# リスクと対策（Risk / Mitigation）

設計上の弱点・事故ポイントを先に構造化します（レビューが感想戦にならないように）。

| リスク | 発生条件（いつ起きるか） | 影響（S/M/L） | 予防/緩和策（設計上の手当） | 検知（ログ/監視/アラート） | 残課題（Open Questionsへのリンク） | 根拠 |
|---|---|---|---|---|---|---|
| <<risk>> | <<trigger>> | <<level>> | <<mitigation>> | <<detection>> | <<open_question>> | <<evidence>> |
| <<risk>> | <<trigger>> | <<level>> | <<mitigation>> | <<detection>> | <<open_question>> | <<evidence>> |

---

# 実装ガイド（実装担当へ渡す情報）

設計成果物から「実装できる状態」を作るための要点を記録します（未確定は未確定のまま）。

| 観点 | 記載内容（要点） | 根拠（ADR/該当見出し等） |
|---|---|---|
| 変更対象（モジュール/境界） | <<unknown>> | <<unknown>> |
| I/F（入力/出力/契約） | <<unknown>> | <<unknown>> |
| データモデル/永続化 | <<unknown>> | <<unknown>> |
| エラーハンドリング方針 | <<unknown>> | <<unknown>> |
| 互換性/移行方針 | <<unknown>> | <<unknown>> |
| テスト戦略（何をどう保証） | <<unknown>> | <<unknown>> |
| ロールアウト/切替 | <<unknown>> | <<unknown>> |

---

# サンプル実装（PR本文専用）

codingAgentが「手を動かしたい」欲をここに寄せます。**サンプルコードはPR本文にのみ記載し、リポジトリにファイル追加しません。**

## サンプル実装の扱い（Sample Code Contract）

サンプルを「実装差分」と誤認しないための分類表です（禁止事項ではなく、フォームで合意を固定）。

| サンプル種別 | 目的（何のための例か） | 実装PRへの取り込み方針（そのまま/要調整/参考のみ） | 参照（ADR#/該当見出し） |
|---|---|---|---|
| 型/DTO/Interface | <<purpose>> | <<policy>> | <<evidence>> |
| 疑似コード | <<purpose>> | <<policy>> | <<evidence>> |
| SQL/DDL案 | <<purpose>> | <<policy>> | <<evidence>> |
| 設定例 | <<purpose>> | <<policy>> | <<evidence>> |

## インターフェース / 型 / DTO（例）

```
// <<example_code>>
```

## 疑似コード（例）

```
// <<example_code>>
```

## SQL / DDL（例）

```
// <<example_code>>
```

## 設定例（例）

```
// <<example_code>>
```

## 失敗パターン / 境界値（例）

| 分類       | ケース      | 期待動作（設計上）    | 備考       |
| -------- | -------- | ------------ | -------- |
| error    | <<case>> | <<expected>> | <<note>> |
| boundary | <<case>> | <<expected>> | <<note>> |

---

# “推論せず質問に落とす”ための質問票（ADR / Open Questions）

判断が必要な箇所を「質問」として残します。

| 論点 / 質問                       | 回答（事実のみ）    | 根拠（Issue/ADR/該当箇所） |
| ----------------------------- | ----------- | ------------------ |
| このPRで「決定」扱いにしたいことは何か？（なければ空欄） | <<unknown>> | <<unknown>>        |
| 未確定点（質問として列挙）                 | <<unknown>> | <<unknown>>        |
| 追加で合意が必要な関係者/レビュー観点           | <<unknown>> | <<unknown>>        |
| 実装前に必要な調査/PoCはあるか？            | <<unknown>> | <<unknown>>        |
| 境界条件（曖昧さ）が残る箇所はどこか？           | <<unknown>> | <<unknown>>        |

---

# 実装TODO（次PRのタスク分割）

設計PRの次に来る「実装PR」を迷わず作れるように、タスクを分割して固定します。

| タスク（実装PRでやること） | オーナー（AI/人間/共同） | ブロッカー（未確定ならOpen Questionsへ） | 受け入れ条件（Doneの定義） | 参照（ADR/該当見出し） |
| -------------- | -------------- | --------------------------- | --------------- | ------------- |
| <<todo>>       | <<owner>>      | <<blocker>>                 | <<done>>        | <<evidence>>  |
| <<todo>>       | <<owner>>      | <<blocker>>                 | <<done>>        | <<evidence>>  |

---

# レビューの観測ログ（何を見てレビューできるか）

| 対象  | 参照先（URL/パス/見出し） | 目的（何を確認する）  |
| --- | --------------- | ----------- |
| ADR | <<where>>       | <<purpose>> |

---

# 補足（Notes）

* <<unknown>>

---

# コードレビューフィードバック対応（Review Feedback Response）

このセクションは「追記」で管理します。

## 追記（今回分）

* フィードバック（要約）：<<feedback>>　対応（何を変えた）：<<action>>　対象（見出し/ADR/Commit）：<<target>>　状態（対応済/保留/却下）：<<status>>
* フィードバック（要約）：<<feedback>>　対応（何を変えた）：<<action>>　対象（見出し/ADR/Commit）：<<target>>　状態（対応済/保留/却下）：<<status>>

## 既存ログ（前回まで）

```text
<<keep_existing_lines>>
```
