# DevContainer での開発・npm publish 手順

## 前提
- Docker / Docker Compose v2 が利用可能であること
- VS Code と Dev Containers 拡張がインストールされていること
- npm に発行済みの `NPM_TOKEN`（公開パッケージの場合は automation トークン推奨）

## セットアップ
1. `.env.sample` をコピーして `.env` を作成し、`NPM_TOKEN` を設定する  
   ```bash
   cp .env.sample .env
   # .env を開き、NPM_TOKEN=your-npm-token-here を実際のトークンに置き換える
   ```
   `.env` は `.gitignore` で除外されています。
2. VS Code でリポジトリを開き、「Reopen in Container」を実行。
3. コンテナ起動後、自動で `.npmrc` が生成され、`package.json` がある場合は `npm install` が実行されます。
   - `NPM_TOKEN` を設定していない場合は警告が表示されますが、コンテナは利用可能です。

## npm publish（dry-run 推奨）
コンテナ内で実行します。
```bash
npm publish --dry-run
```
本番公開時は `--dry-run` を外して実行してください。

## トラブルシュート
- `.env` がない: `initialize.sh` が自動生成しますが、手動で `.env.sample` からコピーしても構いません。
- `NPM_TOKEN` 未設定で publish する場合: コンテナ内で `npm login` を実行してから `npm publish` してください。
- Windows で bash が使えない場合（WSL2 未使用など）:
  - 前提: Docker Desktop for Windows は通常 WSL2 バックエンドを使用しますが、`devcontainer.json` の `initializeCommand` はホスト側（Windows）で実行されます。bash を利用するには Git Bash などを Windows 側にインストールし、PATH に通す必要があります。
  - Git Bash 等を利用しない場合は、`.env.sample` を手動で `.env` にコピーしてからコンテナを起動してください（この場合、initializeCommand による自動生成は行われません）。
  - あるいは PowerShell で `.env` を生成するよう `initializeCommand` を置き換えることもできます（例: `Copy-Item .env.sample .env -ErrorAction Ignore`）。他プラットフォームとの互換性に注意してください。
