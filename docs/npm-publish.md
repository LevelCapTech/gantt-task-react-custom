# npm Trusted Publishing 運用手順

## Trusted Publishing 概要
- GitHub Actions の OIDC Token を利用して、短命な認証で npm を公開する方式です。
- 長期トークン（`NODE_AUTH_TOKEN`）を使わずに、`npm publish --provenance` で署名付き公開を行います。
- 本リポジトリはタグ駆動でのみ公開します。

## 前提条件
- npm 側で Trusted Publishing を有効化済みであること。
- npm パッケージの公開権限（public/private）が確定していること。
- GitHub Actions が有効で、タグの push を許可していること。
- ルートの `package.json` に `build` スクリプトが存在し、`npm run build` が成功すること。

## npm 側設定手順
- npm にログインし、対象パッケージの Settings を開きます。
- Settings の「Trusted Publishing」で「Add a provider」を選び、GitHub を指定します。
- Owner は `LevelCapTech`、Repository は `gantt-task-react-custom`、Workflow は `npm-publish.yml`、Environment は空欄で登録します。
- 登録後は「このリポジトリのこのワークフローからの OIDC トークンのみ publish 許可」という設定になります。
- npm の設定にトークンを保存しません（`.npmrc` にトークンは書かない）。

## GitHub 側設定手順（OIDC）
- ワークフローは `.github/workflows/npm-publish.yml` を使用します。
- `permissions` に `id-token: write` を付与し、OIDC Token を発行できるようにします。
- npm registry は `https://registry.npmjs.org` を指定します。
- GitHub Secrets に npm トークンを登録する必要はありません。

## タグ駆動リリース手順

### タグとバージョン番号の関係（必須定義）
- npm リリース対象タグは `release/vMAJOR.MINOR.PATCH` の形式のみです。
- `release/v1.2.3` の場合、`package.json` の version は `1.2.3` に上書きされます。
- 上記形式に一致しないタグは、ワークフロー内でエラーとして停止します。

### 人間が行う操作
```bash
npm version 1.2.3
git push
git tag release/v1.2.3
git push origin release/v1.2.3
```

#### 緊急時の差し戻し操作

1. GitHub Actions を止める
2. 下記コマンドを実行する

```bash
git tag -d release/v1.2.3
git push origin :refs/tags/release/v1.2.3
```

3. npm側の確認

```
npm view @levelcaptech/gantt-task-react-custom versions
```

反映されていたら、バージョンを上げて上書きするのが唯一の操作です

### 自動で発生する処理
- `package.json` の version 上書き
- `npm publish --provenance`
- GitHub Release 作成

### 禁止事項
- `package.json` の version を手動編集する
- `release/` プレフィックス無しタグでの公開を期待する
