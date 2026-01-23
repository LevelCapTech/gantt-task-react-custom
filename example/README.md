このサンプルは [Create React App](https://github.com/facebook/create-react-app) で作成されています。

開発用途として、親ディレクトリにある gantt-task-react パッケージにリンクされています。

`npm install` の後に `npm start` を実行すると、このパッケージを PORT=3001 (http://localhost:3001) でテストできます。
- `start` スクリプトは cross-env によりポート指定を行うため、Windows でも同じコマンドで動作します。
- cross-env を使わず手動指定する場合は `set PORT=3001 && npm start` (cmd.exe) などで実行してください。

# example (CRA) 開発メモ

この `example/` ディレクトリは、
`@levelcaptech/gantt-task-react-custom` ライブラリを **Create React App (CRA)** で動作確認・開発するためのサンプルアプリです。

---

## ディレクトリ構成と役割

```
gantt-task-react-custom/
├─ src/                # ライブラリ本体（microbundle で dist にビルドされる）
├─ dist/               # ライブラリのビルド成果物（example から参照される）
├─ example/            # CRA ベースのサンプルアプリ
│  ├─ src/
│  ├─ package.json
│  └─ tsconfig.json
```

* **ライブラリ本体**

  * `src/` → `dist/` にビルドされる
  * `microbundle-crl` を使用
* **example (CRA)**

  * `@levelcaptech/gantt-task-react-custom` を `file:..` で参照
  * 実行時は **example 側の React / ReactDOM を使用**

---

## 重要：CRA + example の関係

この構成では **React が二重に読み込まれると即座に壊れます**。

### 発生した問題

以下のエラーが発生：

```
Invalid hook call.
Cannot read properties of null (reading 'useRef')
```

### 原因

* ライブラリ側に React がバンドルされていた
* example(CRA) 側にも React が存在
* **React が 2 インスタンス存在する状態** になっていた

結果：

* `useRef`, `useState` などの Hooks が壊れる

---

## 解決方法（重要）

### 1. microbundle で React を external 指定

`gantt-task-react-custom/package.json` に以下を設定：

```json
"microbundle": {
  "external": [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react/jsx-dev-runtime"
  ]
}
```

これにより：

* ライブラリは React を **同梱しない**
* 実行時は example(CRA) 側の React を使用する

---

## 開発時の正しい手順（重要）

### ライブラリ側（別ターミナル）

```bash
# ルートディレクトリ
yarn build
# または
yarn start   # watch モード
```

* `dist/` が更新される
* example はこの `dist` を参照する

---

### example 側（別ターミナル）

```bash
cd example
yarn start
```

---

## 注意点（ハマりどころ）

### ❌ yarn start だけでは反映されないケース

* CRA は `node_modules/@levelcaptech/gantt-task-react-custom` をキャッシュする
* 以下のような変更時は **再インストールが必要な場合あり**

#### 再インストールが必要なケース

* dist の構造が変わった
* React の external 設定を変更した
* microbundle の出力仕様を変更した

```bash
cd example
rm -rf node_modules
yarn install
yarn start
```

---

## console.log が example で出ない場合

* `src/` に書いた console.log → **出ない**
* `dist/` に反映されたコードの console.log → **出る**

👉 必ず以下の流れを守ること：

1. ライブラリ側で `yarn build` / `yarn start`
2. `dist` が更新される
3. example をリロード

---

## まとめ

* example は **dist を使うだけ**
* React は **example 側で 1 つだけ**
* Hooks エラーはほぼ「React 二重読み込み」
* 迷ったら：

  * `dist` を疑う
  * `external` を疑う
  * `node_modules` を疑う

---

この README は、
**将来の自分が同じ地獄を見ないための供養** です 🙏
