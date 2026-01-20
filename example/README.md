このサンプルは [Create React App](https://github.com/facebook/create-react-app) で作成されています。

開発用途として、親ディレクトリにある gantt-task-react パッケージにリンクされています。

`npm install` の後に `npm start` を実行すると、このパッケージを PORT=3001 (http://localhost:3001) でテストできます。
- `start` スクリプトは cross-env によりポート指定を行うため、Windows でも同じコマンドで動作します。
- cross-env を使わず手動指定する場合は `set PORT=3001 && npm start` (cmd.exe) などで実行してください。
