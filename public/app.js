const editor=document.querySelector('#editor'),people=document.querySelector('#people'),versionEl=document.querySelector('#version'),syncLabel=document.querySelector('#sync-label'),words=document.querySelector('#words'),remote=document.querySelector('#remote'),toast=document.querySelector('#toast');
let text='',version=0,clientId='',timer,applying=false;
const name=`Guest ${Math.floor(Math.random()*90+10)}`;
const colors=['#294e3d','#db6f55','#6979a8','#9c6a8e','#b48b3c'];
const initials=n=>n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
function diff(before,after){let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;let be=before.length,ae=after.length;while(be>start&&ae>start&&before[be-1]===after[ae-1]){be--;ae--}return{index:start,deleteCount:be-start,insertText:after.slice(start,ae),baseVersion:version}}
function setDocument(next,nextVersion){applying=true;text=next;version=nextVersion;editor.value=next;versionEl.textContent=`v${version}`;words.textContent=`${next.trim()?next.trim().split(/\s+/).length:0} words`;applying=false}
const protocol=location.protocol==='https:'?'wss':'ws';const ws=new WebSocket(`${protocol}://${location.host}/collaborate`);
ws.onopen=()=>{syncLabel.textContent='Synced';ws.send(JSON.stringify({type:'join',name}))};
ws.onclose=()=>syncLabel.textContent='Offline';
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='init'){clientId=m.id;setDocument(m.document.text,m.document.version);renderPeople(m.participants)}if(m.type==='document')setDocument(m.text,m.version);if(m.type==='presence')renderPeople(m.participants);if(m.type==='cursor'&&m.userId!==clientId){remote.textContent='A collaborator is editing';clearTimeout(timer);timer=setTimeout(()=>remote.textContent='',1200)}if(m.type==='error'){setDocument(m.document.text,m.document.version);showToast(m.message)}};
editor.addEventListener('input',()=>{if(applying)return;const next=editor.value;const operation=diff(text,next);text=next;words.textContent=`${next.trim()?next.trim().split(/\s+/).length:0} words`;if(ws.readyState===1)ws.send(JSON.stringify({type:'edit',operation}))});
editor.addEventListener('keyup',()=>{if(ws.readyState===1)ws.send(JSON.stringify({type:'cursor',position:editor.selectionStart}))});
function renderPeople(list){people.innerHTML=list.slice(0,5).map((p,i)=>`<div class="avatar" style="background:${colors[i%colors.length]}" title="${p.name}">${initials(p.name)}</div>`).join('')}
function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
document.querySelector('#analyze').onclick=async()=>{const button=document.querySelector('#analyze');button.textContent='Analyzing…';const result=await fetch('/api/suggestions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:editor.value})}).then(r=>r.json());document.querySelector('#score').textContent=result.score;document.querySelector('#suggestions').innerHTML=result.suggestions.length?result.suggestions.map(s=>`<div class="suggestion"><header>${s.title}<span>${s.type}</span></header><p>${s.evidence} ${s.recommendation}</p></div>`).join(''):'<p class="empty">Clean draft. No material issues detected.</p>';button.textContent='Analyze writing';showToast('Editorial review complete')};

