---
name: BLIND PR
about: 参照禁止条件下で本文完結の変更を行うためのテンプレートです。(環境設定や製造に影響しない汎用作業/軽いコーディング作業のプルリクエスト)
---

# 概要（Summary）

このプルリクエストは **<<unknown>>** に沿った変更です。

---

# 背景・経緯（Context / Facts）

* トリガーとなった事象（Issue / PR / 指摘 / 差分 等）：<<unknown>>
* 参照した情報・資料：<<unknown>>
* 作業開始時点で確認できていた事実：<<unknown>>

---

# 変更のインデックス（どのファイルをどう変えたか）

diffの目次（ファイル×変更概要）を下記のテーブルに記載します。

| ファイル     | 変更概要         |
| -------- | ------------ |
| <<path>> | <<one_line>> |
| <<path>> | <<one_line>> |

## 設計判断 / トレードオフ

コードの差分（Diff）からは読み取れない「設計判断（Trade-off）」を記録します（例：なぜプランAではなくプランBを採用したか）。必要なだけ行を追加します。

| 判断テーマ     | プランA       | プランB       | 採用プラン      | 採用理由（事実/制約/評価軸）  | 不採用理由（トレードオフ） | 根拠（Issue/Doc/測定/差分） |
| --------- | ---------- | ---------- | ---------- | ---------------- | ------------- | ------------------- |
| <<topic>> | <<plan_a>> | <<plan_b>> | <<chosen>> | <<reason_facts>> | <<tradeoff>>  | <<evidence>>        |
| <<topic>> | <<plan_a>> | <<plan_b>> | <<chosen>> | <<reason_facts>> | <<tradeoff>>  | <<evidence>>        |

---

# 適用後に観測できる結果（観測ログ/確認ログ）

## 確認ログ（何を実行／何を目視したか）を下記のテーブルに記載します。

| 確認項目      | 方法（実行/目視）          | 結果         | 根拠（ログ/URL/スクショ等） |
| --------- | ------------------ | ---------- | ---------------- |
| <<check>> | <<exec_or_visual>> | <<result>> | <<evidence>>     |
| <<check>> | <<exec_or_visual>> | <<result>> | <<evidence>>     |

## エラーハンドリング・境界値の考慮事項（Error Handling / Boundary Conditions）

異常系（エラー時）および境界値（Boundary Condition）について、考慮したケースと確認結果を下記のテーブルに記載します。必要なだけ行を追加します。

| 分類（error/boundary） | ケース（入力/条件） | 期待動作（仕様） | 実装上の扱い（例外/戻り値/ログ/抑止） | 確認方法（実行/目視/テスト） | 結果 | 根拠（ログ/URL/スクショ等） |
|---|---|---|---|---|---|---|
| <<kind>> | <<case>> | <<expected>> | <<handling>> | <<verify>> | <<result>> | <<evidence>> |
| <<kind>> | <<case>> | <<expected>> | <<handling>> | <<verify>> | <<result>> | <<evidence>> |
| <<kind>> | <<case>> | <<expected>> | <<handling>> | <<verify>> | <<result>> | <<evidence>> |

---

# 影響範囲（どこに影響しないと言える根拠）

| 影響対象        | 結論          | 根拠          |
| ----------- | ----------- | ----------- |
| アプリケーション挙動  | <<unknown>> | <<unknown>> |
| 環境設定・デプロイ手順 | <<unknown>> | <<unknown>> |

## 依存関係とコストへの影響（Dependencies / Cost Impact）

外部依存（ライブラリ/外部サービス/API）およびコスト（課金・パフォーマンス）への影響を下記のテーブルに記載します。必要なだけ行を追加します。

| 観点         | 対象（ライブラリ/サービス/API 等） | 変更内容（追加/更新/削除/呼出増減 等） | 影響（課金/性能/運用） | 影響量（増減の見積/測定値） | 根拠（計測/ログ/設定/差分） |
| ---------- | -------------------- | --------------------- | ------------ | -------------- | --------------- |
| 依存         | <<target>>           | <<change>>            | <<impact>>   | <<delta>>      | <<evidence>>    |
| コスト        | <<target>>           | <<change>>            | <<impact>>   | <<delta>>      | <<evidence>>    |
| <<aspect>> | <<target>>           | <<change>>            | <<impact>>   | <<delta>>      | <<evidence>>    |

---

# スコープ境界（触っていい／ダメ、非目標）

| 区分         | 範囲（パス/モジュール/設定など） | 根拠          |
| ---------- | ----------------- | ----------- |
| 触ってよい範囲    | <<unknown>>       | <<unknown>> |
| 触ってはいけない範囲 | <<unknown>>       | <<unknown>> |
| 非目標        | <<unknown>>       | <<unknown>> |

---

# 推論せず“質問に落とす”ための質問票

判断が必要な箇所を下表にまとめます。（決定事項を確認するADR）

| 論点 / 質問                       | 回答（事実のみ）    | 根拠（Issue/PR/Commit/ファイル等） |
| ----------------------------- | ----------- | ------------------------- |
| このPRで「決定」扱いにしたいことは何か？（なければ空欄） | <<unknown>> | <<unknown>>               |
| 触ってよい範囲（パス/モジュール/設定）          | <<unknown>> | <<unknown>>               |
| 触ってはいけない範囲（パス/モジュール/設定）       | <<unknown>> | <<unknown>>               |
| 非目標（このPRではやらないこと）             | <<unknown>> | <<unknown>>               |
| 成功条件（何が確認できればOKか）             | <<unknown>> | <<unknown>>               |
| 不確定点（質問として列挙）                 | <<unknown>> | <<unknown>>               |
| 追加質問（必要に応じて追記）                | <<unknown>> | <<unknown>>               |

---

# 実装と確認のログ（何を触って、何を確認したか）

| 項目                    | 記録          |
| --------------------- | ----------- |
| 触った主要箇所（パス/関数/クラス等）   | <<unknown>> |
| 実装メモ（変更意図ではなく事実）      | <<unknown>> |
| 実行した確認（コマンド/手動操作/ログ等） | <<unknown>> |
| 既知の未確認点（あれば）          | <<unknown>> |

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
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |
| 人間 | <<task>>  | <<target>>     | <<where>>         | <<how>>     | <<inputs>> | <<outputs>>    | <<evidence>>     |

---

# 生成コードの利用方法（どうやって使うか）

## 形式A: テーブル

AIが生成したコード（生成物）の利用方法を下記のテーブルに記載します。

| 対象（生成物）      | 種別（コード/設定/スクリプト等） | 配置（パス/モジュール） | 呼び出し元（どこから使う）  | 使い方（設定/呼び出し/実行手順） | 入力（必要な値/前提） | 出力（得られる結果/保存先） | 確認方法（どう確かめる） |
| ------------ | ----------------- | ------------ | -------------- | ----------------- | ----------- | -------------- | ------------ |
| <<artifact>> | <<type>>          | <<path>>     | <<entrypoint>> | <<how_to_use>>    | <<inputs>>  | <<outputs>>    | <<verify>>   |
| <<artifact>> | <<type>>          | <<path>>     | <<entrypoint>> | <<how_to_use>>    | <<inputs>>  | <<outputs>>    | <<verify>>   |
| <<artifact>> | <<type>>          | <<path>>     | <<entrypoint>> | <<how_to_use>>    | <<inputs>>  | <<outputs>>    | <<verify>>   |

## 形式B: コードサンプル

利用手順をコード（またはコマンド）で提示します。必要に応じてブロックを追加します。

```sh
# <<artifact>> の利用例（コマンド）
# 前提: <<inputs>>
# 実行場所: <<where>>

<<command_or_steps>>
```

```ts
// <<artifact>> の利用例（コード）
// 配置: <<path>>
// 呼び出し元: <<entrypoint>>

<<code_sample>>
```

---

# セキュリティチェック (Security Self-Check)

- [ ] **Secrets**: コード内にAPIキーやパスワードが含まれていないことを確認した
- [ ] **Input Validation**: 外部からの入力値（API引数/フォーム）を検証している
- [ ] **Access Control**: 認可（権限チェック）ロジックに抜け穴がない

# 補足（Notes）

* <<unknown>>
* <<unknown>>
* <<unknown>>
* <<unknown>>
* <<unknown>>
* <<unknown>>

---

# コードレビューフィードバック対応（Review Feedback Response）

このセクションは「追記」で管理します。

## 追記（今回分）

* フィードバック（要約）：<<feedback>>　対応（何を変えた）：<<action>>　対象（ファイル/行/Commit）：<<target>>　状態（対応済/保留/却下）：<<status>>
* フィードバック（要約）：<<feedback>>　対応（何を変えた）：<<action>>　対象（ファイル/行/Commit）：<<target>>　状態（対応済/保留/却下）：<<status>>
* フィードバック（要約）：<<feedback>>　対応（何を変えた）：<<action>>　対象（ファイル/行/Commit）：<<target>>　状態（対応済/保留/却下）：<<status>>

## 既存ログ（前回まで）

```text
<<keep_existing_lines>>
```
