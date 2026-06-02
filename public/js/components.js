// ─── LOGIN GATE（簡易・テスト用） ─────────────────────────────────────────────
function Gate({ onAuth }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  function submit() {
    if (pw === APP_PASSWORD) {
      setAuthed();
      onAuth();
    } else {
      setErr(true);
      setPw("");
    }
  }
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 slide-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <IcoTrend s={20} c="text-white"/>
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">新商品開発シミュレーター</h1>
            <p className="text-[11px] text-slate-500">ログインしてください</p>
          </div>
        </div>
        <label className="text-xs text-slate-400 block mb-1.5">パスワード</label>
        <input type="password" value={pw} autoFocus
          onChange={e=>{ setPw(e.target.value); setErr(false); }}
          onKeyDown={e=>e.key==='Enter'&&submit()}
          placeholder="パスワードを入力"
          className="w-full bg-slate-800 border border-slate-600 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
        {err && <p className="text-xs text-red-400 mt-2">パスワードが違います</p>}
        <button onClick={submit}
          className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-semibold transition-colors">
          ログイン
        </button>
      </div>
    </div>
  );
}

// ─── CLOUD SYNC STATUS BADGE ──────────────────────────────────────────────────
function CloudStatus({ status }) {
  const map = {
    init:    { t:"接続中…",    c:"text-slate-400",   d:"bg-slate-500" },
    saving:  { t:"同期中…",    c:"text-amber-400",   d:"bg-amber-400 animate-pulse" },
    saved:   { t:"同期済み",   c:"text-emerald-400", d:"bg-emerald-400" },
    error:   { t:"同期エラー", c:"text-red-400",     d:"bg-red-500" },
    offline: { t:"オフライン", c:"text-slate-500",   d:"bg-slate-600" },
  };
  const s = map[status] || map.init;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700" title="Firestore クラウド同期状態">
      <span className={`w-2 h-2 rounded-full ${s.d}`}/>
      <span className={`text-[11px] font-semibold ${s.c}`}>☁ {s.t}</span>
    </div>
  );
}

// ─── MISC COMPONENTS ──────────────────────────────────────────────────────────
function MiniStat({label,value,valueClass="text-white"}) {
  return(
    <div className="bg-slate-800/60 rounded-none p-3 border border-slate-700/50">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-sm font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function StatCard({label,value,sub,valueClass="text-white"}) {
  return(
    <div className="rounded-none border p-5 bg-slate-900 border-slate-800">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      {sub&&<p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function LaunchDatePicker({label,year,month,onChange,accent=false}) {
  return(
    <div>
      <label className={`text-xs font-medium mb-1.5 block ${accent?"text-indigo-300":"text-slate-300"}`}>{label}</label>
      <div className="flex gap-2">
        <select value={year} onChange={e=>onChange(Number(e.target.value),month)}
          className={`flex-1 bg-slate-800 border ${accent?"border-indigo-600":"border-slate-600"} rounded-none px-2 py-2 text-sm text-white focus:outline-none`}>
          {Array.from({length:16},(_,i)=>2024+i).map(y=><option key={y} value={y}>{y}年</option>)}
        </select>
        <select value={month} onChange={e=>onChange(year,Number(e.target.value))}
          className={`flex-1 bg-slate-800 border ${accent?"border-indigo-600":"border-slate-600"} rounded-none px-2 py-2 text-sm text-white focus:outline-none`}>
          {MONTH_JP.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── TASK FORM ────────────────────────────────────────────────────────────────
function YMPicker({label, year, month, onChange, accent=false}) {
  const years = [];
  for(let y = 2024; y <= 2039; y++) years.push(y);
  return (
    <div>
      <label className={`text-xs mb-1 block ${accent?"text-amber-400":"text-slate-400"}`}>{label}</label>
      <div className="flex gap-1">
        <select value={year} onChange={e=>onChange(Number(e.target.value), month)}
          className={`flex-1 bg-slate-700 border ${accent?"border-amber-600/50":"border-slate-600"} px-1 py-1.5 text-xs text-white focus:outline-none`}>
          {years.map(y=><option key={y} value={y}>{y}年</option>)}
        </select>
        <select value={month} onChange={e=>onChange(year, Number(e.target.value))}
          className={`flex-1 bg-slate-700 border ${accent?"border-amber-600/50":"border-slate-600"} px-1 py-1.5 text-xs text-white focus:outline-none`}>
          {MONTH_JP.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

function TaskForm({task, baselineLaunchYear, baselineLaunchMonth, delayMonths, onSave, onCancel}) {
  const [f,setF]=useState({
    name:task.name,
    startOffset:task.startOffset, endOffset:task.endOffset,
    cost:task.cost,
    fcstStartOffset:task.fcstStartOffset,
    fcstEndOffset:task.fcstEndOffset,
    progress:task.progress??0,
    status:task.status||"not_started",
  });
  const isCustom = f.fcstStartOffset!==null || f.fcstEndOffset!==null;
  const s=(k,v)=>setF(p=>({...p,[k]:v}));

  const startYM = offsetToYM(baselineLaunchYear, baselineLaunchMonth, f.startOffset);
  const endYM   = offsetToYM(baselineLaunchYear, baselineLaunchMonth, f.endOffset);
  const fcstStartOff = isCustom ? f.fcstStartOffset : f.startOffset + delayMonths;
  const fcstEndOff   = isCustom ? f.fcstEndOffset   : f.endOffset   + delayMonths;
  const fcstStartYM  = offsetToYM(baselineLaunchYear, baselineLaunchMonth, fcstStartOff);
  const fcstEndYM    = offsetToYM(baselineLaunchYear, baselineLaunchMonth, fcstEndOff);

  function toggleCustom(checked) {
    if(checked){
      setF(p=>({...p, fcstStartOffset: p.startOffset+delayMonths, fcstEndOffset: p.endOffset+delayMonths}));
    } else {
      setF(p=>({...p, fcstStartOffset:null, fcstEndOffset:null}));
    }
  }

  return(
    <div className="mb-4 bg-slate-800/80 border border-indigo-700/50 p-4 slide-in">
      <p className="text-xs font-semibold text-indigo-300 mb-3">{task.id==="new"?"新しいタスク":"タスクを編集"}</p>
      <div className="space-y-2.5">
        <input value={f.name} onChange={e=>s('name',e.target.value)} placeholder="タスク名"
          className="w-full bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"/>

        <div className="text-xs text-slate-400 font-semibold pt-1">📋 計画期間</div>
        <div className="grid grid-cols-2 gap-2">
          <YMPicker label="開始" year={startYM.year} month={startYM.month}
            onChange={(y,m)=>s('startOffset', ymToOffset(baselineLaunchYear,baselineLaunchMonth,y,m))}/>
          <YMPicker label="終了" year={endYM.year} month={endYM.month}
            onChange={(y,m)=>s('endOffset', ymToOffset(baselineLaunchYear,baselineLaunchMonth,y,m))}/>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">コスト（万円・終了月に一括計上）</label>
          <input type="number" value={f.cost} onChange={e=>s('cost',Number(e.target.value))}
            className="w-full bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"/>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">ステータス</label>
          <select value={f.status} onChange={e=>s('status',e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            {Object.entries(STATUS_DEF).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block flex justify-between">
            <span>進捗</span><span className="font-bold text-emerald-400">{f.progress}%</span>
          </label>
          <input type="range" min="0" max="100" step="5" value={f.progress}
            onChange={e=>s('progress', Number(e.target.value))}
            className="w-full accent-emerald-500"/>
        </div>

        <div className="border-t border-slate-700 pt-3">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <div className={`w-9 h-5 rounded-full relative transition-colors ${isCustom?"bg-amber-500":"bg-slate-600"}`}
              onClick={()=>toggleCustom(!isCustom)}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isCustom?"translate-x-4":""}`}/>
            </div>
            <span className="text-xs text-slate-300 font-medium">グローバル遅延との連動を解除</span>
            {!isCustom&&<span className="text-xs text-indigo-400 font-medium">（連動中）</span>}
            {isCustom&&<span className="text-xs text-amber-400 font-medium">（解除中・個別設定）</span>}
          </label>
          {isCustom&&(
            <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-amber-500/50">
              <YMPicker label="予測開始" year={fcstStartYM.year} month={fcstStartYM.month} accent
                onChange={(y,m)=>s('fcstStartOffset', ymToOffset(baselineLaunchYear,baselineLaunchMonth,y,m))}/>
              <YMPicker label="予測終了" year={fcstEndYM.year} month={fcstEndYM.month} accent
                onChange={(y,m)=>s('fcstEndOffset', ymToOffset(baselineLaunchYear,baselineLaunchMonth,y,m))}/>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={()=>onSave(f)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-semibold transition-colors">保存</button>
          <button onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 transition-colors">✕</button>
        </div>
      </div>
    </div>
  );
}