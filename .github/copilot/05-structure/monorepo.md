# モノレポ構成定義 — CopilotAgent 参照用

> **NOTE:** 本書は Copilot Agent が自動解析する構成定義レイヤの SSOT。  
> 規範表現は MUST / SHOULD / MUST NOT を使用し、各箇条には `RULE:` / `DO NOT:` / `EXAMPLE:` / `NOTE:` タグを付与する。`RULE:` は MUST、`DO NOT:` は MUST NOT に相当する。  
> スコープは本リポジトリ内のモノレポ（複数アプリ混在）運用。コード例・コマンドは直接利用可能な最小形を維持する。`<repo_name>` はワークスペース上のリポジトリ名プレースホルダ（例: `myproject`）。

---

## 1. 目的と適用範囲
- RULE: 本書は `.github/copilot-instructions.md`（リポジトリに存在）から include される構成定義レイヤであり、モノレポのディレクトリ設計・ビルド・デプロイ・テストの単一情報源となる。
- RULE: 対象は「リポジトリルートを起点とする compose / docker / devcontainer / apps / deploy / scripts / credentials」。他ファイルへ影響を及ぼさない。
- NOTE: 互換性重視。既存のコード例・コマンドは保持しつつ重複を統合して再構成する。

---

## 2. 基本原則（パス・ビルド・多言語）
- RULE: docker-compose ファイルはリポジトリルートに集約し、`docker-compose.base.yml`（共通） + `docker-compose.<env>.yml`（差分）でオーバーレイする。
- RULE: `build.context` と `dockerfile` は **常にリポジトリルート基準**で指定し、`common` を含む階層（例: `./apps/python`）に固定する。
- RULE: `.env` はビルド時に混ぜず、起動時に `env_file` で渡す。
- RULE: ベースイメージは1つにまとめ、各アプリの Dockerfile は薄く（`FROM base + COPY + ENTRYPOINT`）。`CMD` 直叩きは避け、`entrypoint.sh` で `exec python -m ...` する。
- RULE: アプリごとの世界は `apps/<lang>/<app>` に分離する（Python / PHP / iOS / Web 等）。共通コードは言語ごとに分ける。
- DO NOT: `build.context: ../..` などリポジトリ全体を投げる指定。パス地獄とビルド肥大化を招く。

---

## 3. 標準ディレクトリ構成（推奨テンプレ）

### 3.1 リポジトリ全体（Python + 共通 + devcontainer + compose + env）
```text
repo-root/
├── .env
├── .env.dev
├── .env.stg
├── .env.prod
│
├── docker-compose.base.yml
├── docker-compose.dev.yml
├── docker-compose.stg.yml
├── docker-compose.prod.yml
│
├── docker/
│   └── base/
│       └── Dockerfile                # 本番アプリ共通ベースイメージ
│
├── apps/
│   ├── python/
│   │   ├── common/                   # ★ Python共通コード
│   │   │   ├── __init__.py
│   │   │   ├── mylib/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── util.py
│   │   │   │   └── validators.py
│   │   │   └── tests/
│   │   │       ├── test_util.py
│   │   │       └── test_validators.py
│   │   │
│   │   ├── app1/
│   │   │   ├── Dockerfile            # 薄い（FROM base）
│   │   │   ├── entrypoint.sh         # シェル経由で python 実行
│   │   │   ├── main_app1.py
│   │   │   └── tests/
│   │   │       ├── test_app1_main.py
│   │   │       └── test_app1_api.py
│   │   │
│   │   └── batch/
│   │       ├── Dockerfile            # 薄い（FROM base）
│   │       ├── entrypoint.sh
│   │       ├── main_batch.py
│   │       └── tests/
│   │           └── test_batch.py
│   │
│   ├── php/                          # （必要なら共存）
│   │   ├── api/
│   │   │   ├── Dockerfile
│   │   │   ├── composer.json
│   │   │   └── src/...
│   │   └── common/
│   │       └── src/...
│   │
│   └── ios/                          # （必要なら共存）
│       └── MyAwesomeApp/
│           ├── MyAwesomeApp.xcodeproj
│           ├── Sources/...
│           └── Tests/...
│
└── .devcontainer/
    ├── Dockerfile                    # 開発専用（本番とは別）
    └── devcontainer.json
```

---

## 4. Dockerfile 設計（共通ベース + 薄い各アプリ）
### 4.1 共通ベースイメージ
- RULE: 本番共通依存のみを入れる。開発ツールは devcontainer 側へ。
```dockerfile
# docker/base/Dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH="/app"
```

### 4.2 薄いアプリ Dockerfile（app1/batch）
- RULE: `build.context` を `./apps/python` に固定し、common を COPY できるようにする。
```dockerfile
# apps/python/app1/Dockerfile
FROM myorg/app-base:1.0
WORKDIR /app
COPY common/ ./common/
COPY app1/ ./app1/
RUN chmod +x ./app1/entrypoint.sh
ENTRYPOINT ["./app1/entrypoint.sh"]
```
```dockerfile
# apps/python/batch/Dockerfile
FROM myorg/app-base:1.0
WORKDIR /app
COPY common/ ./common/
COPY batch/ ./batch/
RUN chmod +x ./batch/entrypoint.sh
ENTRYPOINT ["./batch/entrypoint.sh"]
```

### 4.3 entrypoint.sh テンプレート
- RULE: `set -euo pipefail` と `exec python -m ...` を徹底し、PYTHONPATH を固定する。
```bash
#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH="/app"
exec python -m app1.main_app1 "$@"
```

---

## 5. docker-compose 設計（base + env差分 + profiles）
- RULE: `profiles` で起動セットを分ける（例: `local` / `cloud` / `batch`）。
- RULE: `env_file` は「共通 → 環境固有」の順で積む。
- RULE: Healthcheck は起動順が重要なサービスに付与する。
```yaml
# docker-compose.base.yml
version: "3.9"
services:
  app1:
    profiles: ["local", "cloud"]
    build:
      context: ./apps/python
      dockerfile: ./app1/Dockerfile
    env_file: [.env]
    restart: unless-stopped
  batch:
    profiles: ["local", "batch"]
    build:
      context: ./apps/python
      dockerfile: ./batch/Dockerfile
    env_file: [.env]
    restart: unless-stopped
```
```yaml
# docker-compose.dev.yml（開発差分）
services:
  app1:
    env_file: [.env, .env.dev]
    volumes:
      - ./apps/python:/app
  batch:
    env_file: [.env, .env.dev]
    volumes:
      - ./apps/python:/app
```
```yaml
# docker-compose.prod.yml（本番差分）
services:
  app1:
    env_file: [.env, .env.prod]
  batch:
    env_file: [.env, .env.prod]
```
```bash
# EXAMPLE: 起動コマンド
docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile local up -d   # dev
docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile cloud up -d  # cloud
docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile batch up batch
```
- NOTE: `x-credentials-*` アンカーを使って volume 定義を共有すると、複数アプリでも重複を防げる（Sec.9 認証情報の例を参照）。

---

## 6. devcontainer 運用
- RULE: `.devcontainer/` は開発専用。本番イメージと分離し、開発ツールは devcontainer のみへ入れる。
- RULE: ワークスペースは `/workspaces/<repo_name>` にマウントされる前提で、PYTHONPATH を devcontainer 内で固定する。
```json
{
  "name": "mono-repo-dev",
  "build": { "dockerfile": "Dockerfile", "context": "." },
  "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
  "containerEnv": {
    "PYTHONPATH": "/workspaces/${localWorkspaceFolderBasename}/apps/python"
  },
  "customizations": {
    "vscode": { "extensions": ["ms-python.python", "ms-python.vscode-pylance"] }
  }
}
```
- DO NOT: devcontainer イメージに本番用コンポーネントを混在させる。

---

## 7. common & PYTHONPATH（単一方針）
- RULE: Python の import root を `apps/python` に固定し、`common` を `apps/python/common` に置く。
- RULE: import は絶対指定（`from common...`）。`sys.path.append` や相対 import は禁止。
- RULE: 実行は `python -m <module>` に統一し、実行ディレクトリ依存を排除する。
- RULE: devcontainer は `PYTHONPATH=/workspaces/<repo_name>/apps/python`、アプリコンテナは `/app` を import root とする。
```text
apps/python/
├── common/
│   ├── __init__.py
│   └── mylib/util.py
├── app1/
│   └── app1/main_app1.py
└── batch/
    └── batch/main_batch.py
```
```yaml
# compose 側 PYTHONPATH 例（方式A）
services:
  app1:
    volumes:
      - ./apps/python:/app
    environment:
      PYTHONPATH: /app
```
```bash
# EXAMPLE: devcontainer 直実行
cd apps/python/app1 && PYTHONPATH=/workspaces/<repo_name>/apps/python ./entrypoint.sh
```

---

## 8. テスト戦略（pytest 一括）
- RULE: プロジェクトルートで `pytest` を実行する。`PYTHONPATH=$PWD/apps/python` を必ず設定する。
- RULE: `tests/` または `test_*.py` 規約を統一し、探索範囲を `apps/python` に固定する。
- RULE: `integration` マーカーで遅い/外部依存テストを分離し、デフォルトは unit のみ。
```ini
# repo-root/pytest.ini
[pytest]
minversion = 7.0
testpaths = apps/python
python_files = test_*.py *_test.py
markers =
  unit: unit tests
  integration: integration tests
addopts = -ra
```
```bash
# scripts/test-python.sh（単一情報源）
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PYTHONPATH="$PWD/apps/python"
pytest -v -m "not integration"
```
- RULE: CI 品質ゲート（PR）は Lint + Unit Test + Security を必須とし、CD でも Unit を再実行する。
- EXAMPLE: GitHub Actions（unit 抜粋）
```yaml
- name: Unit tests (single source)
  run: |
    chmod +x scripts/test-python.sh
    ./scripts/test-python.sh
```

---

## 9. 認証情報/credentials 運用
- RULE: 認証ファイルは `.env` に直接書かず、`credentials/<env>/...` に配置して Git へコミットしない（`.gitignore` 必須）。README と `.sample` のみ Git 許可。
- RULE: コンテナ内パスは `/run/credentials/...` へ read-only マウントし、`.env` には「パスのみ」を定義する。
- RULE: 秘密鍵/証明書は 600、ディレクトリは 700 権限にする。
- EXAMPLE: compose で共通 volume を注入（volume 自体にアンカーを付与する）
```yaml
services:
  app1:
    volumes:
      - &credentials-dev ./credentials/dev:/run/credentials:ro
      - ./apps/python:/app
  batch:
    volumes:
      - *credentials-dev
      - ./apps/python:/app
```
- RULE: CI では `credentials/` を持ち込まず、Secrets からファイルを生成して同一パスに置く。
```yaml
- name: Write GCP credentials
  run: |
    mkdir -p /tmp/credentials/gcp
    echo '${{ secrets.GCP_SA_JSON }}' > /tmp/credentials/gcp/service-account.json
    chmod 600 /tmp/credentials/gcp/service-account.json
```
- NOTE: 最終形は Secret Manager / IAM Role / Workload Identity などファイルレス運用を推奨。

---

## 10. Dependabot（モノレポ混在対応）
- RULE: `.github/dependabot.yml` をリポジトリルート1箇所に置き、エコシステム × ディレクトリ単位で `updates` を分割する。
- RULE: `open-pull-requests-limit` と `groups` を必ず設定し、PR洪水を防ぐ。ラベルは `dependencies` + `deps-<lang>` + `area-<app>` を付与する。
- RULE: 週次更新を基本とし、Security updates は優先レビュー（`security` ラベル）。
```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly", day: "monday", time: "03:00", timezone: "Asia/Tokyo" }
    labels: ["dependencies", "deps-actions"]
    open-pull-requests-limit: 5
    groups:
      actions:
        patterns: ["*"]
  - package-ecosystem: "pip"
    directory: "/apps/python/app1"
    schedule: { interval: "weekly", day: "monday", time: "03:10", timezone: "Asia/Tokyo" }
    labels: ["dependencies", "deps-python", "area-app1"]
    open-pull-requests-limit: 5
    groups:
      py-devtools-app1:
        patterns: ["pytest*", "ruff", "mypy", "black", "isort"]
      py-runtime-app1:
        patterns: ["*"]
        exclude-patterns: ["pytest*", "ruff", "mypy", "black", "isort"]
```
- DO NOT: `directory` を依存ファイルの無い場所に向ける / PR 上限なしで運用する。

---

## 11. CI/CD とデプロイ
- RULE: ワークフローは領域別に分割する（例: `python-ci.yml`, `php-ci.yml`, `ios-ci.yml`, `release-cloud.yml`, `release-onprem.yml`）。`paths` で無駄実行を減らす。
- RULE: リリースフローは `unit` → `build` → `deploy` の順で、`deploy` は `needs: [unit, build]` を必須とする。
- EXAMPLE: release-cloud 骨子
```yaml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: |
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
      - run: chmod +x scripts/test-python.sh && ./scripts/test-python.sh
  build:
    needs: unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - run: docker build -f apps/python/app1/Dockerfile -t myorg/app1:sha-${{ github.sha }} apps/python
  deploy:
    needs: [unit, build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy-cloud.sh prod
```
- RULE: イメージタグは不変（`sha-<commit>`）で昇格させる。`dev→stg→prod` も同一 SHA を使う。
- RULE: onprem は compose を正とし、`deploy/onprem/compose/deploy.sh` などスクリプト経由で実行する。systemd 常駐例は `deploy/onprem/compose/systemd/app-stack.service` を基にする。
- RULE: cloud は kustomize/helm の overlays/values に起動対象・タグ・Secret 注入を集約する。
- RULE: `scripts/` に up/down/logs/test/deploy の入口を集約し、CI も同じスクリプトを呼ぶ。
- EXAMPLE: Makefile（起動とテストの固定化）
```make
.PHONY: up-dev up-prod down test
COMPOSE_BASE=-f docker-compose.base.yml
COMPOSE_DEV=$(COMPOSE_BASE) -f docker-compose.dev.yml
COMPOSE_PROD=$(COMPOSE_BASE) -f docker-compose.prod.yml
up-dev:
	docker compose $(COMPOSE_DEV) --profile local up -d
up-prod:
	docker compose $(COMPOSE_PROD) --profile cloud up -d
down:
	docker compose $(COMPOSE_BASE) down
test:
	chmod +x ./scripts/test-python.sh && ./scripts/test-python.sh
```

---

## 12. 多言語共存
- RULE: 言語ごとに世界を分離する（Python: `apps/python`, PHP: `apps/php`, iOS: `apps/ios`, Web: `apps/web`）。
- RULE: CI ジョブも言語ごとに分け、チェック名に領域を含める（例: `python-ci`, `php-api-ci`, `ios-ci`）。
- NOTE: iOS は Docker 化せず macOS runner で `xcodebuild test` を実行する。PHP は composer / phpunit / artisan test をアプリ単位で実行する。

---

## 13. 補助ファイル（運用の単一情報源）
- RULE: `.dockerignore` を必ず置き、`__pycache__`, `.pytest_cache`, `.venv`, `.mypy_cache`, `dist`, `build`, `node_modules`, `.DS_Store` 等を除外する。
- RULE: `scripts/` 配下に `test-python.sh`, `up-*.sh`, `deploy-*.sh` などを集約し、CI/ローカルが同一入口を使う。
- RULE: `credentials/README.md` で取得・配置・権限・注入パスを明記する。
- NOTE: `schema/` に OpenAPI / JSON Schema / Protobuf を置き、言語跨ぎの共通仕様をコードではなく仕様で共有する。

---

## 14. 最小チェックリスト
- [ ] compose はルート集約。base + env 差分でオーバーレイ運用。
- [ ] `build.context` は `common` を含む階層（例: `./apps/python`）に固定。
- [ ] `.env` は env_file で渡し、ビルドへ混ぜない。
- [ ] ベースイメージは1つ、各アプリ Dockerfile は薄い（FROM + COPY + ENTRYPOINT）。
- [ ] entrypoint.sh は `exec python -m ...` で起動し、PYTHONPATH を固定。
- [ ] devcontainer は本番と分離、workspace はリポジトリルート。PYTHONPATH を `/workspaces/<repo_name>/apps/python` に固定。
- [ ] pytest はリポジトリルートで実行し、`PYTHONPATH=$PWD/apps/python` を必須とする。
- [ ] credentials は Git へ入れず、`/run/credentials` へ read-only マウントする。
- [ ] Dependabot は groups + PR 上限付きでエコシステム別に分割。
- [ ] CI/CD は scripts/ を入口にし、unit → build → deploy の順でゲートする。

---

## 15. アンチパターンと対処
- DO NOT: `../common` を COPY する（build.context 外は参照不可）  
  → 対処: build.context を common を含む階層に固定。
- DO NOT: devcontainer で `PYTHONPATH` 未設定のまま `cd apps/...` して実行  
  → 対処: `containerEnv.PYTHONPATH=/workspaces/<repo_name>/apps/python` を固定。
- DO NOT: `python file.py` など実行場所依存の起動  
  → 対処: すべて `python -m <module>` に統一。
- DO NOT: PR 上限なしの Dependabot 運用  
  → 対処: groups + `open-pull-requests-limit` を必ず設定。
- DO NOT: credentials を `.env` や Git に埋め込む  
  → 対処: パスだけを `.env` に記載し、`/run/credentials` を read-only で注入。

---

## 16. Wiki 貼り付け用ショート宣言
```text
【運用宣言】
1) compose はリポジトリルートに集約し、base + 環境差分でオーバーレイする。
2) build.context は common を含む階層（例: ./apps/python）に固定し、../ 地獄を禁止する。
3) .env は起動時に env_file で渡す（ビルドに混ぜない）。
4) Dockerfile は「共通ベース1つ + 各アプリ薄いDockerfile」を原則とし、太い Dockerfile のコピペを禁止する。
5) アプリ起動はリポジトリルートから docker compose を叩く。直起動はデバッグ用途に限定する。
6) common は apps/python/common に置き、PYTHONPATH を apps/python（/app）に統一する。
7) CI はリポジトリルートから pytest を実行し、`PYTHONPATH=$PWD/apps/python` を必須とする。
8) devcontainer は本番イメージと分離し、開発ツールは devcontainer 側にのみ導入する。
9) 多言語共存（Python/PHP/iOS）は言語ごとに apps/<lang>/ で世界を分け、CI もジョブを分ける。
```

---

## 17. リポジトリ完全テンプレ（圧縮版）
> NOTE: “common + パス + CI” で必要な資材を一箇所にまとめた統合版。`...` は配下に増えることを示す。
```text
repo-root/
├── .dockerignore
├── .env(.dev|.stg|.prod|.onprem|.example)
├── Makefile
├── docker-compose.base.yml
├── docker-compose.dev.yml
├── docker-compose.stg.yml
├── docker-compose.prod.yml
├── docker/base/Dockerfile
├── .devcontainer/
│   ├── Dockerfile
│   ├── devcontainer.json
│   └── scripts/
├── .github/
│   ├── workflows/
│   ├── dependabot.yml
│   ├── CODEOWNERS
│   ├── copilot-instructions.md
│   └── copilot/**
├── scripts/
│   ├── test-python.sh
│   ├── up-dev.sh
│   ├── deploy-cloud.sh
│   ├── deploy-onprem.sh
│   └── ...
├── credentials/
│   ├── dev/
│   ├── stg/
│   └── prod/                              # 認証ファイル本体は Git 禁止、README のみ許容
├── schema/
│   ├── openapi.yaml
│   ├── events.proto
│   └── ...
├── deploy/
│   ├── local/compose/
│   ├── onprem/compose/
│   │   ├── deploy.sh
│   │   ├── rollback.sh
│   │   └── systemd/app-stack.service
│   └── cloud/
│       ├── terraform/
│       │   ├── modules/
│       │   └── envs/
│       ├── k8s/
│       │   ├── base/
│       │   └── overlays/
│       └── helm/
│           ├── charts/
│           └── values/
├── apps/
│   ├── python/
│   │   ├── common/
│   │   ├── app1/
│   │   └── batch/
│   ├── php/api/
│   ├── web/
│   └── ios/MyAwesomeApp/
└── tests/ (共通E2Eなど全体テストが必要な場合のみ)
```

---

## 18. 事故発生時の即時チェック
- RULE: `ModuleNotFoundError: common` → PYTHONPATH が通っているか確認（devcontainer: `/workspaces/<repo_name>/apps/python`, compose: `/app`）。entrypoint で export する。
- RULE: `pytest` 探索が遅い → `pytest.ini` の `testpaths` を固定。
- RULE: CI でのみ落ちる → CI も `scripts/test-python.sh` を呼んでいるか確認し、同一 PYTHONPATH に揃える。
- RULE: credentials パスずれ → `.env` と compose の volume / env_file の整合を確認。

---

## 19. 用語・プロファイル命名規約
- RULE: compose profiles は `local`（開発全部入り）、`cloud`（リリース対象）、`batch`（バッチ専用）、必要なら `ops` を使う。
- RULE: ラベル/チェック名/ジョブ名には領域を含める（例: `deps-python`, `area-app1`, `python-ci`, `php-api-ci`）。

---

## 20. 参考コマンド集（再掲）
```bash
# 起動
docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile local up -d
docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile cloud up -d
docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile batch up batch

# テスト
export PYTHONPATH="$PWD/apps/python"
pytest -v -m "not integration"

# devcontainer での PYTHONPATH 固定
echo 'export PYTHONPATH=/workspaces/<repo_name>/apps/python' >> ~/.bashrc
```

---

## 21. セキュリティ補足
- RULE: secrets/credentials をログに出さない。CI ではマスクする。
- RULE: `.env.prod` に機密を直書きしない。必要なら別配布 or CI 注入に切り替える。
- RULE: healthcheck で早期検知しつつ、deploy スクリプトで監査ログ（日時/ユーザ/SHA）を出力する。

---

## 22. 変更ポリシー
- RULE: 本書を更新する場合は「重複排除・MUST/SHOULD 整理・タグ付け」を維持し、include 構造を壊さないこと。
- RULE: 構成変更は plan（`80-templates/implementation-plan.md`）で合意してから実施する。
