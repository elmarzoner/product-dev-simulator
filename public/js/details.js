// ─── FISCAL TAB ───────────────────────────────────────────────────────────────
function FiscalTab({projects}) {
  const [divFilter, setDivFilter] = useState("all");
  const [projFilter, setProjFilter] = useState("all"); // "all"=合算 / それ以外=project.id
  const selectedProject = projFilter!=="all" ? projects.find(p => String(p.id)===String(projFilter)) : null;
  const filteredProjects = selectedProject
    ? [selectedProject]
    : (divFilter==="all" ? projects : projects.filter(p => (p.division||"hand_tool")===divFilter));

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

  // 売上が実在する期のうち最も早い期。発売日を動かすと開発コストは発売前の期に、
  // 売上は発売後の期に入るため、「売上を確認したい」用途では売上のある期に寄せる。
  const earliestRevFY = useMemo(() => {
    let min = null;
    Object.entries(allMap).forEach(([k, v]) => {
      if (!(v.planRev || v.fcstRev)) return;
      const [y, m] = k.split('-').map(Number);
      const f = fiscalYearOfYM(y, m);
      if (min === null || f < min) min = f;
    });
    return min;
  }, [allMap]);

  const [fy, setFy] = useState(FY_BASE_YEAR);
  const fyTouched = useRef(false);
  // ユーザーが手動で期を選ぶ前で、現在の期に売上が無いのに他の期に売上がある場合は、
  // 売上のある最も早い期へ寄せる（発売日変更で売上が別の期に移動したケースを救済）。
  useEffect(() => {
    if (fyTouched.current || earliestRevFY === null) return;
    const curHasRev = monthsAll.some(({year, month}) => {
      const v = allMap[`${year}-${String(month).padStart(2,'0')}`];
      return v && (v.planRev || v.fcstRev);
    });
    if (!curHasRev) setFy(earliestRevFY);
  }, [earliestRevFY, allMap]);

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

  const costGapData = rows.map(r => ({label: `${r.month}月`, gap: r.costGap, plan: r.planCost, forecast: r.fcstCost}));
  const revGapData  = rows.map(r => ({label: `${r.month}月`, gap: r.revGap,  plan: r.planRev,  forecast: r.fcstRev}));
  const hasCostGap  = rows.some(r => r.costGap !== 0);
  const hasRevGap   = rows.some(r => r.revGap !== 0);

  return (
    <div className="space-y-5 slide-in">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">期次サマリー</h2>
          <p className="text-xs text-slate-400 mt-1">4月始まり・各月の計画 vs 予測の差異を集計（{selectedProject ? `${selectedProject.name}（単体）` : `${divFilter==="all"?"全事業部":DIVISION[divFilter].label}・${filteredProjects.length}件`}）</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <select value={projFilter} onChange={e=>setProjFilter(e.target.value)}
            className="bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="all">全プロジェクト合算</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className={`flex border border-slate-600 overflow-hidden ${projFilter!=="all"?"opacity-40 pointer-events-none":""}`}
            title={projFilter!=="all"?"プロジェクト個別表示中は無効":undefined}>
            {[["all","全事業部"],["hand_tool","HT"],["fastening","FT"]].map(([k,l]) => (
              <button key={k} onClick={()=>setDivFilter(k)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${divFilter===k?"bg-amber-600 text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>
          <select value={fy} onChange={e=>{fyTouched.current=true; setFy(Number(e.target.value));}}
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

      <div className="grid grid-cols-2 gap-4">
        <div className={`border p-5 ${tot.costGap>0?"border-red-800/60 bg-red-950/20":tot.costGap<0?"border-emerald-800/60 bg-emerald-950/20":"border-slate-800 bg-slate-900"}`}>
          <p className="text-xs text-slate-400 mb-1">{halfLabel}のコスト差異（予測 − 計画）</p>
          <p className={`text-3xl font-bold leading-none ${tot.costGap>0?"text-red-400":tot.costGap<0?"text-emerald-400":"text-slate-200"}`}>
            {tot.costGap>0?"+":""}{tot.costGap.toLocaleString()}<span className="text-base font-semibold ml-1">万円</span>
          </p>
        </div>
        <div className={`border p-5 ${tot.revGap<0?"border-red-800/60 bg-red-950/20":tot.revGap>0?"border-emerald-800/60 bg-emerald-950/20":"border-slate-800 bg-slate-900"}`}>
          <p className="text-xs text-slate-400 mb-1">{halfLabel}の売上差異（予測 − 計画）</p>
          <p className={`text-3xl font-bold leading-none ${tot.revGap<0?"text-red-400":tot.revGap>0?"text-emerald-400":"text-slate-200"}`}>
            {tot.revGap>0?"+":""}{tot.revGap.toLocaleString()}<span className="text-base font-semibold ml-1">万円</span>
          </p>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">※ コストと売上は性質が異なるため合算していません。いずれも発売日のズレで各期に移動した分で、商品トータルでは増減しません。</p>

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
