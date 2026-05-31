// ─── PROJECT LIST PANEL ──────────────────────────────────────────────────────
function ProjectListPanel({projects, selectedId, setSelectedId, setEditingProject,
                            showNewProject, setShowNewProject, newProjectName, setNewProjectName, addProject}) {
  const active    = projects.filter(p => (p.status||"active")==="active");
  const completed = projects.filter(p => p.status==="completed");
  const archived  = projects.filter(p => p.status==="archived");
  const TOP_N = 3;
  const topActive  = active.slice(0, TOP_N);
  const restActive = active.slice(TOP_N);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived,  setShowArchived]  = useState(false);

  const ProjectRow = ({p, dim=false}) => {
    const div = DIVISION[p.division||"hand_tool"];
    return (
      <div onClick={()=>setSelectedId(p.id)}
        className={`group flex items-center justify-between px-3 py-2 rounded-none cursor-pointer transition-colors ${p.id===selectedId?"bg-indigo-600 text-white":"text-slate-300 hover:bg-slate-800"} ${dim?"opacity-70":""}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`text-[9px] font-bold px-1 py-px shrink-0 ${div.bg} ${div.text}`}>{div.short}</span>
          <span className="text-sm font-medium truncate">{p.name}</span>
        </div>
        <button onClick={e=>{e.stopPropagation(); setEditingProject(p);}}
          className="opacity-0 group-hover:opacity-70 hover:opacity-100 ml-2 shrink-0 text-slate-300">
          <IcoEdit s={13}/>
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 border-b border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">プロジェクト</span>
        <button onClick={()=>setShowNewProject(true)} className="text-indigo-400 hover:text-indigo-300"><IcoPlus s={16}/></button>
      </div>
      {showNewProject&&(
        <div className="mb-3 flex gap-2">
          <input className="flex-1 bg-slate-800 border border-slate-700 rounded-none px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="プロジェクト名" value={newProjectName} onChange={e=>setNewProjectName(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addProject()} autoFocus/>
          <button onClick={addProject} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-none text-xs text-white font-semibold transition-colors">追加</button>
          <button onClick={()=>setShowNewProject(false)} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-none text-xs text-slate-300 transition-colors">✕</button>
        </div>
      )}
      <div className="space-y-1">
        {topActive.map(p => <ProjectRow key={p.id} p={p}/>)}
        {restActive.length>0 && (
          <div className="pt-1">
            <select value="" onChange={e=>e.target.value && setSelectedId(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
              <option value="">▼ その他のアクティブ案件（{restActive.length}件）</option>
              {restActive.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>
      {completed.length>0 && (
        <div className="mt-3 border-t border-slate-800 pt-2">
          <button onClick={()=>setShowCompleted(o=>!o)}
            className="w-full flex items-center justify-between text-[11px] text-emerald-400 hover:text-emerald-300 py-1">
            <span>✓ 完了案件 ({completed.length})</span>
            <span>{showCompleted?"▲":"▼"}</span>
          </button>
          {showCompleted && (
            <div className="space-y-1 mt-1">
              {completed.map(p => <ProjectRow key={p.id} p={p} dim/>)}
            </div>
          )}
        </div>
      )}
      {archived.length>0 && (
        <div className="mt-2 border-t border-slate-800 pt-2">
          <button onClick={()=>setShowArchived(o=>!o)}
            className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-300 py-1">
            <span>📦 アーカイブ ({archived.length})</span>
            <span>{showArchived?"▲":"▼"}</span>
          </button>
          {showArchived && (
            <div className="space-y-1 mt-1">
              {archived.map(p => <ProjectRow key={p.id} p={p} dim/>)}
            </div>
          )}
        </div>
      )}
      {projects.length===0 && (
        <p className="text-xs text-slate-500 text-center py-3">プロジェクトを追加してください</p>
      )}
    </div>
  );
}

// ─── PROJECT EDIT MODAL ──────────────────────────────────────────────────────
function ProjectEditModal({project, onClose, onSave, onDelete}) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status || "active");
  const [division, setDivision] = useState(project.division || "hand_tool");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 p-6 w-[420px] max-w-[95vw] slide-in" onClick={e=>e.stopPropagation()}>
        <h3 className="text-base font-bold text-white mb-4">プロジェクト編集</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">プロジェクト名</label>
            <input value={name} onChange={e=>setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">事業部</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DIVISION).map(([k,v]) => (
                <button key={k} onClick={()=>setDivision(k)}
                  className={`py-2 text-xs font-semibold transition-colors ${division===k?`${v.bg} ${v.text} border border-current`:"bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500"}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">ステータス</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROJECT_STATUS).map(([k,v]) => (
                <button key={k} onClick={()=>setStatus(k)}
                  className={`py-2 text-xs font-semibold transition-colors ${status===k?`${v.bg} ${v.text} border border-current`:"bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500"}`}>
                  {v.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {status==="active" && "通常表示されます"}
              {status==="completed" && "完了として下部に折りたたみ表示"}
              {status==="archived" && "アーカイブ欄に格納（通常は非表示）"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={()=>{onSave({name, status, division}); onClose();}}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-semibold">保存</button>
          <button onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm text-slate-300">キャンセル</button>
        </div>
        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-[11px] text-red-400 font-semibold mb-2">危険ゾーン</p>
          {!confirmDelete ? (
            <button onClick={()=>setConfirmDelete(true)}
              className="w-full py-2 border border-red-800 text-red-400 hover:bg-red-950 text-xs font-semibold">
              このプロジェクトを完全削除
            </button>
          ) : (
            <div className="bg-red-950/40 border border-red-800 p-3">
              <p className="text-xs text-red-300 mb-2">本当に削除しますか？この操作は取り消せません。</p>
              <div className="flex gap-2">
                <button onClick={()=>{onDelete(); onClose();}}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-xs text-white font-semibold">削除する</button>
                <button onClick={()=>setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-slate-700 text-xs text-slate-300">取消</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ALL PROJECTS OVERVIEW TAB ────────────────────────────────────────────────
function OverviewTab({projects, setSelectedId, setActiveTab}) {
  const [filter, setFilter] = useState("active");
  const [divFilter, setDivFilter] = useState("all");
  const byStatus = filter==="all" ? projects : projects.filter(p => (p.status||"active")===filter);
  const filtered = divFilter==="all" ? byStatus : byStatus.filter(p => (p.division||"hand_tool")===divFilter);
  const counts = {
    active:    projects.filter(p=>(p.status||"active")==="active").length,
    completed: projects.filter(p=>p.status==="completed").length,
    archived:  projects.filter(p=>p.status==="archived").length,
    all:       projects.length,
  };
  const rows = filtered.map(p => {
    const delay = monthDiff(p.baselineLaunchYear,p.baselineLaunchMonth,p.forecastLaunchYear,p.forecastLaunchMonth);
    const totalCost = p.tasks.reduce((s,t)=>s+(t.cost||0),0);
    const totalRev  = p.salesPlan.reduce((s,r)=>s+(r.rev||0),0);
    const taskCount = p.tasks.length;
    const avgProgress = taskCount>0 ? Math.round(p.tasks.reduce((s,t)=>s+(t.progress||0),0)/taskCount) : 0;
    const statusCount = p.tasks.reduce((acc,t)=>{const k=t.status||"not_started"; acc[k]=(acc[k]||0)+1; return acc;},{});
    return {p, delay, totalCost, totalRev, taskCount, avgProgress, statusCount};
  });

  return (
    <div className="space-y-5 slide-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">全プロジェクト一覧</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border border-slate-600 overflow-hidden">
            {[["all","全事業部"],["hand_tool","HT"],["fastening","FT"]].map(([k,l]) => (
              <button key={k} onClick={()=>setDivFilter(k)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${divFilter===k?"bg-amber-600 text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="active">アクティブのみ ({counts.active})</option>
            <option value="completed">完了のみ ({counts.completed})</option>
            <option value="archived">アーカイブのみ ({counts.archived})</option>
            <option value="all">すべて ({counts.all})</option>
          </select>
        </div>
      </div>
      {rows.length===0 && (
        <p className="text-xs text-slate-500 text-center py-8 bg-slate-900 border border-slate-800">該当するプロジェクトがありません</p>
      )}
      {rows.length>0 && <div className="bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-800/60">
            <tr className="text-slate-400">
              <th className="px-3 py-3 text-left font-semibold">プロジェクト名</th>
              <th className="px-3 py-3 text-center font-semibold">事業部</th>
              <th className="px-3 py-3 text-left font-semibold">計画発売日</th>
              <th className="px-3 py-3 text-left font-semibold">予測発売日</th>
              <th className="px-3 py-3 text-center font-semibold">遅延</th>
              <th className="px-3 py-3 text-center font-semibold">タスク数</th>
              <th className="px-3 py-3 text-center font-semibold">進捗率</th>
              <th className="px-3 py-3 text-center font-semibold">内訳</th>
              <th className="px-3 py-3 text-right font-semibold">総コスト</th>
              <th className="px-3 py-3 text-right font-semibold">売上計画</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({p, delay, totalCost, totalRev, taskCount, avgProgress, statusCount}) => (
              <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                <td className="px-3 py-3 text-white font-medium">{p.name}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 ${DIVISION[p.division||"hand_tool"].bg} ${DIVISION[p.division||"hand_tool"].text}`}>
                    {DIVISION[p.division||"hand_tool"].short}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-300">{p.baselineLaunchYear}/{String(p.baselineLaunchMonth).padStart(2,'0')}</td>
                <td className="px-3 py-3 text-slate-300">{p.forecastLaunchYear}/{String(p.forecastLaunchMonth).padStart(2,'0')}</td>
                <td className={`px-3 py-3 text-center font-bold ${delay>0?"text-red-400":delay<0?"text-emerald-400":"text-slate-500"}`}>
                  {delay===0?"−":delay>0?`+${delay}M`:`${delay}M`}
                </td>
                <td className="px-3 py-3 text-center text-slate-300">{taskCount}</td>
                <td className="px-3 py-3 w-32">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{width:`${avgProgress}%`}}/>
                    </div>
                    <span className="text-emerald-400 font-semibold text-[11px] w-8 text-right">{avgProgress}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex gap-1 justify-center flex-wrap">
                    {Object.entries(STATUS_DEF).map(([k,v]) => statusCount[k]>0 && (
                      <span key={k} className={`text-[10px] font-semibold px-1.5 py-0.5 ${v.bg} ${v.text}`}>{v.label}×{statusCount[k]}</span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-amber-400">{totalCost.toLocaleString()}万</td>
                <td className="px-3 py-3 text-right text-emerald-300">{totalRev.toLocaleString()}万</td>
                <td className="px-3 py-3 text-right">
                  <button onClick={()=>{setSelectedId(p.id); setActiveTab(0);}}
                    className="text-[10px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white">開く</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      <p className="text-xs text-slate-500">単位: 万円　／　進捗率は各タスクの進捗％の平均</p>
    </div>
  );
}
