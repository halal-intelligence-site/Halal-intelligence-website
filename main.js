const $ = (id)=>document.getElementById(id);

const grid   = $('grid');
const q      = $('q');
const country= $('country');
const ab     = $('ab');
const status = $('status');
const scope  = $('scope');
const minA   = $('minA');
const sort   = $('sort');
const minAVal= $('minAVal');

document.getElementById('yr') && (document.getElementById('yr').textContent = new Date().getFullYear());

const ABS    = ['GAC','EIAC','JAKIM','BPJPH','SFDA','MUIS','HAK','IMANOR'];
const SCOPES = ['Food','Slaughter','Cosmetics','Pharma','Logistics','Management Systems'];

ABS.forEach(x=> ab.appendChild(new Option(x, x)));
SCOPES.forEach(x=> scope.appendChild(new Option(x, x)));

let DATA = [];  // loaded from /data/index.json

function starSVG(fill){return `<svg viewBox="0 0 20 20" width="16" height="16" fill="${fill}" aria-hidden="true"><path d="M10 1.5l2.59 5.25 5.8.84-4.19 4.09.99 5.78L10 14.98 4.81 17.46l.99-5.78L1.6 7.59l5.8-.84L10 1.5z"/></svg>`}
function toneStatus(s){ if(s==='Accredited') return '#e6f4ff'; if(s==='Suspended') return '#fff7e6'; if(s==='Withdrawn') return '#ffe6e6'; return '#eef2ff'; }

function render(list){
  grid.innerHTML='';
  list.forEach(h=>{
    const stars = Array.from({length:5}).map((_,i)=> starSVG(i < Math.min(5,h.accs.length) ? '#fbbf24' : '#e5e7eb')).join('');
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div style="min-width:0">
          <div style="font-weight:800">${h.name}</div>
          <div class="meta" title="${h.country}">${h.country}</div>
        </div>
        <div class="stars" aria-label="rating">${stars}</div>
      </div>
      <div class="tags">
        ${h.accs.map(a=>`<span class="badge" style="background:#e7f8ee;border-color:#c8f0d7;color:#166534">Accredited: ${a}</span>`).join('')}
        ${h.scopes.map(s=>`<span class="badge" style="background:#f3e8ff;border-color:#ead8ff;color:#6b21a8">${s}</span>`).join('')}
        <span class="badge" style="background:${toneStatus(h.status)}">${h.status}</span>
      </div>
      <div class="meta">Last verified: ${new Date(h.lastVerified).toLocaleDateString()}</div>
      <div class="actions">
        <a class="meta" href="${h.site || '#'}" target="_blank" rel="noreferrer">Official site</a>
        <button class="btn btn-dark" onclick="alert('Details coming soon')">View details</button>
      </div>`;
    grid.appendChild(card);
  });
  $('countShown') && ($('countShown').textContent = list.length);
}

function apply(){
  const query = q.value.trim().toLowerCase();
  let list = DATA.filter(d=>{
    const matchesQ = !query || (d.name+' '+d.country+' '+d.scopes.join(' ')+' '+d.accs.join(' ')+' '+(d.site||'')).toLowerCase().includes(query);
    const matchesC = !country.value || d.cc===country.value;
    const matchesAB = !ab.value || d.accs.includes(ab.value);
    const matchesS = !status.value || d.status===status.value;
    const matchesScope = !scope.value || d.scopes.includes(scope.value);
    const matchesMin = d.accs.length >= +minA.value;
    return matchesQ && matchesC && matchesAB && matchesS && matchesScope && matchesMin;
  });
  if (sort.value==='rating') list.sort((a,b)=> b.accs.length - a.accs.length);
  if (sort.value==='name')   list.sort((a,b)=> a.name.localeCompare(b.name));
  if (sort.value==='recent') list.sort((a,b)=> +new Date(b.lastVerified) - +new Date(a.lastVerified));
  render(list);
  minAVal.textContent = minA.value;
}

function resetFilters(){
  q.value=''; country.value=''; ab.value=''; status.value=''; scope.value='';
  minA.value=0; sort.value='rating'; apply();
}

[q,country,ab,status,scope,minA,sort].forEach(el=> el.addEventListener('input', apply));

// Load dataset
(async function loadData(){
  try {
    const res = await fetch('/data/index.json', { cache: 'no-store' });
    const json = await res.json();
    DATA = json;

    // Populate Country options
    const pairs = [...new Set(DATA.map(d=>`${d.cc}|${d.country}`))];
    pairs.sort((a,b)=> a.split('|')[1].localeCompare(b.split('|')[1]))
      .forEach(s=>{
        const [cc,n]=s.split('|');
        country.appendChild(new Option(n, cc));
      });

    // KPIs
    const kpiTotal = document.getElementById('kpiTotal');
    const kpiVerified = document.getElementById('kpiVerified');
    const kpiUpdated = document.getElementById('kpiUpdated');
    const countTotal = document.getElementById('countTotal');

    if (kpiTotal) kpiTotal.textContent   = DATA.length;
    if (kpiVerified) kpiVerified.textContent= DATA.filter(d=>d.status==='Accredited').length;
    if (kpiUpdated) kpiUpdated.textContent = new Date(Math.max(...DATA.map(d=>+new Date(d.lastVerified)))).toLocaleDateString();
    if (countTotal) countTotal.textContent = DATA.length;

    apply();
  } catch (e){
    grid.innerHTML = `<div class="card">Failed to load data/index.json. Please add that file to your repo.</div>`;
    console.error(e);
  }
})();