// ─── SVG CHART HELPERS ────────────────────────────────────────────────────────

function GapBarChart({data, labelKey="label", valueKey="gap", height=200}) {
  const W=700, H=height, padL=58, padR=16, padT=20, padB=52;
  const innerW=W-padL-padR, innerH=H-padT-padB;
  const vals=data.map(d=>d[valueKey]||0);
  const maxAbs=Math.max(...vals.map(v=>Math.abs(v)),1);
  const [tip,setTip]=useState(null);
  const zero=padT+innerH/2;
  const barW=Math.max(4,innerW/data.length*0.65);
  const halfH=innerH/2;
  function barY(v){return v>=0?zero-((v/maxAbs)*halfH):zero;}
  function barH(v){return (Math.abs(v)/maxAbs)*halfH;}
  const ticks=[-maxAbs,-maxAbs/2,0,maxAbs/2,maxAbs];
  return (
    <div className="relative" style={{width:'100%',aspectRatio:`${W}/${H}`}}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {ticks.map((t,i)=>{
          const y=padT+innerH/2-(t/maxAbs)*halfH;
          return(
            <g key={i}>
              <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={t===0?"#475569":"#1e293b"} strokeWidth={t===0?1.5:1} strokeDasharray={t===0?"0":"3 3"}/>
              <text x={padL-6} y={y+4} textAnchor="end" fill="#64748b" fontSize={10}>{Math.round(t)}万</text>
            </g>
          );
        })}
        {data.map((d,i)=>{
          const v=d[valueKey]||0;
          const x=padL+(i/data.length)*innerW+(innerW/data.length-barW)/2;
          return(
            <rect key={i} x={x} y={barY(v)} width={barW} height={Math.max(2,barH(v))}
              fill={v>=0?"#3b82f6":"#f59e0b"} rx={3}
              onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,d,i})}
              onMouseLeave={()=>setTip(null)}
              className="cursor-pointer"/>
          );
        })}
        {data.map((d,i)=>(i%Math.ceil(data.length/12)===0&&(
          <text key={i} x={padL+(i+0.5)/data.length*innerW} y={H-padB+16}
            textAnchor="middle" fill="#64748b" fontSize={9}
            transform={`rotate(-45,${padL+(i+0.5)/data.length*innerW},${H-padB+16})`}>
            {d[labelKey]}
          </text>
        )))}
        <line x1={padL} y1={zero} x2={W-padR} y2={zero} stroke="#64748b" strokeWidth={1}/>
      </svg>
      {tip&&(
        <div className="fixed z-50 bg-slate-800 border border-slate-700 rounded-none px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{left:tip.x+12,top:tip.y-50}}>
          <div className="text-slate-300 font-semibold mb-1">{tip.d[labelKey]}</div>
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400">計画: <span className="text-white font-bold">{Math.round(tip.d.plan||0).toLocaleString()}万円</span></span>
            <span className="text-slate-400">予測: <span className="text-white font-bold">{Math.round(tip.d.forecast||0).toLocaleString()}万円</span></span>
            <span className={`font-bold ${(tip.d[valueKey]||0)>=0?"text-blue-400":"text-amber-400"}`}>
              差異: {(tip.d[valueKey]||0)>=0?"+":" "}{Math.round(tip.d[valueKey]||0).toLocaleString()}万円
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
