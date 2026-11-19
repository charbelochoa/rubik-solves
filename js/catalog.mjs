import {icon} from './illustrations.mjs';
export const stages={
 F2L:{name:'Primeras dos capas'},
 OLL:{name:'Orientación de la última capa'},
 PLL:{name:'Permutación de la última capa'}
};
export const slug=c=>c.stage.toLowerCase()+'-'+c.code.toLowerCase().replaceAll(' ','-');
export const imageURL=c=>c.image||'assets/diagramas/'+slug(c)+'.svg';
const basicNames=['Inserción frontal','Inserción derecha','Par unido frontal','Par unido derecho'];
export const title=c=>c.stage==='F2L'?(c.code.startsWith('B')&&/^B\d+$/.test(c.code)?basicNames[Number(c.code.slice(1))-1]:c.group+' · '+c.code):c.stage==='OLL'?c.code:'Permutación '+c.code;
export const escapeHTML=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function caseCard(c,resource=false) {
  return `<a class="case-card" href="laboratorio.html?caso=${slug(c)}" ${resource?'':'data-detail="'+slug(c)+'"'}><div class="case-art"><span class="case-code">${c.code}</span><img loading="lazy" width="120" height="120" src="${imageURL(c)}" alt="Posición inicial de ${c.stage} ${c.code}"></div><div class="case-body"><h4>${title(c)}</h4><code>${c.alg}</code><span class="card-go" aria-hidden="true">${icon('chevron',13)}</span></div></a>`;
}
export const families=cases=>[...new Set(cases.map(c=>c.group))];
export function sections(cases,resource=false) {
  return families(cases).map(g=>{
    const list=cases.filter(c=>c.group===g);
    return `<section class="family-section"><h3>${g} <small>${list.length} casos</small></h3><div class="case-grid">${list.map(c=>caseCard(c,resource)).join('')}</div></section>`;
  }).join('');
}
