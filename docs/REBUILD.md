## package.json 更新時のリビルド手順（React コンポーネントライブラリ）

このライブラリは **microbundle + dist 配布 + example(CRA)** という構成のため、
`package.json` を更新した場合は **通常のコード変更よりも慎重な手順**が必要になる。

---

### 対象となる変更

以下のような変更を行った場合は、本手順を必ず実施すること。

- `dependencies / devDependencies / peerDependencies` の変更
- `microbundle` 設定の変更（external など）
- React / react-dom / jsx-runtime 関連の調整
- build 設定に関わる script の変更

---

## 正しいリビルド手順

### ① ライブラリ側（ルートディレクトリ）

```bash
# 不整合を防ぐため一度クリーン
rm -rf node_modules dist

# 依存関係を再インストール
yarn install

# ライブラリをビルド
yarn build
# または watch 開発の場合
# yarn start
```

- `dist/` が最新の状態で生成される
- React は external 扱いのため **dist に含まれない**ことが重要

---

### ② example（CRA）側

```bash
cd example

# CRA は file:.. をキャッシュするため再インストールが必要
rm -rf node_modules

yarn install
yarn start
```

#### 一括で実行する婆

```bash
rm -rf node_modules && yarn install && yarn start
```

---

## なぜ example 側も再インストールが必要なのか？

- example は `@levelcaptech/gantt-task-react-custom` を `file:..` で参照している
- CRA は `node_modules` 配下を強くキャッシュする
- `dist` や依存構造が変わっても **自動では反映されない**

👉 そのため：

- `package.json` を変更した場合
- microbundle 設定を変更した場合

は **example 側の `node_modules` 削除が必須**。

---

## よくある勘違い ❌

### ❌ yarn start だけで反映されると思ってしまう

- ライブラリ側で `yarn start` → dist 更新
- example 側は **何も変わらない**

👉 dist は更新されていても、
CRA が古い node_modules を使い続けている可能性が高い。

---

## 確認ポイント（トラブルシュート）

- dist に React が含まれていないか？

```bash
grep -R "react.development" dist
```

- React Hook エラーが出ていないか？

```
Invalid hook call
Cannot read properties of null (reading 'useRef')
```

→ 出たら **React 二重読み込みを疑う**

---

## まとめ（重要）

- package.json を触ったら：

  - **ライブラリ側：再 install + build**
  - **example 側：node_modules 削除 + install**

- React コンポーネントライブラリでは
  **「dist と依存関係はセットで管理」**する
- Hooks エラーの 9 割は **React 二重読み込み**

---

この手順は、
**将来の自分とチームメンバーを守るための必須知識**。
