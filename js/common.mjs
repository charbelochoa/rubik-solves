const notation=document.querySelector('#notationDialog');
document.querySelector('[data-notation]').addEventListener('click',()=>notation.showModal());
document.querySelector('[data-close]').addEventListener('click',()=>notation.close());
document.addEventListener('click',event=>{
  const dialog=event.target;
  if(dialog.tagName!=='DIALOG') return;
  const box=dialog.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom) dialog.close();
});
document.querySelector('#print')?.addEventListener('click',()=>window.print());
export async function loadCases() {
  const response=await fetch(new URL('../data/cases.json',import.meta.url));
  if(!response.ok) throw new Error('No se pudo abrir el catálogo.');
  return response.json();
}
