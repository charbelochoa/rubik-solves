import {COLORS,FACES,stickers,turnGeometry} from './cube.mjs';
// The puzzle uses Y up. CSS uses Y down, so X and Z rotations change sign.
const faceTransforms={F:'',R:'rotateY(90deg)',B:'rotateY(180deg)',L:'rotateY(-90deg)',U:'rotateX(90deg)',D:'rotateX(-90deg)'};
function element(className,parent) {
  const node=document.createElement('div');
  node.className=className;parent.append(node);return node;
}
export function createCubeView(container) {
  const world=element('cube-world',container),moving=element('cube-layer',world);
  const pieces=[], tiles=new Array(54);
  let motion=null;
  container.setAttribute('role','img');
  container.setAttribute('aria-label','Cubo tridimensional de seis caras');
  for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++) {
    if(x===0&&y===0&&z===0) continue;
    const pos=[x,y,z],piece=element('cubie',world);
    piece.style.transform=`translate3d(calc(${x} * var(--unit)),calc(${-y} * var(--unit)),calc(${z} * var(--unit)))`;
    pieces.push({pos,piece});
    for(const f of FACES) {
      const side=element('cubie-side',piece);
      side.style.transform=faceTransforms[f]+' translateZ(calc(var(--unit) / 2))';
      const index=stickers.findIndex(s=>s.face===f&&s.pos.every((v,i)=>v===pos[i]));
      if(index>=0) {side.dataset.sticker=index;tiles[index]=side;}
    }
  }
  function cancel() {
    if(motion){motion.onfinish=null;motion.cancel();motion=null;}
    while(moving.firstChild) world.append(moving.firstChild);
  }
  function display(state) {
    cancel();
    tiles.forEach((tile,i)=>tile.style.setProperty('--tile',COLORS[state[i]]));
  }
  function showTurn(from,to,move) {
    if(!move||window.matchMedia('(prefers-reduced-motion: reduce)').matches) {display(to);return;}
    display(from);
    const {axis,layers,degrees}=turnGeometry(move);
    pieces.filter(p=>layers.includes(p.pos[axis])).forEach(p=>moving.append(p.piece));
    const rotation='rotate'+'XYZ'[axis];
    motion=moving.animate([{transform:rotation+'(0deg)'},{transform:rotation+'('+degrees*[-1,1,-1][axis]+'deg)'}],
      {duration:280,easing:'cubic-bezier(0.77, 0, 0.175, 1)',fill:'forwards'});
    motion.onfinish=()=>display(to);
  }
  return {display,showTurn,orbit(yaw,pitch){world.style.transform=`rotateX(${-pitch}deg) rotateY(${-yaw}deg)`;}};
}
