// 情シス依頼書.md → 情シス依頼書.docx
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber, PageBreak,
} = require('docx');

const FONT = 'Yu Gothic'; // 日本語向け
const BORDER = { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const CONTENT_W = 9360; // A4 1inch margins: 11906 - 2880 ≈ 9026, use ~9000

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    ...opts,
    children: [new TextRun({ text, font: FONT, size: 22, ...(opts.run || {}) })],
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '4F46E5', space: 4 } },
    children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: '1E293B' })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: '4F46E5' })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: '475569' })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}
function hr() {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8', space: 4 } },
    children: [new TextRun('')],
  });
}

// Build a table from header row + body rows
function buildTable(headers, rows, widths) {
  const sum = widths.reduce((a, b) => a + b, 0);
  const mkCell = (text, opts = {}) => new TableCell({
    borders: BORDERS,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.header ? { fill: 'E0E7FF', type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { after: 0 },
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text: String(text ?? ''), font: FONT, size: 20, bold: !!opts.header })],
    })],
  });
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => mkCell(h, { header: true, width: widths[i] })),
  });
  const bodyRows = rows.map(r => new TableRow({
    children: r.map((c, i) => mkCell(c, { width: widths[i] })),
  }));
  return new Table({
    width: { size: sum, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

// Bold inline helper using multiple TextRuns
function paraWithBold(parts, opts = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    ...opts,
    children: parts.map(([t, bold]) => new TextRun({ text: t, font: FONT, size: 22, bold: !!bold })),
  });
}

const children = [];

// 表題
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
  children: [new TextRun({ text: '新商品開発プロセス進捗シミュレーター', font: FONT, size: 36, bold: true, color: '1E293B' })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 280 },
  children: [new TextRun({ text: '社内導入依頼書', font: FONT, size: 32, bold: true, color: '4F46E5' })],
}));

// 日付・差出
children.push(p('作成日：2026年5月29日', { alignment: AlignmentType.RIGHT, run: { size: 20 } }));
children.push(p('起案：経営企画室', { alignment: AlignmentType.RIGHT, run: { size: 20 } }));
children.push(p('提出先：情報システム部', { alignment: AlignmentType.RIGHT, run: { size: 20 } }));
children.push(hr());

// 1. 概要
children.push(h1('1. 概要'));
children.push(p('新商品開発プロジェクトの進捗・コスト・売上を一元管理し、発売日変更が経営に与える影響をリアルタイムで可視化するWebアプリケーション「新商品開発プロセス進捗シミュレーター」を、社内サーバー上で限定公開・運用したく、ご検討をお願いいたします。'));

children.push(h2('1.1 目的'));
children.push(buildTable(
  ['#', '目的', '期待効果'],
  [
    ['1', '新商品開発プロジェクトの全社的な進捗可視化', '経営判断のスピード向上'],
    ['2', '発売遅延による財務インパクトの即時試算', 'リスクの早期把握'],
    ['3', '期次サマリーによる予実差異の即時集計', '経営会議用資料の作成工数削減'],
    ['4', '非エンジニアでも改善を続けられる業務ツール文化の醸成', '全社のDX推進'],
  ],
  [800, 4280, 4280]
));

children.push(h2('1.2 利用想定者'));
children.push(bullet('経営企画室メンバー（中心利用者）'));
children.push(bullet('開発・製造部門の担当者（プロジェクト登録）'));
children.push(bullet('経営層（閲覧・確認）'));

// 2. アプリケーション仕様
children.push(h1('2. アプリケーション仕様'));
children.push(h2('2.1 主な機能'));
[
  '進捗タイムライン（ガントチャート）',
  '月別コスト推移（計画 vs 予測）',
  '売上・インパクト分析',
  '期次サマリー（4月始まり・通期/上期/下期切替・全プロジェクト合算）',
  '全プロジェクト一覧（フィルター付き）',
  'タスク進捗管理（％・ステータス）',
  'データ入出力（JSON / CSV）',
].forEach(t => children.push(bullet(t)));

children.push(h2('2.2 技術構成'));
children.push(buildTable(
  ['区分', '内容'],
  [
    ['フロントエンド', 'HTML / React (CDN利用) / Tailwind CSS'],
    ['構成', '単一HTMLファイル（外部依存はCDNのみ）'],
    ['ファイル容量', '約150KB'],
    ['ブラウザ要件', 'Chrome / Edge / Firefox（最新版）'],
  ],
  [3000, 6360]
));

children.push(h2('2.3 拡張時の構成（将来）'));
children.push(p('データ共有のため、以下を追加予定：'));
children.push(buildTable(
  ['区分', '内容'],
  [
    ['バックエンド', 'Node.js + Express（軽量API）'],
    ['データベース', 'SQLite（単一ファイル・運用容易）'],
    ['通信', 'HTTP/HTTPS（社内のみ）'],
  ],
  [3000, 6360]
));

// 3. ご依頼事項
children.push(h1('3. ご依頼事項'));
children.push(h2('3.1 サーバー要件'));
children.push(buildTable(
  ['項目', '内容'],
  [
    ['種別', 'Linuxサーバー（Ubuntu 22.04 LTS推奨）または Windows Server'],
    ['CPU', '1コア以上（最小限でも十分）'],
    ['メモリ', '2GB以上'],
    ['ストレージ', '20GB以上'],
    ['用途', '静的Webファイル配信 + 軽量Node.js API'],
    ['設置場所', '社内データセンター（オンプレ）'],
  ],
  [2400, 6960]
));

children.push(h2('3.2 必要ソフトウェア'));
children.push(buildTable(
  ['ソフト', '用途', 'バージョン'],
  [
    ['Node.js', 'バックエンド実行環境', 'v18 LTS 以降'],
    ['npm', 'パッケージ管理', 'Node.js同梱'],
    ['Git', 'バージョン管理', '任意の安定版'],
    ['Webサーバー', '（Nginx推奨。Apache/IISでも可）', '任意'],
  ],
  [2400, 4760, 2200]
));

children.push(h2('3.3 ネットワーク要件'));
children.push(buildTable(
  ['項目', '内容'],
  [
    ['アクセス制限', '社内ネットワークからのみアクセス可能'],
    ['社外アクセス', '完全遮断'],
    ['ポート', '80（HTTP）または 443（HTTPS）'],
    ['内部DNS', 'http://product-simulator.local 等のサブドメイン割当（任意）'],
    ['HTTPS化', '社内認証局またはオレオレ証明書で対応（推奨）'],
  ],
  [2400, 6960]
));

children.push(h2('3.4 運用要件'));
children.push(buildTable(
  ['項目', '内容'],
  [
    ['サービス自動起動', 'systemd または Windowsサービスで常時稼働'],
    ['バックアップ', 'データベースファイル（data.db）の日次自動バックアップ'],
    ['バックアップ保管', '既存の社内バックアップ基盤への組み込み'],
    ['ログ保管', 'アクセスログを最低90日'],
  ],
  [2400, 6960]
));

// 4. 責任分界
children.push(h1('4. 責任分界と運用体制'));
children.push(h2('4.1 役割分担'));
children.push(buildTable(
  ['項目', '情報システム部', '経営企画室'],
  [
    ['サーバー調達・構築', '◎', '−'],
    ['OS・ミドルウェア管理', '◎', '−'],
    ['ネットワーク・セキュリティ', '◎', '−'],
    ['サーバーバックアップ運用', '◎', '−'],
    ['アプリケーション開発・改修', '−', '◎'],
    ['アプリケーションのバージョン管理（Git）', '−', '◎'],
    ['アプリケーションの不具合対応', '−', '◎'],
    ['アプリケーションのユーザーサポート', '−', '◎'],
    ['利用者からの一次窓口', '−', '◎'],
  ],
  [5160, 2100, 2100]
));

children.push(h2('4.2 経営企画室として担保すること'));
[
  ['ソースコードのバージョン管理', ['GitHub（プライベートリポジトリ）にて全変更履歴を管理', '過去バージョンへのロールバック手順を整備']],
  ['デプロイ手順の文書化', ['社内サーバーへの反映手順をマニュアル化', '情シス側で必要なオペレーションは事前に共有']],
  ['不具合対応の責任', ['利用者からの問い合わせ窓口を経営企画室で一本化', '致命的不具合発生時は、即時利用停止 → 修正 → 再デプロイの手順を確立']],
  ['セキュリティ意識の徹底', ['個人情報・機密情報は本アプリに保存しない', '外部公開リスクのあるコード（APIキー等）はGitに上げない']],
  ['運用前テスト', ['本番反映前に必ず動作確認', '大きな変更時は事前に情シスへ報告']],
].forEach(([title, items]) => {
  children.push(numbered(title));
  items.forEach(t => children.push(bullet(t)));
});

children.push(h2('4.3 障害時の連絡フロー'));
[
  '利用者 → 経営企画室（一次対応）',
  '　　　　　　↓',
  '　　原因切り分け',
  '　　　├─ アプリ起因 → 経営企画室で修正',
  '　　　└─ サーバー/NW起因 → 情シスへエスカレーション',
].forEach(t => children.push(p(t, { run: { font: 'Consolas', size: 20 } })));

// 5. セキュリティ
children.push(h1('5. セキュリティ・コンプライアンス対応'));
children.push(h2('5.1 リスク評価'));
children.push(buildTable(
  ['リスク', 'レベル', '対策'],
  [
    ['外部からの不正アクセス', '低', '社内ネットワーク限定で根本的に遮断'],
    ['内部からの情報漏洩', '低', '社内ネットワーク限定運用・アクセス権限の適切な管理'],
    ['データ消失', '低', '日次バックアップ＋Gitでコード保全'],
    ['改修ミスによる業務停止', '中', 'テスト環境で事前検証＋ロールバック手順整備'],
  ],
  [3000, 1200, 5160]
));

children.push(h2('5.2 取扱情報'));
children.push(p('本アプリで扱う情報：'));
children.push(bullet('新商品開発プロジェクトの計画・進捗'));
children.push(bullet('各プロジェクトの想定コスト・売上計画'));
children.push(h2('5.3 監査対応'));
children.push(bullet('すべての変更履歴はGit上に記録'));
children.push(bullet('バックアップから過去状態の復元が可能'));
children.push(bullet('アクセスログは情シスの既存基盤に統合'));

// 6. スケジュール
children.push(h1('6. 導入スケジュール案'));
children.push(buildTable(
  ['フェーズ', '内容', '期間'],
  [
    ['1. 要件確認', '本書ベースで情シスと協議', '〜1週間'],
    ['2. サーバー手配', '情シスにてサーバー調達・OS設定', '2〜4週間'],
    ['3. 環境構築', 'Node.js等インストール・経営企画室と協働', '1週間'],
    ['4. アプリ配置', '経営企画室がデプロイ', '1〜2日'],
    ['5. 試験運用', '経営企画室内のみで運用', '2週間'],
    ['6. 本格運用', '関係部門へ展開', '−'],
  ],
  [2200, 5560, 1600]
));

// 7. 背景
children.push(h1('7. 補足：本依頼の背景'));
children.push(p('近年、非エンジニアであっても業務アプリを内製化する動きが各社で広がっています。生成AIの活用により、コードの設計・実装・保守の難易度が大きく下がったことが背景です。'));
children.push(paraWithBold([
  ['本アプリは、経営企画室で', false],
  ['生成AIを活用しながら開発', true],
  ['した実用ツールであり、すでに以下を達成しています：', false],
]));
children.push(bullet('GitHubでのバージョン管理'));
children.push(bullet('個人ブラウザでの試用版を社内向けに公開可能な水準で稼働中'));
children.push(bullet('バックアップ（JSON/CSVエクスポート）機能を実装済み'));
children.push(paraWithBold([
  ['このような業務ツールを', false],
  ['情シスの手を借りずに改善し続けられる', true],
  ['ことで、IT部門のリソースを本来の戦略案件に集中いただけると考えています。', false],
]));
children.push(p('経営企画室として、責任を持って運用・改善を行いますので、ご検討のほどよろしくお願いいたします。'));

// 8. 問い合わせ
children.push(h1('8. お問い合わせ'));
children.push(p('経営企画室　渡邉達哉'));
children.push(p('内線：xxxx'));
children.push(p('メール：t-watanabe@xxxxx'));

children.push(hr());
children.push(h2('別紙（必要に応じて提示可能）'));
children.push(bullet('アプリのデモURL（現状GitHub Pages公開版）：https://elmarzoner.github.io/product-dev-simulator/'));
children.push(bullet('ソースコード（GitHub）：https://github.com/elmarzoner/product-dev-simulator'));
children.push(bullet('スクリーンショット集'));
children.push(bullet('詳細技術仕様書'));

children.push(p('以上', { alignment: AlignmentType.RIGHT }));

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{
        level: 0, format: LevelFormat.BULLET, text: '・', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }] },
      { reference: 'numbers', levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ font: FONT, size: 18, children: ['- ', PageNumber.CURRENT, ' -'] })],
      })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, '情シス依頼書.docx');
  fs.writeFileSync(out, buf);
  console.log('OK:', out);
});
