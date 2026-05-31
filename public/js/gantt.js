// ─── GANTT TAB ────────────────────────────────────────────────────────────────
function GanttTab({project,delayMonths,timelineMonths,getFcstOffsets,updateProject}) {
  const minO=Math.min(...project.tasks.map(t=>t.startOffset))-1;
  const maxO=Math.max(...project.tasks.map(t=>{
    const {fcstEnd}=getFcstOffsets(t);
    return Math.max(t.endOffset,fcstEnd,3);
  }))+1;
  const vis=timelineMonths.filter(m=>m.offset>=minO&&m.offset<=maxO);
  const total=vis.length;
  function ci(offset){return vis.findIndex(m=>m.offset===offset);}
  function pct(n){return `${(n/total)*100}%`;}

  const today=new Date();
  const todayOffset=monthDiff(project.baselineLaunchYear,project.baselineLaunchMonth,today.getFullYear(),today.getMonth()+1);
  const dayOfMonth=today.getDate();
  const daysInMonth=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
  const todayFracIdx=ci(todayOffset)+(dayOfMonth-1)/daysInMonth;
  const showTodayLine=todayFracIdx>=0 && todayFracIdx<=total;

  return(
    <div className="space-y-4 slide-in">
      {/* 発売日設定 */}
      <div className="bg-slate-900 border border-slate-800 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">発売日設定</p>
        <div className="grid grid-cols-2 gap-6">
          <LaunchDatePicker label="当初目標発売日" year={project.baselineLaunchYear} month={project.baselineLaunchMonth}
            onChange={(y,m)=>updateProject({baselineLaunchYear:y,baselineLaunchMonth:m})}/>
          <LaunchDatePicker label="現在の予測発売日" year={project.forecastLaunchYear} month={project.forecastLaunchMonth}
            onChange={(y,m)=>updateProject({forecastLaunchYear:y,forecastLaunchMonth:m})} accent/>
        </div>
        {delayMonths!==0&&(
          <div className={`mt-4 p-2.5 text-xs ${delayMonths>0?"bg-red-950/60 border border-red-800/60 text-red-300":"bg-emerald-950/60 border border-emerald-800/60 text-emerald-300"}`}>
            <span className="font-semibold">{delayMonths>0?`⚠ ${delayMonths}ヶ月の遅延が発生しています`:`✓ ${Math.abs(delayMonths)}ヶ月の前倒しです`}</span>
            <span className="ml-2 opacity-80">個別設定のないタスクは自動スライドします</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">進捗タイムライン（ガントチャート）</h2>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span><span className="inline-block w-4 h-2 rounded-sm bg-blue-500 mr-1.5 align-middle"/>計画</span>
          <span><span className={`inline-block w-4 h-2 rounded-sm mr-1.5 align-middle ${delayMonths>0?"bg-red-500":delayMonths<0?"bg-emerald-500":"bg-indigo-500"}`}/>予測（連動）</span>
          <span><span className="inline-block w-4 h-2 rounded-sm bg-amber-500 mr-1.5 align-middle"/>予測（個別設定）</span>
        </div>
      </div>
      <div className="bg-slate-900 rounded-none border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{minWidth:`${Math.max(700,total*56)}px`,position:'relative'}}>
            {showTodayLine && (
              <div className="absolute top-0 bottom-0 pointer-events-none z-10"
                style={{left:`calc(176px + (100% - 176px) * ${todayFracIdx/total})`,width:'2px',background:'#facc15',boxShadow:'0 0 8px rgba(250,204,21,0.6)'}}>
                <div className="absolute -top-1 -left-2 text-[9px] text-yellow-300 font-bold whitespace-nowrap">今日</div>
              </div>
            )}
            <div className="flex border-b border-slate-800">
              <div className="w-44 shrink-0 px-4 py-3 text-xs font-semibold text-slate-400 border-r border-slate-800 sticky left-0 bg-slate-900 z-20">タスク名</div>
              <div className="flex flex-1">
                {vis.map((m,i)=>{
                  const isBase=m.offset===0;
                  const isFcstDefault=m.offset===delayMonths&&delayMonths!==0;
                  return(
                    <div key={i} className={`flex-1 py-3 text-center border-r border-slate-800/40 text-xs ${isBase?"bg-slate-700/30":isFcstDefault?"bg-indigo-950/40":""}`}>
                      <div className={`font-semibold ${isBase?"text-white":isFcstDefault?"text-indigo-300":"text-slate-400"}`}>{m.month}月</div>
                      <div className="text-slate-600 text-[9px]">{m.year}</div>
                      {isBase&&<div className="text-[9px] text-slate-400">📦</div>}
                      {isFcstDefault&&<div className="text-[9px] text-indigo-400">🚀</div>}
                    </div>
                  );
                })}
              </div>
            </div>
            {project.tasks.map(task=>{
              const bs=ci(task.startOffset), be=ci(task.endOffset);
              const {fcstStart,fcstEnd,isCustom}=getFcstOffsets(task);
              const fs=ci(fcstStart), fe=ci(fcstEnd);
              const hasDelay=delayMonths!==0||isCustom;
              const barColor=isCustom?"#f59e0b":delayMonths>0?"#ef4444":"#10b981";
              return(
                <div key={task.id} className="border-b-2 border-slate-700">
                  <div className="flex" style={{height:'40px'}}>
                    <div className="w-44 shrink-0 px-3 flex items-center gap-2 border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{background:task.color}}/>
                      <span className="text-xs text-slate-300 font-medium truncate">{task.name}</span>
                      {isCustom&&<span title="個別設定中"><IcoPin s={10} c="text-amber-400 shrink-0"/></span>}
                    </div>
                    <div className="flex-1 relative">
                      {bs>=0&&be>=0&&(
                        <div className="gantt-bar absolute top-1/2 -translate-y-1/2 h-5 rounded flex items-center px-2 overflow-hidden"
                          style={{left:pct(bs),width:pct(be-bs+1),background:task.color,opacity:hasDelay?0.7:1,border:hasDelay?"1px dashed rgba(255,255,255,0.5)":"none"}}>
                          {(task.progress||0)>0 && (
                            <div className="absolute inset-y-0 left-0 bg-white/30" style={{width:`${task.progress}%`}}/>
                          )}
                          <span className="relative text-white text-[10px] font-medium truncate">
                            計画 {(task.progress||0)>0?`(${task.progress}%)`:""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {hasDelay&&(
                    <div className="flex" style={{height:'34px'}}>
                      <div className="w-44 shrink-0 px-3 flex items-center justify-end border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                        {isCustom
                          ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400">個別設定</span>
                          : <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${delayMonths>0?"bg-red-950 text-red-400":"bg-emerald-950 text-emerald-400"}`}>
                              {delayMonths>0?`+${delayMonths}M 遅延`:`${delayMonths}M 前倒し`}
                            </span>
                        }
                      </div>
                      <div className="flex-1 relative">
                        {fs>=0&&fe<total&&(
                          <div className="gantt-bar absolute top-1/2 -translate-y-1/2 h-4 rounded flex items-center px-2"
                            style={{left:pct(fs),width:pct(fe-fs+1),background:barColor}}>
                            <span className="text-white text-[10px] font-medium">予測</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800 flex gap-6 text-xs text-slate-500">
          <span>📦 計画発売日: {project.baselineLaunchYear}年{project.baselineLaunchMonth}月</span>
          {delayMonths!==0&&<span className="text-indigo-400">🚀 予測発売日: {project.forecastLaunchYear}年{project.forecastLaunchMonth}月</span>}
          {project.tasks.some(t=>t.fcstStartOffset!==null)&&<span className="text-amber-400">📌 個別設定ありのタスクがあります</span>}
        </div>
      </div>
    </div>
  );
}
