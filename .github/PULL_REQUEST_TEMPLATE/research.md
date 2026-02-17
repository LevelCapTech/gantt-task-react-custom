---
name: SYSTEM REALITY RESEARCH PR
about: 設計前に「現状のシステム実態（As-Is）」を観測ログ中心で共有するためのテンプレートです（原則 実装なし）。
---

# 概要（Summary）

このプルリクエストは **<<unknown>>** （As-Is）を共有するための変更です。

---

# 対象（Issue / Scope）

* 調査Issueリンク（必須）：<<url>>
* 調査対象システム/環境（必須）：<<service / env>>

---

# 背景・経緯（Context / Facts）

* トリガーとなった事象（不具合/要望/移行/監査 等）：<<fact>>
* 調査開始時点で分かっていた事実（観測済みの事実のみ）：<<fact_list>>
* 参照した情報（doc/コード/設定/ダッシュボード/チケット 等）：<<links_or_paths>>

---

# 現状スナップショット（As-Is Snapshot）

「推測」ではなく、今見えている範囲の **現状の姿** を箇条書きで固定します。

* ランタイム/フレームワーク：<<name + version>>
* OS / コンテナ基盤：<<name + version>>
* DB / ストレージ：<<name + version / topology>>
* 主要依存（ライブラリ/外部SaaS）：<<list>>
* 実行場所（VPS/Cloud/オンプレ/ローカル等）：<<where>>

---

# 観測ログ（何を見て、何が分かったか）

「読めば再現できる」粒度で、観測の手順と結果を残します。

| 観測テーマ     | 手段（実行/目視） | 実行場所（URL/画面/コマンド） | 得られた事実（要約） | 根拠（ログ/スクショ/URL/設定断片） |
| --------- | --------- | ----------------- | ---------- | -------------------- |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |
| <<topic>> | <<how>>   | <<where>>         | <<facts>>  | <<evidence>>         |

---

# コンポーネント棚卸し（Inventory）

現状の構成要素を「名前・役割・入口/出口」で揃えて記録します。

| 種別（app/job/db/queue/cron/infra 等） | 名前       | 役割（1行）   | 入力（入口） | 出力（出口）  | 配置/稼働場所   | 根拠（コード/設定/観測） |
| --------------------------------- | -------- | -------- | ------ | ------- | --------- | ------------- |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |
| <<type>>                          | <<name>> | <<role>> | <<in>> | <<out>> | <<where>> | <<evidence>>  |

---

# データフロー / 依存関係（As-Is Flow）

「どこ→どこに」流れているかを、最小単位で記録します。

| From     | To     | 何が流れる（データ/イベント） | 方式（HTTP/Queue/Batch等） | 失敗時の挙動（観測できた範囲）      | 根拠           |
| -------- | ------ | --------------- | --------------------- | -------------------- | ------------ |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |
| <<from>> | <<to>> | <<payload>>     | <<method>>            | <<failure_behavior>> | <<evidence>> |

---

# 設定・運用の実態（As-Is Ops）

| 観点          | 現状        | 調査方法（実行/目視） | 根拠           |
| ----------- | --------- | ----------- | ------------ |
| デプロイ/リリース手順 | <<as_is>> | <<how>>     | <<evidence>> |
| 監視/アラート     | <<as_is>> | <<how>>     | <<evidence>> |
| ログ/トレース     | <<as_is>> | <<how>>     | <<evidence>> |
| バックアップ/リストア | <<as_is>> | <<how>>     | <<evidence>> |
| 権限/認証の運用    | <<as_is>> | <<how>>     | <<evidence>> |

---

# 既知の問題・リスク（Facts Only）

推測ではなく、観測できた範囲の「問題/リスク」を事実として列挙します。

| 事象（何が起きる/起きた） | 影響（どこが困る）  | 発生条件（観測できた範囲） | 暫定回避（あれば）      | 根拠           |
| ------------- | ---------- | ------------- | -------------- | ------------ |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |
| <<issue>>     | <<impact>> | <<condition>> | <<workaround>> | <<evidence>> |

---

# 仮説と切り分け結果（Hypothesis → Falsification）

| 仮説             | 検証手段（実行/目視） | 結果（支持/否定/未判定） | 追加で必要な調査 | 根拠           |
| -------------- | ----------- | ------------- | -------- | ------------ |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |
| <<hypothesis>> | <<method>>  | <<result>>    | <<next>> | <<evidence>> |

---

# 選択肢（Pros / Cons）

※このPRは「設計前」なので、結論を急がず **選択肢の棚卸し** まででOK。

## 選択肢A: <<title>>

* Pros: <<facts_based>>
* Cons: <<facts_based>>

## 選択肢B: <<title>>

* Pros: <<facts_based>>
* Cons: <<facts_based>>

---

# 推奨（Recommended Next Step）

* 推奨案（次にやること）：<<next_action>>
* そう言える理由（事実/制約/評価軸）：<<reason>>

---

# 推論せず“質問に落とす”ための質問票（ADR / Questions）

不明点は埋めずに **質問** として残します。

| 論点 / 質問                    | 現時点の回答（事実のみ） | 根拠（Issue/Doc/観測ログ） |
| -------------------------- | ------------ | ------------------ |
| 現状で確定している前提は？              | <<facts>>    | <<evidence>>       |
| どこがブラックボックス？（見えてない/権限がない等） | <<unknown>>  | <<evidence>>       |
| 次に誰に何を確認すべき？               | <<question>> | <<evidence>>       |
| 成功条件（調査完了と見なす条件）は？         | <<criteria>> | <<evidence>>       |
| 追加質問（必要に応じて追記）             | <<question>> | <<evidence>>       |

---

# 変更のインデックス（どのファイルをどう変えたか）

diffの目次（ファイル×変更概要）を下記のテーブルに記載します。

| ファイル     | 変更概要         |
| -------- | ------------ |
| <<path>> | <<one_line>> |
| <<path>> | <<one_line>> |

---

# 実行区分（AIが実行したこと／人間が追加で行うこと）

| 区分 | タスク（何をする） | 対象（どのサイト/システム） | 実行場所（URL/画面/コマンド） | 証跡（ログ/URL/スクショ等） |
| -- | --------- | -------------- | ----------------- | ---------------- |
| AI | <<task>>  | <<target>>     | <<where>>       | <<evidence>>     |
| AI | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| AI | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<evidence>>     |

---

# 補足（Notes）

* <<unknown>>
* <<unknown>>
* <<unknown>>
* <<unknown>>
* <<unknown>>
* <<unknown>>

---

# レビューフィードバック対応（追記運用）

## 追記（今回分）

* フィードバック（要約）：<<feedback>>　対応：<<action>>　対象：<<target>>　状態：<<status>>

## 既存ログ（前回まで）

```text
<<keep_existing_lines>>
```
