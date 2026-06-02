// ─── COST TAB ─────────────────────────────────────────────────────────────────
function CostTab({costData,delayMonths}) {
  const [showTable,setShowTable]=useState(false);
  const active=costData.filter(d=>d.baseline>0||d.forecast>0);
  const gapData=active.map(d=>({...d,plan:d.baseline,forecast:d.forecast,gap:d.forecast-d.baseline}));
  const hasGap=gapData.some(d=>d.gap!==0);
  const totalB=costData.reduce((s,d)=>s+d.baseline,0);
  const peakB=Math.max(...costData.map(d=>d.baseline),0);

  return(
    <div className="space-y-5 slide-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">月別コスト推移（キャッシュアウト）</h2>
        {delayMonths!==0&&(
          <div className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${delayMonths>0?"bg-red-950 text-red-400 border-red-800":"bg-emerald-950 text-emerald-400 border-emerald-800"}`}>
            コスト発生タイミングが{Math.abs(delayMonths)}ヶ月{delayMonths>0?"後倒し":"前倒し"}
          </div>
        )}
      </div>
      <div className="bg-slate-900 rounded-none border border-slate-800 p-6">
        <p className="text-sm font-semibold text-slate-300 mb-4">計画 vs 予測コスト（月別）</p>
        <BarChartSVG data={active} keys={["baseline","forecast"]}
          colors={["#f59e0b","#3b82f6"]}
          labels={["計画コスト","予測コスト"]} formatter={v=>`${Math.round(v)}万`}/>
      </div>
      {hasGap&&(
        <div className="bg-slate-900 rounded-none border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-300">月別コスト差異（予測 − 計画）</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"/>マイナス差異</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"/>プラス差異</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">マイナス＝計画月にコストが未発生（後のタスクにシフト）　プラス＝当初計画より追加でコスト発生</p>
          <GapBarChart data={gapData} valueKey="gap" height={180}/>
          <button onClick={()=>setShowTable(!showTable)}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            {showTable?"▲ 月別詳細を閉じる":"▼ 月別詳細を表示"}
          </button>
          {showTable&&(
            <div className="mt-3 bg-slate-800/50 rounded-none overflow-hidden">
              <GapTable data={gapData} planKey="plan" fcstKey="forecast" gapKey="gap" sign="cost"/>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="総開発コスト（計画）" value={`${totalB.toLocaleString()}万円`} sub="計画ベース合計"/>
        <StatCard label="ピーク月コスト（計画）" value={`${peakB.toLocaleString()}万円`} sub="最大月次支出"/>
        {delayMonths!==0&&(
          <StatCard label="コストピーク月シフト" value={`${Math.abs(delayMonths)}ヶ月 ${delayMonths>0?"後倒し":"前倒し"}`}
            sub="キャッシュフローへの影響" valueClass={delayMonths>0?"text-red-400":"text-emerald-400"}/>
        )}
      </div>
    </div>
  );
}

// ─── SALES TAB ────────────────────────────────────────────────────────────────
function SalesTab({salesData,totalLoss,delayMonths,project}) {
  const [showTable,setShowTable]=useState(false);
  const baseTotal=salesData.reduce((s,d)=>s+d.baseRev,0);
  const fcstTotal=salesData.reduce((s,d)=>s+d.fcstRev,0);
  const gapData=salesData
    .filter(d=>d.baseRev!==0||d.fcstRev!==0)
    .map(d=>({...d,plan:d.baseRev,forecast:d.fcstRev,gap:d.fcstRev-d.baseRev}));
  const hasGap=gapData.some(d=>d.gap!==0);

  return(
    <div className="space-y-5 slide-in">
      <h2 className="text-lg font-bold text-white">売上・機会損失インパクト分析</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="計画累計売上（12ヶ月）" value={`${baseTotal.toLocaleString()}万円`} valueClass="text-emerald-400" sub="当初発売日ベース"/>
        <StatCard label="予測累計売上（12ヶ月）" value={`${fcstTotal.toLocaleString()}万円`} valueClass="text-indigo-400" sub="現在の予測発売日ベース"/>
        <div className={`rounded-none border p-5 ${totalLoss>0?"border-red-800/60 bg-red-950/20":"bg-slate-900 border-slate-800"}`}>
          <p className="text-xs text-slate-400 mb-1">機会損失（現時点累計）</p>
          <p className={`text-2xl font-black ${totalLoss>0?"text-red-400":totalLoss<0?"text-emerald-400":"text-slate-400"}`}>
            {totalLoss>0?`-${totalLoss.toLocaleString()}万円`:totalLoss<0?`+${Math.abs(totalLoss).toLocaleString()}万円`:"なし"}
          </p>
          <p className="text-xs text-slate-500 mt-1">{totalLoss>0?"⚠ 遅延による売上未達額":totalLoss<0?"✓ 前倒しによる追加売上":"遅延なし"}</p>
        </div>
      </div>
      <div className="bg-slate-900 rounded-none border border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">累積売上比較（計画 vs 予測）</h3>
        <LineChartSVG data={salesData} keys={["cumBase","cumForecast"]}
          colors={["#f59e0b","#6366f1"]} labels={["累積売上（計画）","累積売上（予測）"]}
          formatter={v=>`${Math.round(v).toLocaleString()}万`}/>
      </div>
      {hasGap&&(
        <div className="bg-slate-900 rounded-none border border-red-900/40 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-300">月別売上差異（予測 − 計画）</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"/>マイナス差異</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"/>プラス差異</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            マイナス＝計画より売上が少ない月（発売遅延による機会損失）　プラス＝計画を上回る月
          </p>
          <GapBarChart data={gapData} valueKey="gap" height={200}/>
          <button onClick={()=>setShowTable(!showTable)}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            {showTable?"▲ 月別詳細を閉じる":"▼ 月別詳細を表示（計画 / 予測 / 差異）"}
          </button>
          {showTable&&(
            <div className="mt-3 bg-slate-800/50 rounded-none overflow-hidden">
              <GapTable data={gapData} planKey="plan" fcstKey="forecast" gapKey="gap" sign="revenue"/>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FISCAL TAB ───────────────────────────────────────────────────────────────
function FiscalTab({projects}) {
  const [divFilter, setDivFilter] = useState("all");
  const filteredProjects = divFilter==="all" ? projects : projects.filter(p => (p.division||"hand_tool")===divFilter);

  const allMap = useMemo(() => {
    const m = {};
    filteredProjects.forEach(p => {
      const pm = projectMonthlyAggregate(p);
      Object.entries(pm).forEach(([k, v]) => {
        if (!m[k]) m[k] = { planCost:0, fcstCost:0, planRev:0, fcstRev:0 };
        m[k].planCost += v.planCost; m[k].fcstCost += v.fcstCost;
        m[k].planRev  += v.planRev;  m[k].fcstRev  += v.fcstRev;
      });
    });
    return m;
  }, [filteredProjects]);

  const availableFYs = useMemo(() => {
    const set = new Set();
    Object.keys(allMap).forEach(k => {
      const [y, m] = k.split('-').map(Number);
      set.add(fiscalYearOfYM(y, m));
    });
    set.add(FY_BASE_YEAR);
    const min = Math.min(...set) - 1;
    const max = Math.max(...set) + 3;
    const arr = [];
    for (let y = min; y <= max; y++) arr.push(y);
    return arr;
  }, [allMap]);

  const [fy, setFy] = useState(FY_BASE_YEAR);
  const [half, setHalf] = useState("full");
  const halfLabel = half==="h1" ? "上期" : half==="h2" ? "下期" : "通期";

  const monthsAll = fiscalMonths(fy);
  const monthsFiltered = half==="h1" ? monthsAll.slice(0,6) : half==="h2" ? monthsAll.slice(6,12) : monthsAll;

  const rows = useMemo(() => monthsFiltered.map(({year, month}) => {
    const k = `${year}-${String(month).padStart(2,'0')}`;
    const v = allMap[k] || { planCost:0, fcstCost:0, planRev:0, fcstRev:0 };
    return {
      label: `${year}/${String(month).padStart(2,'0')}`,
      year, month,
      planCost: v.planCost, fcstCost: v.fcstCost,
      planRev: v.planRev,   fcstRev: v.fcstRev,
      costGap: v.fcstCost - v.planCost,
      revGap:  v.fcstRev  - v.planRev,
    };
  }), [allMap, fy, half]);

  const tot = rows.reduce((s, r) => ({
    planCost: s.planCost + r.planCost, fcstCost: s.fcstCost + r.fcstCost,
    planRev:  s.planRev  + r.planRev,  fcstRev:  s.fcstRev  + r.fcstRev,
    costGap:  s.costGap  + r.costGap,  revGap:   s.revGap   + r.revGap,
  }), {planCost:0,fcstCost:0,planRev:0,fcstRev:0,costGap:0,revGap:0});

  const costGapData = rows.map(r => ({label: `${r.month}月`, gap: r.costGap}));
  const revGapData  = rows.map(r => ({label: `${r.month}月`, gap: r.revGap}));
  const hasCostGap  = rows.some(r => r.costGap !== 0);
  const hasRevGap   = rows.some(r => r.revGap !== 0);

  return (
    <div className="space-y-5 slide-in">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">期次サマリー</h2>
          <p className="text-xs text-slate-400 mt-1">4月始まり・各月の計画 vs 予測の差異を集計（{divFilter==="all"?"全事業部":DIVISION[divFilter].label}・{filteredProjects.length}件）</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex border border-slate-600 overflow-hidden">
            {[["all","全事業部"],["hand_tool","HT"],["fastening","FT"]].map(([k,l]) => (
              <button key={k} onClick={()=>setDivFilter(k)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${divFilter===k?"bg-amber-600 text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>
          <select value={fy} onChange={e=>setFy(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            {availableFYs.map(y => (
              <option key={y} value={y}>第{fyToPeriod(y)}期（{y}年4月〜{y+1}年3月）</option>
            ))}
          </select>
          <div className="flex border border-slate-600 overflow-hidden">
            {[["full","通期"],["h1","上期"],["h2","下期"]].map(([k,l]) => (
              <button key={k} onClick={()=>setHalf(k)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${half===k?"bg-indigo-600 text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label={`${halfLabel}累計コスト（計画）`} value={`${tot.planCost.toLocaleString()}万円`} valueClass="text-slate-200"/>
        <StatCard label={`${halfLabel}累計コスト（予測）`} value={`${tot.fcstCost.toLocaleString()}万円`}
          valueClass={tot.costGap>0?"text-red-400":tot.costGap<0?"text-emerald-400":"text-slate-200"}
          sub={tot.costGap!==0?`差異 ${tot.costGap>0?"+":""}${tot.costGap.toLocaleString()}万円`:"差異なし"}/>
        <StatCard label={`${halfLabel}累計売上（計画）`} value={`${tot.planRev.toLocaleString()}万円`} valueClass="text-emerald-300"/>
        <StatCard label={`${halfLabel}累計売上（予測）`} value={`${tot.fcstRev.toLocaleString()}万円`}
          valueClass={tot.revGap<0?"text-red-400":tot.revGap>0?"text-emerald-400":"text-slate-200"}
          sub={tot.revGap!==0?`差異 ${tot.revGap>0?"+":""}${tot.revGap.toLocaleString()}万円`:"差異なし"}/>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-300">月別コスト差異（予測 − 計画）</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"/>マイナス差異</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"/>プラス差異</span>
          </div>
        </div>
        {hasCostGap ? <GapBarChart data={costGapData} valueKey="gap" height={200}/>
          : <p className="text-xs text-slate-500 text-center py-12">この期の月別コスト差異はありません</p>}
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-300">月別売上差異（予測 − 計画）</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"/>マイナス差異</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"/>プラス差異</span>
          </div>
        </div>
        {hasRevGap ? <GapBarChart data={revGapData} valueKey="gap" height={200}/>
          : <p className="text-xs text-slate-500 text-center py-12">この期の月別売上差異はありません</p>}
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">月別詳細</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/60">
              <tr className="text-slate-400">
                <th className="px-3 py-2 text-left font-semibold">月</th>
                <th className="px-3 py-2 text-right font-semibold">計画コスト</th>
                <th className="px-3 py-2 text-right font-semibold">予測コスト</th>
                <th className="px-3 py-2 text-right font-semibold">コスト差異</th>
                <th className="px-3 py-2 text-right font-semibold">計画売上</th>
                <th className="px-3 py-2 text-right font-semibold">予測売上</th>
                <th className="px-3 py-2 text-right font-semibold">売上差異</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label} className="border-t border-slate-800 hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-300 font-medium">{r.label}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{r.planCost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-300">{r.fcstCost.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${r.costGap>0?"text-red-400":r.costGap<0?"text-emerald-400":"text-slate-600"}`}>
                    {r.costGap===0?"−":`${r.costGap>0?"+":""}${r.costGap.toLocaleString()}`}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">{r.planRev.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-300">{r.fcstRev.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${r.revGap<0?"text-red-400":r.revGap>0?"text-emerald-400":"text-slate-600"}`}>
                    {r.revGap===0?"−":`${r.revGap>0?"+":""}${r.revGap.toLocaleString()}`}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-700 bg-slate-800/40 font-bold">
                <td className="px-3 py-2 text-white">{halfLabel}合計</td>
                <td className="px-3 py-2 text-right text-slate-200">{tot.planCost.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-slate-200">{tot.fcstCost.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right ${tot.costGap>0?"text-red-400":tot.costGap<0?"text-emerald-400":"text-slate-600"}`}>
                  {tot.costGap===0?"−":`${tot.costGap>0?"+":""}${tot.costGap.toLocaleString()}`}
                </td>
                <td className="px-3 py-2 text-right text-slate-200">{tot.planRev.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-slate-200">{tot.fcstRev.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right ${tot.revGap<0?"text-red-400":tot.revGap>0?"text-emerald-400":"text-slate-600"}`}>
                  {tot.revGap===0?"−":`${tot.revGap>0?"+":""}${tot.revGap.toLocaleString()}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">単位: 万円　／　全プロジェクトを合算</p>
      </div>
    </div>
  );
}
