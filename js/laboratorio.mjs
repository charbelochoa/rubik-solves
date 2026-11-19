import {loadCases} from './common.mjs';
import {slug,title,imageURL} from './catalog.mjs';
import {FACES,COLORS,colorNames,SOLVED,setup,apply,tokens,turn,inverse,caseHint,describeTurn,createRecognizer} from './cube.mjs';
import {icon} from './illustrations.mjs';
import {createCubeView} from './vista.mjs';
const $=s=>document.querySelector(s);
const cases=await loadCases(), recognize=createRecognizer(cases);
const cubeView=createCubeView($('#cube'));
let state=SOLVED, yaw=35, pitch=26, painting=false, brush='U', playback=null, timer=null;
const names={U:'Superior',R:'Derecha',F:'Frontal',D:'Inferior',L:'Izquierda',B:'Trasera'};
function showCube(from,move) {
  cubeView.orbit(yaw,pitch);
  cubeView.showTurn(from,state,move);
  if(!painting) return;
  $('#net').innerHTML=FACES.map((f,j)=>`<div class="net-face face-${f}" role="group" aria-label="Cara ${names[f]}">${[...state.slice(j*9,j*9+9)].map((c,i)=>`<button data-cell="${j*9+i}" class="net-cell" style="--swatch:${COLORS[c]}" aria-label="${names[f]}, casilla ${i+1}, ${colorNames[c]}" ${i===4?'disabled':''}>${i===4?f:''}</button>`).join('')}</div>`).join('');
}
function clearPlayer() {$('#transport').hidden=true;$('#transport').replaceChildren();}
function stop() {if(timer!==null) clearInterval(timer);timer=null;}
function edit(next,message='',move) {
  const previous=state;
  stop();clearPlayer();playback=null;state=next;$('#recognition').replaceChildren();$('#edit-status').textContent=message;showCube(previous,move);
}
function paint(i) {
  if(i%9===4) {$('#edit-status').textContent='El centro fija el color de esta cara.';return;}
  edit(state.slice(0,i)+brush+state.slice(i+1),'Casilla pintada de '+colorNames[brush]+'.');
}
function mode(value) {
  painting=value;$('#turn-mode').setAttribute('aria-pressed',!value);$('#paint-mode').setAttribute('aria-pressed',value);
  $('#turn-tools').hidden=value;$('#paint-tools').hidden=!value;$('#viewport').classList.toggle('painting',value);
  $('#edit-status').textContent='';showCube();
}
$('#turn-mode').onclick=()=>mode(false);$('#paint-mode').onclick=()=>mode(true);
function palette() {
  $('#palette').innerHTML=FACES.map(f=>`<button class="swatch" style="--swatch:${COLORS[f]}" aria-label="Pintar de ${colorNames[f]}" aria-pressed="${f===brush}" title="${colorNames[f]}" data-color="${f}">${f===brush?'✓':''}</button>`).join('');
}
$('#palette').onclick=e=>{const b=e.target.closest('[data-color]');if(b){brush=b.dataset.color;palette();$('#palette [aria-pressed="true"]').focus();}};
$('#net').onclick=e=>{const b=e.target.closest('[data-cell]');if(b){paint(Number(b.dataset.cell));$('#net [data-cell="'+b.dataset.cell+'"]').focus();}};
const viewport=$('#viewport');
let drag;
function view(dx,dy) {yaw+=dx;pitch=Math.max(-89,Math.min(89,pitch+dy));cubeView.orbit(yaw,pitch);}
viewport.onpointerdown=e=>{
  if(e.button!==0||e.target.closest('button')) return;
  const hit=e.target.closest('[data-sticker]');
  drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,id:e.pointerId,cell:hit?Number(hit.dataset.sticker):null};
  viewport.setPointerCapture(e.pointerId);
};
viewport.onpointermove=e=>{
  if(!drag||e.pointerId!==drag.id) return;
  if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4) drag.moved=true;
  if(drag.moved){view((drag.lastX-e.clientX)*.65,(e.clientY-drag.lastY)*.55);drag.lastX=e.clientX;drag.lastY=e.clientY;}
};
viewport.onpointerup=e=>{if(drag?.id!==e.pointerId)return;if(!drag.moved&&painting&&drag.cell!==null) paint(drag.cell);drag=null;};
viewport.onpointercancel=()=>{drag=null;};
viewport.onkeydown=e=>{const dirs={ArrowLeft:[15,0],ArrowRight:[-15,0],ArrowUp:[0,12],ArrowDown:[0,-12]};if(dirs[e.key]){e.preventDefault();view(...dirs[e.key]);}};
$('#home-view').onclick=()=>{yaw=35;pitch=26;showCube();};
$('#turns').innerHTML=['','\'','2'].map(suffix=>['U','R','F','D','L','B'].map(f=>`<button data-turn="${f+suffix}" aria-label="${describeTurn(f+suffix)}">${f+suffix}</button>`).join('')).join('');
$('#turns').onclick=e=>{const b=e.target.closest('[data-turn]');if(b) edit(turn(state,b.dataset.turn),describeTurn(b.dataset.turn),e.detail?b.dataset.turn:null);};
$('#sequence-form').onsubmit=e=>{
  e.preventDefault();
  try {
    const moves=tokens($('#sequence').value);
    if(!moves.length) return $('#edit-status').textContent='Escribe al menos un giro.';
    edit(apply(state,moves),'Secuencia aplicada · '+moves.length+' giros.');
  }catch(err){$('#edit-status').textContent=err.message;}
};
$('#reset').onclick=()=>{yaw=35;pitch=26;edit(SOLVED,'Cubo resuelto.');};
function identify() {
  stop();clearPlayer();playback=null;$('#edit-status').textContent='';
  const result=recognize(state),box=$('#recognition');
  if(!result.alg) {box.innerHTML='<p class="feedback'+(result.error?' error':'')+'"></p>';box.firstChild.textContent=result.error||result.message;return;}
  const moves=tokens(result.alg), states=[state];
  for(const m of moves) states.push(turn(states.at(-1),m));
  playback={result,moves,states,step:0};
  const c=result.case;
  box.innerHTML=`<div class="recognition-head"><span class="eyebrow">${c?c.stage+' · '+c.code:'AJUSTE FINAL'}</span><h3>${c?title(c):'Alinear la capa superior'}</h3></div><p>${c?caseHint(c):result.message}</p>${result.prep?`<p class="prep"><b>Preparación</b> <code>${result.prep}</code>. ${result.extraction?'Libera primero la pieza atrapada y coloca el par frente a ti.':'Coloca el patrón en la orientación del diagrama.'}</p>`:''}<div class="moves" aria-label="Ir a un movimiento"></div>`;
  const transport=$('#transport');
  transport.hidden=false;
  transport.innerHTML=`<div class="player"><button id="prev" class="icon-btn" aria-label="Movimiento anterior">${icon('back')}</button><button class="btn primary" id="play"></button><button id="next" class="icon-btn" aria-label="Movimiento siguiente">${icon('chevron')}</button></div><div class="step-info"><strong id="step-count"></strong><p id="step-help"></p></div>`;
  box.querySelector('.moves').innerHTML=moves.map((m,i)=>`<button data-step="${i+1}" aria-label="Ir al giro ${i+1}, ${m}">${m}</button>`).join('');
  if(c) {
    const diagram=document.createElement('img');
    diagram.src=imageURL(c);diagram.alt='Diagrama de referencia de '+c.code;
    box.querySelector('.recognition-head').prepend(diagram);
  }
  box.querySelector('.moves').onclick=e=>{const b=e.target.closest('[data-step]');if(b){stop();go(Number(b.dataset.step));}};
  $('#prev').onclick=()=>{stop();go(playback.step-1);};$('#next').onclick=()=>{stop();go(playback.step+1);};
  $('#play').onclick=()=>{
    if(timer!==null){stop();go(playback.step);return;}
    if(playback.step===moves.length) go(0);
    timer=setInterval(()=>go(playback.step+1),850);go(playback.step+1);
  };
  go(0);
}
function go(index) {
  const p=playback;if(!p) return;
  const previous=p.step, previousState=state;
  p.step=Math.max(0,Math.min(index,p.moves.length));
  const end=p.step===p.moves.length;
  if(end) stop();
  const movement=p.step===previous+1?p.moves[previous]:p.step===previous-1?inverse(p.moves[p.step]):null;
  state=p.states[p.step];showCube(previousState,movement);
  $('#prev').disabled=!p.step;$('#next').disabled=end;
  $('#play').innerHTML=timer!==null?icon('pause',15)+' Pausar':end?icon('reset',15)+' Repetir':icon('play',15)+' Reproducir';
  for(const b of document.querySelectorAll('[data-step]')) b.setAttribute('aria-current',Number(b.dataset.step)===p.step?'step':'false');
  $('#step-count').textContent=(p.result.case?p.result.case.code+' · ':'')+'Paso '+p.step+' de '+p.moves.length;
  $('#step-help').textContent=!p.step?'Posición inicial. Avanza un giro o reproduce la secuencia.':describeTurn(p.moves[p.step-1])+(end?' Secuencia completa. Pulsa «Identificar caso» para continuar.':'');
}
function choices() {
  const list=cases.filter(c=>c.stage===$('#pick-stage').value);
  $('#pick-case').innerHTML=list.map(c=>`<option value="${slug(c)}">${c.code} · ${c.group}</option>`).join('');
}
function load(c) {
  $('#pick-stage').value=c.stage;choices();$('#pick-case').value=slug(c);
  yaw=35;pitch=26;mode(false);edit(setup(c.alg));identify();
  const url=new URL(location.href);url.searchParams.set('caso',slug(c));history.replaceState(null,'',url);
}
$('#pick-stage').onchange=choices;
$('#load-case').onclick=()=>{load(cases.find(c=>slug(c)===$('#pick-case').value));revealCube();};
$('#random').onclick=()=>{const list=cases.filter(c=>c.stage===$('#pick-stage').value&&slug(c)!==$('#pick-case').value);load(list[Math.floor(Math.random()*list.length)]);revealCube();};
function revealCube() {
  if(matchMedia('(max-width:720px)').matches) viewport.scrollIntoView({block:'start',behavior:'instant'});
}
$('#identify').onclick=()=>{identify();if(playback) revealCube();};
palette();choices();
const initial=cases.find(c=>slug(c)===new URLSearchParams(location.search).get('caso'));
if(initial) load(initial);else showCube();
