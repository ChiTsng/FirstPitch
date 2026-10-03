import { useId } from 'react';

/** Sweet spot (90,55), pivot/knob (350,235). Geometry matches the contact choreography. */
export function HitBat() {
  const id = useId();
  return <svg className="opening__bat" viewBox="0 0 440 300" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff0c9"/><stop offset=".32" stopColor="#dfb574"/><stop offset=".65" stopColor="#b67c42"/><stop offset="1" stopColor="#674225"/></linearGradient>
      <clipPath id={`${id}-clip`}><path d="M0-6 115-9C187-11 208-24 276-25L356-25Q387-25 387 0T356 25H276C208 24 187 11 115 9L0 6Z"/></clipPath>
    </defs>
    <g transform="translate(350 235) rotate(-145.3)">
      <path d="M0-6 115-9C187-11 208-24 276-25L356-25Q387-25 387 0T356 25H276C208 24 187 11 115 9L0 6Z" fill={`url(#${id}-wood)`} stroke="#edca91" strokeWidth="1"/>
      <g clipPath={`url(#${id}-clip)`} fill="none" stroke="#754c2c" strokeWidth="1.3" opacity=".4">
        {[ -16, -8, 2, 12, 19 ].map((y,i) => <path key={y} d={`M90 ${y/3}Q240 ${y + (i%2 ? 8 : -8)} 390 ${y}`}/>)}
        <ellipse cx="291" cy="2" rx="57" ry="9"/><ellipse cx="292" cy="2" rx="35" ry="5"/>
      </g>
      <path d="M8-8 97-9 97 9 8 8Z" fill="#153636"/>
      {Array.from({length:9},(_,i)=><path key={i} d={`M${10+i*10}-8  ${20+i*10} 8`} stroke="#72908a" strokeWidth="2"/>)}
      <rect x="-7" y="-12" width="10" height="24" rx="4" fill="#d7b783"/>
      <path d="M160-7Q270-19 358-19" fill="none" stroke="#fff5d9" strokeWidth="2" opacity=".6"/>
    </g>
  </svg>;
}
