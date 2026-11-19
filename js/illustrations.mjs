import {stickers,COLORS,FACES} from './cube.mjs';
const icons={
  cube:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  book:'<path d="M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>', chevron:'<path d="m9 5 7 7-7 7"/>', down:'<path d="m6 9 6 6 6-6"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>',
  shuffle:'<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 5-5m2-3c2-3 3-4 5-4h3m-4-4 4 4-4 4"/>',
  play:'<path d="m7 4 13 8-13 8z"/>', pause:'<path d="M8 4v16m8-16v16"/>', back:'<path d="m15 5-7 7 7 7"/>',
  reset:'<path d="M3 4v6h6"/><path d="M4 9a9 9 0 1 1 0 7"/>', scan:'<path d="M3 9V4h5m8 0h5v5m0 6v5h-5m-8 0H3v-5m4-3h10"/>',
  notation:'<rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="M6 8h1m3 0h1m3 0h1m3 0h.2M6 12h1m3 0h1m3 0h1m3 0h.2M8 16h8"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1"/>',
  orbit:'<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="11" ry="5.5" transform="rotate(-30 12 12)"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2"/>',
  paint:'<path d="m14 6 4-4 4 4-4 4m-2-2-8 8-4 1 1-4 8-8"/><path d="M4 21h16"/>',
  print:'<path d="M6 8V3h12v5M6 17H3V9h18v8h-3"/><path d="M6 14h12v7H6zM17 11h1"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>'
};
export const icon=(name,size=18)=>`<svg class="icon" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const point=(p,q,t)=>p.map((v,i)=>v+(q[i]-v)*t);
function rounded(pts,t) {
  const format=p=>p.map(n=>n.toFixed(2)).join(' ');
  let d='M'+format(point(pts[0],pts.at(-1),t));
  pts.forEach((p,i)=>{const next=pts[(i+1)%pts.length]; d+=' Q'+format(p)+' '+format(point(p,next,t))+' L'+format(point(next,p,t));});
  return d+'Z';
}
const rad=n=>n*Math.PI/180;
export function cubeSVG(state,yaw=35,pitch=26,{label='Cubo 3D',hero=false}={}) {
  const a=rad(yaw),b=rad(pitch);
  const proj=([x,y,z])=>{
    const horizontal=x*Math.cos(a)-z*Math.sin(a), depth=x*Math.sin(a)+z*Math.cos(a);
    return [120+horizontal*24,110+(-y*Math.cos(b)+depth*Math.sin(b))*24,y*Math.sin(b)+depth*Math.cos(b)];
  };
  const origin=proj([0,0,0]);
  const visible=stickers.map((s,i)=>({...s,index:i})).filter(s=>proj(s.normal)[2]-origin[2]>.01);
  visible.sort((a,b)=>proj(a.pos)[2]-proj(b.pos)[2]);
  let paths='';
  for(const s of visible) {
    const axis=s.normal.findIndex(v=>v!==0), rest=[0,1,2].filter(i=>i!==axis);
    const center=s.pos.map((v,i)=>v*2+s.normal[i]);
    const quad=radius=>[[-1,-1],[-1,1],[1,1],[1,-1]].map(pair=>{
      const p=center.slice(); rest.forEach((k,j)=>p[k]+=radius*pair[j]);return proj(p).slice(0,2);
    });
    const base=quad(1.012),sticker=quad(.865);
    paths+=`<g data-sticker="${s.index}"><path d="${rounded(base,.11)}" fill="#172b30" stroke="#172b30" stroke-width="1.1"/><path d="${rounded(sticker,.24)}" fill="${COLORS[state[s.index]]}" stroke="#ffffff" stroke-opacity=".22" stroke-width=".7"/>`;
    if(hero) paths+=`<path d="${rounded(sticker,.24)}" fill="${s.face==='R'?'#001d2a':'#fff'}" opacity="${s.face==='R'?'.12':'.045'}"/>`;
    paths+='</g>';
  }
  return `<svg class="cube-render" role="img" aria-label="${label}" viewBox="0 -10 240 240" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}
export function diagram(state,stage) {
  const top=i=>stage==='OLL'?(state[i]==='U'?COLORS.U:'#cbd4d9'):COLORS[state[i]];
  const tiles=[];
  const tile=(x,y,w,h,i)=>tiles.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="${top(i)}" stroke="#34454e" stroke-width="1.2"/>`);
  for(let i=0;i<9;i++) tile(25+(i%3)*22,25+Math.floor(i/3)*22,21,21,i);
  for(let i=0;i<3;i++){
    tile(25+i*22,15,21,8,FACES.indexOf('B')*9+2-i);
    tile(25+i*22,93,21,8,FACES.indexOf('F')*9+i);
    tile(15,25+i*22,8,21,FACES.indexOf('L')*9+i);
    tile(93,25+i*22,8,21,FACES.indexOf('R')*9+2-i);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 116 116" role="img" aria-label="Vista superior, frente abajo">${tiles.join('')}<path d="m54 108 4-4 4 4" fill="none" stroke="#5a6d72" stroke-width="1.5"/></svg>`;
}
