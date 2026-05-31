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
              fill={v>=0?"#10b981":"#ef4444"} rx={3}
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
            <span className={`font-bold ${(tip.d[valueKey]||0)>=0?"text-emerald-400":"text-red-400"}`}>
              差異: {(tip.d[valueKey]||0)>=0?"+":" "}{Math.round(tip.d[valueKey]||0).toLocaleString()}万円
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function BarChartSVG({data,keys,colors,labels,height=260,formatter=(v)=>`${v}万`}) {
  const W=700,H=height,padL=58,padR=16,padT=16,padB=52;
  const innerW=W-padL-padR,innerH=H-padT-padB;
  const maxVal=Math.max(...data.flatMap(d=>keys.map(k=>d[k]||0)),1);
  const barW=Math.max(4,(innerW/data.length)*0.7/keys.length);
  const groupW=innerW/data.length;
  const [tip,setTip]=useState(null);
  const yTicks=5;
  return(
    <div className="relative" style={{width:'100%',aspectRatio:`${W}/${H}`}}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {Array.from({length:yTicks+1},(_,i)=>{
          const y=padT+innerH-(i/yTicks)*innerH;
          return(<g key={i}>
            <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#1e293b" strokeWidth={1}/>
            <text x={padL-6} y={y+4} textAnchor="end" fill="#64748b" fontSize={10}>{formatter(Math.round((i/yTicks)*maxVal))}</text>
          </g>);
        })}
        {data.map((d,di)=>{
          const gx=padL+di*groupW+groupW*0.15;
          return keys.map((k,ki)=>{
            const val=d[k]||0;
            const bh=(val/maxVal)*innerH;
            const x=gx+ki*(barW+2);
            const y=padT+innerH-bh;
            return(<rect key={k} x={x} y={y} width={barW} height={bh} fill={colors[ki]}
              rx={3} opacity={0.9}
              onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,d,di})}
              onMouseLeave={()=>setTip(null)}
              className="cursor-pointer"/>);
          });
        })}
        {data.map((d,di)=>(di%Math.ceil(data.length/12)===0&&(
          <text key={di} x={padL+di*groupW+groupW/2} y={H-padB+16}
            textAnchor="middle" fill="#64748b" fontSize={9}
            transform={`rotate(-45,${padL+di*groupW+groupW/2},${H-padB+16})`}>
            {d.label}
          </text>
        )))}
        {keys.map((k,ki)=>(
          <g key={k} transform={`translate(${padL+ki*140},${H-8})`}>
            <rect x={0} y={-8} width={10} height={10} fill={colors[ki]} rx={2}/>
            <text x={14} y={0} fill="#94a3b8" fontSize={11}>{labels[ki]}</text>
          </g>
        ))}
      </svg>
      {tip&&(
        <div className="fixed z-50 bg-slate-800 border border-slate-700 rounded-none px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{left:tip.x+12,top:tip.y-40}}>
          <div className="text-slate-300 font-semibold mb-1">{data[tip.di].label}</div>
          {keys.map((k,ki)=>(
            <div key={k} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{background:colors[ki]}}/>
              <span className="text-slate-400">{labels[ki]}:</span>
              <span className="text-white font-bold">{formatter(data[tip.di][k]||0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LineChartSVG({data,keys,colors,labels,height=240,formatter=(v)=>`${v}万`}) {
  const W=700,H=height,padL=68,padR=16,padT=16,padB=52;
  const innerW=W-padL-padR,innerH=H-padT-padB;
  const maxVal=Math.max(...data.flatMap(d=>keys.map(k=>d[k]||0)),1);
  const [tip,setTip]=useState(null);
  const n=data.length;
  function px(i){return padL+(i/(n-1))*innerW;}
  function py(v){return padT+innerH-(v/maxVal)*innerH;}
  const yTicks=5;
  const gw=innerW/n;
  return(
    <div className="relative" style={{width:'100%',aspectRatio:`${W}/${H}`}}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {Array.from({length:yTicks+1},(_,i)=>{
          const y=padT+innerH-(i/yTicks)*innerH;
          return(<g key={i}>
            <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#1e293b" strokeWidth={1}/>
            <text x={padL-6} y={y+4} textAnchor="end" fill="#64748b" fontSize={10}>{formatter(Math.round((i/yTicks)*maxVal))}</text>
          </g>);
        })}
        {keys.map((k,ki)=>(
          <polygon key={`area-${k}`}
            points={`${px(0)},${padT+innerH} ${data.map((_,i)=>`${px(i)},${py(data[i][k]||0)}`).join(' ')} ${px(n-1)},${padT+innerH}`}
            fill={colors[ki]} opacity={0.06}/>
        ))}
        {keys.map((k,ki)=>(
          <polyline key={k}
            points={data.map((_,i)=>`${px(i)},${py(data[i][k]||0)}`).join(' ')}
            fill="none" stroke={colors[ki]} strokeWidth={2.5} strokeLinejoin="round"
            strokeDasharray={ki>0?"8 4":"0"}/>
        ))}
        {data.map((_,i)=>(
          <rect key={i} x={px(i)-gw/2} y={padT} width={gw} height={innerH} fill="transparent"
            onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,i})}
            onMouseLeave={()=>setTip(null)}/>
        ))}
        {data.map((d,i)=>(i%Math.ceil(n/10)===0&&(
          <text key={i} x={px(i)} y={H-padB+16} textAnchor="middle" fill="#64748b" fontSize={9}
            transform={`rotate(-45,${px(i)},${H-padB+16})`}>{d.label}</text>
        )))}
        {keys.map((k,ki)=>(
          <g key={k} transform={`translate(${padL+ki*180},${H-8})`}>
            <line x1={0} y1={-4} x2={14} y2={-4} stroke={colors[ki]} strokeWidth={2.5} strokeDasharray={ki>0?"6 3":"0"}/>
            <text x={18} y={0} fill="#94a3b8" fontSize={11}>{labels[ki]}</text>
          </g>
        ))}
      </svg>
      {tip&&(()=>{
        const d=data[tip.i];
        return(
          <div className="fixed z-50 bg-slate-800 border border-slate-700 rounded-none px-3 py-2 text-xs shadow-xl pointer-events-none"
            style={{left:tip.x+12,top:tip.y-40}}>
            <div className="text-slate-300 font-semibold mb-1">{d.label}</div>
            {keys.map((k,ki)=>(
              <div key={k} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{background:colors[ki]}}/>
                <span className="text-slate-400">{labels[ki]}:</span>
                <span className="text-white font-bold">{formatter(d[k]||0)}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

function GapTable({data,planKey,fcstKey,gapKey,labelKey="label",unit="万円",sign="cost"}) {
  const rows=data.filter(d=>(d[planKey]||0)!==0||(d[fcstKey]||0)!==0);
  if(rows.length===0) return null;
  return(
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-2 px-3 text-slate-400 font-semibold">月</th>
            <th className="text-right py-2 px-3 text-slate-400 font-semibold">計画</th>
            <th className="text-right py-2 px-3 text-slate-400 font-semibold">予測</th>
            <th className="text-right py-2 px-3 text-slate-400 font-semibold">差異</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d,i)=>{
            const plan=Math.round(d[planKey]||0);
            const fcst=Math.round(d[fcstKey]||0);
            const gap=Math.round(d[gapKey]||0);
            return(
              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-3 text-slate-300 font-medium">{d[labelKey]}</td>
                <td className="py-2 px-3 text-right text-slate-300">{plan>0?`${plan.toLocaleString()}${unit}`:"—"}</td>
                <td className="py-2 px-3 text-right text-slate-300">{fcst>0?`${fcst.toLocaleString()}${unit}`:"—"}</td>
                <td className={`py-2 px-3 text-right font-bold ${gap<0?"text-red-400":gap>0?"text-emerald-400":"text-slate-500"}`}>
                  {gap!==0?(gap>0?"+":"")+gap.toLocaleString()+unit:"±0"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
