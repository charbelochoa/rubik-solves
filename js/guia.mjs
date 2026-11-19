import {loadCases} from './common.mjs';
import {stages,families,sections,title,imageURL,slug} from './catalog.mjs';
import {caseHint,tokens} from './cube.mjs';
import {icon} from './illustrations.mjs';
const $=s=>document.querySelector(s);
const cases=await loadCases();
const all='Todos los casos';
const params=new URLSearchParams(location.search);
let stage=Object.hasOwn(stages,params.get('etapa'))?params.get('etapa'):'F2L';
let group=all;
const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function render() {
  const list=cases.filter(c=>c.stage===stage), query=clean($('#search').value);
  $('#stage-name').textContent=stages[stage].name;
  $('#stage-label').textContent=stage;
  $('#stage-description').textContent=stages[stage].text;
  for(const tab of document.querySelectorAll('[data-stage]')) tab.setAttribute('aria-pressed',tab.dataset.stage===stage);
  $('#groups').innerHTML=[all,...families(list)].map(g=>`<button data-group="${g}" aria-pressed="${g===group}"><span>${g}</span><small>${g===all?list.length:list.filter(c=>c.group===g).length}</small></button>`).join('');
  const filtered=list.filter(c=>(group===all||group===c.group)&&clean([c.code,title(c),c.group,c.stage,c.alg].join(' ')).includes(query));
  $('#results').innerHTML=filtered.length?sections(filtered):'<div class="empty"><h3>No hay coincidencias</h3><p>Busca otro nombre o código de esta etapa.</p><button class="btn outline" id="clear-search">Ver todos los casos</button></div>';
}
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-stage]'), family=e.target.closest('[data-group]');
  if(tab) {
    stage=tab.dataset.stage; group=all; $('#search').value='';
    const url=new URL(location.href);url.searchParams.set('etapa',stage);history.replaceState(null,'',url);
    render();
  }
  if(family) {group=family.dataset.group;render();[...$('#groups').children].find(b=>b.dataset.group===group)?.focus({preventScroll:true});}
  if(e.target.closest('#clear-search')) {group=all;$('#search').value='';render();$('#search').focus();}
  const card=e.target.closest('[data-detail]');
  if(!card||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
  e.preventDefault();
  const c=cases.find(c=>slug(c)===card.dataset.detail),dialog=$('#detail');
  dialog.innerHTML=`<div class="dialog-top"><span class="eyebrow">${c.stage} / ${c.code}</span><button class="icon-btn" id="close-detail" aria-label="Cerrar">${icon('close')}</button></div><h2>${title(c)}</h2><div class="detail-art"><img src="${imageURL(c)}" alt="Patrón inicial de ${c.code}"></div><p>${caseHint(c)}</p><div class="algo-box"><span class="eyebrow">ALGORITMO · ${tokens(c.alg).length} GIROS</span><code>${c.alg}</code></div><a href="${card.getAttribute('href')}" class="btn primary full">${icon('cube')} Practicar en 3D ${icon('arrow',16)}</a>`;
  $('#close-detail').onclick=()=>dialog.close();dialog.showModal();
});
$('#search').addEventListener('input',render);
render();
