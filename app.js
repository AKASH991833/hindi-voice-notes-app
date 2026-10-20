'use strict';
const KEY='awaaznotes.v1',PREF='awaaznotes.pref';
const LANGS=[['hi-IN','हिन्दी (Hindi)'],['en-IN','English (India)'],['en-US','English (US)']];
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let notes=store.get(KEY,[]);let pref=Object.assign({lang:'hi-IN',cmds:true},store.get(PREF,{}));
let rec=null,listening=false,wantOn=false,handled=new Set(),restarts=0,tab='rec',q='',editing=null,statusMsg='',statusErr=false;
function savePref(){store.set(PREF,pref)}
function saveNotes(){store.set(KEY,notes)}
/* ---- voice punctuation commands ---- */
const CMDS=[
 [/\s*(पूर्ण विराम|पूरण विराम|पूर्णविराम|poora viram|purn viram)\s*/gi,'। '],
 [/\s*(अल्पविराम|अल्प विराम|alp viram)\s*/gi,', '],
 [/\s*(प्रश्न चिह्न|प्रश्नचिह्न|प्रश्न चिन्ह|प्रश्नवाचक चिह्न|question mark)\s*/gi,'? '],
 [/\s*(विस्मयादिबोधक चिह्न|विस्मयादिबोधक|exclamation mark|exclamation point)\s*/gi,'! '],
 [/\s*(full stop|period)\s*/gi,'. '],
 [/\s*\bcomma\b\s*/gi,', '],
 [/\s*(नया पैराग्राफ|नया पैराग्राफ़|new paragraph)\s*/gi,'\n\n'],
 [/\s*(नई लाइन|नयी लाइन|नई पंक्ति|new line|next line)\s*/gi,'\n']];
function applyCmds(t){if(!pref.cmds)return t;let o=t;for(const[r,s]of CMDS)o=o.replace(r,s);return o}
function joinText(cur,add){add=add.replace(/^[ \t]+|[ \t]+$/g,'');if(!add)return cur;if(!cur)return add;if(/[\s]$/.test(cur)||/^[\s,.!?।]/.test(add))return cur+add;return cur+' '+add}
const ta=()=>$('#txt');
function setStatus(m,err){statusMsg=m;statusErr=!!err;const s=$('#st');if(s){s.textContent=m;s.className='status'+(err?' err':'')}}
function startRec(){
 if(!SR){setStatus('Is browser me voice typing support nahi hai. Chrome use karein.',1);return}
 if(listening)return;
 rec=new SR();rec.lang=pref.lang;rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;handled=new Set();
 rec.onstart=()=>{listening=true;setStatus('Sun raha hoon... bolo');paintMic()};
 rec.onresult=ev=>{
  let interim='';
  for(let i=ev.resultIndex;i<ev.results.length;i++){
   const r=ev.results[i];const t=r[0].transcript;
   if(r.isFinal){if(handled.has(i))continue;handled.add(i);restarts=0;const el=ta();if(el){el.value=joinText(el.value,applyCmds(t));el.dispatchEvent(new Event('input'))}}
   else interim+=t;
  }
  const iv=$('#interim');if(iv)iv.textContent=interim;
 };
 rec.onerror=e=>{
  const m={'not-allowed':'Mic ki permission band hai. Address bar me lock icon se Mic allow karein.','service-not-allowed':'Is browser/device me speech service allowed nahi hai.','audio-capture':'Mic nahi mila. Mic connect karke dobara try karein.','network':'Internet nahi hai. Voice typing ke liye internet chahiye.','language-not-supported':'Ye bhasha is browser me support nahi hai.'}[e.error];
  if(m){wantOn=false;setStatus(m,1)}else if(e.error==='no-speech'){setStatus('Kuch sunai nahi diya... bolte rahiye')}
 };
 rec.onend=()=>{listening=false;const iv=$('#interim');if(iv)iv.textContent='';paintMic();
  if(wantOn&&restarts<20){restarts++;setTimeout(()=>{if(wantOn)startRec()},250)}
  else if(wantOn){wantOn=false;setStatus('Voice band ho gayi. Mic dabakar dobara chalu karein.',1);paintMic()}
  else if(!statusErr)setStatus('Ruk gaya. Mic dabakar dobara bolo.')};
 try{rec.start()}catch(e){setStatus('Mic start nahi hua. Dobara try karein.',1);wantOn=false;paintMic()}
}
function stopRec(){wantOn=false;try{rec&&rec.stop()}catch(_){}listening=false;paintMic()}
function toggleMic(){if(wantOn||listening){stopRec();setStatus('Ruk gaya.')}else{wantOn=true;restarts=0;setStatus('Mic chalu ho raha hai...');startRec()}}
function paintMic(){const m=$('#mic');if(!m)return;const on=wantOn||listening;m.classList.toggle('on',on);m.setAttribute('aria-pressed',on);m.setAttribute('aria-label',on?'Recording rokein':'Recording shuru karein');const l=$('#micl');if(l)l.textContent=on?'Rokne ke liye dabayein':'Bolne ke liye dabayein'}
/* ---- views ---- */
const MIC='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>';
function render(){
 $('#app').innerHTML=`<div class="tabs"><button data-t="rec" class="${tab==='rec'?'on':''}">Bolo</button><button data-t="notes" class="${tab==='notes'?'on':''}">Meri notes (${notes.length})</button><button data-t="more" class="${tab==='more'?'on':''}">Backup</button></div><div id="v"></div>`;
 $$('[data-t]').forEach(b=>b.onclick=()=>{if(tab==='rec'&&b.dataset.t!=='rec')stopRec();tab=b.dataset.t;render();scrollTo(0,0)});
 ({rec:vRec,notes:vNotes,more:vMore})[tab]($('#v'));
}
let draft='';
function vRec(el){
 el.innerHTML=`${SR?'':'<div class="banner">Is browser me voice typing available nahi hai. Android par <b>Chrome</b> ya computer par Chrome / Edge use karein. Aap neeche type bhi kar sakte hain (keyboard ke mic se bhi bol sakte hain).</div>'}
 <div class="card recbox"><div class="row" style="justify-content:center;margin-bottom:6px"><select id="lang" style="max-width:240px" aria-label="Bhasha">${LANGS.map(([c,n])=>`<option value="${c}" ${pref.lang===c?'selected':''}>${n}</option>`).join('')}</select></div>
 <button class="mic" id="mic" ${SR?'':'disabled'}>${MIC}</button><div id="micl" class="muted" style="font-weight:700"></div><div id="st" class="status${statusErr?' err':''}">${esc(statusMsg)}</div></div>
 <div class="card"><div class="row"><b>Text</b><span class="muted right" id="cnt"></span></div>
 <textarea id="txt" class="big" placeholder="Yahan aapki boli hui baat text banke aayegi. Aap ise edit bhi kar sakte hain." maxlength="20000"></textarea><div id="interim" class="interim" aria-live="polite"></div>
 <div class="row" style="margin-top:8px"><button class="btn pri" id="sv">Save note</button><button class="btn" id="cp">Copy</button><button class="btn" id="sh">Share</button><button class="btn bad" id="cl">Saaf karo</button></div>
 <label class="row" style="gap:8px;margin-top:12px"><input type="checkbox" id="cmds" ${pref.cmds?'checked':''}> <span class="muted" style="font-size:.9rem">Voice se punctuation: bolo "पूर्ण विराम", "अल्पविराम", "प्रश्न चिह्न", "नई लाइन" (English: full stop, comma, question mark, new line)</span></label></div>`;
 const t=ta();t.value=editing?notes.find(n=>n.id===editing)?.text||'':draft;
 const upd=()=>{draft=editing?draft:t.value;const w=t.value.trim()?t.value.trim().split(/\s+/).length:0;$('#cnt').textContent=w+' shabd · '+t.value.length+' akshar'};
 t.addEventListener('input',upd);upd();
 if(editing)$('#sv').textContent='Badlav save karo';
 $('#lang').onchange=e=>{pref.lang=e.target.value;savePref();if(wantOn){stopRec();setTimeout(()=>{wantOn=true;startRec()},400)}};
 $('#cmds').onchange=e=>{pref.cmds=e.target.checked;savePref()};
 $('#mic').onclick=toggleMic;paintMic();
 $('#sv').onclick=()=>{const v=t.value.trim();if(!v){toast('Pehle kuch bolo ya likho');return}
  if(editing){const n=notes.find(x=>x.id===editing);if(n){n.text=v;n.title=titleOf(v);n.updated=Date.now()}editing=null;toast('Badlav save ho gaya')}
  else{notes.unshift({id:uid(),title:titleOf(v),text:v,lang:pref.lang,created:Date.now(),updated:Date.now()});toast('Note save ho gaya')}
  saveNotes();stopRec();draft='';t.value='';tab='notes';render()};
 $('#cp').onclick=()=>t.value.trim()?copyText(t.value):toast('Kuch text nahi hai');
 $('#sh').onclick=()=>shareText(t.value);
 $('#cl').onclick=()=>{if(!t.value.trim()||confirm('Text saaf kar dein?')){t.value='';draft='';editing=null;render()}};
}
function titleOf(v){const f=v.split('\n')[0].trim();return f.length>48?f.slice(0,48).trim()+'…':f}
async function shareText(t){t=t.trim();if(!t){toast('Kuch text nahi hai');return}
 if(navigator.share){try{await navigator.share({text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
 window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener')}
const dt=ms=>new Date(ms).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
function vNotes(el){
 const list=notes.filter(n=>!q||(n.title+' '+n.text).toLowerCase().includes(q.toLowerCase()));
 el.innerHTML=`<div class="card"><input id="q" type="search" placeholder="Notes me dhundo..." value="${esc(q)}" aria-label="Search"></div>
 ${list.length?list.map(n=>`<div class="note"><h4>${esc(n.title)}</h4><div class="meta">${dt(n.updated)} · ${n.text.trim().split(/\s+/).length} shabd · ${esc((LANGS.find(l=>l[0]===n.lang)||[0,n.lang])[1])}</div><p>${esc(n.text)}</p>
 <div class="row"><button class="btn sm" data-ed="${n.id}">Edit</button><button class="btn sm" data-cp="${n.id}">Copy</button><button class="btn sm" data-sh="${n.id}">Share</button><button class="btn sm" data-dl="${n.id}">.txt</button><button class="btn sm bad" data-rm="${n.id}">Delete</button></div></div>`).join(''):`<div class="card empty">${notes.length?'Kuch nahi mila.':'Abhi koi note nahi. "Bolo" tab me pehli note banao.'}</div>`}`;
 $('#q').oninput=e=>{q=e.target.value;const pos=e.target.selectionStart;vNotes(el);const i=$('#q');i.focus();i.setSelectionRange(pos,pos)};
 const get=id=>notes.find(n=>n.id===id);
 $$('[data-ed]',el).forEach(b=>b.onclick=()=>{editing=b.dataset.ed;tab='rec';render();scrollTo(0,0)});
 $$('[data-cp]',el).forEach(b=>b.onclick=()=>copyText(get(b.dataset.cp).text));
 $$('[data-sh]',el).forEach(b=>b.onclick=()=>shareText(get(b.dataset.sh).text));
 $$('[data-dl]',el).forEach(b=>b.onclick=()=>{const n=get(b.dataset.dl);download((n.title.replace(/[^\w\u0900-\u097F]+/g,'-').slice(0,30)||'note')+'.txt','\ufeff'+n.text)});
 $$('[data-rm]',el).forEach(b=>b.onclick=()=>{if(confirm('Ye note delete karein?')){notes=notes.filter(n=>n.id!==b.dataset.rm);saveNotes();render()}});
}
function vMore(el){
 el.innerHTML=`<div class="card"><h3>Backup &amp; restore</h3><p class="muted">Notes sirf is browser me hain. Backup lete rahein.</p><div class="row"><button class="btn pri" id="bk">Backup (.json)</button><label class="btn" style="display:inline-block">Restore<input type="file" id="rs" accept=".json,application/json" class="hide"></label><button class="btn" id="all">Sab notes .txt</button></div></div>
 <div class="card"><h3>Tips</h3><ul class="muted" style="margin:0;padding-left:1.1rem"><li>Chrome (Android / computer) me sabse acchha chalta hai. iPhone Safari me limited.</li><li>Shaant jagah par, mic ke paas bolein. Hindi ke liye "हिन्दी" chunein.</li><li>Hinglish bolne par bhi Hindi akshar aate hain. English words English me chahiye to English chunein.</li><li>Accuracy browser ki speech service par depend karti hai, kabhi kabhi galat shabd aa sakte hain. Save karne se pehle ek baar padh lein.</li></ul></div>`;
 $('#bk').onclick=()=>download('awaaz-notes-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(notes),'application/json');
 $('#all').onclick=()=>notes.length?download('awaaz-notes.txt','\ufeff'+notes.map(n=>n.title+'\n'+dt(n.updated)+'\n\n'+n.text).join('\n\n----------\n\n')):toast('Koi note nahi');
 $('#rs').onchange=async x=>{const f=x.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!Array.isArray(j))throw 0;
  const n=j.map(o=>({id:String(o.id||uid()),title:String(o.title||'').slice(0,80),text:String(o.text||'').slice(0,20000),lang:String(o.lang||'hi-IN'),created:+o.created||Date.now(),updated:+o.updated||Date.now()})).filter(o=>o.text);
  if(!confirm(n.length+' note(s) mili. Abhi ki notes replace karein?'))return;notes=n;saveNotes();tab='notes';render();toast('Restore ho gaya')}catch(_){toast('Ye valid backup file nahi hai')}};
}
render();
window.__test={applyCmds,joinText};
