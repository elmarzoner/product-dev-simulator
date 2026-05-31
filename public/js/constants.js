const { useState, useMemo, useCallback, useEffect } = React;

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_PROJECTS = [
  {
    id:1, name:"モンキレンチリニューアル",
    division:"hand_tool",
    baselineLaunchYear:2026, baselineLaunchMonth:10,
    forecastLaunchYear:2026, forecastLaunchMonth:12,
    tasks:[
      {id:1,name:"企画・調査",    startOffset:-6,endOffset:-4,cost:200,costType:"lump",color:"#6366f1",fcstStartOffset:null,fcstEndOffset:null,progress:100,status:"completed"},
      {id:2,name:"開発・設計",    startOffset:-4,endOffset:-2,cost:300,costType:"lump",color:"#8b5cf6",fcstStartOffset:null,fcstEndOffset:null,progress:70, status:"in_progress"},
      {id:3,name:"量産・検品",    startOffset:-2,endOffset:0, cost:400,costType:"lump",color:"#10b981",fcstStartOffset:null,fcstEndOffset:null,progress:0,  status:"not_started"},
      {id:4,name:"プロモーション",startOffset:-1,endOffset:2, cost:100,costType:"lump",color:"#3b82f6",fcstStartOffset:null,fcstEndOffset:null,progress:0,  status:"not_started"},
    ],
    salesPlan:[
      {mo:1,rev:100},{mo:2,rev:170},{mo:3,rev:200},{mo:4,rev:200},
      {mo:5,rev:170},{mo:6,rev:130},{mo:7,rev:100},{mo:8,rev:100},
      {mo:9,rev:80}, {mo:10,rev:70},{mo:11,rev:70},{mo:12,rev:50},
    ],
  },
  {
    id:2, name:"エアコン工具P",
    division:"hand_tool",
    baselineLaunchYear:2026, baselineLaunchMonth:6,
    forecastLaunchYear:2026, forecastLaunchMonth:7,
    tasks:[
      {id:1,name:"企画・調査",    startOffset:-6,endOffset:-4,cost:150,costType:"lump",color:"#6366f1",fcstStartOffset:null,fcstEndOffset:null,progress:100,status:"completed"},
      {id:2,name:"開発・設計",    startOffset:-4,endOffset:-2,cost:280,costType:"lump",color:"#8b5cf6",fcstStartOffset:null,fcstEndOffset:null,progress:100,status:"completed"},
      {id:3,name:"量産・検品",    startOffset:-2,endOffset:0, cost:350,costType:"lump",color:"#10b981",fcstStartOffset:null,fcstEndOffset:null,progress:40, status:"in_progress"},
      {id:4,name:"プロモーション",startOffset:-1,endOffset:2, cost:80, costType:"lump",color:"#3b82f6",fcstStartOffset:null,fcstEndOffset:null,progress:20, status:"in_progress"},
    ],
    salesPlan:[
      {mo:1,rev:130},{mo:2,rev:230},{mo:3,rev:300},{mo:4,rev:330},
      {mo:5,rev:300},{mo:6,rev:270},{mo:7,rev:230},{mo:8,rev:200},
      {mo:9,rev:170},{mo:10,rev:150},{mo:11,rev:130},{mo:12,rev:120},
    ],
  },
  {
    id:3, name:"電気工事工具A",
    division:"fastening",
    baselineLaunchYear:2027, baselineLaunchMonth:3,
    forecastLaunchYear:2027, forecastLaunchMonth:3,
    tasks:[
      {id:1,name:"企画・調査",    startOffset:-8,endOffset:-6,cost:120,costType:"lump",color:"#6366f1",fcstStartOffset:null,fcstEndOffset:null,progress:50, status:"in_progress"},
      {id:2,name:"開発・設計",    startOffset:-6,endOffset:-3,cost:350,costType:"lump",color:"#8b5cf6",fcstStartOffset:null,fcstEndOffset:null,progress:0,  status:"not_started"},
      {id:3,name:"金型・試作",    startOffset:-4,endOffset:-2,cost:220,costType:"lump",color:"#f59e0b",fcstStartOffset:null,fcstEndOffset:null,progress:0,  status:"not_started"},
      {id:4,name:"量産・検品",    startOffset:-2,endOffset:0, cost:480,costType:"lump",color:"#10b981",fcstStartOffset:null,fcstEndOffset:null,progress:0,  status:"not_started"},
      {id:5,name:"プロモーション",startOffset:-1,endOffset:2, cost:120,costType:"lump",color:"#3b82f6",fcstStartOffset:null,fcstEndOffset:null,progress:0,  status:"not_started"},
    ],
    salesPlan:[
      {mo:1,rev:170},{mo:2,rev:300},{mo:3,rev:400},{mo:4,rev:430},
      {mo:5,rev:400},{mo:6,rev:330},{mo:7,rev:300},{mo:8,rev:270},
      {mo:9,rev:230},{mo:10,rev:200},{mo:11,rev:180},{mo:12,rev:170},
    ],
  },
];

const MONTH_JP = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

const STATUS_DEF = {
  not_started:{label:"未着手", color:"#64748b", bg:"bg-slate-700", text:"text-slate-300"},
  in_progress:{label:"進行中", color:"#3b82f6", bg:"bg-blue-900",  text:"text-blue-300"},
  completed:  {label:"完了",   color:"#10b981", bg:"bg-emerald-900",text:"text-emerald-300"},
  delayed:    {label:"遅延",   color:"#ef4444", bg:"bg-red-900",   text:"text-red-300"},
};

const PROJECT_STATUS = {
  active:   {label:"アクティブ", bg:"bg-indigo-900",  text:"text-indigo-300"},
  completed:{label:"完了",      bg:"bg-emerald-900", text:"text-emerald-300"},
  archived: {label:"アーカイブ", bg:"bg-slate-700",   text:"text-slate-400"},
};

const DIVISION = {
  hand_tool:{label:"ハンドツール事業部", short:"HT", bg:"bg-amber-900", text:"text-amber-300"},
  fastening:{label:"ファスニング事業部", short:"FT", bg:"bg-cyan-900",  text:"text-cyan-300"},
};

// ─── FISCAL YEAR HELPERS (4月始まり、144期=2026年4月～2027年3月) ────────────
const FY_BASE_PERIOD = 144;
const FY_BASE_YEAR   = 2026;
function periodToFY(p)        { return FY_BASE_YEAR + (p - FY_BASE_PERIOD); }
function fyToPeriod(fy)       { return FY_BASE_PERIOD + (fy - FY_BASE_YEAR); }
function fiscalYearOfYM(y, m) { return m >= 4 ? y : y - 1; }
function fiscalMonths(fy) {
  const arr = [];
  for (let i = 0; i < 12; i++) {
    const m0 = 4 + i;
    arr.push(m0 <= 12 ? { year: fy, month: m0 } : { year: fy + 1, month: m0 - 12 });
  }
  return arr;
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
function addMonths(year, month, delta) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
function monthDiff(y1, m1, y2, m2) { return (y2 - y1) * 12 + (m2 - m1); }
function monthLabel(year, month)    { return `${year}/${String(month).padStart(2,'0')}`; }

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
function offsetToYM(baseYear, baseMonth, offset) {
  const d = new Date(baseYear, baseMonth - 1 + offset, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
function ymToOffset(baseYear, baseMonth, year, month) {
  return (year - baseYear) * 12 + (month - baseMonth);
}

// ─── PROJECT NORMALIZE / STORAGE ──────────────────────────────────────────────
function normalizeProjects(arr) {
  return arr.map(p => ({
    status: "active",
    division: "hand_tool",
    ...p,
    tasks: p.tasks.map(t => ({ progress: 0, status: "not_started", ...t })),
  }));
}
function loadProjects() {
  try {
    const s = localStorage.getItem('pdp3');
    return normalizeProjects(s ? JSON.parse(s) : INITIAL_PROJECTS);
  } catch { return normalizeProjects(INITIAL_PROJECTS); }
}
function saveProjects(p) {
  try { localStorage.setItem('pdp3', JSON.stringify(p)); } catch {}
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ico = ({d, s=16, c=""}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className={c}><path d={d}/></svg>
);
const IcoPlus  = ({s,c}) => <Ico s={s} c={c} d="M12 5v14M5 12h14"/>;
const IcoTrash = ({s,c}) => <Ico s={s} c={c} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>;
const IcoEdit  = ({s,c}) => <Ico s={s} c={c} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>;
const IcoAlert = ({s,c}) => <Ico s={s} c={c} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>;
const IcoTrend = ({s,c}) => <Ico s={s} c={c} d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"/>;
const IcoPin   = ({s,c}) => <Ico s={s} c={c} d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>;

// ─── PROJECT MONTHLY AGGREGATE ────────────────────────────────────────────────
function projectMonthlyAggregate(project) {
  const delay = monthDiff(project.baselineLaunchYear, project.baselineLaunchMonth,
                          project.forecastLaunchYear, project.forecastLaunchMonth);
  const map = {};
  const bump = (y, m, key, val) => {
    const k = `${y}-${String(m).padStart(2,'0')}`;
    if (!map[k]) map[k] = { planCost:0, fcstCost:0, planRev:0, fcstRev:0 };
    map[k][key] += val;
  };
  project.tasks.forEach(task => {
    const planEnd = offsetToYM(project.baselineLaunchYear, project.baselineLaunchMonth, task.endOffset);
    bump(planEnd.year, planEnd.month, 'planCost', task.cost);
    const isCustom = task.fcstEndOffset !== null && task.fcstEndOffset !== undefined;
    const fcstEndOff = isCustom ? task.fcstEndOffset : task.endOffset + delay;
    const fcstEnd = offsetToYM(project.baselineLaunchYear, project.baselineLaunchMonth, fcstEndOff);
    bump(fcstEnd.year, fcstEnd.month, 'fcstCost', task.cost);
  });
  project.salesPlan.forEach(sp => {
    const planYM = offsetToYM(project.baselineLaunchYear, project.baselineLaunchMonth, sp.mo);
    bump(planYM.year, planYM.month, 'planRev', sp.rev);
    const fcstYM = offsetToYM(project.forecastLaunchYear, project.forecastLaunchMonth, sp.mo);
    bump(fcstYM.year, fcstYM.month, 'fcstRev', sp.rev);
  });
  return map;
}
