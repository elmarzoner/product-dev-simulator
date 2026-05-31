# シミュレーター ファイル分割計画

## 方針
- ビルド不要・Firebase Hostingそのままで動く
- `<script type="text/babel" src="...">` で複数ファイルを読み込む
- 各ファイルはグローバルスコープに関数・コンポーネントを定義（ESモジュール不使用）

## 分割後の構成

```
public/
├── index.html          （約150行）殻のみ：CDN読込・CSS・ログインゲート・scriptタグ列挙
└── js/
    ├── constants.js    （約130行）初期データ・定数・ユーティリティ関数
    ├── charts.js       （約350行）グラフ系コンポーネント（GapBarChart・BarChartSVG・LineChartSVG・GapTable）
    ├── components.js   （約200行）汎用UIコンポーネント（MiniStat・StatCard・LaunchDatePicker・YMPicker・TaskForm・SalesPlanEditor）
    ├── gantt.js        （約150行）GanttTabコンポーネント
    ├── details.js      （約300行）CostTab・SalesTab・FiscalTabコンポーネント
    ├── projects.js     （約250行）ProjectListPanel・ProjectEditModal・OverviewTabコンポーネント
    └── app.js          （約200行）メインAppコンポーネント＋ReactDOM.createRoot
```

## index.html の script読込順（順番厳守）

```html
<!-- ① CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<!-- ② アプリファイル（依存順） -->
<script type="text/babel" src="js/constants.js"></script>
<script type="text/babel" src="js/charts.js"></script>
<script type="text/babel" src="js/components.js"></script>
<script type="text/babel" src="js/gantt.js"></script>
<script type="text/babel" src="js/details.js"></script>
<script type="text/babel" src="js/projects.js"></script>
<script type="text/babel" src="js/app.js"></script>
```

## 各ファイルの担当範囲（現index.htmlの行番号）

| ファイル | 行番号 | 主な内容 |
|---|---|---|
| `constants.js` | 29〜129 | INITIAL_PROJECTS・MONTH_JP・STATUS_DEF・PROJECT_STATUS・DIVISION・addMonths・monthDiff・monthLabel・normalizeProjects・loadProjects・saveProjects・Icoアイコン群・DATE HELPERS・FISCAL YEAR HELPERS・projectMonthlyAggregate |
| `charts.js` | 143〜394 | GapBarChart・BarChartSVG・LineChartSVG・GapTable |
| `components.js` | 396〜604 | MiniStat・StatCard・LaunchDatePicker・YMPicker・TaskForm・SalesPlanEditor |
| `gantt.js` | 603〜838 | GanttTab |
| `details.js` | 839〜969・970〜1169 | CostTab・SalesTab・FiscalTab |
| `projects.js` | 1170〜1461 | ProjectListPanel・ProjectEditModal・OverviewTab |
| `app.js` | 1462〜1891 | App（メイン）・ReactDOM.createRoot |

## 注意事項

- `const { useState, useMemo, useCallback, useEffect } = React;` は
  **constants.jsの先頭**に1回だけ書く（他ファイルでは不要）
- `type="text/babel"` の src 読み込みはローカルサーバー（`firebase serve`）か
  本番デプロイ環境でないと動かない（ファイルを直接ブラウザで開くと CORS エラー）
- 開発中の動作確認は `firebase serve` コマンドを使う
