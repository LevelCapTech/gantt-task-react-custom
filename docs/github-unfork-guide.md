# GitHubフォーク解除手順書

## フォーク解除の概要
- GitHubではフォーク関係をUIから直接解除できません。
- 解除にはGitHub Supportへの依頼が必要です。

## フォーク解除手順（ブラウザ操作）

### Step 1: リポジトリを開く
- ブラウザで [GitHub ダッシュボード](https://github.com/dashboard) を開きます。
- 対象リポジトリ「LevelCapTech/gantt-task-react-custom」をクリックして表示します。

### Step 2: Supportへ連絡
- GitHub Support の [問い合わせフォーム](https://support.github.com/contact) を開きます。
- 問い合わせカテゴリで "Repository Network" 関連の問い合わせを選択します。
- フォーク解除の依頼を送信します。

### Step 3: 依頼文テンプレート
以下のテンプレートをそのまま貼り付けて送信します。

```
Repository: LevelCapTech/gantt-task-react-custom
Request: Please detach this repository from its fork network.
Reason: We would like to maintain it as an independent project.
```

### Step 4: 承認後の確認方法
- 対象リポジトリのページ上部にある「forked from ...」表示が消えていることを確認します。

## 注意事項
- フォーク解除後はネットワーク関係が完全に切れます。
- 元リポジトリとのPR連携はできなくなります。
- 元のネットワークへ戻すことはできません。
