"use strict";
const $=id=>document.getElementById(id),ALL="Все",DAY=864e5,INT=[0,1,3,7,14,30],LEARNED=3;
const CFG=window.CONFIG||{},SB=CFG.SUPABASE_URL,KEY=CFG.SUPABASE_ANON_KEY;
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const ls={get:(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const CARDS=Object.keys(D).flatMap(k=>D[k].split("\n").filter(Boolean).map(l=>{const p=l.split("|");const c=k[0]=="4"?{f:p[0].toLowerCase(),b:p[0],r:p[1]||"",k}:{f:p[0],b:p[1],r:p[2]||(k=="9 Корни"?"словарное слово":""),k};c.id=k+"|"+c.f+"|"+c.b;return c}));
const byCat=c=>c===ALL?CARDS:CARDS.filter(x=>x.k===c);
// Прогресс: P[id]={b:коробка 0-5, d:когда повторить, w:ошибок}. Выучено = коробка 3+
let P=ls.get("egeP",null);
if(!P){P={};ls.get("egeK",[]).forEach(i=>P[i]={b:3,d:Date.now()+3*DAY,w:0})}
const learned=c=>P[c.id]&&P[c.id].b>=LEARNED,due=c=>!P[c.id]||P[c.id].d<=Date.now(),score=()=>CARDS.filter(learned).length;
let nt;function save(){ls.set("egeP",P);clearTimeout(nt);nt=setTimeout(()=>board.push(),2000)}
function grade(c,ok){const p=P[c.id]||{b:0,d:0,w:0};if(ok)p.b=Math.min(5,p.b+1);else{p.b=0;p.w++}p.d=Date.now()+INT[p.b]*DAY;P[c.id]=p;save()}
let cat=ALL,deck=[],back=false,total=0,mode=1,Q=null;
function chips(){const w=$("ch");w.textContent="";[ALL,...Object.keys(D)].forEach(k=>{const b=el("button",k===cat?"on":""),l=byCat(k);b.append(k+" ",el("small","",l.filter(learned).length+"/"+l.length));b.onclick=()=>{cat=k;mode==2?quizStart():start()};w.appendChild(b)})}
function start(){deck=shuf(byCat(cat).filter(due));total=deck.length;back=false;render()}
function render(){
 const c=$("cd");chips();$("pb").style.width=(total?(total-deck.length)/total*100:0)+"%";
 $("cnt").textContent="Сегодня осталось: "+deck.length;c.textContent="";
 if(!deck.length){const n=byCat(cat).map(x=>P[x.id]?P[x.id].d:0).filter(d=>d>Date.now());
  const days=n.length?Math.max(1,Math.ceil((Math.min(...n)-Date.now())/DAY)):0;
  c.className="card";$("cat").textContent="";
  c.append(el("div","t","На сегодня всё 🎉"),el("div","r",days?"Следующее повторение через "+days+" дн.":"Все карточки выучены"));return}
 const d=deck[0];$("cat").textContent=d.k;c.className="card"+(back?" back":"");
 c.append(el("div","t",back?d.b:d.f),el("div",back?"r":"h",back?d.r:"нажмите, чтобы перевернуть"))}
const flip=()=>{if(deck.length){back=!back;render()}};
const know=()=>{if(deck.length)grade(deck.shift(),true);back=false;render()};
const again=()=>{if(deck.length){grade(deck[0],false);deck.push(deck.shift())}back=false;render()};
// Тест
const VOW="аеёиоуыэюя";
function opts(c){let o=[];
 if(c.k[0]=="4"&&!/[ ,]/.test(c.b))o=[...c.f].map((ch,i)=>VOW.includes(ch)?c.f.slice(0,i)+ch.toUpperCase()+c.f.slice(i+1):null).filter(v=>v&&v!==c.b);
 if(!o.length)o=[...new Set(byCat(c.k).map(x=>x.b))].filter(v=>v!==c.b);
 return shuf([c.b,...shuf(o).slice(0,3)])}
function quizStart(){Q={list:shuf(byCat(cat).slice()).slice(0,10),i:0,ok:0};quizRender()}
function quizRender(){const w=$("qz");w.textContent="";chips();
 if(Q.i>=Q.list.length){w.append(el("div","box","Результат: "+Q.ok+" из "+Q.list.length+". Ответы учтены в расписании повторений."));const b=el("button","nx","Ещё 10 вопросов");b.onclick=quizStart;w.appendChild(b);return}
 const c=Q.list[Q.i],box=el("div","card"),o=el("div","opts");let done=false;box.style.cursor="default";
 box.append(el("div","t",c.f),el("div","h",c.k[0]=="4"?"Где ударение?":"Выберите верный вариант"));
 opts(c).forEach((v,n)=>{const b=el("button","",(n+1)+". "+v);b.dataset.v=v;b.onclick=()=>{if(done)return;done=true;const ok=v===c.b;grade(c,ok);if(ok)Q.ok++;
  b.classList.add(ok?"ok":"bad");[...o.children].forEach(x=>{if(x.dataset.v===c.b)x.classList.add("ok")});
  if(c.r)w.appendChild(el("p","hint",c.r));const nx=el("button","nx","Дальше");nx.onclick=()=>{Q.i++;quizRender()};w.appendChild(nx);nx.focus()};o.appendChild(b)});
 w.append(el("div","info","Вопрос "+(Q.i+1)+" из "+Q.list.length),box,o)}
// Рейтинг (Supabase через REST, без библиотек)
const board={on:!!(SB&&KEY),rows:[],me:null,
 async session(){let s=ls.get("egeS",null);if(s&&s.expires_at>Date.now()/1000+60)return s;
  const h={apikey:KEY,"Content-Type":"application/json"};let r;
  if(s)r=await fetch(SB+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:h,body:JSON.stringify({refresh_token:s.refresh_token})});
  if(!r||!r.ok)r=await fetch(SB+"/auth/v1/signup",{method:"POST",headers:h,body:"{}"});
  if(!r.ok)throw new Error("auth");s=await r.json();ls.set("egeS",s);return s},
 async api(p,o={}){const s=await this.session();return fetch(SB+"/rest/v1/"+p,{...o,headers:{apikey:KEY,Authorization:"Bearer "+s.access_token,"Content-Type":"application/json",...o.headers}})},
 async push(){const nick=ls.get("egeNick","");if(!this.on||!nick)return;
  try{const s=await this.session();await this.api("leaderboard?on_conflict=user_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:s.user.id,nick,score:score(),updated_at:new Date().toISOString()})})}catch(e){}},
 async load(){if(!this.on)return;try{const s=await this.session();this.me=s.user.id;const r=await this.api("leaderboard?select=user_id,nick,score&order=score.desc,updated_at.asc&limit=100");if(!r.ok)throw 0;this.rows=await r.json();this.draw()}catch(e){$("acct").textContent="Не удалось загрузить рейтинг. Проверьте настройки Supabase."}},
 async join(n){ls.set("egeNick",n);await this.push();await this.load()},
 async leave(){try{const s=await this.session();await this.api("leaderboard?user_id=eq."+s.user.id,{method:"DELETE"})}catch(e){}ls.set("egeNick","");await this.load();this.draw()},
 draw(){const A=$("acct"),L=$("list");A.textContent="";L.textContent="";
  if(!this.on){A.textContent="Рейтинг пока не подключён. Инструкция — в README.md.";L.hidden=true;return}
  L.hidden=false;const nick=ls.get("egeNick","");
  if(!nick){A.append(el("div","","Придумайте ник для рейтинга. Настоящее имя и фамилию не указывайте."));const i=el("input");i.maxLength=20;i.placeholder="Ник";const b=el("button","","Присоединиться");b.onclick=()=>{const v=i.value.trim().slice(0,20);if(v)this.join(v)};A.append(i,b)}
  else{const m=this.rows.findIndex(r=>r.user_id==this.me);A.append(el("div","","Вы: "+nick+" · выучено "+score()+(m>=0?" · место "+(m+1)+" из "+this.rows.length:"")));const b=el("button","sh","Удалить меня из рейтинга");b.onclick=()=>this.leave();A.appendChild(b)}
  if(!this.rows.length){L.appendChild(el("div","row mut","Пока никого нет. Станьте первым!"));return}
  this.rows.forEach((r,i)=>{const d=el("div","row"+(r.user_id==this.me?" me":""));d.append(el("span","n",i+1),el("span","nm",r.nick),el("span","sc",r.score+" / "+CARDS.length));L.appendChild(d)})}};
// Интерфейс
function tab(n){mode=n;$("study").hidden=n!=1;$("quiz").hidden=n!=2;$("lb").hidden=n!=3;$("ch").hidden=n==3;[1,2,3].forEach(i=>$("t"+i).className=i==n?"on":"");if(n==1)start();if(n==2)quizStart();if(n==3){board.draw();board.load()}}
[1,2,3].forEach(i=>$("t"+i).onclick=()=>tab(i));
$("cd").onclick=flip;$("kn").onclick=know;$("rp").onclick=again;$("sh").onclick=start;
$("rs").onclick=()=>{if(confirm("Сбросить прогресс в выбранном разделе?")){byCat(cat).forEach(c=>delete P[c.id]);save();start()}};
$("ex").onclick=()=>{const a=el("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({v:1,P})],{type:"application/json"}));a.download="ege-progress.json";a.click()};
$("im").onchange=e=>{const f=e.target.files[0];if(f)f.text().then(t=>{const o=JSON.parse(t);if(!o||typeof o.P!="object")throw 0;P=o.P;save();start()}).catch(()=>alert("Не удалось прочитать файл"))};
const setT=t=>{document.documentElement.dataset.theme=t};if(ls.get("egeT",null))setT(ls.get("egeT",null));
$("th").onclick=()=>{const cur=document.documentElement.dataset.theme,dark=cur?cur=="dark":matchMedia("(prefers-color-scheme:dark)").matches,t=dark?"light":"dark";setT(t);ls.set("egeT",t)};
document.addEventListener("keydown",e=>{if(e.target.tagName=="INPUT"||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key,btn=e.target.tagName=="BUTTON";
 if(mode==1){if(k=="ArrowRight")know();else if(k=="ArrowLeft")again();else if((k==" "&&!btn)||(k=="Enter"&&e.target.id=="cd")){e.preventDefault();flip()}}
 else if(mode==2&&/^[1-4]$/.test(k)){const b=$("qz").querySelectorAll(".opts button")[k-1];if(b)b.click()}});
$("h1").textContent="ЕГЭ · Русский язык: "+CARDS.length+" слов";
tab(1);
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js");
