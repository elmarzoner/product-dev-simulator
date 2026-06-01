// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
  const [projects,setProjects]=useState(loadProjects);
  const [selectedId,setSelectedId]=useState(1);
  const [activeTab,setActiveTab]=useState(0);
  const [editingTask,setEditingTask]=useState(null);
  const [showNewProject,setShowNewProject]=useState(false);
  const [newProjectName,setNewProjectName]=useState("");
  const [showDataMenu, setShowDataMenu] = useState(false);

  useEffect(()=>{ saveProjects(projects); },[projects]);
  useEffect(()=>{ setEditingTask(null); setActiveTab(t=>t===5?5:t); },[selectedId]);

  const project=useMemo(()=>projects.find(p=>p.id===selectedId)||projects[0],[projects,selectedId]);

  const updateProject=useCallback((patch)=>{
    setProjects(prev=>prev.map(p=>p.id===project.id?{...p,...patch}:p));
  },[project]);

  const delayMonths=useMemo(()=>
    monthDiff(project.baselineLaunchYear,project.baselineLaunchMonth,
              project.forecastLaunchYear,project.forecastLaunchMonth),
  [project]);

  const getFcstOffsets = useCallback((task)=>{
    const isCustom = task.fcstStartOffset!==null && task.fcstStartOffset!==undefined;
    return {
      fcstStart: isCustom ? task.fcstStartOffset : task.startOffset + delayMonths,
      fcstEnd:   (task.fcstEndOffset!==null&&task.fcstEndOffset!==undefined)
                 ? task.fcstEndOffset : task.endOffset + delayMonths,
      isCustom,
    };
  },[delayMonths]);

  const timelineMonths=useMemo(()=>{
    const minO=Math.min(...project.tasks.map(t=>t.startOffset))-1;
    const maxO=Math.max(...project.tasks.map(t=>{
      const {fcstEnd}=getFcstOffsets(t);
      return Math.max(t.endOffset,fcstEnd,12);
    }))+1;
    const arr=[];
    for(let o=minO;o<=maxO;o++){
      const b=addMonths(project.baselineLaunchYear,project.baselineLaunchMonth,o);
      arr.push({offset:o,...b,label:monthLabel(b.year,b.month)});
    }
    return arr;
  },[project,getFcstOffsets]);

  const costData=useMemo(()=>{
    const map={};
    timelineMonths.forEach(m=>{ map[m.offset]={label:m.label,baseline:0,forecast:0}; });
    project.tasks.forEach(task=>{
      const {fcstStart,fcstEnd}=getFcstOffsets(task);
      const durB=task.endOffset-task.startOffset+1;
      const monthlyB=task.costType==="spread"?task.cost/durB:0;
      for(let o=task.startOffset;o<=task.endOffset;o++){
        const val=task.costType==="lump"?(o===task.endOffset?task.cost:0):monthlyB;
        if(map[o]) map[o].baseline+=val;
      }
      const durF=fcstEnd-fcstStart+1;
      const monthlyF=task.costType==="spread"?task.cost/Math.max(1,durF):0;
      for(let o=fcstStart;o<=fcstEnd;o++){
        const val=task.costType==="lump"?(o===fcstEnd?task.cost:0):monthlyF;
        if(map[o]) map[o].forecast+=val;
      }
    });
    return timelineMonths.map(m=>({
      label:m.label, offset:m.offset,
      baseline:Math.round(map[m.offset]?.baseline||0),
      forecast:Math.round(map[m.offset]?.forecast||0),
    }));
  },[project,timelineMonths,getFcstOffsets]);

  const salesData=useMemo(()=>{
    const sm={};
    project.salesPlan.forEach(s=>{sm[s.mo]=s.rev;});
    let cumBase=0,cumFcst=0;
    return timelineMonths.map(m=>{
      const br=m.offset>=1?(sm[m.offset]||0):0;
      const fr=(m.offset-delayMonths)>=1?(sm[m.offset-delayMonths]||0):0;
      cumBase+=br; cumFcst+=fr;
      return {label:m.label,offset:m.offset,baseRev:br,fcstRev:fr,loss:br-fr,
              cumBase,cumForecast:cumFcst,cumLoss:cumBase-cumFcst};
    });
  },[project,timelineMonths,delayMonths]);

  const totalLoss=useMemo(()=>{
    const now={year:new Date().getFullYear(),month:new Date().getMonth()+1};
    const todayOff=monthDiff(project.baselineLaunchYear,project.baselineLaunchMonth,now.year,now.month);
    const row=salesData.find(d=>d.offset===todayOff)||salesData[salesData.length-1];
    return row?.cumLoss||0;
  },[salesData,project]);

  function addProject(){
    if(!newProjectName.trim()) return;
    const id=Math.max(...projects.map(p=>p.id))+1;
    setProjects(prev=>[...prev,{
      id, name:newProjectName.trim(),
      baselineLaunchYear:2027,baselineLaunchMonth:4,
      forecastLaunchYear:2027,forecastLaunchMonth:4,
      tasks:[
        {id:1,name:"企画・調査",startOffset:-6,endOffset:-4,cost:50, costType:"lump",color:"#6366f1",fcstStartOffset:null,fcstEndOffset:null},
        {id:2,name:"開発・製造",startOffset:-4,endOffset:-1,cost:200,costType:"lump",color:"#f59e0b",fcstStartOffset:null,fcstEndOffset:null},
        {id:3,name:"販促",     startOffset:-1,endOffset:2, cost:80, costType:"lump",color:"#10b981",fcstStartOffset:null,fcstEndOffset:null},
      ],
      salesPlan:Array.from({length:12},(_,i)=>({mo:i+1,rev:0})),
    }]);
    setSelectedId(id);
    setShowNewProject(false);
    setNewProjectName("");
  }

  function deleteProject(id){
    setProjects(prev=>{
      const next = prev.filter(p=>p.id!==id);
      if(selectedId===id) setSelectedId(next[0]?.id);
      return next;
    });
  }

  function saveTask(f){
    const tasks=editingTask.id==="new"
      ?[...project.tasks,{...f,id:Date.now(),color:`hsl(${Math.random()*360},70%,55%)`}]
      :project.tasks.map(t=>t.id===editingTask.id?{...t,...f}:t);
    updateProject({tasks});
    setEditingTask(null);
  }

  // ── データ入出力 ─────────────────────────────────────
  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function ts() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
  }
  function csvEscape(v) {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function toCSV(headers, rows) {
    const BOM = "﻿";
    return BOM + [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\r\n");
  }
  function exportJSON() {
    downloadFile(`pdp_backup_${ts()}.json`,
      JSON.stringify({version:1, exportedAt:new Date().toISOString(), projects}, null, 2),
      "application/json");
  }
  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const arr = Array.isArray(data) ? data : data.projects;
        if (!Array.isArray(arr)) throw new Error("形式エラー");
        if (confirm(`${arr.length}件のプロジェクトをインポートします。\n現在のデータは上書きされます。よろしいですか？`)) {
          setProjects(normalizeProjects(arr));
          setSelectedId(arr[0]?.id);
          alert("インポート完了");
        }
      } catch (err) {
        alert("インポート失敗: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  function exportProjectsCSV() {
    const headers = ["プロジェクト名","事業部","ステータス","計画発売日","予測発売日","遅延月数","タスク数","平均進捗率","総コスト(万円)","売上計画(万円)"];
    const rows = projects.map(p => {
      const delay = monthDiff(p.baselineLaunchYear,p.baselineLaunchMonth,p.forecastLaunchYear,p.forecastLaunchMonth);
      const totalCost = p.tasks.reduce((s,t)=>s+(t.cost||0),0);
      const totalRev  = p.salesPlan.reduce((s,r)=>s+(r.rev||0),0);
      const avgProgress = p.tasks.length>0 ? Math.round(p.tasks.reduce((s,t)=>s+(t.progress||0),0)/p.tasks.length) : 0;
      return [p.name, DIVISION[p.division||"hand_tool"].label, (PROJECT_STATUS[p.status||"active"]?.label)||"アクティブ",
        `${p.baselineLaunchYear}/${String(p.baselineLaunchMonth).padStart(2,'0')}`,
        `${p.forecastLaunchYear}/${String(p.forecastLaunchMonth).padStart(2,'0')}`,
        delay, p.tasks.length, `${avgProgress}%`, totalCost, totalRev];
    });
    downloadFile(`pdp_projects_${ts()}.csv`, toCSV(headers, rows), "text/csv;charset=utf-8");
  }
  function exportTasksCSV() {
    const headers = ["プロジェクト名","タスク名","計画開始","計画終了","予測開始","予測終了","コスト(万円)","進捗率","ステータス","個別設定"];
    const rows = [];
    projects.forEach(p => {
      const delay = monthDiff(p.baselineLaunchYear,p.baselineLaunchMonth,p.forecastLaunchYear,p.forecastLaunchMonth);
      p.tasks.forEach(t => {
        const ps = offsetToYM(p.baselineLaunchYear,p.baselineLaunchMonth,t.startOffset);
        const pe = offsetToYM(p.baselineLaunchYear,p.baselineLaunchMonth,t.endOffset);
        const isCustom = t.fcstStartOffset !== null && t.fcstStartOffset !== undefined;
        const fs = offsetToYM(p.baselineLaunchYear,p.baselineLaunchMonth, isCustom?t.fcstStartOffset:t.startOffset+delay);
        const fe = offsetToYM(p.baselineLaunchYear,p.baselineLaunchMonth, (t.fcstEndOffset!=null)?t.fcstEndOffset:t.endOffset+delay);
        rows.push([p.name, t.name,
          `${ps.year}/${String(ps.month).padStart(2,'0')}`, `${pe.year}/${String(pe.month).padStart(2,'0')}`,
          `${fs.year}/${String(fs.month).padStart(2,'0')}`, `${fe.year}/${String(fe.month).padStart(2,'0')}`,
          t.cost||0, `${t.progress||0}%`, STATUS_DEF[t.status||"not_started"].label,
          isCustom ? "はい" : "いいえ"]);
      });
    });
    downloadFile(`pdp_tasks_${ts()}.csv`, toCSV(headers, rows), "text/csv;charset=utf-8");
  }
  function exportFiscalCSV() {
    const allMap = {};
    projects.forEach(p => {
      const pm = projectMonthlyAggregate(p);
      Object.entries(pm).forEach(([k,v]) => {
        if (!allMap[k]) allMap[k] = {planCost:0,fcstCost:0,planRev:0,fcstRev:0};
        allMap[k].planCost += v.planCost; allMap[k].fcstCost += v.fcstCost;
        allMap[k].planRev  += v.planRev;  allMap[k].fcstRev  += v.fcstRev;
      });
    });
    const keys = Object.keys(allMap).sort();
    const headers = ["年月","期","計画コスト(万円)","予測コスト(万円)","コスト差異","計画売上(万円)","予測売上(万円)","売上差異"];
    const rows = keys.map(k => {
      const [y,m] = k.split('-').map(Number);
      const v = allMap[k];
      return [`${y}/${String(m).padStart(2,'0')}`, `第${fyToPeriod(fiscalYearOfYM(y,m))}期`,
        v.planCost, v.fcstCost, v.fcstCost - v.planCost, v.planRev, v.fcstRev, v.fcstRev - v.planRev];
    });
    downloadFile(`pdp_fiscal_${ts()}.csv`, toCSV(headers, rows), "text/csv;charset=utf-8");
  }

  const TABS=["進捗タイムライン","月別コスト推移","売上・インパクト分析","期次サマリー","全プロジェクト一覧","プロジェクト設定"];

  return(
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-none bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <IcoTrend s={16} c="text-white"/>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">新商品開発プロセス進捗シミュレーター</h1>
          <p className="text-xs text-slate-400">発売日変更が財務インパクトに与える影響をリアルタイム分析</p>
        </div>
        {project && (
          <div className="ml-4 pl-4 border-l border-slate-700 flex items-center gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 ${DIVISION[project.division||"hand_tool"].bg} ${DIVISION[project.division||"hand_tool"].text}`}>
              {DIVISION[project.division||"hand_tool"].short}
            </span>
            <span className="text-base font-bold text-indigo-300">{project.name}</span>
          </div>
        )}
        {delayMonths!==0&&(
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${delayMonths>0?"bg-red-950 text-red-400 border-red-800":"bg-emerald-950 text-emerald-400 border-emerald-800"}`}>
            <IcoAlert s={12}/>
            {delayMonths>0?`${delayMonths}ヶ月遅延中`:`${Math.abs(delayMonths)}ヶ月前倒し`}
          </div>
        )}
        <div className="ml-auto relative">
          <button onClick={()=>setShowDataMenu(o=>!o)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-semibold transition-colors">
            📁 データ ▼
          </button>
          {showDataMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={()=>setShowDataMenu(false)}/>
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 z-40 w-56 shadow-xl">
                <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800">バックアップ</div>
                <button onClick={()=>{exportJSON(); setShowDataMenu(false);}}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">📦 JSONエクスポート（全データ）</button>
                <label className="w-full block text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 cursor-pointer">
                  📥 JSONインポート
                  <input type="file" accept=".json,application/json" className="hidden"
                    onChange={e=>{importJSON(e); setShowDataMenu(false);}}/>
                </label>
                <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider border-b border-t border-slate-800">CSV（Excel用）</div>
                <button onClick={()=>{exportProjectsCSV(); setShowDataMenu(false);}}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">📊 プロジェクト一覧</button>
                <button onClick={()=>{exportTasksCSV(); setShowDataMenu(false);}}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">📊 タスク詳細</button>
                <button onClick={()=>{exportFiscalCSV(); setShowDataMenu(false);}}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">📊 月別集計（全プロジェクト合算）</button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 min-w-[300px] bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
          <ProjectListPanel
            projects={projects}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            setActiveTab={setActiveTab}
            showNewProject={showNewProject}
            setShowNewProject={setShowNewProject}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            addProject={addProject}
          />
          <div className="p-4 flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="総開発コスト" value={`${project.tasks.reduce((s,t)=>s+t.cost,0).toLocaleString()}万円`}/>
              <MiniStat label="機会損失（累計）" value={totalLoss>0?`-${totalLoss.toLocaleString()}万円`:"なし"} valueClass={totalLoss>0?"text-red-400":"text-emerald-400"}/>
            </div>
            <button onClick={()=>setActiveTab(5)}
              className="w-full py-2.5 border border-dashed border-indigo-700 text-indigo-400 hover:bg-indigo-950/40 text-xs font-semibold transition-colors">
              ✎ タスク・売上・プロジェクト設定を編集
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-1 pt-2">
            {TABS.map((tab,i)=>(
              <button key={i} onClick={()=>setActiveTab(i)}
                className={`px-4 py-2.5 text-sm font-medium rounded-none transition-colors ${activeTab===i?"bg-slate-950 text-indigo-400 border-x border-t border-slate-700":"text-slate-400 hover:text-slate-200"}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-6 bg-slate-950">
            {activeTab===0&&<GanttTab project={project} delayMonths={delayMonths} timelineMonths={timelineMonths} getFcstOffsets={getFcstOffsets} updateProject={updateProject}/>}
            {activeTab===1&&<CostTab costData={costData} delayMonths={delayMonths}/>}
            {activeTab===2&&<SalesTab salesData={salesData} totalLoss={totalLoss} delayMonths={delayMonths} project={project}/>}
            {activeTab===3&&<FiscalTab projects={projects}/>}
            {activeTab===4&&<OverviewTab projects={projects} setSelectedId={setSelectedId} setActiveTab={setActiveTab}/>}
            {activeTab===5&&<SettingsTab
              project={project} updateProject={updateProject}
              deleteProject={()=>deleteProject(project.id)}
              editingTask={editingTask} setEditingTask={setEditingTask} saveTask={saveTask}
              getFcstOffsets={getFcstOffsets} delayMonths={delayMonths}/>}
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
