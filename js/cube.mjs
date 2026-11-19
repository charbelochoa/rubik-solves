// Facelets use the URFDLB convention, viewed directly towards each face.
export const FACES = [...'URFDLB'];
export const COLORS = { U:'#ffd64a', R:'#ed5149', F:'#3384e9', D:'#fbfbf6', L:'#ff903e', B:'#38b67d' };
export const colorNames = {U:'amarillo', R:'rojo', F:'azul', D:'blanco', L:'naranja', B:'verde'};
export const SOLVED = FACES.join('').replace(/./g, face => face.repeat(9));
const frame = {
  U: ([a,b]) => [a,1,b], R: ([a,b]) => [1,-b,-a], F: ([a,b]) => [a,-b,1],
  D: ([a,b]) => [a,-1,-b], L: ([a,b]) => [-1,-b,a], B: ([a,b]) => [-a,-b,-1]
};
export const stickers = FACES.flatMap(face => Array.from({length:9}, (_,i) => ({
  face, i, pos:frame[face]([i%3-1,Math.floor(i/3)-1]), normal:frame[face]([0,0])
})));
const key = (p,n) => [...p,...n].join(',');
const indices = new Map(stickers.map((s,i) => [key(s.pos,s.normal),i]));
function rotate([x,y,z],axis) {
  return [[x,-z,y],[z,y,-x],[-y,x,z]][axis];
}
// Axis, selected layers, clockwise angle in right-handed quarter turns.
const definitions = {
  R:[0,[1],-1], L:[0,[-1],1], U:[1,[1],-1], D:[1,[-1],1], F:[2,[1],-1], B:[2,[-1],1],
  M:[0,[0],1], E:[1,[0],1], S:[2,[0],-1],
  x:[0,[-1,0,1],-1], y:[1,[-1,0,1],-1], z:[2,[-1,0,1],-1]
};
for (const f of FACES) {
  const [axis,[layer],angle]=definitions[f];
  definitions[f.toLowerCase()]=[axis,[0,layer],angle];
}
const permutations = new Map();
export function turnGeometry(move) {
  const [axis,layers,angle]=definitions[move[0]];
  const quarters=move.endsWith('2')?2:move.endsWith("'")?-1:1;
  return {axis,layers,degrees:90*angle*quarters};
}
for (const [face,[axis,layers,angle]] of Object.entries(definitions)) {
  for (const [suffix,count] of [['',1],["'",-1],['2',2]]) {
    const map=Array.from({length:54},(_,i)=>i);
    stickers.forEach(({pos,normal},i) => {
      if (!layers.includes(pos[axis])) return;
      let p=pos,n=normal;
      for (let k=0;k<(angle*count+4)%4;k++) {p=rotate(p,axis); n=rotate(n,axis);}
      map[indices.get(key(p,n))]=i;
    });
    permutations.set(face+suffix,map);
  }
}
export function tokens(alg) {
  const clean=alg.replace(/[’′]/g,"'").replace(/[()]/g,' ').replace(/([URFDLB])w/g,(_,f)=>f.toLowerCase()).trim();
  if (!clean) return [];
  const turns=clean.split(/\s+/);
  if (turns.some(t=>!permutations.has(t))) throw new Error('Revisa la notación y separa los giros con espacios.');
  return turns;
}
export const turn = (state,move) => permutations.get(move).map(i=>state[i]).join('');
export const apply = (state,alg) => (Array.isArray(alg)?alg:tokens(alg)).reduce(turn,state);
export const inverse = alg => tokens(alg).reverse().map(t=>t.endsWith('2')?t:t.endsWith("'")?t[0]:t+"'").join(' ');
export function normalize(state) {
  const centers=Object.fromEntries(FACES.map((f,i)=>[state[i*9+4],f]));
  return [...state].map(c=>centers[c]).join('');
}
export const setup = alg => normalize(apply(SOLVED,inverse(alg)));
function slot(faces) {
  const normals=[...faces].map(f=>frame[f]([0,0]));
  const pos=[0,1,2].map(axis=>normals.reduce((v,n)=>v+n[axis],0));
  return normals.map(n=>indices.get(key(pos,n)));
}
const corners=['URF','UFL','ULB','UBR','DFR','DLF','DBL','DRB'];
const edges=['UR','UF','UL','UB','DR','DF','DL','DB','FR','FL','BL','BR'];
export const cornerSlots=corners.map(slot), edgeSlots=edges.map(slot);
export const readPiece=(state,ids)=>ids.map(i=>state[i]).join('');
function parity(permutation) {
  return permutation.reduce((n,v,i)=>n+permutation.slice(i+1).filter(w=>v>w).length,0)%2;
}
export function validate(state) {
  if (state.length!==54 || FACES.some(f=>[...state].filter(c=>c===f).length!==9)) return 'Cada color debe aparecer exactamente nueve veces. Revisa las casillas pintadas.';
  const s=normalize(state), cp=[], ep=[];
  let twist=0,flip=0;
  for (const ids of cornerSlots) {
    const piece=readPiece(s,ids), k=[...piece].findIndex(c=>'UD'.includes(c));
    const id=corners.indexOf(piece.slice(k)+piece.slice(0,k));
    if(k<0 || id<0 || cp.includes(id)) return 'Hay una esquina repetida o con colores incompatibles. Comprueba sus tres caras.';
    cp.push(id); twist+=k;
  }
  for (const ids of edgeSlots) {
    const piece=readPiece(s,ids), reversed=[...piece].reverse().join('');
    const direction=edges.includes(piece)?0:1, id=edges.indexOf(direction?reversed:piece);
    if(id<0 || ep.includes(id)) return 'Hay una arista repetida o con colores incompatibles. Comprueba sus dos caras.';
    ep.push(id); flip+=direction;
  }
  if(twist%3) return 'La orientación de las esquinas es imposible. Revisa las esquinas giradas.';
  if(flip%2) return 'La orientación de las aristas es imposible. Revisa las aristas volteadas.';
  if(parity(cp)!==parity(ep)) return 'La permutación es imposible. Revisa si intercambiaste dos piezas al pintar.';
  return '';
}
const correct=(s,ids)=>ids.every(i=>s[i]===SOLVED[i]);
export const crossDone = s => edgeSlots.slice(4,8).every(ids=>correct(s,ids));
export const solvedPairs = s => cornerSlots.slice(4).map((ids,i)=>correct(s,ids)&&correct(s,edgeSlots[8+i]));
export const lowerDone = s => crossDone(s)&&solvedPairs(s).every(Boolean);
export const oriented = s => s.slice(0,9)==='U'.repeat(9);
export const ollKey = s => [...s].map(c=>c==='U'?'1':'0').join('');
export function pairKey(s) {
  const corner=cornerSlots.find(ids=>[...readPiece(s,ids)].sort().join('')==='DFR');
  const edge=edgeSlots.find(ids=>[...readPiece(s,ids)].sort().join('')==='FR');
  return [cornerSlots.indexOf(corner),readPiece(s,corner),edgeSlots.indexOf(edge),readPiece(s,edge)].join('/');
}
const AUF=['','U',"U'",'U2'], yaw=['','y',"y'",'y2'];
const join=(...parts)=>parts.filter(Boolean).join(' ');
export function createRecognizer(cases) {
  const lookup={F2L:new Map(),OLL:new Map(),PLL:new Map()};
  for (const c of cases) {
    const s=setup(c.alg);
    const signature=c.stage==='F2L'?pairKey(s):c.stage==='OLL'?ollKey(s):s;
    lookup[c.stage].set(signature,c);
  }
  function find(state,stage) {
    for (const y of yaw) {
      const framed=normalize(apply(state,y));
      if(stage==='F2L' && solvedPairs(framed)[0]) continue;
      for (const u of AUF) {
        const s=apply(framed,u);
        const signature=stage==='F2L'?pairKey(s):stage==='OLL'?ollKey(s):s;
        const c=lookup[stage].get(signature);
        if(c) return {case:c,prep:join(y,u),alg:join(y,u,c.alg)};
      }
    }
  }
  return state=>{
    const error=validate(state);
    if(error) return {error};
    const s=normalize(state);
    if(s===SOLVED) return {message:'Cubo resuelto. Todas las piezas coinciden con sus centros.'};
    if(!crossDone(s)) return {message:'Forma la cruz en la cara inferior y alinea cada arista con su centro lateral. Después podrás identificar el primer par F2L.'};
    if(!lowerDone(s)) {
      const match=find(s,'F2L');
      if(match) return match;
      // Free a trapped pair in a different slot without disturbing finished pairs.
      const done=solvedPairs(s);
      for(const f of ['R','L','F','B']) for(const side of [f,f+"'"]) for(const u of ['U',"U'",'U2']) {
        const extraction=join(side,u,inverse(side));
        const extracted=apply(s,extraction);
        if(solvedPairs(extracted).some((v,i)=>done[i]&&!v)) continue;
        const next=find(extracted,'F2L');
        if(next) return {...next,prep:join(extraction,next.prep),alg:join(extraction,next.alg),extraction};
      }
      return {message:'Extrae una pieza de una ranura incorrecta a la capa superior para formar el siguiente par.'};
    }
    if(!oriented(s)) return find(s,'OLL') || {error:'No se encontró la orientación. Comprueba la entrada.'};
    for(const u of AUF.slice(1)) if(apply(s,u)===SOLVED) return {alg:u,message:'Solo queda alinear la capa superior con los centros laterales.'};
    return find(s,'PLL') || {error:'No se encontró la permutación. Comprueba la entrada.'};
  };
}
const motionNames={U:'la cara superior',D:'la cara inferior',F:'la cara frontal',B:'la cara trasera',R:'la cara derecha',L:'la cara izquierda',M:'la capa central como L',E:'la capa ecuatorial como D',S:'la capa central como F',x:'todo el cubo como R',y:'todo el cubo como U',z:'todo el cubo como F'};
export function describeTurn(move) {
  const f=move[0], wide='urfdlb'.includes(f);
  const target=wide?motionNames[f.toUpperCase()]+' y su capa interior':motionNames[f];
  return 'Gira '+target+' '+(move.endsWith('2')?'media vuelta':move.endsWith("'")?'un cuarto de vuelta en sentido antihorario':'un cuarto de vuelta en sentido horario')+'.';
}
export function caseHint(c) {
  const s=setup(c.alg);
  if(c.stage==='F2L') {
    const ids=cornerSlots.find(ids=>[...readPiece(s,ids)].sort().join('')==='DFR');
    const face=stickers[ids.find(i=>s[i]==='D')].face;
    const edge=edgeSlots.find(ids=>[...readPiece(s,ids)].sort().join('')==='FR');
    const pos=stickers[edge[0]].pos[1]===1?'arriba':'en la capa intermedia';
    return 'Busca la esquina del par frontal derecho. Su pegatina inferior mira hacia '+({U:'arriba',D:'abajo',R:'la derecha',L:'la izquierda',F:'el frente',B:'atrás'})[face]+'. La arista está '+pos+'. Une ambas piezas e insértalas entre sus centros.';
  }
  if(c.stage==='OLL') {
    const es=edgeSlots.slice(0,4).filter(ids=>s[ids[0]]==='U').length;
    const cs=cornerSlots.slice(0,4).filter(ids=>s[ids[0]]==='U').length;
    return 'Observa el color superior. Hay '+es+' de 4 aristas y '+cs+' de 4 esquinas orientadas. Coloca el patrón como en el diagrama y ejecuta el algoritmo para completar la cara superior.';
  }
  const e=edgeSlots.slice(0,4).filter(ids=>!correct(s,ids)).length;
  const k=cornerSlots.slice(0,4).filter(ids=>!correct(s,ids)).length;
  return 'Compara las bandas laterales con sus centros. En la posición del diagrama cambian de lugar '+e+' aristas y '+k+' esquinas. Conserva el frente indicado al ejecutar la permutación.';
}
