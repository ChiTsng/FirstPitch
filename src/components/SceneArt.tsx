import { useId } from 'react';

/** Original vector artwork: the same six diagrams connect the opening, chapters and navigation. */
export function SceneArt({ chapter = 3 }: { chapter?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="scene-art" viewBox="0 0 300 220" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-turf`} x2="0.8" y2="1"><stop stopColor="#5cc4a0" stopOpacity=".6"/><stop offset="1" stopColor="#1a7665" stopOpacity=".08"/></linearGradient>
        <radialGradient id={`${id}-glow`}><stop stopColor="#84e5c7" stopOpacity=".24"/><stop offset="1" stopColor="#84e5c7" stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse cx="150" cy="122" rx="145" ry="94" fill={`url(#${id}-glow)`}/>
      <g className="scene-art__ground">
        <path d="M150 192 34 98 Q150 -18 266 98Z" fill={`url(#${id}-turf)`} stroke="#83d7bd" strokeOpacity=".35"/>
        {[0,1,2,3].map(n => <path key={n} d={`M${57+n*15} ${118+n*12} Q150 ${20+n*22} ${243-n*15} ${118+n*12}`} stroke="#a5e6cc" strokeOpacity=".1"/>)}
        <path d="M150 175 96 127 150 79 204 127Z" fill="#cc9b68" fillOpacity=".13" stroke="#e9c887" strokeOpacity=".6"/>
        <path d="M150 192 34 98 M150 192 266 98" stroke="#f6ebcb" strokeOpacity=".6"/>
        {[ [150,175],[96,127],[150,79],[204,127] ].map(([x,y],n) => <rect key={n} x={x-3.5} y={y-3.5} width="7" height="7" rx="1" fill="#fff2d1" transform={`rotate(45 ${x} ${y})`}/>)}
      </g>
      {chapter === 0 && <g stroke="#fff1ce"><path d="M150 157V75" strokeDasharray="3 5"/><circle cx="150" cy="75" r="7" fill="#e4bd71"/><circle cx="150" cy="174" r="7" fill="#75d8b2"/><path d="m121 143 10-28" strokeWidth="6" strokeLinecap="round"/><circle className="scene-art__ball" cx="150" cy="113" r="5" fill="#fff7e6"/></g>}
      {chapter === 1 && <g stroke="#f2d28b"><path d="M120 56H173V125H120Z" fill="#edcc85" fillOpacity=".12"/><path d="m120 56 18-15h53v69l-18 15m0-69 18-15M138 41v69h53" opacity=".5"/><path d="M138 56v69m17-69v69m-35-46h53m-53 23h53" opacity=".4"/><circle cx="159" cy="85" r="7" fill="#fff5dc"/></g>}
      {chapter === 2 && <g><path className="scene-art__trail" d="M150 175Q124 18 221 61" stroke="#f2cf83" strokeWidth="2" strokeDasharray="5 5"/><circle cx="221" cy="61" r="6" fill="#fff3d2"/></g>}
      {chapter === 3 && <path className="scene-art__trail" d="m150 168 47-41-47-41-47 41Z" stroke="#89f1c7" strokeWidth="3" strokeDasharray="9 5"/>}
      {chapter === 4 && <g><path className="scene-art__trail" d="M196 116Q181 82 156 73" stroke="#f3cd80" strokeWidth="3" strokeDasharray="5 5"/><circle cx="186" cy="103" r="7" fill="#f3cd80"/><path d="m150 122 36-19" stroke="#a1e3d0" strokeDasharray="3 5"/></g>}
      {chapter === 5 && <g><path d="m160 182 109-91-9-9-109 91Z" fill="#edc877" fillOpacity=".4" stroke="#ffe6ae"/><circle cx="206" cy="137" r="7" fill="#ffe6ae"/><path d="m190 107 36 43m-36 0 36-43" stroke="#ea8b79" strokeWidth="2"/></g>}
    </svg>
  );
}

export function HeroBall() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 320 320" className="hero-ball" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-leather`} cx=".32" cy=".24" r=".75"><stop stopColor="#fffef2"/><stop offset=".5" stopColor="#eee9cf"/><stop offset=".78" stopColor="#b3b6a9"/><stop offset="1" stopColor="#485d63"/></radialGradient>
        <pattern id={`${id}-pores`} width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#5d6358" opacity=".16"/><circle cx="3.5" cy="3.5" r=".5" fill="#fff" opacity=".5"/></pattern>
        <clipPath id={`${id}-clip`}><circle cx="160" cy="160" r="136"/></clipPath>
      </defs>
      <circle cx="160" cy="160" r="137" fill="#c2d4cd"/>
      <circle cx="160" cy="160" r="136" fill={`url(#${id}-leather)`}/>
      <circle cx="160" cy="160" r="136" fill={`url(#${id}-pores)`}/>
      <g clipPath={`url(#${id}-clip)`} transform="rotate(-26 160 160)">
        {[82,238].map((x, i) => <g key={x}>
          <path d={`M${x} 14C${i ? 163 : 157} 91 ${i ? 163 : 157} 229 ${x} 306`} fill="none" stroke="#787468" strokeOpacity=".3" strokeWidth="5"/>
          <path d={`M${x} 14C${i ? 163 : 157} 91 ${i ? 163 : 157} 229 ${x} 306`} fill="none" stroke="#a33939" strokeWidth="2"/>
          {Array.from({length:24}, (_, n) => {
            const t = (n+.5)/24, u = 1-t;
            const y = u*u*u*14+3*u*u*t*91+3*u*t*t*229+t*t*t*306;
            const shift = 225*t*u, px = x+(i ? -shift : shift);
            return <path key={n} d={`m${px-6} ${y-4} 12 8m-12 0 12-8`} fill="none" stroke="#b4403f" strokeWidth="2.4" strokeLinecap="round"/>;
          })}
        </g>)}
      </g>
      <path d="M69 99A111 111 0 0 1 154 48" fill="none" stroke="#fffef1" strokeWidth="3" opacity=".65" strokeLinecap="round"/>
    </svg>
  );
}
