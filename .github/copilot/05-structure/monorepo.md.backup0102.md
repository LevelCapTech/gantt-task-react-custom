# モノレポ（複数アプリ）オーケストレーション & 開発運用 ベストプラクティスまとめ

> **注意（正直ベース）**  
> このドキュメントは「このスレッド内で確認できた会話内容」を**漏れなく**整理したものです。  
> ただし、チャットUI上で省略表示（…）されている過去発言の全文までは参照できないため、**表示されている範囲を根拠に**網羅整理しています。

---

## 1. 前提・課題（スレッドで出た論点）

- 1つのリポジトリに複数アプリが共存（モノレポ）。
- `.env` を共通化したくて、`docker-compose` の `build.context` を `../../` のようにリポジトリルートへ寄せていた。
- アプリ数増加により **相対パス地獄（../apps/app1 等）** と管理難が発生。
- 環境ごとに `docker-compose.*.yml` を分けたため、Dockerfileパスも相対で崩れやすい。
- クラウドリリースで「アプリセット（起動対象の組み合わせ）」が必要。
- ベースとなるDockerイメージは同じ（言語/ランタイム共通）だが、各アプリは別起動。
- `CMD` 直で python 実行ではなく、**シェル（entrypoint.sh）経由で python 実行**している。
- app1 と batch などで **共通コード（common）** が必要。
- `.devcontainer` の位置づけ（開発環境は本番と別）と、devcontainer内での起動手順。
- CI/CD で全アプリのテストをまとめて実行したい（pytest）。
- Python 以外に PHP / iOS（iPhoneアプリ）も同じリポジトリに共存できるか。

---

## 2. 結論（スレッドのベストプラクティス要約）

### 2.1 パス地獄を消す基本戦略
- `docker-compose` を環境別に置き散らさず、**リポジトリルートに集約**する。
- `docker-compose.base.yml`（共通） + `docker-compose.dev.yml / stg / prod`（差分）で **オーバーレイ**運用。
- `build.context` と `dockerfile` の相対パスは **常にリポジトリルート基準**に統一する。
- `.env` は「ビルド時に混ぜる」のではなく、**起動時（compose の env_file）で渡す**。

### 2.2 クラウドリリース用「アプリセット」の扱い
- 「環境（dev/stg/prod）」と「アプリセット（local/cloud/batch など）」は別軸。
- `profiles` を使うと、**同じcomposeから起動セットを切り替え**できる。
- 代替として「アプリセット用オーバーレイ compose」を追加する方法もある。

### 2.3 “同じベースイメージ” を複数アプリで共有する方法
- **太い Dockerfile のコピペはNG**。
- 推奨は「共通ベースイメージ（1つ）」 + 「各アプリは薄い Dockerfile（FROM base + COPY + ENTRYPOINT）」。
- もしコード自体が同一で設定や起動引数だけ違うなら、**イメージを1つにして service を分ける**選択も可能。

### 2.4 common（共通コード）の扱い
- Dockerの制約：`COPY` は **build.context 外を参照できない**。
- そのため、commonを利用するなら `build.context` は **common を含む階層**にする（例：`./apps/python`）。
- devcontainerで `cd apps/app1` して直接実行する場合でも、`PYTHONPATH` を上位（`apps/python` 等）に通して common import を成立させる。

### 2.5 devcontainer の位置づけ
- `.devcontainer` は “開発用サービス/環境” としては同列に見てもよいが、
- **本番アプリのDockerイメージとは完全に分離**する（dev専用ツールで本番イメージを汚さない）。
- devcontainer の “ビルドコンテキスト” と “ワークスペース（コードが見える場所）” は別：
  - ビルドコンテキスト：`.devcontainer/`
  - ワークスペース：`/workspaces/<repo>` にリポジトリ全体がマウントされる想定

### 2.6 テスト（pytest）の実行方針
- CI/CD で全アプリのテストを回したいなら、**プロジェクトルートから pytest** でOK。
- ただし `PYTHONPATH` を揃える（例：`export PYTHONPATH="$PWD/apps/python"`）。
- `tests/` 配置や `test_*.py` 規約を統一し、pytest の自動検出に乗せる。

### 2.7 Python以外（PHP / iOS）共存
- 共存は可能。言語ごとに “世界” を分ける：
  - `apps/python/...`
  - `apps/php/...`
  - `apps/ios/...`
- 共通コードは言語ごとに分ける（Pythonのcommon / PHPのcommon）。
- iOSは通常Dockerで回さず、macOS（Xcode）でビルド・テスト（CIはmacOS runner等）。

---

## 3. 推奨フォルダ構成（このスレッド統合版）

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

### 4.1 共通ベースイメージ（例）
- 本番アプリ共通の依存（言語ランタイム、最低限のOSパッケージ）だけを入れる。
- 開発専用ツール（zsh, vim, debugツール等）は入れない（devcontainer側へ）。

```dockerfile
# docker/base/Dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    bash \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONUNBUFFERED=1
# common を含む import を安定させる（運用で統一）
ENV PYTHONPATH="/app:${PYTHONPATH}"
```

### 4.2 app1 の薄いDockerfile（entrypoint.sh で起動）
- **common をCOPYできるように build.context を `./apps/python` にする**前提。

```dockerfile
# apps/python/app1/Dockerfile
FROM myorg/app-base:1.0

WORKDIR /app
COPY common/ ./common/
COPY app1/ ./app1/

RUN chmod +x ./app1/entrypoint.sh
ENTRYPOINT ["./app1/entrypoint.sh"]
```

### 4.3 batch の薄いDockerfile（同様）
```dockerfile
# apps/python/batch/Dockerfile
FROM myorg/app-base:1.0

WORKDIR /app
COPY common/ ./common/
COPY batch/ ./batch/

RUN chmod +x ./batch/entrypoint.sh
ENTRYPOINT ["./batch/entrypoint.sh"]
```

### 4.4 entrypoint.sh（CMD直叩きではなくシェル経由）
- 前処理（環境変数チェック、ログ初期化、マイグレーション等）をここに寄せられる。
- `exec` を使ってPID1のシグナル挙動を素直にする。

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Starting app1..."
# 例：必要ならここで export / バリデーション / 初期化
# export PYTHONPATH="/app:${PYTHONPATH}"

exec python -m app1.main_app1 "$@"
```

---

## 5. docker-compose（base + env差分 + profiles）

### 5.1 docker-compose.base.yml（共通、buildはここに集約）
- `build.context` を **common を含む階層**に固定（例：`./apps/python`）。
- `profiles` で **起動セット（local / cloud / batch）** を切り替え可能。

```yaml
version: "3.9"

services:
  app1:
    profiles: ["local", "cloud"]
    build:
      context: ./apps/python
      dockerfile: ./app1/Dockerfile
    env_file:
      - .env
    restart: unless-stopped

  batch:
    profiles: ["local", "batch"]
    build:
      context: ./apps/python
      dockerfile: ./batch/Dockerfile
    env_file:
      - .env
    restart: unless-stopped
```

### 5.2 docker-compose.dev.yml（開発差分）
- 開発はマウント（必要な場合のみ）。本番はマウントしない。
- ここでは例として python ソースを `/app` にマウント。

```yaml
services:
  app1:
    env_file:
      - .env
      - .env.dev
    volumes:
      - ./apps/python:/app

  batch:
    env_file:
      - .env
      - .env.dev
    volumes:
      - ./apps/python:/app
```

### 5.3 docker-compose.prod.yml（本番差分）
- volume を付けない（イメージ固定運用）。
- 必要なら replicas などはクラウド基盤側へ（composeのdeployは環境による）。

```yaml
services:
  app1:
    env_file:
      - .env
      - .env.prod

  batch:
    env_file:
      - .env
      - .env.prod
```

### 5.4 起動コマンド例（環境×アプリセット）
- ローカル（全部入り）
```bash
docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.dev.yml \
  --profile local up -d
```

- クラウドリリース（app1のみ想定）
```bash
docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.prod.yml \
  --profile cloud up -d
```

- バッチだけ
```bash
docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.prod.yml \
  --profile batch up batch
```

---

## 6. devcontainer 運用（ビルドとワークスペースの分離）

### 6.1 devcontainer の基本方針
- `.devcontainer/` は **開発専用**（本番イメージとは別）。
- コードは `/workspaces/<repo>` にマウントされる前提で、そこから compose を叩ける。

### 6.2 common を devcontainer で直接実行（cdしてもimportが壊れない）
- `cd apps/python/app1` して実行する場合、`PYTHONPATH` を上位に通す。

例：devcontainer.json で固定（概念例）
```json
{
  "containerEnv": {
    "PYTHONPATH": "/workspaces/${localWorkspaceFolderBasename}/apps/python"
  }
}
```

---

## 7. テスト運用（pytestをルートから一括）

### 7.1 ルートからpytestで全アプリを回す
- 原則：**プロジェクトルートで `pytest`**。
- 条件：`tests/` もしくは `test_*.py` 規約で配置されていること。

```bash
cd repo-root
export PYTHONPATH="$PWD/apps/python"
pytest -v
```

### 7.2 CI/CD（概念）
- CIも devcontainer も同じ思想で `PYTHONPATH` を統一するのが楽。

---

## 8. Python以外（PHP / iOS）共存ガイド（スレッド結論）
- 同一リポジトリに共存可能。
- 言語ごとに分けて管理（`apps/python`, `apps/php`, `apps/ios`）。
- 共通コードは言語ごとに別管理（Python common / PHP common）。
- iOSは通常Docker化しない（macOS/Xcode運用・CIはmacOS runner等）。

---

## 9. 禁止事項・アンチパターン（スレッドで強調）
- `build.context: ../..` でリポジトリ全体を投げる（相対パス地獄 & ビルド肥大化）。
- `.env` をビルド時に無理やり参照させる設計（起動時に渡すのが基本）。
- 本番イメージに devcontainer 用の開発ツールを混ぜる（本番が汚れる）。
- 太い Dockerfile を各アプリへコピペ（変更箇所が爆発する）。
- common をコンテキスト外に置いて `COPY ../common` しようとする（Docker的に不可）。

---

## 10. すぐ使える「最小ルール」チェックリスト
- [ ] compose はルートに集約し、base + env差分でオーバーレイ運用
- [ ] build.context は common を含む階層（例：`./apps/python`）に固定
- [ ] `.env` は env_file で渡す（ビルドに混ぜない）
- [ ] ベースイメージは1つ、各アプリDockerfileは薄く（FROM + COPY + ENTRYPOINT）
- [ ] entrypoint.sh は `exec python ...` で起動
- [ ] devcontainer は本番と分離、workspace は repo-root
- [ ] devcontainer直実行でも `PYTHONPATH` 統一で common import を成立
- [ ] CI/CD は repo-root で pytest、`PYTHONPATH=$PWD/apps/python` を統一

---
## 11. 追加ベストプラクティス（運用で詰まらないための“補強”）

> このセクションは、このスレッドで出た内容を運用に落とす際に「必ず必要になる」補助ルールを、漏れなく具体化したもの。

---

## 11.1 `.dockerignore` を必ず置く（ビルド肥大化・キャッシュ崩壊を防ぐ）

- `build.context` を `./apps/python` に固定する場合、**apps配下の不要物を除外**しないとビルドが遅くなる。
- 典型的に除外すべきもの：`__pycache__`, `.pytest_cache`, `.venv`, `.mypy_cache`, `dist`, `build`, `node_modules`, `.DS_Store` など。

例（`repo-root/.dockerignore`）：

```text
# Python caches
**/__pycache__/
**/*.pyc
**/*.pyo
**/*.pyd
**/.pytest_cache/
**/.mypy_cache/
**/.ruff_cache/

# Virtualenvs
**/.venv/
**/venv/

# Build artifacts
**/dist/
**/build/
**/*.egg-info/

# OS/editor
**/.DS_Store
**/.idea/
**/.vscode/

# Logs
**/*.log
```

---

## 11.2 `pytest.ini`（または `pyproject.toml`）でテスト探索・パスを固定

- “ルートからpytest一発” を安定化させるため、pytest設定を置く。
- `testpaths` を明示すると、意図しない探索（巨大ディレクトリ）を避けられる。

例（`repo-root/pytest.ini`）：

```ini
[pytest]
minversion = 7.0
addopts = -ra -q
testpaths =
    apps/python
python_files =
    test_*.py
    *_test.py
markers =
    slow: slow tests
    integration: integration tests
```

---

## 11.3 `PYTHONPATH` の統一ルール（devcontainer/CI/ローカル/コンテナを揃える）

### 方針
- **`apps/python` を import ルートとして統一**する。
- つまり `common` を `apps/python/common` に置くなら、以下が常に成立する：
  - `from common.mylib import util`

### ルール
- ルート実行（CI/ローカル）：
  - `PYTHONPATH=$PWD/apps/python`
- devcontainer：
  - `PYTHONPATH=/workspaces/<repo>/apps/python`
- 本番イメージ（コンテナ内）：
  - `/app` に `apps/python` を配置しているなら `PYTHONPATH=/app`

---

## 12. devcontainer の“実体”テンプレート（このスレッド版）

### 12.1 `.devcontainer/devcontainer.json`（概念を具体化）

- 重要：devcontainerは「開発ツール」を詰め込む場所。本番イメージと分離。
- ワークスペースはリポジトリルートがマウントされる想定。

例：

```json
{
  "name": "mono-repo-dev",
  "build": {
    "dockerfile": "Dockerfile",
    "context": "."
  },
  "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
  "containerEnv": {
    "PYTHONPATH": "/workspaces/${localWorkspaceFolderBasename}/apps/python"
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance"
      ]
    }
  }
}
```

### 12.2 `.devcontainer/Dockerfile`（開発専用）

例（必要な開発ツールを入れる）：

```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

RUN apt-get update && apt-get install -y \
    git curl bash \
    python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*
```

---

## 13. “環境別起動”と“devcontainer起動”の手順をズラさないルール

### 13.1 共通ルール
- **起動コマンドは常に repo-root から叩く**（ホストでも devcontainer内でも同じ）。
- “各アプリへ cd して直接起動” は **例外（デバッグ用途）** として扱う。

### 13.2 起動コマンド（統一）

- dev（ローカル/開発）：
  - `docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile local up -d`

- prod（クラウド/本番想定）：
  - `docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile cloud up -d`

- batchだけ：
  - `docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile batch up batch`

### 13.3 例外：各アプリ直起動（デバッグ）
- 直起動の条件：
  - `PYTHONPATH` が上位に通っていること（devcontainerのcontainerEnv等）
- 実行例：
  - `cd apps/python/app1 && ./entrypoint.sh`
  - `cd apps/python/batch && ./entrypoint.sh`

---

## 14. “common” を壊さないための厳格ルール（運用規約化推奨）

### 14.1 commonディレクトリの約束
- `apps/python/common/__init__.py` は必須（パッケージ認識のため）
- `common/` 配下は“アプリ横断で利用されるものだけ”を置く  
  （アプリ固有のコードは入れない）

例：

```text
apps/python/common/
├── __init__.py
└── mylib/
    ├── __init__.py
    ├── util.py
    └── validators.py
```

### 14.2 importは相対ではなく絶対に固定
- OK：`from common.mylib import util`
- NG：`from ..common...`（実行位置やpytest探索で壊れやすい）

---

## 15. CI/CD（GitHub Actions）最小サンプル（Python全アプリpytest一括）

> このスレッドの結論：CI/CDで “ルートからpytest一発” を成立させる。

例（`.github/workflows/python-tests.yml`）：

```yaml
name: Python Tests

on:
  push:
    branches: [ "main" ]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          # 例：requirementsがある場合
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          # 例：pytestを保証
          pip install pytest

      - name: Run tests (all apps)
        run: |
          export PYTHONPATH="$PWD/apps/python"
          pytest -v
```

---

## 16. PHP / iOS を同居させる場合のCIの分割（共存はOK、実行環境を分ける）

### 16.1 PHP（例：Laravel）テストジョブの概念
- Pythonとは別ジョブに分ける（依存が違うため）
- 例コマンド：
  - `cd apps/php/api && composer install && php artisan test`

### 16.2 iOSテストはmacOS runnerが必要
- 例コマンド（概念）：
  - `cd apps/ios/MyAwesomeApp && xcodebuild test ...`

> ※このスレッドの結論：iOSは通常Docker化しない（macOS/Xcode運用）。

---

## 17. よくある失敗パターン（即死を避けるチェック）

### 17.1 “commonがCOPYできない”
- 原因：`build.context` が `common` を含んでいない
- 解決：`build.context` を `./apps/python` のように “commonを含む階層” に固定する

### 17.2 “devcontainerでcdして実行したらcommon importが壊れる”
- 原因：`PYTHONPATH` 未設定
- 解決：devcontainerの `containerEnv.PYTHONPATH` を `/workspaces/<repo>/apps/python` に固定

### 17.3 “pytestが意図しない場所まで探索して遅い”
- 原因：pytestの探索範囲が広すぎる
- 解決：`pytest.ini` の `testpaths` を固定

---

## 18. 最終：Wiki掲載向け “短い運用宣言（コピペ用）”

> チームルールとして冒頭に貼る用途（このスレッドの決定事項を短文化）。

```text
【運用宣言】
1) docker-composeはリポジトリルートに集約し、base + 環境差分でオーバーレイ運用する。
2) build.contextはcommonを含む階層（例：./apps/python）に固定し、../ 地獄を禁止する。
3) .envは起動時にenv_fileで渡す（ビルドに混ぜない）。
4) Dockerfileは「共通ベース1つ + 各アプリ薄いDockerfile」を原則とし、太いDockerfileのコピペを禁止する。
5) アプリ起動は原則 repo-root から docker compose を叩く。cdして直起動はデバッグ用途に限定する。
6) commonは apps/python/common に置き、PYTHONPATH を apps/python に統一して import を安定化する。
7) CIは repo-root から pytest を実行し、PYTHONPATH=$PWD/apps/python を必ず設定する。
8) devcontainerは本番イメージと分離し、開発ツールはdevcontainer側にのみ導入する。
9) 多言語共存（PHP/iOS）は可能。言語ごとに apps/<lang>/ で世界を分け、CIもジョブを分ける。
```

---
## 19. 実運用で必須になる “補助ファイル” 一式（手順ブレ防止）

> このスレッドの結論を「誰が叩いても同じ」状態にするための補助ファイル群。  
> **起動手順・環境選択・テスト実行の属人化を潰す**のが目的。

---

## 19.1 Makefile（起動・停止・テストをコマンド1つに固定）

- ルートから叩くルールを強制できる
- devcontainer/ホストどちらでも同じ

例（`repo-root/Makefile`）：

```make
.PHONY: up-dev up-stg up-prod down ps logs test

COMPOSE_BASE=-f docker-compose.base.yml
COMPOSE_DEV=$(COMPOSE_BASE) -f docker-compose.dev.yml
COMPOSE_STG=$(COMPOSE_BASE) -f docker-compose.stg.yml
COMPOSE_PROD=$(COMPOSE_BASE) -f docker-compose.prod.yml

up-dev:
	docker compose $(COMPOSE_DEV) --profile local up -d

up-stg:
	docker compose $(COMPOSE_STG) --profile cloud up -d

up-prod:
	docker compose $(COMPOSE_PROD) --profile cloud up -d

down:
	docker compose $(COMPOSE_BASE) down

ps:
	docker compose $(COMPOSE_BASE) ps

logs:
	docker compose $(COMPOSE_BASE) logs -f --tail=200

test:
	PYTHONPATH=$$(pwd)/apps/python pytest -v
```

---

## 19.2 scripts/（CIとローカルの同一化：テストや起動をスクリプト化）

- CIでもローカルでも同じスクリプトを叩くと事故が減る

例：

```text
repo-root/
└── scripts/
    ├── test-python.sh
    ├── up-dev.sh
    └── up-prod.sh
```

例（`scripts/test-python.sh`）：

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PYTHONPATH="$PWD/apps/python"
pytest -v
```

---

## 20. docker-compose 設計の追加ルール（事故りやすい所を固定）

---

## 20.1 profile 命名規約（混乱を防ぐ）
- `local`：開発で全部入り（監視/DB含めてもよい）
- `cloud`：クラウドリリースに含めるアプリセット
- `batch`：バッチ系だけ
- 追加するなら `ops`（監視系）など、意味で揃える

---

## 20.2 env_file の積み方（必ず同じ順）
- **必ず共通 → 環境固有の順**にする（後勝ちが自然）

例（dev）：

```yaml
env_file:
  - .env
  - .env.dev
```

---

## 20.3 secrets の扱い（.envに全部入れない）
- `.env` は「ローカル・開発向けの利便性」で、**本番はSecret管理が本筋**
- Docker Composeだけで完結させるなら：
  - `.env.prod` に機密を書かない（別配布）
  - もしくは環境変数をCIから注入する

---

## 20.4 healthcheck（起動確認が必要なサービスには付ける）
- API等は起動順/依存関係でこけやすいので付ける

例：

```yaml
services:
  app1:
    healthcheck:
      test: ["CMD", "bash", "-lc", "curl -fsS http://localhost:8080/health || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 10
```

---

## 21. entrypoint.sh の“運用テンプレ”（本番でもデバッグでも壊れない）

> このスレッドの前提：CMD直叩きではなく **シェル越しにpython起動**。

### 21.1 共有テンプレ（最小）
- `set -euo pipefail`
- `exec` でpythonへ置き換え（シグナル伝搬）

例：

```bash
#!/usr/bin/env bash
set -euo pipefail

# 例：共通の事前チェック（必要なら）
: "${APP_ENV:=local}"

# 例：import安定化（必要なら）
export PYTHONPATH="/app:${PYTHONPATH:-}"

echo "[entrypoint] APP_ENV=${APP_ENV}"
exec python "$@"
```

### 21.2 アプリ用（python -m で固定して “実行場所依存” を消す）
- `python -m app1.main_app1` の形式に寄せると安定する

例（app1）：

```bash
#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH="/app:${PYTHONPATH:-}"
exec python -m app1.main_app1 "$@"
```

---

## 22. “common” をさらに堅牢にする選択肢（規模拡大に備える）

> スレッドの結論は「PYTHONPATHで common を見せる」。  
> それを崩さず、規模が増えた時に選べる拡張案を列挙（運用に必要）。

---

## 22.1 common を「Pythonパッケージ」として配布可能にする（発展）
- `apps/python/common` を `pyproject.toml` / `setup.cfg` 等でパッケージ化
- 各アプリは `pip install -e` で参照する（開発しやすい）

例（概念）：

```text
apps/python/common/
├── pyproject.toml
└── common/
    ├── __init__.py
    └── mylib/...
```

> ただし、このスレッドの標準解は **PYTHONPATH統一**。  
> パッケージ化は「さらに大きくなったら」選ぶ。

---

## 22.2 common を “schema/” に寄せる（言語跨ぎ共有の王道）
- Python/PHP/iOSの共通は「コード」ではなく「仕様」を共有するのが安全
- OpenAPI / JSON Schema / Protobuf を `schema/` へ

例：

```text
repo-root/
└── schema/
    ├── openapi.yaml
    └── events.proto
```

---

## 23. 多言語共存の実戦ルール（Python + PHP + iOS）

> ここはユーザー質問「Python以外も共存できるか？」に対するスレッド結論を運用ルールに落としたもの。

---

## 23.1 ディレクトリ分離（言語ごとの世界）
- `apps/python/*`
- `apps/php/*`
- `apps/ios/*`

### 23.2 CIジョブ分割（依存が違うので混ぜない）
- Python：ubuntu runnerで pytest
- PHP：ubuntu runnerで composer + phpunit/laravel test
- iOS：macOS runnerで xcodebuild

---

## 24. Wikiに載せる “標準手順”（最終的にここだけ見れば動く）

> ここを**Wikiの冒頭**に貼るのが推奨。

---

## 24.1 ローカル開発（ホスト or devcontainer）
1) repo-root に移動  
2) dev起動  
3) ログ確認  
4) テスト

```bash
cd repo-root
docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile local up -d
docker compose -f docker-compose.base.yml logs -f --tail=200
PYTHONPATH=$PWD/apps/python pytest -v
```

---

## 24.2 本番相当（クラウドリリースセット）
- cloud profile を使う（= リリース対象アプリだけ起動）

```bash
cd repo-root
docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile cloud up -d
docker compose -f docker-compose.base.yml ps
```

---

## 24.3 バッチだけ
```bash
cd repo-root
docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile batch up batch
```

---

## 25. 最終チェック（このスレッドの結論が守れているか）

- [ ] composeはルートに集約されている（環境別は *ファイル* 分割、*場所* は分散しない）
- [ ] `build.context` は `common` を含む階層（例：`./apps/python`）に固定されている
- [ ] `.env` は env_file で渡している（ビルドに混ぜない）
- [ ] ベースイメージは1つ、各アプリDockerfileは薄い（コピペ地獄禁止）
- [ ] entrypoint.sh は `exec python ...` で起動（シグナル/終了コード健全）
- [ ] devcontainer は本番と分離されている（開発ツールはdevcontainer側）
- [ ] devcontainerで `cd apps/...` しても `PYTHONPATH` 統一で common import が壊れない
- [ ] CI/CD はルートで pytest（`PYTHONPATH=$PWD/apps/python` を統一）
- [ ] PHP/iOSは同居OKだが、世界とCIジョブは分けている

---
## 26. モノレポ（複数アプリ混在）での `dependabot.yml` 運用（ベストプラクティス）

> 前提：Python / PHP / Node / GitHub Actions など複数の「エコシステム」が同一リポジトリに混在し、  
> `apps/` 配下に複数アプリ、`.devcontainer/` や `.github/workflows/` も存在する構成を想定。

---

### 26.1 基本方針（ルールを先に固定する）
1) **Dependabotの設定は「ルート1箇所」**（`.github/dependabot.yml`）に集約  
2) **“言語/パッケージ管理単位” ごとに `updates` を分ける**  
3) `directory` は **依存管理ファイル（requirements.txt / pyproject.toml / composer.json / package.json）がある場所**を正確に指定  
4) **環境ごとの依存がある場合**（dev/prodでファイルが違う等）は、ファイルがあるディレクトリ単位で分ける  
5) PRが増えすぎると運用が崩壊するため、**グルーピング**と**PR上限**（`open-pull-requests-limit`）を必ず使う  
6) “全アプリ混在” の画面（PR一覧・Dependabot PR乱立）を前提に、**ラベル・担当者・レビュー**の自動付与で流量を制御する  
7) **Security updates（脆弱性対応）は別枠**で優先（ラベルで目立たせる、通常より短い周期など）

---

### 26.2 ディレクトリ設計の前提（Dependabotが迷わない置き方）
Dependabotは `directory` を起点に依存ファイルを探します。  
よって、依存ファイルが散らばるほど `updates` の定義数が増えます。

推奨（例）：
- Python：
  - `apps/python/app1/pyproject.toml`（Poetry）
  - `apps/python/batch/pyproject.toml`（Poetry）
  - `apps/python/requirements.txt`（共通requirements方式の場合）
- PHP：
  - `apps/php/api/composer.json`
- Node：
  - `apps/web/package.json`
- GitHub Actions：
  - `.github/workflows/*.yml`
- DevContainer：
  - `.devcontainer/`（依存更新の対象にするかは運用判断：基本は“やりすぎ注意”）

---

### 26.3 運用で必須の設計（PR洪水を防ぐ）
#### A) グルーピング（推奨）
- `groups` を使い、**同種依存をまとめて1PR**にする  
- 例：Pythonなら `pytest/ruff/mypy` 等の開発依存、`fastapi/requests` 等のランタイム依存で分ける

#### B) PR上限（必須）
- `open-pull-requests-limit` を小さめに（例：5〜10）  
- これがないと複数アプリ×複数エコシステムでPRが爆発します

#### C) スケジュール
- 通常：週1（`weekly`）で十分  
- Security：`daily` でも良い（通知・優先度が上がる）

#### D) 自動ラベル/担当付け
- `labels` で言語/領域を付与（例：`dependencies`, `deps:python`, `deps:php`）
- `reviewers` / `assignees` を付けて、混在画面でも処理漏れを防ぐ

---

### 26.4 推奨 `.github/dependabot.yml` サンプル（モノレポ混在対応）

> 例：Python（Poetry）×2アプリ、PHP（Composer）×1、Node（npm）×1、GitHub Actions を更新  
> ※ `directory` はあなたのリポジトリの実パスに合わせて修正してください。

```yaml
version: 2

updates:
  # --- GitHub Actions（CI/CD） ---
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
      timezone: "Asia/Tokyo"
    labels:
      - "dependencies"
      - "deps:actions"
    open-pull-requests-limit: 5
    groups:
      actions:
        patterns:
          - "*"

  # --- Python / app1（Poetry） ---
  - package-ecosystem: "pip"
    directory: "/apps/python/app1"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:10"
      timezone: "Asia/Tokyo"
    labels:
      - "dependencies"
      - "deps:python"
      - "area:app1"
    reviewers:
      - "YOUR_GITHUB_USERNAME"
    open-pull-requests-limit: 5
    groups:
      py-devtools-app1:
        patterns:
          - "pytest*"
          - "ruff"
          - "mypy"
          - "black"
          - "isort"
      py-runtime-app1:
        patterns:
          - "*"
        exclude-patterns:
          - "pytest*"
          - "ruff"
          - "mypy"
          - "black"
          - "isort"

  # --- Python / batch（Poetry） ---
  - package-ecosystem: "pip"
    directory: "/apps/python/batch"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:20"
      timezone: "Asia/Tokyo"
    labels:
      - "dependencies"
      - "deps:python"
      - "area:batch"
    reviewers:
      - "YOUR_GITHUB_USERNAME"
    open-pull-requests-limit: 5
    groups:
      py-devtools-batch:
        patterns:
          - "pytest*"
          - "ruff"
          - "mypy"
          - "black"
          - "isort"
      py-runtime-batch:
        patterns:
          - "*"
        exclude-patterns:
          - "pytest*"
          - "ruff"
          - "mypy"
          - "black"
          - "isort"

  # --- PHP / api（Composer） ---
  - package-ecosystem: "composer"
    directory: "/apps/php/api"
    schedule:
      interval: "weekly"
      day: "tuesday"
      time: "03:00"
      timezone: "Asia/Tokyo"
    labels:
      - "dependencies"
      - "deps:php"
      - "area:php-api"
    reviewers:
      - "YOUR_GITHUB_USERNAME"
    open-pull-requests-limit: 5
    groups:
      php-all:
        patterns:
          - "*"

  # --- Node / web（npm） ---
  - package-ecosystem: "npm"
    directory: "/apps/web"
    schedule:
      interval: "weekly"
      day: "wednesday"
      time: "03:00"
      timezone: "Asia/Tokyo"
    labels:
      - "dependencies"
      - "deps:node"
      - "area:web"
    reviewers:
      - "YOUR_GITHUB_USERNAME"
    open-pull-requests-limit: 5
    groups:
      node-dev:
        dependency-type: "development"
        patterns:
          - "*"
      node-prod:
        dependency-type: "production"
        patterns:
          - "*"
```

---

### 26.5 “混在画面” で事故を起こさない運用フロー（必須）
#### 1) PRタイトル/ラベルで瞬時に判別できる状態にする
- `deps:python` / `deps:php` / `deps:node` / `deps:actions`
- `area:app1` / `area:batch` のような“アプリ領域ラベル”を強制

#### 2) CIが落ちたDependabot PRは「原因の型」が決まっている
- Python：テスト/型/フォーマットの破壊（pytest, ruff, mypy）
- PHP：PHPバージョンや拡張、composer.lock 更新差分
- Node：lockfile差分、node version、breaking change

→ 対処は「アプリ単位で」行う必要があるため、`area:*` ラベルが重要

#### 3) PRが多い場合は “weekly + groups + limit” を守る
- 週1で十分（Securityは別）
- groupでまとめる
- limitで天井を作る  
これがないと混在画面で確実に漏れます

---

### 26.6 Security updates（脆弱性）を最優先にする（推奨）
Dependabotの“アラート起点のPR（Security updates）”を運用で目立たせます。

- ルール例：
  - `dependencies` + `security` ラベル（運用で付与）
  - 通常PRより優先レビュー（SLAを短く）

※ `dependabot.yml` 側で完全に“securityだけ別設定”は制約があるため、  
運用ルール（ラベル/優先度/ブランチ保護）で担保するのが現実的です。

---

### 26.7 よくある落とし穴（モノレポ混在特有）
1) **directory の指定ミス**：依存ファイルがないと更新されない  
2) **共通requirements/lockがルートにあるのにアプリ配下を見ている**：どちらを正にするか決める  
3) **アプリごとにPythonバージョンが違う**：CIでマトリクス化しないとPRが常に落ちる  
4) **PR上限なし**：混在画面で破綻する  
5) **groupなし**：PRが細粒度になりすぎて処理できない

---

### 26.8 最小運用テンプレ（Wiki貼り付け用）
- 週1更新（Actions/Python/PHP/Node）
- PR上限5
- groupsあり
- ラベル/領域ラベルで混在画面でも漏れない

運用宣言（短文化）：

```text
【Dependabot運用】
1) dependabot.ymlはルート1箇所に集約し、エコシステム×ディレクトリ単位でupdatesを定義する。
2) PR洪水を防ぐため、必ず groups と open-pull-requests-limit を設定する。
3) dependencies系ラベル + area:<app> ラベルで混在画面でも判別可能にする。
4) Security関連は最優先でレビューし、通常更新は週1で十分とする。
5) directoryは依存ファイルが存在する場所を正確に指定し、更新漏れを禁止する。
```

---
## 27. Unitテスト & CI/CD 運用（モノレポ複数アプリ混在のベストプラクティス）

> 目的：**全アプリの品質ゲートを自動化**し、PR混在でも漏れずに回る状態を作る。  
> このスレッド方針（ルートからpytest一括、profiles、common、devcontainer分離）を前提に、運用ルールを“確定仕様”として記述する。

---

## 27.1 テスト戦略の原則（最初に固定すること）

### 27.1.1 テスト階層（必須）
- **Unit**：外部I/O無し（DB/ネットワーク/実API無し）。速い。常時実行。
- **Integration**：DB/Redis/外部APIモック等を使う。遅い。条件付きで実行。
- **E2E**：デプロイ後やステージングで。さらに遅い。リリース前限定。

### 27.1.2 PR品質ゲート（必須）
- PRに対して最低限以下を必須チェックにする：
  1) Lint（静的解析）
  2) Unit Test（全アプリ）
  3) Security（依存脆弱性 / SASTなど）
- Integration/E2Eは「別ワークフロー」でOK（必須化は運用負荷を見て段階的に）

---

## 27.2 Python（複数アプリ + common）Unitテスト運用

### 27.2.1 テスト配置ルール（必須）
- `apps/python/<app>/tests/` に集約
- `apps/python/common/tests/` も許可（common自体のユニットテスト）

例：
```text
apps/python/
├── common/
│   └── tests/
├── app1/
│   └── tests/
└── batch/
    └── tests/
```

### 27.2.2 ルートから一括実行（スレッド結論の正式化）
- CI/CD とローカルは同じ：
- `PYTHONPATH` は **apps/python** をルートに固定

実行：
```bash
cd repo-root
export PYTHONPATH="$PWD/apps/python"
pytest -v
```

### 27.2.3 pytest設定（推奨：探索範囲固定）
`repo-root/pytest.ini`：
```ini
[pytest]
testpaths = apps/python
python_files = test_*.py *_test.py
markers =
  unit: unit tests
  integration: integration tests
addopts = -ra
```

### 27.2.4 “遅い/不安定” テストの扱い（必須）
- `@pytest.mark.integration` を付けて分離
- デフォルトは unit だけ（高速）
- integrationは夜間or手動or特定ブランチで実行

例：
- unitだけ：
  - `pytest -m "not integration"`
- integration：
  - `pytest -m "integration"`

---

## 27.3 PHP（Laravel/Composer）Unitテスト運用（共存前提）

### 27.3.1 実行単位
- `apps/php/<app>` がテスト単位（composer.jsonがある場所）

例：
```bash
cd repo-root/apps/php/api
composer install --no-interaction --prefer-dist
php artisan test
# もしくは vendor/bin/phpunit
```

### 27.3.2 “混在画面”で迷わないルール
- ジョブ名・チェック名に必ず `php/api` のような**領域名**を含める
- ラベル `area:php-api` を使う（Dependabotとも整合）

---

## 27.4 iOS（Xcode）テスト運用（Docker外：macOS runner 前提）

### 27.4.1 実行単位
- `apps/ios/<App>` が単位（xcodeproj/xcworkspaceがある場所）

例（概念）：
```bash
cd repo-root/apps/ios/MyAwesomeApp
xcodebuild \
  -scheme MyAwesomeApp \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  test
```

### 27.4.2 注意（必須）
- iOSは通常Docker化しない（このスレッド結論）
- CIは `runs-on: macos-*` を使う（コストが上がるため、トリガ条件を絞るのが現実的）

---

## 27.5 GitHub Actions（CI）運用設計：モノレポ最適解

### 27.5.1 ワークフロー分割（必須）
- 1ファイルに全部詰めない。混在画面で見分けづらくなる。
- 推奨：
  - `python-ci.yml`
  - `php-ci.yml`
  - `ios-ci.yml`
  - `docker-build.yml`（任意）
  - `security.yml`（任意）

### 27.5.2 変更検知（paths）で無駄実行を減らす（強く推奨）
- `apps/python/**` 変更 → python-ciだけ
- `apps/php/**` 変更 → php-ciだけ
- `.github/workflows/**` 変更 → actions検証

---

## 27.6 サンプル：Python CI（全アプリ unit テスト一括）

`.github/workflows/python-ci.yml`：
```yaml
name: python-ci

on:
  pull_request:
    paths:
      - "apps/python/**"
      - "pytest.ini"
      - ".github/workflows/python-ci.yml"
  push:
    branches: ["main"]
    paths:
      - "apps/python/**"
      - "pytest.ini"

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          # 例: requirements 方式なら
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest

      - name: Unit tests (all python apps)
        run: |
          export PYTHONPATH="$PWD/apps/python"
          pytest -v -m "not integration"
```

---

## 27.7 サンプル：Python Integration（任意：夜間/手動）

`.github/workflows/python-integration.yml`：
```yaml
name: python-integration

on:
  workflow_dispatch:
  schedule:
    - cron: "0 19 * * 1-5" # JST 04:00 平日（UTC表記）

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest

      - name: Integration tests
        run: |
          export PYTHONPATH="$PWD/apps/python"
          pytest -v -m "integration"
```

---

## 27.8 サンプル：PHP CI（Laravel）

`.github/workflows/php-ci.yml`：
```yaml
name: php-ci

on:
  pull_request:
    paths:
      - "apps/php/**"
      - ".github/workflows/php-ci.yml"
  push:
    branches: ["main"]
    paths:
      - "apps/php/**"

jobs:
  php-api-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/php/api
    steps:
      - uses: actions/checkout@v4

      - name: Set up PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: "8.3"
          tools: composer

      - name: Install
        run: composer install --no-interaction --prefer-dist

      - name: Test
        run: php artisan test
```

---

## 27.9 サンプル：iOS CI（必要時のみ実行）

`.github/workflows/ios-ci.yml`：
```yaml
name: ios-ci

on:
  pull_request:
    paths:
      - "apps/ios/**"
      - ".github/workflows/ios-ci.yml"
  push:
    branches: ["main"]
    paths:
      - "apps/ios/**"

jobs:
  ios-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode.app

      - name: Build & Test
        working-directory: apps/ios/MyAwesomeApp
        run: |
          xcodebuild \
            -scheme MyAwesomeApp \
            -destination 'platform=iOS Simulator,name=iPhone 15' \
            test
```

---

## 27.10 “Dependabot PR” を落とさないための運用（必須）

### 27.10.1 依存更新PRは「壊れて当然」前提で流量制御
- 週1 + groups + open-pull-requests-limit（前セクション）
- CIが赤になったら：
  - 原因が `area:*` で即判別できる状態にする
  - 修正はそのアプリの依存定義で完結させる（common破壊禁止）

### 27.10.2 “依存更新PRのCI時間” を短くする
- unitのみ必須化（integrationは別）
- キャッシュ活用（pip cache / composer cache / node cache）

---

## 27.11 CD（デプロイ）運用：最低限の安全策（スレッド整合）

> このスレッドは主にオーケストレーション/CI寄りだが、CDで必須の運用ルールを“省略なし”で列挙。

### 27.11.1 デプロイは “mainのみ” に限定（必須）
- PRはテストまで
- merge後（main）で build/push/deploy を走らせる

### 27.11.2 イメージタグ戦略（必須）
- `latest` だけは危険。必ず不変タグを持つ：
  - `sha-<GITHUB_SHA>`
  - `vX.Y.Z`（リリースタグ運用するなら）

### 27.11.3 デプロイ対象（アプリセット）の決定
- `profiles: cloud` が “クラウドリリースセット” の単一情報源
- 追加/削除はPRで明示し、レビュー必須

---

## 27.12 サンプル：Docker Build（任意：mainでビルドしてpush）

`.github/workflows/docker-build.yml`：
```yaml
name: docker-build

on:
  push:
    branches: ["main"]
    paths:
      - "apps/python/**"
      - "docker/**"
      - "docker-compose.base.yml"
      - ".github/workflows/docker-build.yml"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # 例: レジストリログインは環境に合わせて設定
      # - name: Login
      #   uses: docker/login-action@v3
      #   with:
      #     registry: ghcr.io
      #     username: ${{ github.actor }}
      #     password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build app1
        run: |
          docker build \
            -f apps/python/app1/Dockerfile \
            -t myorg/app1:sha-${{ github.sha }} \
            apps/python

      - name: Build batch
        run: |
          docker build \
            -f apps/python/batch/Dockerfile \
            -t myorg/batch:sha-${{ github.sha }} \
            apps/python

      # pushは必要なら追加
      # - run: docker push ...
```

---

## 27.13 ブランチ保護（必須：品質ゲートを“強制”する）

GitHubのブランチ保護で最低限：
- `Require status checks to pass before merging`
- 必須チェック：
  - `python-ci / unit`
  - `php-ci / php-api-tests`（該当するなら）
  - `ios-ci / ios-tests`（該当するなら）
- `Require pull request reviews before merging`
- `Dismiss stale approvals when new commits are pushed`（推奨）

---

## 27.14 最終：Wiki貼り付け用 “Unitテスト & CI/CD 運用宣言”（短文化）

```text
【Unitテスト & CI/CD運用】
1) Unitは常時必須、Integration/E2Eは別ワークフローで条件付き実行とする。
2) Pythonは repo-root から pytest を一括実行し、PYTHONPATH=$PWD/apps/python を統一する。
3) PHPは apps/php/<app> を単位として composer + artisan/phpunit を実行する。
4) iOSは apps/ios/<app> を単位として macOS runner で xcodebuild test を実行する。
5) ワークフローは言語/領域で分割し、pathsフィルタで無駄実行を抑制する。
6) Dependabot PRは週1 + groups + PR上限制御とし、ラベル(area/deps)で混在画面でも処理漏れを防ぐ。
7) mainへのマージは必須チェック通過を条件とし、ブランチ保護で強制する。
8) CDはmainのみ、イメージはshaタグ等の不変タグを必ず付与し、cloud profileがリリース対象セットの単一情報源とする。
```

---
## 28. 外部システム連携（GCP/AWS 等）の認証情報運用（`.env` に置けない JSON / RSA / PEM 対応）

> 目的：`.env` では表現できない（または置くべきでない）  
> **JSON（GCP Service Account）** / **RSA・PEM（鍵）** / **証明書** 等を、  
> モノレポ複数アプリ環境でも **漏れなく・事故なく・再現性高く**扱う。

---

## 28.1 大原則（必須ルール）
1) **認証ファイルはGitに絶対コミットしない**（事故防止の最上位ルール）
2) `.env` には「ファイルのパス」だけを書く  
   - 例：`GCP_SA_JSON_PATH=/run/secrets/gcp_sa.json`
3) 認証ファイルは `credentials/` 配下に置く（運用で統一）
4) `credentials/` は環境別に分ける（dev/stg/prod を混ぜない）
5) **起動時に volume / secret として注入**し、イメージ内に焼き込まない（原則）
6) devcontainer / ローカル / CI / 本番の注入方式を分けても良いが、**アプリが読む場所（パス）は統一**する

---

## 28.2 推奨ディレクトリ構成（credentials の置き場所）

> このスレッドのモノレポ構成に整合する形で提示。

```text
repo-root/
├── .env
├── .env.dev
├── .env.stg
├── .env.prod
│
├── credentials/
│   ├── dev/
│   │   ├── gcp/
│   │   │   ├── service-account.json
│   │   │   └── oauth-client.json
│   │   ├── aws/
│   │   │   ├── access_key_id.txt          # 必要なら（推奨は環境変数注入）
│   │   │   ├── secret_access_key.txt
│   │   │   └── session_token.txt
│   │   └── ssh/
│   │       ├── id_rsa
│   │       └── id_rsa.pub
│   │
│   ├── stg/
│   │   └── gcp/...
│   │
│   └── prod/
│       └── gcp/...
│
└── credentials/README.md
```

### 28.2.1 `credentials/README.md` に必ず書くべきこと（必須）
- 何を置くか（ファイル名）
- どこから取得するか（手順）
- 権限（chmod）
- どの `.env.*` の変数に対応するか（パス）

---

## 28.3 `.gitignore`（最重要・必須）
認証ファイルは **100% 無視**する。

例（`repo-root/.gitignore`）：

```text
# Credentials / secrets
credentials/**
!credentials/README.md
!credentials/**/.keep
```

> `.keep` を置きたい場合は例外的に許可（空ディレクトリ保持用）。

---

## 28.4 `.env` に書くのは “パスのみ”（具体例）

### 28.4.1 共通（.env）
- 認証ファイルを読むアプリは、**このパスを参照する**だけにする
- 環境差分でファイル本体が変わっても、**パスは固定**が理想

例（`.env`）：

```text
# GCP
GCP_SA_JSON_PATH=/run/credentials/gcp/service-account.json

# SSH (例)
SSH_PRIVATE_KEY_PATH=/run/credentials/ssh/id_rsa

# AWS (例: 可能なら IAM role / OIDC を推奨)
AWS_SHARED_CREDENTIALS_FILE=/run/credentials/aws/credentials
AWS_CONFIG_FILE=/run/credentials/aws/config
```

### 28.4.2 環境固有（.env.dev）
- 基本はパス固定なので、ここに書くのは “on/off” や “project id” 等

例：

```text
APP_ENV=dev
GCP_PROJECT_ID=my-dev-project
AWS_REGION=ap-northeast-1
```

---

## 28.5 docker-compose で credentials を注入する（推奨：volume マウント）

> compose の “動かし方” は、スレッドの base + dev/prod オーバーレイに整合させる。

### 28.5.1 dev（ローカル/開発）での注入（例：app1）
`docker-compose.dev.yml` に追加：

```yaml
services:
  app1:
    volumes:
      - ./apps/python:/app
      # ★ credentials を read-only で注入
      - ./credentials/dev:/run/credentials:ro

  batch:
    volumes:
      - ./apps/python:/app
      - ./credentials/dev:/run/credentials:ro
```

### 28.5.2 prod（本番）での注入（原則：ホストに置かない）
- composeで本番運用するなら、ホストに置く場合でも **権限/配布/監査**が必要
- 可能ならクラウド側の Secret Manager / Parameter Store 等に寄せる（後述）

ただし “運用として credentials フォルダに置く” を採用するなら、prodは：

```yaml
services:
  app1:
    volumes:
      - ./credentials/prod:/run/credentials:ro
  batch:
    volumes:
      - ./credentials/prod:/run/credentials:ro
```

---

## 28.6 ファイル権限（必須）
秘密鍵・証明書は権限を厳しく。

- 秘密鍵：`chmod 600`
- ディレクトリ：`chmod 700`

例：

```bash
chmod 700 credentials/dev/ssh
chmod 600 credentials/dev/ssh/id_rsa
chmod 600 credentials/dev/gcp/service-account.json
```

---

## 28.7 アプリ側の実装ルール（必須：ファイルパス参照のみ）

### 28.7.1 Python（GCP Service Account JSON）
- アプリは `.env` から `GCP_SA_JSON_PATH` を読み取って利用
- Google SDK は `GOOGLE_APPLICATION_CREDENTIALS` を使うのが一般的

推奨：
- `.env` に `GOOGLE_APPLICATION_CREDENTIALS=/run/credentials/gcp/service-account.json` を入れる
- アプリは Google SDK に任せる（自前でJSON読まない）

### 28.7.2 AWS
- 可能なら **OIDC / IAM Role / Workload Identity**（クラウド推奨）
- それが無理なら `AWS_SHARED_CREDENTIALS_FILE` 方式でファイル注入
- `.env` にはパスだけ

---

## 28.8 devcontainer での扱い（必須：安全に見える化）

### 28.8.1 devcontainer内で credentials を使う場合
- ワークスペース（`/workspaces/repo-root`）に `credentials/dev` が存在しても、Gitに入らないのでOK
- ただし「誤コミット」防止のため、READMEで運用を明記

### 28.8.2 devcontainerから compose 起動
- スレッド方針どおり、repo-root で compose を叩く
- credentials の注入は compose がやる（devcontainerは “見るだけ”）

---

## 28.9 CI/CD での扱い（必須：credentials フォルダをそのまま使わない）

> CI上で `credentials/` をリポジトリに置く運用は基本NG（機密配布の問題）。  
> CIは “Secrets” から生成して配置する。

### 28.9.1 GCP JSON を GitHub Actions Secrets に入れる例（概念）
1) `GCP_SA_JSON` を GitHub Secrets に登録（文字列）
2) CI でファイルとして書き出す
3) `.env` のパスに合わせて配置

例：

```yaml
- name: Write GCP credentials
  run: |
    mkdir -p /tmp/credentials/gcp
    echo '${{ secrets.GCP_SA_JSON }}' > /tmp/credentials/gcp/service-account.json
    chmod 600 /tmp/credentials/gcp/service-account.json

- name: Run tests
  run: |
    export PYTHONPATH="$PWD/apps/python"
    export GOOGLE_APPLICATION_CREDENTIALS="/tmp/credentials/gcp/service-account.json"
    pytest -v
```

> 本番は CI から直接配布するのではなく、クラウドのSecret Managerへ登録して、実行環境でマウントするのが王道。

---

## 28.10 クラウドでの推奨（最終形：ファイル運用を脱却する道筋）

> ユーザー要望は「credentialsフォルダ運用」だが、  
> 本番の最終形として推奨される “安全策” を漏れなく列挙。

### 28.10.1 GCP
- **Secret Manager** にJSONを登録
- 実行環境（Cloud Run/GKE等）でマウント or 環境変数注入
- Workload Identity を採用できるなら、JSON自体が不要になる

### 28.10.2 AWS
- **IAM Role / OIDC** を採用できるなら、アクセスキー配布が不要
- Parameter Store / Secrets Manager で管理し、実行環境で取得

> ただしローカル開発は `credentials/dev` を使うのが現実的（このスレッド方針）。

---

## 28.11 Wiki貼り付け用 “認証情報運用宣言”（短文化）

```text
【外部連携認証情報（JSON/RSA/PEM等）運用】
1) 認証ファイルは .env に直接書かず、credentials/ 配下に配置する（dev/stg/prod で分離）。
2) Gitに絶対コミットしない（.gitignoreで credentials/** を完全除外し、READMEだけ例外）。
3) .env にはファイル本体ではなく “パス” のみを定義し、アプリはそのパスを読むだけにする。
4) docker-compose では credentials/<env> を /run/credentials に read-only マウントして注入する。
5) 秘密鍵・JSONは権限を厳格化する（600/700）。
6) CI/CD は credentials/ を持たず、Secrets からファイル生成して同じパス設計でテスト/実行する。
7) 本番は可能なら Secret Manager / OIDC / Workload Identity へ移行し、ファイル配布自体を廃止する。
```

---
## 29. credentials 運用を “モノレポ複数アプリ” で破綻させない追加仕様（省略なし）

> 28章で定義した「credentialsフォルダ運用」を、  
> **複数アプリ・複数環境・devcontainer・CI/CD・クラウド**すべてで矛盾なく成立させるための追加仕様。

---

## 29.1 置く場所の最終決定（アプリ別 or ルート共通）

### 29.1.1 推奨（スレッド整合）：ルート共通 `credentials/<env>/...`
- どのアプリでも同じパス規約を使える
- compose の volume 設定がシンプル
- “混在画面” でも説明が一箇所で済む

採用：
- `repo-root/credentials/dev/...`
- `repo-root/credentials/stg/...`
- `repo-root/credentials/prod/...`

### 29.1.2 例外（必要な場合のみ）：アプリ固有認証をアプリ配下に置く
- 例：app1だけが使う非常に特殊な鍵（他アプリは不要）
- ただし運用が散らかるため、原則は禁止
- 例外適用時は `credentials/<env>/<app>/...` に寄せる（アプリ配下へは置かない）

---

## 29.2 “共通認証” と “アプリ固有認証” の区別（必須）

### 29.2.1 共通認証（common）
- 複数アプリが同じ認証情報を使う
- 例：同一GCPプロジェクトのサービスアカウント、共通S3バケットアクセス等

配置例：
- `credentials/dev/gcp/service-account.json`
- `credentials/dev/aws/credentials`

### 29.2.2 アプリ固有認証（app-specific）
- app1だけ別プロジェクト/別アカウント等で必要
- 配置は “環境→アプリ→種別” の順で統一する

配置例：
- `credentials/dev/app1/gcp/service-account.json`
- `credentials/dev/batch/aws/credentials`

---

## 29.3 `.env` のパス設計（最重要：パスは “固定” を目指す）

> 原則：**環境が変わってもアプリが参照するパスは同じ**。  
> 違うのは “注入される中身” のみ。

### 29.3.1 推奨：コンテナ内パスを固定
- `GCP_SA_JSON_PATH=/run/credentials/gcp/service-account.json`
- `AWS_SHARED_CREDENTIALS_FILE=/run/credentials/aws/credentials`

### 29.3.2 `.env.*` に書くべきもの（ファイル以外）
- `GCP_PROJECT_ID`
- `AWS_REGION`
- `APP_ENV`

> “パス” は共通 `.env` に寄せるのが原則。

---

## 29.4 docker-compose のベストプラクティス（アプリ増加に耐える）

### 29.4.1 volume の重複をなくす（anchors を使う）
※ YAML アンカーを許容できる運用なら、必ず導入する。

例（`docker-compose.dev.yml`）：

```yaml
x-credentials-dev: &credentials-dev
  - ./credentials/dev:/run/credentials:ro

services:
  app1:
    volumes:
      - ./apps/python:/app
      <<: *credentials-dev

  batch:
    volumes:
      - ./apps/python:/app
      <<: *credentials-dev
```

> YAMLの構文制約で `<<:` の使い方はcompose実装差が出る可能性があるため、  
> 運用が不安なら “素直にコピペ” でもよいが、アプリ数増で保守が増える点は理解しておく。

### 29.4.2 代替：環境変数で credentials の物理パスを切り替える
- `CREDENTIALS_DIR=./credentials/dev` を `.env.dev` に置き、
- compose は `${CREDENTIALS_DIR}` を参照する

例（`docker-compose.dev.yml`）：

```yaml
services:
  app1:
    volumes:
      - ${CREDENTIALS_DIR}:/run/credentials:ro
```

`.env.dev`：
```text
CREDENTIALS_DIR=./credentials/dev
```

---

## 29.5 “起動手順がブレない” ための scripts/（必須）

### 29.5.1 環境ごとに起動スクリプトを固定
- devcontainer内でもホストでも同じスクリプトを叩く

例：

```text
scripts/
├── up-dev.sh
├── up-stg.sh
└── up-prod.sh
```

`up-dev.sh`（credentialsも含めて同じcomposeを叩くだけ）：

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile local up -d
```

---

## 29.6 認証ファイルの “サンプル” と “生成ルール”（必須）

> Gitに本物を置かない以上、READMEだけでは再現性が落ちる。  
> なので、**サンプル or 生成スクリプト**を必ず用意する。

### 29.6.1 サンプルファイルを置く（内容はダミー）
- `credentials/dev/gcp/service-account.json.sample`
- `credentials/dev/aws/credentials.sample`

ただし **sample を credentials/ 配下に置くなら .gitignore の例外が必要**。

例（`.gitignore` 例外）：

```text
credentials/**
!credentials/README.md
!credentials/**/*.sample
!credentials/**/.keep
```

### 29.6.2 生成スクリプト（テンプレートからコピー）
例：
- `scripts/init-credentials-dev.sh`
  - sample → 実ファイルへコピー
  - chmod を設定
  - 作成場所を案内

---

## 29.7 セキュリティ運用（必須：事故を仕組みで潰す）

### 29.7.1 pre-commit / CI で漏洩検知を必須化
- push前に弾く（最優先）
- 例：gitleaks / trufflehog / secretlint 等

運用ルール（宣言）：
- 「秘密情報検知が落ちたPRは例外なく修正しないとマージ不可」

### 29.7.2 監査ログのための “配置規約”
- 認証情報は `credentials/<env>/...` にしか置かない
- 例外を許さない（散在すると漏洩調査が困難）

---

## 29.8 本番（prod）で “credentialsフォルダ” を使う場合の追加条件（必須）

> 本番でホスト配置する場合は、単にフォルダを置くだけでは危険。  
> 最低限の条件を満たす必要がある。

必須条件：
1) 配布経路が明確（誰がどこから持ってくるか）
2) 権限が限定（サーバユーザのみ読める）
3) ローテーション手順がある（更新時に再起動が必要か等）
4) 監査できる（更新履歴/責任者が追える）

---

## 29.9 クラウド移行の最終形（“ファイル運用” を捨てる道）

> スレッドの要望は “credentialsフォルダ運用” だが、  
> 本番の最終形としての移行方針を確定させる。

- GCP：Workload Identity（可能なら）→ JSON不要  
  できない場合：Secret Manager → マウント/注入
- AWS：IAM Role / OIDC → キー不要  
  できない場合：Secrets Manager / Parameter Store

移行宣言：
- 「devは credentials/dev を許可。本番は原則 Secret Manager / Role へ寄せる」

---

## 29.10 Wiki貼り付け用 “credentials拡張仕様” （短文化）

```text
【credentials運用 拡張仕様】
1) credentialsは repo-root/credentials/<env>/... に集約し、環境単位で分離する。
2) アプリ固有が必要なら credentials/<env>/<app>/... に置き、アプリ配下へは置かない。
3) .env はパスのみを定義し、コンテナ内パスは /run/credentials/... に固定する。
4) compose で credentials を read-only マウントし、イメージには焼き込まない。
5) sample/生成スクリプトを用意し、再現性を担保する（本物はGitに置かない）。
6) secret漏洩検知（gitleaks等）を必須化し、検知時はマージ不可とする。
7) 本番は最終的に Secret Manager / Role / OIDC / Workload Identity へ移行し、ファイル配布を廃止する。
```

---
## 30. クラウド / オンプレ / ローカルのデプロイ運用を両立するリポジトリ構成（モノレポ前提）

> 目的：  
> - **同一リポジトリ**で複数アプリ（Python/PHP/iOS等）を管理しつつ、  
> - **ローカル（開発）** / **オンプレ（自社サーバ）** / **クラウド（GCP/AWS）** のデプロイ方式を混在させても、  
> - 起動手順・差分管理・秘密情報取り扱いが破綻しない「単一情報源」を作る。

---

### 30.1 大原則（必須ルール）
1) **アプリのソースは `apps/` に集約**（既定）
2) **デプロイ用ファイルは `deploy/`（または `infra/`）に集約**し、アプリ配下に散らさない  
3) **ローカル/オンプレは docker compose を正**（既定：base + env差分 + profiles）  
4) **クラウドは IaC / マニフェスト（Terraform/Helm/Kustomize）を正**  
5) **アプリセットの単一情報源を各方式で持つ**
   - compose：`profiles`（例：cloud/local/batch）
   - k8s：`kustomize overlays` または `helm values`  
6) **認証情報はローカルは `credentials/`、クラウドは Secret Manager/Role/OIDC を最終形**（既定方針）

---

## 30.2 推奨ディレクトリ構成（最小〜標準）

> 既存の構成（apps/・docker-compose.*・credentials/・devcontainer）を崩さずに拡張する。

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
│       └── Dockerfile
│
├── apps/
│   ├── python/...
│   ├── php/...
│   └── ios/...
│
├── credentials/
│   ├── dev/...
│   ├── stg/...
│   └── prod/...
│
├── deploy/                              # ★ デプロイ運用をここに集約
│   ├── local/                           # ローカル（開発）運用
│   │   ├── README.md
│   │   └── compose/                     # ルートcomposeを呼ぶだけ（分岐点の明文化）
│   │       ├── up.sh
│   │       ├── down.sh
│   │       └── logs.sh
│   │
│   ├── onprem/                          # オンプレ（自社サーバ）運用
│   │   ├── README.md
│   │   ├── compose/                     # compose方式での本番/常駐運用
│   │   │   ├── install.sh               # 初期導入（ユーザ作成/dir準備など）
│   │   │   ├── deploy.sh                # pull/build/up
│   │   │   ├── rollback.sh              # 前タグへ戻す
│   │   │   └── systemd/
│   │   │       ├── app-stack.service    # docker compose をsystemdで常駐化（必要なら）
│   │   │       └── README.md
│   │   └── ansible/                     # 可能なら IaC 化（任意）
│   │       ├── inventory/
│   │       ├── playbooks/
│   │       └── roles/
│   │
│   └── cloud/                           # クラウド運用（GCP/AWS）
│       ├── README.md
│       ├── terraform/                   # ★ IaC（ネットワーク/DB/権限/レジストリ等）
│       │   ├── modules/
│       │   ├── envs/
│       │   │   ├── dev/
│       │   │   ├── stg/
│       │   │   └── prod/
│       │   └── README.md
│       │
│       ├── k8s/                         # ★ デプロイ対象（マニフェスト）
│       │   ├── base/                    # 共通（Deployment/Service等）
│       │   ├── overlays/                # 環境差分（kustomize運用の場合）
│       │   │   ├── dev/
│       │   │   ├── stg/
│       │   │   └── prod/
│       │   └── README.md
│       │
│       └── helm/                        # 代替：helm運用の場合（任意）
│           ├── charts/
│           │   └── app-suite/           # アプリセット（複数サービス）を1チャートで表現可
│           └── values/
│               ├── dev.yaml
│               ├── stg.yaml
│               └── prod.yaml
│
├── scripts/                              # “どこから叩くか” を統一するための共通スクリプト
│   ├── test-python.sh
│   ├── up-dev.sh
│   ├── up-prod.sh
│   ├── deploy-onprem.sh
│   └── deploy-cloud.sh
│
├── Makefile                              # 任意：起動/テスト/デプロイをコマンド固定
└── .devcontainer/
    ├── Dockerfile
    └── devcontainer.json
```

---

## 30.3 “アプリセット” を各デプロイ方式でどう表現するか（必須）

### 30.3.1 ローカル/オンプレ（docker compose）側の単一情報源
- **profiles が単一情報源**
  - `local`：開発で全部入り
  - `cloud`：クラウドリリース対象
  - `batch`：バッチだけ

運用宣言（必須）：
- 「クラウド/オンプレでデプロイする対象は `profiles` と一致していること」
- 「新しいサービスを追加したら、profile設計も同時に更新すること」

### 30.3.2 クラウド（k8s/helm）側の単一情報源
- kustomizeなら：
  - `deploy/cloud/k8s/base` に全サービス定義
  - `deploy/cloud/k8s/overlays/{dev,stg,prod}` で “アプリセット + 環境差分” を決める
- helmなら：
  - `deploy/cloud/helm/values/{dev,stg,prod}.yaml` が単一情報源

運用宣言（必須）：
- 「k8sのoverlays/valuesが “その環境で動くアプリセット” の単一情報源」
- 「compose profiles と意味を合わせる（最低限：cloud profile相当のサービスが一致）」

---

## 30.4 秘密情報（credentials）の運用：ローカル/オンプレ/クラウドの責務分離（必須）

### 30.4.1 ローカル（開発）
- `credentials/dev` を compose で `/run/credentials:ro` にマウント（既定）

### 30.4.2 オンプレ（自社サーバ）
- 方針A（暫定）：`credentials/prod` をサーバに配布して read-only マウント  
- 方針B（推奨）：Vault等のシークレット管理へ移行（段階導入）

### 30.4.3 クラウド（推奨：ファイル配布を廃止）
- GCP：Workload Identity / Secret Manager
- AWS：IAM Role / OIDC / Secrets Manager
- アプリ側は `.env` に書いた “パス or 環境変数名” を読むだけ（実体注入は基盤責務）

---

## 30.5 “デプロイ手順がブレない” ための README 配置（必須）
- `deploy/local/README.md`：開発起動手順（compose profiles と env）
- `deploy/onprem/README.md`：オンプレ導入・更新・ロールバック・監視/ログ
- `deploy/cloud/README.md`：Terraform適用 → k8s/helmデプロイ → ロールバック

必須記載項目（テンプレ）：
- 対象環境（dev/stg/prod）
- アプリセット（どのサービスが動くか）
- 必要な認証（どこから注入されるか）
- デプロイコマンド（scripts/Makefile 参照）
- ロールバック手順（必ず）

---

## 30.6 Wiki貼り付け用 “デプロイ運用 構成宣言”（短文化）

```text
【デプロイ運用（cloud/onprem/local）構成】
1) アプリは apps/、デプロイ資材は deploy/ に集約し、散在を禁止する。
2) local/onprem は docker compose（base + env差分 + profiles）を正とする。
3) cloud は terraform（基盤）+ k8s/helm（アプリ）を正とし、環境差分は overlays/values で管理する。
4) アプリセットの単一情報源は、composeはprofiles、k8sはoverlays、helmはvaluesとする。
5) 認証情報はローカル/オンプレは credentials/、クラウドは Secret Manager/Role/OIDC を最終形とする。
6) 起動/デプロイ/ロールバックは scripts/ または Makefile に集約し、手順の属人化を禁止する。
```

---
## 31. クラウド/オンプレ/ローカル デプロイ運用の“実体ファイル”テンプレート一式（省略なし）

> 30章の「構成方針」を実際に回せるように、  
> `deploy/` 配下に置く具体ファイルのテンプレートを漏れなく提示する。

---

## 31.1 deploy/local（ローカル運用）テンプレート

### 31.1.1 `deploy/local/README.md`
```markdown
# deploy/local（ローカル開発運用）

## 目的
- 開発者が同一手順で起動/停止/ログ確認できる状態を提供する。
- 起動対象（アプリセット）は docker compose profiles により切り替える。

## 前提
- リポジトリルートに docker-compose.*.yml が存在する
- credentials/dev が存在する（Git管理しない）

## 起動（local profile）
```bash
cd repo-root
./deploy/local/compose/up.sh
```

### 31.1.2 `deploy/local/compose/up.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.dev.yml \
  --profile local \
  up -d
```

### 31.1.3 `deploy/local/compose/down.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

docker compose -f docker-compose.base.yml down
```

### 31.1.4 `deploy/local/compose/logs.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

docker compose -f docker-compose.base.yml logs -f --tail=200
```

---

## 31.2 deploy/onprem（オンプレ運用）テンプレート

> オンプレは “サーバ常駐” が目的になるため、  
> - **更新（deploy）**  
> - **ロールバック**  
> - **systemd管理**（任意）  
> を必ず定義する。

### 31.2.1 `deploy/onprem/README.md`

```markdown
# deploy/onprem（オンプレ運用）

## 目的
- 自社サーバで docker compose によりアプリセットを常駐運用する。
- 更新/ロールバックを再現可能にし、手順を属人化しない。

## 前提
- サーバにリポジトリを配置（またはCIが配布）
- credentials/prod をサーバ側に安全に配置（Git管理しない）
- docker compose が利用可能

## 初期導入
```bash
cd repo-root
./deploy/onprem/compose/install.sh
```

## デプロイ（更新）

```bash
cd repo-root
./deploy/onprem/compose/deploy.sh
```

## ロールバック（前タグへ）

```bash
cd repo-root
./deploy/onprem/compose/rollback.sh <IMAGE_TAG>
```

## 起動対象

* docker compose profiles の "cloud"（= 本番相当セット）を使用する


### 31.2.2 `deploy/onprem/compose/install.sh`
- 初回に必要なディレクトリ/権限の準備のみ（破壊的操作は禁止）

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

# 例：credentials 配置確認（存在しないなら失敗させる）
test -d credentials/prod || (echo "credentials/prod not found" && exit 1)

# 例：権限チェック（必要なら運用に合わせて）
echo "install: ok"
```

### 31.2.3 `deploy/onprem/compose/deploy.sh`
- “更新” の最小定義：pull → build（or pull image）→ up -d

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

# 例：コードをpullする運用なら
git pull --rebase

docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.prod.yml \
  --profile cloud \
  up -d

docker compose -f docker-compose.base.yml ps
```

### 31.2.4 `deploy/onprem/compose/rollback.sh`
- 前のイメージタグへ戻す方式（運用によってはcomposeのimage指定が必要）

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "usage: rollback.sh <IMAGE_TAG>"
  exit 1
fi

# 例：環境変数でタグを指定する運用（compose側で ${IMAGE_TAG} を参照）
export IMAGE_TAG="$TAG"

docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.prod.yml \
  --profile cloud \
  up -d

docker compose -f docker-compose.base.yml ps
```

---

## 31.3 deploy/onprem/systemd（任意だが常駐なら推奨）

### 31.3.1 `deploy/onprem/compose/systemd/app-stack.service`
- docker compose を systemd で管理する最小例（環境に合わせて編集）

```ini
[Unit]
Description=App Stack (docker compose)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/repo-root
ExecStart=/usr/bin/docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile cloud up -d
ExecStop=/usr/bin/docker compose -f docker-compose.base.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

---

## 31.4 deploy/cloud（クラウド運用）テンプレート

> cloud は「基盤」と「アプリ」を分ける。  
> - terraform：ネットワーク/権限/レジストリ/DB 等  
> - k8s/helm：アプリデプロイ

### 31.4.1 `deploy/cloud/README.md`

```markdown
# deploy/cloud（クラウド運用）

## 目的
- IaCで基盤を管理し、k8s/helmでアプリをデプロイする。
- 環境差分は overlays（kustomize）または values（helm）で管理する。

## 手順（Terraform → Deploy）
### 1) 基盤（terraform）
```bash
cd deploy/cloud/terraform/envs/prod
terraform init
terraform apply
```

### 2) アプリ（kustomize）

```bash
cd deploy/cloud/k8s/overlays/prod
kubectl apply -k .
```

## 秘密情報

* ローカルの credentials/ は使わない
* Secret Manager / IAM Role / OIDC / Workload Identity を利用する


---

## 31.5 cloud/k8s（kustomize）最小テンプレート

### 31.5.1 `deploy/cloud/k8s/base/kustomization.yaml`
- “共通” のリソースだけを列挙

```yaml
resources:
  - app1-deployment.yaml
  - app1-service.yaml
  - batch-cronjob.yaml
```

### 31.5.2 `deploy/cloud/k8s/overlays/prod/kustomization.yaml`
- 環境差分（replicas / image tag / env 等）をここで定義

```yaml
resources:
  - ../../base

patches:
  - target:
      kind: Deployment
      name: app1
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 2
images:
  - name: myorg/app1
    newName: myorg/app1
    newTag: sha-REPLACE_ME
```

---

## 31.6 scripts（共通コマンド統一）テンプレート

### 31.6.1 `scripts/deploy-onprem.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
./deploy/onprem/compose/deploy.sh
```

### 31.6.2 `scripts/deploy-cloud.sh`（kustomize例）

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ENV="${1:-prod}"
cd "deploy/cloud/k8s/overlays/${ENV}"
kubectl apply -k .
```

---

## 31.7 Wiki貼り付け用 “デプロイ資材の置き場所” 宣言（短文化）

```text
【デプロイ資材の配置】
1) local/onprem/cloud すべてのデプロイ資材は deploy/ に集約する（apps/ に散らさない）。
2) local/onprem は docker compose を正とし、deploy/local と deploy/onprem のスクリプトが単一手順となる。
3) cloud は terraform（基盤）+ k8s/helm（アプリ）で管理し、deploy/cloud が単一手順となる。
4) scripts/ または Makefile でコマンドを固定し、手順の属人化を禁止する。
```

---

## 32. デプロイ運用の“単一情報源（Single Source of Truth）”を壊さない追加設計（必須）

> 30〜31章で「deploy/ に集約」まで定義した。  
> ここからは、クラウド/オンプレ/ローカルで **同じリポジトリから矛盾なく運用するための“追加仕様”** を漏れなく確定する。

---

### 32.1 デプロイ対象（アプリセット）の定義場所（必須）

#### 32.1.1 docker compose（local/onprem）の単一情報源
- **docker-compose.base.yml の services + profiles が単一情報源**
- 環境差分（dev/prod）は docker-compose.{env}.yml 側で行う
- 「どの環境に何が出るか」は profile で決める

ルール（必須）：
- `profiles: ["cloud"]` が付いたサービスは **クラウド・オンプレ本番相当**に含まれる
- `profiles: ["local"]` が付いたサービスは **ローカル開発**に含まれる
- `profiles: ["batch"]` は **バッチ単体運用**に含まれる

#### 32.1.2 Kubernetes（cloud）の単一情報源
- **kustomize overlays / helm values が単一情報源**
- 「prod に app1 は出すが batch は CronJob として出す」などは overlays/values で決める

ルール（必須）：
- `deploy/cloud/k8s/overlays/prod`（または `deploy/cloud/helm/values/prod.yaml`）が **prod のアプリセット最終決定**である
- compose の `cloud` と意味が一致していること（最低限：主要サービスが一致）

---

### 32.2 イメージタグ戦略（必須：ロールバック可能にする）

#### 32.2.1 タグは必ず “不変（immutable）” を含める
- `sha-<GITHUB_SHA>` を必須とする
- `latest` は参照用に残してもよいが、デプロイは不変タグを正とする

#### 32.2.2 compose（onprem）でタグを注入する方式（必須）
- `docker-compose.prod.yml` に “image を変数化” しておく
- rollback は `IMAGE_TAG=sha-xxxxx` を差し替えるだけで成立させる

例（`docker-compose.prod.yml` の “image固定” 方式）：

```yaml
services:
  app1:
    image: myorg/app1:${IMAGE_TAG:-latest}
  batch:
    image: myorg/batch:${IMAGE_TAG:-latest}
```

> ルール：onprem の deploy/rollback は IMAGE_TAG を切り替えるだけで戻せること。

---

### 32.3 環境昇格（dev→stg→prod）の運用（必須）

#### 32.3.1 昇格の原則
- **同一SHAを昇格**させる（devで動いたものをprodへ）
- 「devはsha-A、prodはsha-B」になった瞬間に再現性が壊れる

#### 32.3.2 リリースノート（必須）
- デプロイ単位は “アプリセット”
- そのため “app1だけの変更” でも、アプリセットのリリースとして記録する

---

## 33. オンプレ（docker compose）本番運用：完全テンプレート（更新/ロールバック/監査）

> 31章の onprem は最小だったため、ここで “運用に必要な要素” を全て補完する。

---

### 33.1 onprem 用 `.env.onprem`（推奨：onprem専用のenvを分離）

例：`repo-root/.env.onprem`（Git管理してよいのは “非機密のみ”）

```text
APP_ENV=prod
TZ=Asia/Tokyo

# イメージタグ（不変）
IMAGE_TAG=sha-REPLACE_ME

# credentials の注入先（パスは固定）
GCP_SA_JSON_PATH=/run/credentials/gcp/service-account.json

# ログ出力
LOG_FORMAT=json
LOG_LEVEL=info
```

---

### 33.2 onprem デプロイスクリプト（“pull/build/pin/ps” を固定）

#### 33.2.1 `deploy/onprem/compose/deploy.sh`（改訂：タグ固定・監査ログ出力）

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

# 監査用ログ（いつ/誰が/何をデプロイしたか）
echo "[deploy] start: $(date -Iseconds)"
echo "[deploy] user: $(whoami)"
echo "[deploy] git: $(git rev-parse --short HEAD || true)"

# 例：コードpullする運用の場合（CI配布なら不要）
git pull --rebase

# credentials 존재確認
test -d credentials/prod || (echo "credentials/prod not found" && exit 1)

# .env.onprem がある場合は読み込む（なければ .env.prod を使う等、運用で統一）
if [ -f .env.onprem ]; then
  set -a
  source .env.onprem
  set +a
fi

docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.prod.yml \
  --profile cloud \
  up -d

docker compose -f docker-compose.base.yml ps
echo "[deploy] done: $(date -Iseconds)"
```

---

### 33.3 onprem ロールバック（タグ差し替えで戻す）

#### 33.3.1 `deploy/onprem/compose/rollback.sh`（改訂：.env.onprem へ書き込み方式）

> 方式A：運用として `.env.onprem` に IMAGE_TAG を書き込む（最も分かりやすい）

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "usage: rollback.sh <IMAGE_TAG>"
  exit 1
fi

if [ ! -f .env.onprem ]; then
  echo ".env.onprem not found"
  exit 1
fi

# IMAGE_TAG を差し替え（簡易）
grep -q '^IMAGE_TAG=' .env.onprem \
  && sed -i.bak "s/^IMAGE_TAG=.*/IMAGE_TAG=${TAG}/" .env.onprem \
  || echo "IMAGE_TAG=${TAG}" >> .env.onprem

echo "[rollback] set IMAGE_TAG=${TAG}"

# 反映
set -a
source .env.onprem
set +a

docker compose \
  -f docker-compose.base.yml \
  -f docker-compose.prod.yml \
  --profile cloud \
  up -d

docker compose -f docker-compose.base.yml ps
echo "[rollback] done"
```

---

### 33.4 onprem systemd（常駐）完全版（Start/Stop/Restart + Reload）

#### 33.4.1 `deploy/onprem/compose/systemd/app-stack.service`（改訂：restart対応）

```ini
[Unit]
Description=App Stack (docker compose)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/repo-root

ExecStart=/usr/bin/docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile cloud up -d
ExecStop=/usr/bin/docker compose -f docker-compose.base.yml down
ExecReload=/usr/bin/docker compose -f docker-compose.base.yml -f docker-compose.prod.yml --profile cloud up -d

TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

#### 33.4.2 systemd インストール手順（onprem README に必須で記載）
- `/etc/systemd/system/app-stack.service` に配置
- `systemctl daemon-reload`
- `systemctl enable --now app-stack.service`

---

## 34. クラウド（k8s/kustomize）完全テンプレート：Deployment/Service/CronJob/Secret注入

> 31章の kustomize は kustomization だけだったので、ここで “実体マニフェスト” を省略なく追加する。

---

### 34.1 app1 Deployment（例）

#### 34.1.1 `deploy/cloud/k8s/base/app1-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app1
  template:
    metadata:
      labels:
        app: app1
    spec:
      containers:
        - name: app1
          image: myorg/app1:sha-REPLACE_ME
          ports:
            - containerPort: 8080
          env:
            - name: APP_ENV
              value: "prod"
            - name: LOG_FORMAT
              value: "json"
            - name: GOOGLE_APPLICATION_CREDENTIALS
              value: "/run/credentials/gcp/service-account.json"
          volumeMounts:
            - name: credentials
              mountPath: /run/credentials
              readOnly: true
      volumes:
        - name: credentials
          secret:
            secretName: app1-credentials
```

> ルール：クラウドは `credentials/` フォルダを使わず、Secret Manager/Secret で注入する。

---

### 34.2 app1 Service（例）

#### 34.2.1 `deploy/cloud/k8s/base/app1-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1
spec:
  selector:
    app: app1
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP
```

---

### 34.3 batch CronJob（例）

#### 34.3.1 `deploy/cloud/k8s/base/batch-cronjob.yaml`

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: batch
spec:
  schedule: "0 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: batch
              image: myorg/batch:sha-REPLACE_ME
              env:
                - name: APP_ENV
                  value: "prod"
                - name: LOG_FORMAT
                  value: "json"
                - name: GOOGLE_APPLICATION_CREDENTIALS
                  value: "/run/credentials/gcp/service-account.json"
              volumeMounts:
                - name: credentials
                  mountPath: /run/credentials
                  readOnly: true
          volumes:
            - name: credentials
              secret:
                secretName: batch-credentials
```

---

### 34.4 Secret（例：GCP SA JSON をファイルとしてマウント）

#### 34.4.1 `deploy/cloud/k8s/overlays/prod/app1-credentials-secret.yaml`

> ここはクラウドごとに “作り方” が変わるため、  
> 運用としては “Secret Manager → External Secrets” 等を推奨する。  
> ただしテンプレとして “Kubernetes Secret” 例も省略なく提示する。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app1-credentials
type: Opaque
data:
  gcp-service-account.json: REPLACE_WITH_BASE64
```

> マウント時にファイル名を合わせたい場合は `items` を使う（省略なしで例を出す）。

例：Deployment の volumes を次に変更：

```yaml
volumes:
  - name: credentials
    secret:
      secretName: app1-credentials
      items:
        - key: gcp-service-account.json
          path: gcp/service-account.json
```

---

### 34.5 overlays/prod（完全例：resources + secret + image tag）

#### 34.5.1 `deploy/cloud/k8s/overlays/prod/kustomization.yaml`（改訂：secretも含める）

```yaml
resources:
  - ../../base
  - app1-credentials-secret.yaml

images:
  - name: myorg/app1
    newName: myorg/app1
    newTag: sha-REPLACE_ME
  - name: myorg/batch
    newName: myorg/batch
    newTag: sha-REPLACE_ME

patches:
  - target:
      kind: Deployment
      name: app1
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 2
```

---

## 35. クラウド基盤（Terraform）構成：envs/modules の必須ルール

> 実クラウド差分（GCP/AWS）は運用で分かれるが、  
> リポジトリ構造の基本は固定する。

---

### 35.1 Terraform 構成（必須）

- `modules/`：再利用可能な部品（VPC、IAM、Registry等）
- `envs/<env>/`：環境ごとの実体（dev/stg/prod）

例：

```text
deploy/cloud/terraform/
├── modules/
│   ├── network/
│   ├── iam/
│   ├── registry/
│   └── database/
└── envs/
    ├── dev/
    ├── stg/
    └── prod/
```

---

## 36. CI/CD からのデプロイ（cloud/onprem）ワークフロー標準

> “デプロイ手順の属人化禁止” を実現するため、  
> GitHub Actions の “最小構成” を漏れなく提示する（環境差分は secrets で注入）。

---

### 36.1 Build（main）→ Push（Registry）→ Deploy（cloud）

#### 36.1.1 `.github/workflows/release-cloud.yml`（最小）

```yaml
name: release-cloud

on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Registry login は環境に合わせて実装（ghcr.io等）
      # - uses: docker/login-action@v3
      #   with:
      #     registry: ghcr.io
      #     username: ${{ github.actor }}
      #     password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build app1
        run: |
          docker build \
            -f apps/python/app1/Dockerfile \
            -t myorg/app1:sha-${{ github.sha }} \
            apps/python

      - name: Build batch
        run: |
          docker build \
            -f apps/python/batch/Dockerfile \
            -t myorg/batch:sha-${{ github.sha }} \
            apps/python

      # push は運用に応じて有効化
      # - run: docker push myorg/app1:sha-${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # kubectl/kustomize セットアップは環境に応じて追加
      # ここでは scripts を単一情報源として呼ぶ運用を採用
      - name: Deploy (prod)
        run: |
          ./scripts/deploy-cloud.sh prod
```

> ルール：CIは “deploy/ と scripts/ を叩くだけ” にし、ロジックはリポジトリ側に置く。

---

### 36.2 onprem（自己ホスト）デプロイ：CIが SSH で叩く場合の最小

> セキュリティ要件により方式は変わるが、  
> リポジトリ構成としては “deploy/onprem を叩く” を単一情報源とする。

#### 36.2.1 `.github/workflows/release-onprem.yml`（概念テンプレ）

```yaml
name: release-onprem

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # SSH鍵は secrets から注入（credentialsフォルダへコミットしない）
      # 実行は onprem サーバ側で deploy.sh を叩く
      - name: Deploy via SSH
        run: |
          echo "Implement SSH deployment according to your security policy"
          echo "Target should run: ./deploy/onprem/compose/deploy.sh"
```

> ルール：onprem へは “手順を固定したスクリプト” を必ず呼ぶ。  
> CIの中に手順を直書きしない。

---

## 37. ローカル/オンプレ/クラウドの “差分管理表”（漏れなく列挙）

| 項目 | ローカル（dev） | オンプレ（prod相当） | クラウド（prod） |
|---|---|---|---|
| アプリ起動 | docker compose（dev overlay） | docker compose（prod overlay + systemd） | k8s（kustomize/helm） |
| アプリセット | compose profiles（local） | compose profiles（cloud） | overlays/values（prod） |
| 認証情報 | credentials/dev マウント | credentials/prod マウント（暫定） or Vault | Secret Manager / Role / OIDC（最終形） |
| イメージ | build ローカル or CI | 可能なら registry から pull（推奨） | registry から pull（必須） |
| タグ | 任意 | 不変タグ（sha）必須 | 不変タグ（sha）必須 |
| ロールバック | docker compose down/up | IMAGE_TAG 差替 | 直前タグへ overlay/values 更新 |
| 監査 | 任意 | deploy.sh でログ | CIログ + GitOpsログ（推奨） |

---

## 38. Wiki貼り付け用 “デプロイ運用 最終宣言”（省略なし・短文化）

```text
【デプロイ運用（cloud/onprem/local）最終宣言】
1) apps/ はアプリ実装、deploy/ はデプロイ資材、scripts/ は実行入口。散在禁止。
2) local/onprem は docker compose を正とし、base + env差分 + profiles で起動対象を決める。
3) cloud は terraform（基盤）+ k8s/helm（アプリ）を正とし、overlays/values が環境の単一情報源。
4) アプリセットは compose は profiles、k8s は overlays、helm は values が単一情報源。意味を一致させる。
5) 認証情報は .env に埋めず、ローカル/オンプレは credentials/ を read-only マウント、クラウドは Secret/Role/OIDC を最終形とする。
6) イメージタグは不変（sha-<commit>）を必須とし、デプロイとロールバックはタグ差替で成立させる。
7) CI/CD は scripts/ を呼ぶだけにし、手順ロジックはリポジトリに置く（属人化禁止）。
8) dev→stg→prod は同一SHAを昇格し、再現性と監査性を崩さない。
```

---

## 重要（先に結論）
あなたの実リポジトリに「今この瞬間に存在する全ファイル」を、こちらは参照できないため **“文字通りの完全列挙（漏れゼロ）”** は不可能です。  
その代わり、このスレッドで確定した要件（モノレポ / 複数アプリ / compose分割 / devcontainer / common / dependabot / CI/CD / credentials / cloud+onprem+local）を **運用上の漏れが起きないように、網羅的に入る“推奨リポジトリ構成（完全テンプレ）”** を **省略せず** 出します。  
※ `...` は「その配下に実ファイルが増える」ことを示すプレースホルダで、構成としての箱は全て列挙しています。

---

## 99. リポジトリ構成：完全テンプレ（モノレポ複数アプリ / cloud+onprem+local / credentials対応）

```text
repo-root/
├── LICENSE
├── README.md
├── CHANGELOG.md                          # 任意：リリースノート（同一SHA昇格運用と相性良い）
├── SECURITY.md                           # 推奨：脆弱性報告窓口
├── CODE_OF_CONDUCT.md                    # 任意
├── CONTRIBUTING.md                       # 任意：開発規約
├── GOVERNANCE.md                         # 任意：運用責任など（OSS/社内でも有効）

├── .gitignore
├── .gitattributes                        # 推奨：改行/バイナリ扱いなど
├── .editorconfig                         # 推奨：フォーマット統一
├── .dockerignore                         # 必須：build肥大化・キャッシュ崩壊防止
├── .env                                  # 共通（非機密＋パス中心）
├── .env.dev
├── .env.stg
├── .env.prod
├── .env.onprem                           # 推奨：オンプレ専用（非機密のみ／タグ固定等）
├── .env.example                          # 推奨：配布用テンプレ
├── .envrc                                # 任意：direnv運用するなら

├── Makefile                              # 推奨：up/test/deploy を固定（属人化防止）

├── docker-compose.base.yml               # 必須：全サービス土台（profilesの単一情報源）
├── docker-compose.dev.yml                # 必須：開発差分
├── docker-compose.stg.yml                # 任意：ステージング差分
├── docker-compose.prod.yml               # 必須：本番差分（imageタグ/credentials注入など）

├── docker/                               # 推奨：Docker資材を集約
│   ├── base/
│   │   ├── Dockerfile                    # 共通ベース（1つ）
│   │   └── README.md
│   ├── python/                           # 任意：言語別共通（必要なら）
│   │   └── Dockerfile
│   ├── php/
│   │   └── Dockerfile
│   └── ops/                              # 任意：監視/運用コンテナなど
│       └── Dockerfile

├── .devcontainer/                        # devcontainerは“アプリの一種”として扱う（開発環境）
│   ├── devcontainer.json
│   ├── Dockerfile
│   ├── README.md
│   └── scripts/                          # 任意：devcontainer起動時補助
│       ├── postCreate.sh
│       └── postStart.sh

├── .github/                              # GitHub運用の単一集約点
│   ├── dependabot.yml                    # 必須：モノレポ混在対応（directory×ecosystem）
│   ├── CODEOWNERS                        # 推奨：領域ごとレビュー責務
│   ├── PULL_REQUEST_TEMPLATE.md          # 推奨：品質ゲート/リリース影響の記載
│   ├── ISSUE_TEMPLATE/                   # 推奨：運用テンプレ
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── config.yml
│   ├── workflows/                        # 必須：CI/CD
│   │   ├── python-ci.yml                 # 必須：pytest -m "not integration"
│   │   ├── python-integration.yml        # 任意：夜間/手動
│   │   ├── php-ci.yml                    # 任意：PHPがある場合
│   │   ├── ios-ci.yml                    # 任意：iOSがある場合（macos runner）
│   │   ├── docker-build.yml              # 任意：イメージビルド/push
│   │   ├── release-cloud.yml             # 任意：cloud deploy（scripts呼び出し）
│   │   └── release-onprem.yml            # 任意：onprem deploy（方針に従う）
│   ├── copilot-instructions.md           # 任意：Copilot運用（このスレッド由来）
│   └── copilot/                          # 任意：仕様の単一情報源
│       ├── README.md
│       ├── coding-rules.md
│       ├── architecture.md
│       ├── decisions.md
│       └── tasks.md

├── scripts/                              # 必須：手順固定（CIもローカルも同じ入口を叩く）
│   ├── up-dev.sh
│   ├── up-stg.sh
│   ├── up-prod.sh
│   ├── down.sh
│   ├── logs.sh
│   ├── test-python.sh
│   ├── lint-python.sh                    # 任意：ruff/mypy等
│   ├── fmt-python.sh                     # 任意：format
│   ├── deploy-onprem.sh
│   ├── deploy-cloud.sh
│   ├── init-credentials-dev.sh           # 推奨：sample→実ファイル生成＋chmod
│   └── doctor.sh                         # 任意：依存/権限/環境診断

├── credentials/                          # 必須：.envに入らないjson/rsa/pe*運用（Gitに入れない）
│   ├── README.md                         # 必須：取得/配置/権限/変数対応
│   ├── dev/
│   │   ├── gcp/
│   │   │   ├── service-account.json      # 実体（Git禁止）
│   │   │   ├── service-account.json.sample
│   │   │   └── oauth-client.json.sample
│   │   ├── aws/
│   │   │   ├── credentials.sample
│   │   │   └── config.sample
│   │   ├── ssh/
│   │   │   ├── id_rsa.sample
│   │   │   └── id_rsa.pub.sample
│   │   └── tls/
│   │       ├── client.key.sample
│   │       ├── client.crt.sample
│   │       └── ca.crt.sample
│   ├── stg/
│   │   └── ...                           # 同構造
│   └── prod/
│       └── ...                           # 同構造（オンプレ暫定ならここを配布）

├── schema/                               # 推奨：言語跨ぎ共通（OpenAPI/Proto/JSON Schema）
│   ├── README.md
│   ├── openapi.yaml
│   ├── events.proto
│   └── jsonschema/
│       └── ...

├── docs/                                 # 推奨：Wiki/設計/運用手順の一次置き場
│   ├── README.md
│   ├── architecture/
│   │   ├── overview.md
│   │   └── diagrams/
│   ├── operations/
│   │   ├── runbook.md
│   │   ├── incident.md
│   │   └── faq.md
│   ├── security/
│   │   ├── secrets-policy.md
│   │   └── threat-model.md
│   └── adr/                              # 推奨：意思決定ログ
│       ├── 0001-*.md
│       └── ...

├── deploy/                               # 必須：デプロイ資材を集約（apps配下に散らさない）
│   ├── local/
│   │   ├── README.md
│   │   └── compose/
│   │       ├── up.sh
│   │       ├── down.sh
│   │       └── logs.sh
│   ├── onprem/
│   │   ├── README.md
│   │   ├── compose/
│   │   │   ├── install.sh
│   │   │   ├── deploy.sh
│   │   │   ├── rollback.sh
│   │   │   └── systemd/
│   │   │       ├── app-stack.service
│   │   │       └── README.md
│   │   └── ansible/                      # 任意：IaC化（推奨）
│   │       ├── inventory/
│   │       ├── playbooks/
│   │       └── roles/
│   └── cloud/
│       ├── README.md
│       ├── terraform/
│       │   ├── README.md
│       │   ├── modules/
│       │   │   ├── network/
│       │   │   ├── iam/
│       │   │   ├── registry/
│       │   │   └── database/
│       │   └── envs/
│       │       ├── dev/
│       │       ├── stg/
│       │       └── prod/
│       ├── k8s/
│       │   ├── README.md
│       │   ├── base/
│       │   │   ├── kustomization.yaml
│       │   │   ├── app1-deployment.yaml
│       │   │   ├── app1-service.yaml
│       │   │   ├── batch-cronjob.yaml
│       │   │   └── ...
│       │   └── overlays/
│       │       ├── dev/
│       │       │   ├── kustomization.yaml
│       │       │   └── ...
│       │       ├── stg/
│       │       │   ├── kustomization.yaml
│       │       │   └── ...
│       │       └── prod/
│       │           ├── kustomization.yaml
│       │           ├── app1-credentials-secret.yaml   # 例：k8s secret（推奨はExternalSecrets）
│       │           └── ...
│       └── helm/                        # 任意：helm運用するなら（k8sかhelmどちらかに寄せる）
│           ├── charts/
│           │   └── app-suite/
│           └── values/
│               ├── dev.yaml
│               ├── stg.yaml
│               └── prod.yaml

├── ops/                                  # 任意：監視/運用（Prometheus/Grafana等）
│   ├── README.md
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── rules/
│   ├── grafana/
│   │   ├── dashboards/
│   │   └── provisioning/
│   └── loki/
│       └── ...

├── apps/                                 # 必須：アプリ本体（言語ごとに世界を分ける）
│   ├── common/                           # 任意：言語非依存の共通（スクリプト/テンプレ等）
│   │   ├── README.md
│   │   └── ...
│   ├── python/                           # 必須：Python世界（common含む）
│   │   ├── README.md
│   │   ├── common/                       # 必須：Python共通（PYTHONPATH=apps/python 前提）
│   │   │   ├── __init__.py
│   │   │   ├── mylib/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── util.py
│   │   │   │   └── ...
│   │   │   └── tests/
│   │   │       └── ...
│   │   ├── app1/
│   │   │   ├── README.md
│   │   │   ├── Dockerfile                # 薄い（FROM base + COPY + ENTRYPOINT）
│   │   │   ├── entrypoint.sh
│   │   │   ├── pyproject.toml            # 方式A：Poetry/PDM/uv 等
│   │   │   ├── poetry.lock               # 方式A
│   │   │   ├── requirements.txt          # 方式B：requirements運用の場合
│   │   │   ├── src/                      # 任意：srcレイアウトなら
│   │   │   ├── app1/                     # python -m app1.main を想定
│   │   │   │   ├── __init__.py
│   │   │   │   ├── main_app1.py
│   │   │   │   └── ...
│   │   │   └── tests/
│   │   │       └── ...
│   │   └── batch/
│   │       ├── README.md
│   │       ├── Dockerfile
│   │       ├── entrypoint.sh
│   │       ├── pyproject.toml
│   │       ├── poetry.lock
│   │       ├── batch/
│   │       │   ├── __init__.py
│   │       │   ├── main_batch.py
│   │       │   └── ...
│   │       └── tests/
│   │           └── ...
│   ├── php/                              # 任意：PHP世界
│   │   ├── README.md
│   │   └── api/
│   │       ├── README.md
│   │       ├── Dockerfile
│   │       ├── composer.json
│   │       ├── composer.lock
│   │       ├── artisan                    # Laravelの場合
│   │       ├── app/
│   │       ├── config/
│   │       ├── routes/
│   │       ├── database/
│   │       └── tests/
│   ├── web/                              # 任意：Node/フロント世界
│   │   ├── README.md
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── package-lock.json / pnpm-lock.yaml / yarn.lock
│   │   ├── tsconfig.json                 # TSなら
│   │   ├── src/
│   │   └── tests/
│   └── ios/                              # 任意：iOS世界（Docker外）
│       ├── README.md
│       └── MyAwesomeApp/
│           ├── MyAwesomeApp.xcodeproj / .xcworkspace
│           ├── Sources/
│           ├── Tests/
│           └── ...

├── pytest.ini                            # 推奨：探索固定（root pytest一括）
├── pyproject.toml                        # 任意：ルートでツール設定統合（ruff/mypy等）
├── ruff.toml                             # 任意：ruff単体運用なら
├── mypy.ini                              # 任意
├── .pre-commit-config.yaml               # 推奨：secret検知/format/lintをローカルで強制
├── secretlint.config.json                # 任意：secretlint採用するなら
├── gitleaks.toml                         # 任意：gitleaks採用するなら

└── .vscode/                              # 任意：開発者支援（固定したいなら）
    ├── settings.json
    ├── extensions.json
    └── launch.json
```

---

## 追加（必須の“禁止事項”を構成で担保するための補助一覧）

### A) Gitに入れて良い/悪い（構成として固定）
- **Git禁止（絶対）**：`credentials/**` の実体、秘密鍵、JSON実鍵、pem、トークン類
- **Git許可（例外）**：`credentials/README.md`、`*.sample`、`.keep`
- **Git許可**：`.env.example`（ダミーのみ）、`deploy/**`、`scripts/**`、`.github/**`

### B) 単一情報源（どこを見れば正しいか）
- 起動対象（local/onprem）：`docker-compose.base.yml` の `profiles`
- cloud の起動対象：`deploy/cloud/k8s/overlays/*` or `deploy/cloud/helm/values/*`
- 依存更新：`.github/dependabot.yml`
- CI/CD：`.github/workflows/*`
- 認証ファイルの置き場：`credentials/<env>/...`（ローカル/オンプレ暫定）
- 共通Python import：`apps/python/common`（PYTHONPATH=apps/python）

---

## もし“実リポジトリの完全tree”が必要な場合（ここだけ例外）
このチャットに `tree` 出力（またはZIP）を貼れば、**実在ファイルを“文字通り漏れなく”** Wiki向けに整形できます。

## 100. common 参照方法とパス調整（devcontainer / それ以外のDockerコンテナ差分を吸収する“確定仕様”）

> 目的：  
> - `apps/python/common` を **全アプリ（app1/batch…）から同一手順でimport**できる  
> - devcontainer でも、composeで起動する各アプリコンテナでも、CIでも、**参照方法がブレない**  
> - 「cd 位置」「作業ディレクトリ」「コンテキストルート」「PYTHONPATH」の差で壊れない

---

## 100.1 結論（単一方針）
### 100.1.1 Python の common は “apps/python を import root に固定” する（必須）
- common は `apps/python/common` に置く
- 各アプリは `apps/python/<app>` 配下に置く
- **import root を `apps/python` に固定**
- そのために **常に PYTHONPATH を `apps/python` に向ける**

**固定値**：
- `PYTHONPATH=/workspaces/<repo>/apps/python`（devcontainer内）
- `PYTHONPATH=/app`（アプリコンテナ内で `apps/python` を `/app` にマウント/コピーしている場合）
- CIでは `PYTHONPATH=$GITHUB_WORKSPACE/apps/python`

> 重要：アプリコード内で「相対パス import」「実行ディレクトリ依存」を作らない。  
> `python -m <module>` と PYTHONPATH 固定で解決する。

---

## 100.2 ディレクトリ前提（common が壊れない箱）

```text
apps/python/
├── common/
│   ├── __init__.py
│   └── mylib/
│       ├── __init__.py
│       └── util.py
├── app1/
│   ├── app1/
│   │   ├── __init__.py
│   │   └── main_app1.py
│   └── tests/
└── batch/
    ├── batch/
    │   ├── __init__.py
    │   └── main_batch.py
    └── tests/
```

---

## 100.3 import 規約（必須：実装側ルール）
### 100.3.1 common の import は絶対パス（必須）
- OK：`from common.mylib.util import foo`
- OK：`import common.mylib.util as util`
- NG：`from ..common...`（相対importで実行ディレクトリ依存になる）
- NG：`sys.path.append(...)`（場当たり的で壊れやすい）

### 100.3.2 起動は `python -m` に統一（必須）
- OK：`python -m app1.main_app1`
- OK：`python -m batch.main_batch`
- NG：`python apps/python/app1/app1/main_app1.py`（実行パス依存が発生）

---

## 100.4 “devcontainer” と “アプリコンテナ（compose）” でパスがズレる問題の解決（必須）

> devcontainer は「全アプリが見える」ワークスペースが必要。  
> 一方、アプリコンテナは「apps/python だけを /app として持つ」設計が多い。  
> これにより PYTHONPATH がズレるため、**“コンテナ内の import root を固定する”** 必要がある。

---

## 100.5 方式A（推奨）：コンテナ内の `apps/python` を常に `/app` に揃える

### 100.5.1 compose（アプリコンテナ）側
- `./apps/python` をコンテナの `/app` にマウント（またはCOPY）
- したがって common は `/app/common` に存在する

例（`docker-compose.dev.yml` 抜粋）：

```yaml
services:
  app1:
    volumes:
      - ./apps/python:/app
    environment:
      - PYTHONPATH=/app
  batch:
    volumes:
      - ./apps/python:/app
    environment:
      - PYTHONPATH=/app
```

### 100.5.2 Dockerfile（アプリ側）での前提
- ルートに `COPY` する場合も `/app` に揃える
- `WORKDIR` は `/app` か `/app/<app>` どちらでも良いが、importは PYTHONPATH で解決する

---

## 100.6 方式B（devcontainer 側）：ワークスペースは /workspaces なので PYTHONPATH を合わせる

### 100.6.1 devcontainer の “起動後に必ず” PYTHONPATH を通す（必須）
- devcontainer は `repo-root` が `/workspaces/<repo>` になるのが一般的
- そこで **PYTHONPATH=/workspaces/<repo>/apps/python** を必ず設定する

#### A) devcontainer.json で環境変数を固定（推奨）
（例：`.devcontainer/devcontainer.json` 抜粋）

```json
{
  "name": "monorepo-dev",
  "workspaceFolder": "/workspaces/repo-root",
  "containerEnv": {
    "PYTHONPATH": "/workspaces/repo-root/apps/python"
  }
}
```

#### B) シェル初期化で固定（代替）
- `postCreate.sh` で `.bashrc` に export を追記する

例（`.devcontainer/scripts/postCreate.sh`）：

```bash
#!/usr/bin/env bash
set -euo pipefail
echo 'export PYTHONPATH=/workspaces/repo-root/apps/python:${PYTHONPATH:-}' >> ~/.bashrc
echo 'export PYTHONPATH=/workspaces/repo-root/apps/python:${PYTHONPATH:-}' >> ~/.zshrc
```

---

## 100.7 “devcontainer から compose を叩く” ときの認識（確定）
### 100.7.1 devcontainer は “ホスト相当の指揮所” である（必須）
- devcontainer 内で `docker compose ...` を叩く場合、
  - 叩く場所は **repo-root**（スレッド結論）
  - 起動するコンテナの PYTHONPATH は **compose側で /app を採用**（方式A）
- よって devcontainer 側の PYTHONPATH と、アプリコンテナ側の PYTHONPATH は “別でも良い”
  - devcontainer：`/workspaces/repo-root/apps/python`
  - アプリコンテナ：`/app`

> “同じ値にしなければならない” ではなく、**各コンテナ内で common が見えること**が要件。

---

## 100.8 entrypoint.sh（shell経由起動）と PYTHONPATH（必須）
> CMD直叩きではなく shell を経由する方針なので、  
> shell 内で PYTHONPATH を保証し、`exec` で python に置き換える。

### 100.8.1 app1 の entrypoint.sh（確定テンプレ）
- `/app` が import root の前提

```bash
#!/usr/bin/env bash
set -euo pipefail

export PYTHONPATH="/app:${PYTHONPATH:-}"
exec python -m app1.main_app1 "$@"
```

### 100.8.2 batch の entrypoint.sh（確定テンプレ）
```bash
#!/usr/bin/env bash
set -euo pipefail

export PYTHONPATH="/app:${PYTHONPATH:-}"
exec python -m batch.main_batch "$@"
```

---

## 100.9 テスト実行（root pytest）と PYTHONPATH（必須：全実行環境で揃える）

### 100.9.1 ローカル/CI の基本（スレッド結論）
- repo-root から pytest
- `PYTHONPATH=$PWD/apps/python` を必ず付与

例：

```bash
cd repo-root
export PYTHONPATH="$PWD/apps/python"
pytest -v
```

### 100.9.2 devcontainer での基本
- devcontainer は containerEnv で固定済み（100.6.1）なので、通常はそのまま：

```bash
cd /workspaces/repo-root
pytest -v
```

> ただし “明示したい派” なら下でも良い（どちらでも同じ結果になるように設計する）：
> `PYTHONPATH=/workspaces/repo-root/apps/python pytest -v`

---

## 100.10 “common が見えない” 事故の典型と対策（必須チェックリスト）

### 事故A：`ModuleNotFoundError: common`
原因：
- PYTHONPATH が通っていない
対策：
- devcontainer：containerEnv / postCreate で固定
- アプリコンテナ：compose の environment or entrypoint.sh で `export PYTHONPATH=/app`

### 事故B：`python app1/main_app1.py` で動くが `pytest` で落ちる
原因：
- 実行方法が `-m` に統一されていない
対策：
- すべて `python -m ...` に統一

### 事故C：devcontainerでは動くが compose コンテナで落ちる
原因：
- devcontainer は /workspaces、compose は /app で import root が違う
対策：
- 方式A：compose 側は /app を import root に固定し、entrypointで PYTHONPATH を保証

---

## 100.11 Wiki貼り付け用 “common参照 & パス調整” 最終宣言（短文化・省略なし）

```text
【common参照とパス調整（devcontainer/compose/CI統一）】
1) Pythonの import root は apps/python に固定し、common は apps/python/common に置く。
2) common の参照は絶対import（from common...）のみを許可し、相対importとsys.path改変は禁止。
3) 起動は python -m を必須とし、実行ディレクトリ依存の起動（python file.py）は禁止。
4) devcontainer は workspace が /workspaces/<repo> になるため、PYTHONPATH=/workspaces/<repo>/apps/python を固定する。
5) compose で起動するアプリコンテナは apps/python を /app に揃え、PYTHONPATH=/app を固定する。
6) entrypoint.sh（shell経由起動）で export PYTHONPATH を保証し、exec python -m ... で起動する。
7) pytest は repo-root から実行し、CI/ローカルは PYTHONPATH=$PWD/apps/python を統一して全アプリのUnitを走らせる。
8) devcontainer とアプリコンテナで PYTHONPATH 値が異なってもよいが、「各コンテナ内で common が見える」ことを要件とする。
```

---

## 101. CD/CI（継続的デリバリ/継続的デプロイ）でのUT運用と “common + パス” を壊さないための追加仕様（省略なし）

> 目的：  
> - CI（PR）と CD（main / release）で **同じUTが同じ条件で動く**  
> - `common` の参照（PYTHONPATH）と “実行場所差分” で落ちない  
> - Dependabot PR でも “同じ品質ゲート” が適用される  
> - cloud / onprem / local のデプロイ前に “必ずUTが通る” を強制する

---

## 101.1 CD/CI の段階定義（必須）
### 101.1.1 CI（Pull Request）
- 目的：マージ前に破壊を止める
- 必須：Lint + Unit Test（全アプリ） + Secret検知 + 依存脆弱性（可能なら）

### 101.1.2 CD（main / release）
- 目的：デプロイ可能な成果物を作る
- 必須：CIと同じUnit Testを **再実行**（キャッシュ差や条件差で事故を防ぐ）
- 任意：Integration / E2E（段階的に）

### 101.1.3 Deploy（cloud / onprem）
- 目的：本番反映
- 必須：Deployジョブの前に Unit Test が “同じ条件で” PASS していること（ゲート）

---

## 101.2 “UTはどこで実行しても同じ” を成立させる単一ルール（必須）
### 101.2.1 UT 実行コマンドを scripts に一本化（必須）
- CI/CD は `pytest ...` を直書きしない
- **scripts/test-python.sh を単一情報源**にする

#### `scripts/test-python.sh`（確定テンプレ）
- 実行場所（カレント）に依存させない
- PYTHONPATH を固定する
- integration を除外する（unitのみ）

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export PYTHONPATH="$PWD/apps/python:${PYTHONPATH:-}"
pytest -v -m "not integration"
```

> ルール：CIもCDもローカルも devcontainer も **必ずこのスクリプトを叩く**。

---

## 101.3 CI（PR）でのUT：common参照とパス差分を完全排除（必須）
### 101.3.1 GitHub Actions：Python UT ワークフロー（scripts呼び出し）

`.github/workflows/python-ci.yml` の UT 部分は、必ず `scripts/test-python.sh` を呼ぶ：

```yaml
- name: Unit tests (single source)
  run: |
    chmod +x scripts/test-python.sh
    ./scripts/test-python.sh
```

> これにより PYTHONPATH が $GITHUB_WORKSPACE/apps/python に揃い、common が必ず見える。

---

## 101.4 CD（main）でのUT：デプロイ前に “同一条件で再実行” を強制（必須）
### 101.4.1 release workflow の構造（必須）
- `unit` → `build` → `deploy`
- `deploy` は `needs: [unit, build]` を必須とする
- “buildだけ成功して deploy される” を禁止

#### 例：`.github/workflows/release-cloud.yml`（骨格：unitを先に置く）
```yaml
name: release-cloud

on:
  push:
    branches: ["main"]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install test deps
        run: |
          python -m pip install --upgrade pip
          # 依存方式に合わせてここを統一（requirements/poetry/uv等）
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest
      - name: Unit tests
        run: |
          chmod +x scripts/test-python.sh
          ./scripts/test-python.sh

  build:
    needs: unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Build app1
        run: |
          docker build -f apps/python/app1/Dockerfile -t myorg/app1:sha-${{ github.sha }} apps/python
      - name: Build batch
        run: |
          docker build -f apps/python/batch/Dockerfile -t myorg/batch:sha-${{ github.sha }} apps/python

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy (prod)
        run: |
          chmod +x scripts/deploy-cloud.sh
          ./scripts/deploy-cloud.sh prod
```

> ルール：CDでもUTを再実行する（PRで通っていても必須）。

---

## 101.5 “Dockerイメージ内でUTを回す” 方式（必要時の追加仕様）
> 「本番と同じ環境でUTを回したい」場合に追加。  
> ただし時間が増えるので “必要なときだけ” 採用。

### 101.5.1 UT用のテストターゲットを作る（推奨）
- Dockerfile を multi-stage にして `test` ターゲットを持つ
- `PYTHONPATH=/app` を固定

（概念：apps/python/app1/Dockerfile の test ステージ）
```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base
WORKDIR /app
COPY . /app
ENV PYTHONPATH=/app

FROM base AS test
RUN pip install -r /app/requirements.txt && pip install pytest
CMD ["pytest", "-v", "-m", "not integration"]
```

> ルール：testステージでも `PYTHONPATH=/app` を固定し、common が必ず見える。

---

## 101.6 Dependabot PR のUT（混在画面でも漏れなく）運用（必須）
### 101.6.1 Dependabot PR でも同じ必須チェック
- ブランチ保護で `python-ci / unit` を必須化
- `scripts/test-python.sh` を唯一のUT入口にすることで差分を消す

### 101.6.2 依存更新で落ちた場合の修正原則（必須）
- common を壊す修正を “応急処置” として入れない
- 修正は以下の順で限定する：
  1) 依存の固定（上げない/ピン止め）
  2) テストコードの更新（正しい破壊なら）
  3) アプリコード修正（API変更追従）
- “CIを通すだけ” のパスいじり（sys.path等）は禁止

---

## 101.7 “環境差（devcontainer/compose/CI）でUTが割れる” 典型事故と封じ方（必須）

### 事故1：devcontainerでは通るがCIで `common` が見えない
封じ方：
- CIは必ず `scripts/test-python.sh` を叩く
- `scripts/test-python.sh` 内で `cd repo-root` と `PYTHONPATH=$PWD/apps/python` を固定

### 事故2：composeコンテナで実行したUTが壊れる
封じ方：
- composeコンテナ内は `/app` が import root（方式A）
- entrypointで `PYTHONPATH=/app` を保証
- UTもコンテナ内で回すなら `PYTHONPATH=/app` を固定したコマンドに統一

### 事故3：`python file.py` でしか動かない
封じ方：
- 起動は `python -m` を強制
- scripts/ に起動コマンドを集約し、直叩き禁止

---

## 101.8 Wiki貼り付け用 “CD/CI UT運用 最終宣言”（短文化・省略なし）

```text
【CD/CIでのUnit Test運用（common・パス差分対策込み）】
1) Unit TestはCI（PR）とCD（main/release）で同一条件で必ず実行する。デプロイ前ゲートとする。
2) UTコマンドは scripts/test-python.sh に一本化し、CI/CD/ローカル/devcontainerの全てがそれを叩く。
3) scripts/test-python.sh は repo-root に移動し、PYTHONPATH=$PWD/apps/python を固定して common を常に参照可能にする。
4) 起動方式は python -m を必須とし、実行ディレクトリ依存（python file.py）や sys.path改変は禁止。
5) Dependabot PR でも同一UTチェックを必須化し、ブランチ保護で通過しない限りマージ不可とする。
6) 本番同等環境でのUTが必要ならDockerのtestステージを導入し、PYTHONPATH=/app を固定して実行する。
7) devcontainer(/workspaces) と composeコンテナ(/app) はパスが違ってよいが、各環境で import root を固定して差分を吸収する。
```

---
