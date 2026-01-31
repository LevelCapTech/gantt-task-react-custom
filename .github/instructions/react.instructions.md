---
name: React development rules
description: React/CRA と example アプリ作業時の指示
applyTo:
  - "src/**/*.{tsx,ts,jsx,js}"
  - "example/**/*.{tsx,ts,jsx,js}"
  - "example/package.json"
  - "README.md"
  - "docs/**/*.md"
---
- example の起動・再ビルド手順は `docs/REBUILD.md` を SSOT とし、README や案内文はそれに揃える。
- `npm link` / 手動 symlink は禁止。React の二重読み込みを誘発するため提案しない。
- Invalid hook call が出た場合は、example の `node_modules` 削除 → install → start を最優先で案内する。
- UI のスクリーンショットや Playwright 実行は、ユーザーが明示的に要求した場合のみ提案する。
- 依存関係やビルド設定を変更した場合は、ルートの build と example の再インストールを必ず案内する。
