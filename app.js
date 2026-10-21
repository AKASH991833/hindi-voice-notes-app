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
 if(!SR){setStatus('This browser does not support voice typing. Please use Chrome.',1);return}
 if(listening)return;
 rec=new SR();rec.lang=pref.lang;rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;handled=new Set();
 rec.onstart=()=>{listening=true;setStatus('Listening... start speaking');paintMic()};
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
  const m={'not-allowed':'Microphone permission is blocked. Allow the mic from the lock icon in the address bar.','service-not-allowed':'Speech service is not allowed on this browser or device.','audio-capture':'No microphone found. Connect a mic and try again.','network':'No internet. Voice typing needs an internet connection.','language-not-supported':'This language is not supported in this browser.'}[e.error];
  if(m){wantOn=false;setStatus(m,1)}else if(e.error==='no-speech'){setStatus('Did not hear anything... keep speaking')};
 };
 rec.onend=()=>{listening=false;const iv=$('#interim');if(iv)iv.textContent='';paintMic();
  if(wantOn&&restarts<20){restarts++;setTimeout(()=>{if(wantOn)startRec()},250)}
  else if(wantOn){wantOn=false;setStatus('Voice typing stopped. Tap the mic to start again.',1);paintMic()}
  else if(!statusErr)setStatus('Stopped. Tap the mic to speak again.')};
 try{rec.start()}catch(e){setStatus('Could not start the mic. Please try again.',1);wantOn=false;paintMic()}
}
function stopRec(){wantOn=false;try{rec&&rec.stop()}catch(_){}listening=false;paintMic()}
function toggleMic(){if(wantOn||listening){stopRec();setStatus('Stopped.')}else{wantOn=true;restarts=0;setStatus('Starting the mic...');startRec()}}
function paintMic(){const m=$('#mic');if(!m)return;const on=wantOn||listening;m.classList.toggle('on',on);m.setAttribute('aria-pressed',on);m.setAttribute('aria-label',on?'Stop recording':'Start recording');const l=$('#micl');if(l)l.textContent=on?'Tap to stop':'Tap to speak'}
/* ---- views ---- */
const MIC='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>';
function render(){
 $('#app').innerHTML=`<div class="tabs"><button data-t="rec" class="${tab==='rec'?'on':''}">Speak</button><button data-t="notes" class="${tab==='notes'?'on':''}">My Notes (${notes.length})</button><button data-t="more" class="${tab==='more'?'on':''}">Backup</button></div><div id="v"></div>`;
 $$('[data-t]').forEach(b=>b.onclick=()=>{if(tab==='rec'&&b.dataset.t!=='rec')stopRec();tab=b.dataset.t;render();scrollTo(0,0)});
 ({rec:vRec,notes:vNotes,more:vMore})[tab]($('#v'));
}
let draft='';
function vRec(el){
 el.innerHTML=`${SR?'':'<div class="banner">Voice typing is not available in this browser. Use <b>Chrome</b> on Android or Chrome / Edge on a computer. You can also type below (or use your keyboard\'s mic).</div>'}
 <div class="card recbox"><div class="row" style="justify-content:center;margin-bottom:8px"><select id="lang" style="max-width:240px" aria-label="Language">${LANGS.map(([c,n])=>`<option value="${c}" ${pref.lang===c?'selected':''}>${n}</option>`).join('')}</select></div>
 <button class="mic" id="mic" ${SR?'':'disabled'}>${MIC}</button><div id="micl" class="muted" style="font-weight:700"></div><div id="st" class="status${statusErr?' err':''}">${esc(statusMsg)}</div></div>
 <div class="card"><div class="row"><b>Text</b><span class="muted right" id="cnt"></span></div>
 <textarea id="txt" class="big" placeholder="Your spoken words will appear here as text. You can edit them too." maxlength="20000"></textarea><div id="interim" class="interim" aria-live="polite"></div>
 <div class="row" style="margin-top:10px"><button class="btn pri" id="sv">Save note</button><button class="btn" id="cp">Copy</button><button class="btn" id="sh">Share</button><button class="btn bad" id="cl">Clear</button></div>
 <label class="row" style="gap:8px;margin-top:14px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" id="cmds" ${pref.cmds?'checked':''} style="margin-top:3px"> <span class="muted" style="font-size:.9rem">Spoken punctuation: say "पूर्ण विराम", "अल्पविराम", "प्रश्न चिह्न", "नई लाइन" (English: full stop, comma, question mark, new line)</span></label></div>`;
 const t=ta();t.value=editing?notes.find(n=>n.id===editing)?.text||'':draft;
 const upd=()=>{draft=editing?draft:t.value;const w=t.value.trim()?t.value.trim().split(/\s+/).length:0;$('#cnt').textContent=w+' words · '+t.value.length+' characters'};
 t.addEventListener('input',upd);upd();
 if(editing)$('#sv').textContent='Save changes';
 $('#lang').onchange=e=>{pref.lang=e.target.value;savePref();if(wantOn){stopRec();setTimeout(()=>{wantOn=true;startRec()},400)}};
 $('#cmds').onchange=e=>{pref.cmds=e.target.checked;savePref()};
 $('#mic').onclick=toggleMic;paintMic();
 $('#sv').onclick=()=>{const v=t.value.trim();if(!v){toast('Speak or write something first');return}
  if(editing){const n=notes.find(x=>x.id===editing);if(n){n.text=v;n.title=titleOf(v);n.updated=Date.now()}editing=null;toast('Changes saved')}
  else{notes.unshift({id:uid(),title:titleOf(v),text:v,lang:pref.lang,created:Date.now(),updated:Date.now()});toast('Note saved')}
  saveNotes();stopRec();draft='';t.value='';tab='notes';render()};
 $('#cp').onclick=()=>t.value.trim()?copyText(t.value):toast('Nothing to copy');
 $('#sh').onclick=()=>shareText(t.value);
 $('#cl').onclick=()=>{if(!t.value.trim()||confirm('Clear the text?')){t.value='';draft='';editing=null;render()}};
}
function titleOf(v){const f=v.split('\n')[0].trim();return f.length>48?f.slice(0,48).trim()+'…':f}
async function shareText(t){t=t.trim();if(!t){toast('Nothing to share');return}
 if(navigator.share){try{await navigator.share({text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
 window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener')}
const dt=ms=>new Date(ms).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
function vNotes(el){
 const list=notes.filter(n=>!q||(n.title+' '+n.text).toLowerCase().includes(q.toLowerCase()));
 el.innerHTML=`<div class="card"><input id="q" type="search" placeholder="Search your notes..." value="${esc(q)}" aria-label="Search"></div>
 ${list.length?list.map(n=>`<div class="note"><h4>${esc(n.title)}</h4><div class="meta">${dt(n.updated)} · ${n.text.trim().split(/\s+/).length} words · ${esc((LANGS.find(l=>l[0]===n.lang)||[0,n.lang])[1])}</div><p>${esc(n.text)}</p>
 <div class="row"><button class="btn sm" data-ed="${n.id}">Edit</button><button class="btn sm" data-cp="${n.id}">Copy</button><button class="btn sm" data-sh="${n.id}">Share</button><button class="btn sm" data-dl="${n.id}">.txt</button><button class="btn sm bad" data-rm="${n.id}">Delete</button></div></div>`).join(''):`<div class="card empty">${notes.length?'No matching notes.':'No notes yet. Create your first note on the Speak tab.'}</div>`}`;
 $('#q').oninput=e=>{q=e.target.value;const pos=e.target.selectionStart;vNotes(el);const i=$('#q');i.focus();i.setSelectionRange(pos,pos)};
 const get=id=>notes.find(n=>n.id===id);
 $$('[data-ed]',el).forEach(b=>b.onclick=()=>{editing=b.dataset.ed;tab='rec';render();scrollTo(0,0)});
 $$('[data-cp]',el).forEach(b=>b.onclick=()=>copyText(get(b.dataset.cp).text));
 $$('[data-sh]',el).forEach(b=>b.onclick=()=>shareText(get(b.dataset.sh).text));
 $$('[data-dl]',el).forEach(b=>b.onclick=()=>{const n=get(b.dataset.dl);download((n.title.replace(/[^\w\u0900-\u097F]+/g,'-').slice(0,30)||'note')+'.txt','\ufeff'+n.text)});
 $$('[data-rm]',el).forEach(b=>b.onclick=()=>{if(confirm('Delete this note?')){notes=notes.filter(n=>n.id!==b.dataset.rm);saveNotes();render()}});
}
function vMore(el){
 el.innerHTML=`<div class="card"><h3>Backup &amp; restore</h3><p class="muted">Notes are stored only in this browser. Keep taking backups.</p><div class="row"><button class="btn pri" id="bk">Backup (.json)</button><label class="btn" style="display:inline-block">Restore<input type="file" id="rs" accept=".json,application/json" class="hide"></label><button class="btn" id="all">All notes as .txt</button></div></div>
 <div class="card"><h3>Tips</h3><ul class="muted" style="margin:0;padding-left:1.1rem"><li>Works best in Chrome (Android / computer). Limited in iPhone Safari.</li><li>Speak in a quiet place, close to the mic. Select "हिन्दी" for Hindi.</li><li>Speaking Hinglish still gives Devanagari text. Switch to English if you want English words in English.</li><li>Accuracy depends on the browser's speech service, so an occasional wrong word is normal. Read the text once before saving.</li></ul></div>`;
 $('#bk').onclick=()=>download('voice-notes-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(notes),'application/json');
 $('#all').onclick=()=>notes.length?download('voice-notes.txt','\ufeff'+notes.map(n=>n.title+'\n'+dt(n.updated)+'\n\n'+n.text).join('\n\n----------\n\n')):toast('No notes yet');
 $('#rs').onchange=async x=>{const f=x.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!Array.isArray(j))throw 0;
  const n=j.map(o=>({id:String(o.id||uid()),title:String(o.title||'').slice(0,80),text:String(o.text||'').slice(0,20000),lang:String(o.lang||'hi-IN'),created:+o.created||Date.now(),updated:+o.updated||Date.now()})).filter(o=>o.text);
  if(!confirm(n.length+' note(s) found. Replace current notes?'))return;notes=n;saveNotes();tab='notes';render();toast('Backup restored')}catch(_){toast('This is not a valid backup file')}};
}
render();
window.__test={applyCmds,joinText};
