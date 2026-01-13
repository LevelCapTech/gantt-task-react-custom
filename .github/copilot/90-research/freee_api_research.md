# クラウド会計 freee API 連携 技術調査まとめ

本ドキュメントは [RESEARCH] Issue における調査結果をまとめたものです。仕様の入口は [00-index.md](../00-index.md) を参照してください。  
freee 会計 API を利用した自動連携・データ同期に向けた調査結果を整理し、認証、主要エンドポイント、制約、運用方針をまとめています。実データや Secrets は一切含めません。

## 1. 技術要件サマリー
- 認証: OAuth 2.0 Authorization Code Flow（機密クライアントは client_secret、パブリッククライアントは PKCE 推奨）。トークンエンドポイントは `https://accounts.secure.freee.co.jp/public_api/token`、認可エンドポイントは `https://accounts.secure.freee.co.jp/public_api/authorize`。
- API ベース URL: `https://api.freee.co.jp/api/1`. 会社 ID（`company_id`）を必須パラメータとして多くのエンドポイントで指定。
- スコープ: 読み取りのみなら `read`、更新を伴う場合は `write`。長期運用では `offline_access` を付与してリフレッシュトークンを取得する。
- トークン有効期限: アクセストークンは約 1 時間、リフレッシュトークンは長期（約 30 日）で都度ローテーションされる。更新時は新しい refresh_token を保存する。
- レートリミット: 代表的に 60 リクエスト/分/アクセストークン（`X-RateLimit-*` ヘッダーで通知）。超過時は HTTP 429 + `Retry-After`。
- データ取得: REST + JSON。ページングは `limit`（API 仕様上のデフォルト 20、最大 100）と `offset` で制御する。本設計ではバッチ同期時はレートとレスポンスサイズのバランスを考慮し、原則 `limit=100` を明示指定し、軽量な確認・デバッグ用途のみデフォルト値 20 を利用する。
- Sandbox: 開発者向けのサンドボックスが用意されており、同一 OAuth 設定で利用可能（申請が必要）。データはサンプル会社のみで、差分があるため仕様確認用に限定する。Sandbox の運用条件は現在未確定であり、別途決定予定（詳細は plan の「7. オープンな課題」を参照）。

## 2. OAuth 2.0 設定手順
1. **アプリ登録**（freee デベロッパーポータル）  
   - `redirect_uri` を正確に登録（本番/開発で複数可）。  
   - 利用スコープに `read`（必要に応じて `write`）と `offline_access` を指定。  
   - Web/サーバーサイドの場合は `client_secret` を安全に保管。モバイル等のパブリッククライアントは PKCE を使用。
2. **認可リクエスト**  
   - GET `https://accounts.secure.freee.co.jp/public_api/authorize`  
   - 主なクエリ: `client_id`, `response_type=code`, `redirect_uri`, `scope=read offline_access`, `state`（CSRF 対策）, `code_challenge`/`code_challenge_method=S256`（PKCE 利用時）。
3. **アクセストークン取得**  
   - POST `https://accounts.secure.freee.co.jp/public_api/token`  
   - `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id` に加え、**機密クライアントは `client_secret` を送信し、パブリッククライアント（PKCE 利用時）は `code_verifier` を送信する。両者は排他的に使用し、併用しない**。  
   - レスポンス: `access_token`, `token_type`, `expires_in`（秒）、`refresh_token`（offline_access 付与時）。
4. **リフレッシュ**  
   - POST 同エンドポイントに `grant_type=refresh_token`, `refresh_token`, `client_id`, `client_secret`（**機密クライアントの場合。パブリッククライアント（PKCE 利用時）は `client_secret` 不要**）。  
   - リフレッシュトークンはローテーションされるため、レスポンスの新しい `refresh_token` で必ず置き換える。
5. **再認証ポリシー**  
   - 401/invalid_grant 受信時はリフレッシュ試行後に再認可フローへフォールバック。  
   - リフレッシュ失敗が続く場合はユーザー再同意を要求する。

## 3. 主要エンドポイント一覧（取得系）

以下のエンドポイントパスは API ベース URL `https://api.freee.co.jp/api/1` からの相対パスです（例: `/walletables` → `https://api.freee.co.jp/api/1/walletables`）。

| 用途 | メソッド / パス | 主なパラメータ | 出力の要点 | 必要スコープ |
| --- | --- | --- | --- | --- |
| 取引（deals）一覧 | GET `/deals` | `company_id`（必須）、`limit`、`offset`、`updated_since`、`start_date`/`end_date` | `deals` 配列。各要素に `id`, `issue_date`, `type`（income/expense）, `partner_id`, `ref_number`, `details[]`（`account_item_id`, `tax_code`, `amount`, `item_id`, `section_id`, `tag_ids` など） | `read` |
| 仕訳（journals）一覧 | GET `/journals` | `company_id`（必須）、`start_date`、`end_date`、`entry_side`（debit/credit/both）、`limit`、`offset` | `journal_entries` 配列。`id`, `date`, `entry_side`, `account_item_id`, `sub_account_item_id`, `amount`, `section_id`, `tag_ids`, `description` 等 | `read` |
| 口座・残高（walletables） | GET `/walletables` | `company_id`（必須）、`walletable_type`（bank, credit_card, wallet） | `walletables` 配列。`id`, `name`, `walletable_type`, `last_balance`（最新残高）, `last_balance_date` | `read` |
| 口座取引（wallet_txns） | GET `/wallet_txns` | `company_id`（必須）、`start_date`、`end_date`、`walletable_type`、`walletable_id`、`limit`、`offset` | `wallet_txns` 配列。`id`, `date`, `amount`, `walletable_id`, `entry_side`, `description`, `balance` | `read` |
| 取引先（partners） | GET `/partners` | `company_id`（必須）、`limit`、`offset`, `q`（名称検索） | `partners` 配列。`id`, `name`, `code`, `shortcut1/2`, `long_name`, `address` 等 | `read` |

> 更新系（POST/PUT/DELETE）は `write` スコープが必要。複数会社を扱う場合は会社ごとに認可を得て `company_id` を切り替える。

## 4. レートリミットとリトライ
- 代表的制限: 60 リクエスト/分/アクセストークン（会社単位）。詳細はレスポンスヘッダー `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` を参照。
- 超過時: HTTP 429 と `Retry-After` 秒数が返る。`Retry-After` + ジッターで再試行する。バックオフ上限を設け、連続失敗時はキューに退避。
- 受信データのページング: `limit` と `offset` でバッチ取得し、レートを消費しすぎないよう 1 リクエストあたり 100 件を上限に設計。
- 冪等性: GET は安全。将来の POST/PUT は同一 `ref_number` やクライアント側 ID を用いた重複防止を検討。

## 5. 運用・監査方針
- **トークン管理**: `access_token`/`refresh_token` を KMS/Secret Manager 等で暗号化保管。ローテーション後の旧トークンは即廃棄。ログに平文を出さない。
- **再認証**: リフレッシュに失敗した際は影響範囲を最小化するため会社単位で再同意フローを案内（運用例: 管理者へメール通知とダッシュボード上の再認可アラートを即時表示し、再認可 URL を発行）。失敗回数をメトリクス化。
- **ログ/トレーサビリティ**: リクエスト ID（`X-Freee-Request-Id` ヘッダー）を収集し、429/401/5xx をアラート化。PII/Secrets はマスク。
- **エラー設計**: 401（トークン失効）→リフレッシュ後リトライ。429→`Retry-After` 遵守でバックオフ。5xx→指数バックオフ + 上限。バリデーション 4xx は即座にデッドレター行き。
- **監査**: 認可同意・トークン発行・再認証イベントを監査ログに残し、権限付与履歴を定期レビューする。
- **デプロイ環境想定**: サーバーレス（Cloud Run / Lambda）を想定し、秘密情報は環境変数 + Secret Manager 連携で注入。HTTP クライアントは keep-alive + タイムアウト（接続 5s / 応答 30s 目安）設定。

## 6. DESIGN への引き渡し観点
- 認証モジュール: Authorization Code + PKCE をデフォルト。トークンストアの抽象化とローテーション対応を設計。
- データ取得: ページング・レート制御付きのフェッチャー（`limit=100`, offset 進行）。取引/仕訳/口座残高/取引先を会社単位で切り替え可能にする。
- フォールトトレランス: 429/5xx バックオフ、401 再認証、タイムアウト・再送回数のポリシーを設定（例: 3 回指数バックオフ）。
- 監査・オブザーバビリティ: リクエスト ID, HTTP ステータス, レート残数をメトリクス化し、PII マスク済みログで収集。
- Sandbox 利用: 初期実装は Sandbox での結合確認、実データ移行は本番発行クライアントで段階的に行う。
