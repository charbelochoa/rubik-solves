import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOLVED,apply,inverse,setup,normalize,validate,createRecognizer,solvedPairs,lowerDone,oriented,crossDone,edgeSlots,cornerSlots} from '../js/cube.mjs';
const cases=JSON.parse(readFileSync(new URL('../data/cases.json',import.meta.url)));
const recognize=createRecognizer(cases);
assert.deepEqual(['F2L','OLL','PLL'].map(stage=>cases.filter(c=>c.stage===stage).length),[41,57,21]);
const pll=cases.find(c=>c.code==='T');
let checked=0;
for(const c of cases) {
  const base=setup(c.alg);
  assert.equal(recognize(base).case?.code,c.code);
  for(const y of ['','y','y2',"y'"]) for(const u of ['','U','U2',"U'"]) {
    // An arbitrary last-layer permutation must not affect OLL or F2L recognition.
    const end=c.stage==='PLL'?SOLVED:setup(pll.alg);
    const state=apply(apply(end,inverse(c.alg)),[y,u].filter(Boolean));
    assert.equal(validate(state),'',c.code);
    const match=recognize(state);
    assert.equal(match.case?.code,c.code,c.code);
    const result=normalize(apply(state,match.alg));
    if(c.stage==='F2L') assert.ok(lowerDone(result),c.code);
    if(c.stage==='OLL') assert.ok(lowerDone(result)&&oriented(result),c.code);
    if(c.stage==='PLL') assert.equal(result,SOLVED,c.code);
    checked++;
  }
}
assert.match(recognize(SOLVED).message,/resuelto/);
assert.match(recognize(apply(SOLVED,'F')).message,/cruz/);
assert.equal(recognize(apply(SOLVED,'U')).alg,"U'");
function cycled(ids) {
  const a=[...SOLVED];
  ids.forEach((id,i)=>a[id]=SOLVED[ids[(i+1)%ids.length]]);
  return a.join('');
}
assert.match(validate(cycled(edgeSlots[0])),/volteadas/);
assert.match(validate(cycled(cornerSlots[0])),/giradas/);
assert.match(validate(cycled([edgeSlots[0][1],edgeSlots[1][1]])),/permutación/);
let seed=71;
const pick=arr=>arr[(seed=(seed*48271)%2147483647)%arr.length];
for(let sample=0;sample<80;sample++){
  let s=SOLVED;
  for(let j=0;j<9;j++) s=apply(s,pick(['R U R\'','L\' U L','F U2 F\'','B\' U B','U','y']));
  let steps=0;
  while(normalize(s)!==SOLVED && steps++<8) {
    const before=solvedPairs(normalize(s)).filter(Boolean).length;
    const match=recognize(s);
    assert.ok(match.alg,JSON.stringify(match));
    s=apply(s,match.alg);
    assert.ok(crossDone(normalize(s)));
    if(before<4) assert.ok(solvedPairs(normalize(s)).filter(Boolean).length>before);
  }
  assert.equal(normalize(s),SOLVED);
}
console.log(`Verificados ${checked} encuadres, 80 resoluciones desde la cruz y los estados físicamente imposibles.`);
