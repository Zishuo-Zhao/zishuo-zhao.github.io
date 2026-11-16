import {projects,sources,kinds,verified,conferences,conferenceSource,fundingGuide} from './data.js?v=7';
import {evaluate,recommend,infer,referencedProjects,statusOf,eligibleProjects} from './engine.js?v=7';
const aiReady=false; let aiHistory=[];
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile={},type='',view='discover',matching=false,contextId=null,compared=new Set(),saved=new Set(),checks={};
try{saved=new Set(JSON.parse(localStorage.getItem('ew-saved')||'[]').filter(id=>projects.some(p=>p.id===id)));checks=JSON.parse(localStorage.getItem('ew-checks')||'{}');}catch{}
const persist=()=>{try{localStorage.setItem('ew-saved',JSON.stringify([...saved]));localStorage.setItem('ew-checks',JSON.stringify(checks));}catch{}};
const find=id=>projects.find(p=>p.id===id);
const isOpen=p=>['报名窗口内','年度内可申报'].includes(statusOf(p));
function toast(t){$('#toast').textContent=t;$('#toast').hidden=false;setTimeout(()=>$('#toast').hidden=true,2800);}
function sourceLink(p){return p.url?`<a class="detail-source-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">查看依据原文 ↗</a>`:'<span class="small">依据用户提供的学院材料，当前未附公开链接。</span>';}
function render(){
 $('#savedCount').textContent=saved.size;
 $('#sectionTitle').textContent=view==='saved'?'我的意向项目':matching?'与你相关的交流方向':'发现交流机会';
 $('#typeChips').innerHTML=['全部类型',...kinds].map(t=>`<button class="chip ${(!type&&t==='全部类型')||type===t?'active':''}" data-type="${esc(t)}">${esc(t)}</button>`).join('');
 let list=matching?recommend(profile).map(x=>x.p):[...projects];
 if(view==='saved')list=list.filter(p=>saved.has(p.id));
 const q=$('#search').value.trim().toLowerCase(), level=$('#levelFilter').value,scope=$('#scopeFilter').value;
 list=list.filter(p=>(!q||[p.name,p.country,p.summary,p.kind,...p.areas].join(' ').toLowerCase().includes(q))&&(!level||p.degrees.includes(level))&&(!scope||p.scope===scope)&&(!type||p.kind===type)&&(!$('#openOnly').checked||isOpen(p)));
 $('#resultCount').textContent=`${list.length} 条资料`;
 $('#matchBanner').hidden=!matching;
 if(matching)$('#matchBanner').innerHTML=`<button class="text-button" id="exitMatch">查看全部</button><strong>按你的需求排列</strong><br>${esc(Object.values(profile).filter(Boolean).join(' · ')||'请先补充学习阶段和目标')}<br>推荐表示方向值得了解，完整资格、时点和个人成本仍须核实。`;
 $('#cards').innerHTML=list.length?list.map(p=>{
 const e=evaluate(p,profile);return `<article class="project-card"><div class="card-top"><span class="flag">${esc(p.country)} · ${esc(p.scope)}</span><button class="save-button ${saved.has(p.id)?'on':''}" data-save="${p.id}" aria-label="${saved.has(p.id)?'取消收藏':'收藏'}${esc(p.name)}">${saved.has(p.id)?'♥':'♡'}</button></div><div class="project-en">${esc(p.en)}</div><h3>${esc(p.name)}</h3><div class="tags"><span class="tag">${esc(p.kind)}</span><span class="tag status ${isOpen(p)?'open':''}">${esc(statusOf(p))}</span></div><p>${esc(p.summary)}</p>${matching&&e.good.length?`<div class="card-match">✓ ${esc(e.good.slice(0,2).join('；'))}<br>待核实：${esc(e.gaps[0]||'完整申请条件')}</div>`:''}<div class="card-meta"><span>◷ ${esc(p.duration)}</span><span>↗ ${esc(p.degrees.join(' / ')||'对象待定')}</span></div><div class="card-bottom"><label><input type="checkbox" data-compare="${p.id}" ${compared.has(p.id)?'checked':''}> 加入比较</label><button data-detail="${p.id}">了解与申请 →</button></div></article>`;
 }).join(''):'<div class="empty">当前筛选下没有已收录项目。<br>可以放宽项目类型、学习阶段，或查看信息来源补充查找。<br><button class="text-button" id="emptyReset">重置筛选</button></div>';
 $('#compareBar').hidden=!compared.size;$('#compareLabel').textContent=`已选 ${compared.size} 个项目 · 最多3个`;
}
function resetFilters(){type='';$('#search').value='';$('#levelFilter').value='';$('#scopeFilter').value='';$('#openOnly').checked=false;render();}
function switchPanel(which){$('#profilePanel').hidden=which!=='profile';$('#chatPanel').hidden=which==='profile';$('#talkTab').classList.toggle('active',which!=='profile');$('#profileTab').classList.toggle('active',which==='profile');if(which==='profile')for(const [k,v] of Object.entries(profile)){if($('#profilePanel').elements[k])$('#profilePanel').elements[k].value=v;}}
function message(content,user=false){const div=document.createElement('div');div.className='message'+(user?' user':'');if(user)div.textContent=content;else div.innerHTML=content;$('#messages').append(div);$('#messages').scrollTop=$('#messages').scrollHeight;}
function suggestions(items){$('#suggestions').innerHTML=items.map(x=>`<button data-ask="${esc(x)}">${esc(x)}</button>`).join('');}
function welcome(){message('<div class="ai-label">演示模式 · 资料与规则匹配</div><strong>你好，我是小E。</strong><p>刚进大学，还不知道适合什么交流项目？没关系。告诉我年级和感兴趣的事情，我们从探索方向开始。</p><p>大一大二：理清兴趣与准备；高年级：比较项目与申请；研究生：校级项目与研究匹配。也可以问第四课堂、资助和报销准备。</p>');suggestions(['我是大一，还没想好方向','想获得第四课堂学分','国际会议能申请雏鹰吗？']);}
function mini(p){const e=evaluate(p,profile);return `<button class="mini-project" data-detail="${p.id}"><strong>${esc(p.name)} ↗</strong>${esc(e.good[0]||p.summary)}<small>${esc(p.kind)} · ${esc(statusOf(p))}</small></button>`;}
function recommendMessage(){
 matching=true;view='discover';resetFilters();syncNav('discover');
 const ranked=recommend(profile),top=ranked.slice(0,3);
 if(!top.length){message('<p>已收录资料中暂未找到适合当前条件的方向。我不会把本科项目直接推荐给研究生。可以通过“信息来源”查看新通知，或调整目标与时间。</p>');return;}
 let html=`<strong>先从这${top.length}个方向了解</strong><p>我按${esc([profile.degree,profile.goal,profile.time].filter(Boolean).join('、'))}筛选，以下仅表示方向相关：</p>`;
 html+=top.map(x=>mini(x.p)).join('');
 html+='<p>点开项目可以查看具体收获、已有反馈及申请步骤。往届项目仅用于了解路径，不代表新一轮已经开放。</p>';
 if(profile.time==='暑期'&&top.every(x=>x.p.time!=='暑期'))html+='<p><strong>时间提醒：</strong>暂未收录与你学习阶段相符的暑期项目，上述为其他时间路径，不能直接替代。</p>';
 if(profile.budget==='需要资助')html+='<p>你提到需要资助：先核对可申请计划及个人自付费用，暂不把任何项目判断为“预算内”。</p>';
 message(html);suggestions(['这几个项目怎么比较？','申请要准备什么？','参加后能得到什么？']);
}
function conferenceResults(q=''){const t=q.trim().toLowerCase();const list=conferences.filter(c=>!t||(c.zh+' '+c.en).toLowerCase().includes(t));return `<p class="small">匹配 ${list.length} / 357 条 · 保留官方序号，近似名称请核对原文</p><div class="conference-results">${list.map(c=>`<div class="source-item"><strong>${c.id}. ${esc(c.zh)}</strong><p>${esc(c.en)}</p><small>原目录第 ${c.page} 页 · 年度举办地、征稿及审批另核实</small></div>`).join('')}</div>`;}
function fundingHTML(){return `<span class="badge-blue">FUNDING & PREPARATION</span><h2>高水平交流，从学术目标到资助准备</h2><p>${esc(fundingGuide.purpose)}</p><div class="notice"><strong>本科生雏鹰 · 博士生飞鹰</strong><br>雏鹰面向符合条件的全日制在读普通本科生；飞鹰面向符合条件的全日制在读博士，海外联培6—24个月、至少180天。硕士不能套用两项资助资格。</div><h3>求是雏鹰：先辨申请类别</h3><table class="info-table"><tr><th>国际学科竞赛／学术会议</th><th>高水平境外交流</th></tr><tr><td>${esc(fundingGuide.conference)}</td><td>${esc(fundingGuide.exchange)}</td></tr></table><div class="notice"><strong>25000元是短期项目上限，不是固定到账金额</strong><br>${esc(fundingGuide.standard)}</div><h3>报销怎么准备</h3><p class="small">${esc(fundingGuide.reimbursement)}</p><p><a href="${sources.chu.url}" target="_blank" rel="noopener">雏鹰年度通知 ↗</a>　<a href="${sources.fei.url}" target="_blank" rel="noopener">飞鹰年度通知 ↗</a></p><h3>本科生国际学术会议认定目录 · 2026</h3><p class="small">可按中文名、英文名或缩写查找。名单认定、资助审批与费用报销是不同环节；不能凭会议名称直接报销。教育学可查 CIES、AERA；体育方向可查 ISBS。</p><input class="conference-search" id="conferenceSearch" aria-label="检索国际会议目录" placeholder="例如：AERA、教育、运动、ICML"><p><a href="${conferenceSource}" target="_blank" rel="noopener">查看学校完整会议目录（PDF）↗</a></p><div id="conferenceResults">${conferenceResults()}</div>`;}
function ruleAnswer(q){
 if(!q.trim())return;switchPanel('talk');message(q,true);$('#question').value='';
 if(/会议|报销|25000|2.5万/.test(q)){profile=infer(q,profile);if(profile.degree&&profile.degree!=='本科生'){message('<strong>先按研究生身份核对资助。</strong><p>本科生求是雏鹰的25000元短期资助上限不能套用到研究生。博士可查看求是飞鹰、CSC及学校其他适用渠道；具体费用项目、标准和报销手续按获批计划与当期通知确认。</p>'+['fei','csc-phd','io'].filter(id=>find(id).degrees.includes(profile.degree)).map(id=>mini(find(id))).join(''));return;}message('<strong>先确认身份与资助类别</strong><p>'+esc(fundingGuide.standard)+'</p><p>'+esc(fundingGuide.conference)+'</p><button class="mini-project" data-info="funding">查看资助分类、会议目录与报销准备 →</button>');return;}
 const before={...profile};profile=infer(q,profile);const ids=referencedProjects(q),explicit=ids.map(find).filter(Boolean);if(explicit.length===1)contextId=explicit[0].id;
 const current=explicit.length?explicit:contextId?[find(contextId)]:[];
 if(/雏鹰|飞鹰/.test(q)&&(/区别|硕士|本科|博士|适用|是什么|能申请|资助/.test(q)||!current.length)){
  message('<strong>两项计划不能混用。</strong><p>求是雏鹰面向符合条件的本科生；2026年求是飞鹰面向符合条件的全日制在读博士生，支持赴国外开展至少180天的联合培养，硕士不直接适用。</p><p>它们属于资助计划，并不等于“暑期项目”或“学期交换”。是否获资助还要经过申请审核。</p><button class="mini-project" data-info="funding">查看对象、边界与通知原文 →</button>');suggestions(['我是硕士，想出国做研究','我是博士，想联合培养一年']);return;
 }
 if(/类型|有哪些.*项目|项目.*区别/.test(q)&&!profile.goal&&!current.length){message('<strong>先分清六种路径</strong><ul><li>暑期／短期课程：集中学习某一主题。</li><li>学期交换：修读合作高校课程，先核对学分。</li><li>科研／教学实习：围绕课题或真实教学开展实践。</li><li>学位衔接：如3+2、4+1+1，须确认培养与学位条件。</li><li>研究生联合培养：围绕研究计划与导师开展合作。</li><li>国际组织实习：按岗位任务开展国际公共事务实践。</li></ul><p>你的学习阶段是什么？更希望修课、做研究、体验教学，还是继续攻读学位？</p>');suggestions(['我是本科生，想学期交换','我是教育学院本科生，想暑期教学实习','我是博士，想做科研']);return;}
 if(/比较|区别/.test(q)){
  const ps=current.length>=2?current:compared.size>=2?[...compared].map(find):recommend(profile).slice(0,3).map(x=>x.p);
  message('<strong>比较时看学习任务，不只看学校名称。</strong>'+ps.map(p=>`<p><b>${esc(p.name)}</b>：${esc(p.kind)}，${esc(p.duration)}；${esc(p.gain[0])}。${esc(statusOf(p))}。</p>`).join('')+'<p>你可以勾选项目卡片的“加入比较”，并排看类型、时长、对象、收获、资助与限制。</p>');return;
 }
 if(/第四课堂|四课堂|第四.*学分/.test(q)){message('<strong>先确认你的入学年级与项目情况。</strong><p>对2023级起本科生，认定路径与是否取得有效课程学分、项目正式起止是否满28天、线上线下等因素有关。不足28天且无有效课程学分时，还需要通过一门学校认定的国际化课程；应先完成回校办结及相应审核。</p><p>NIE 2026年6月30日至7月25日的行程不足28天，不能按“约四周”直接承诺满足要求。</p><a href="https://ugrs.zju.edu.cn/dwjlfwpt/2025/0925/c42976a3085718/page.htm" target="_blank" rel="noopener">学校第四课堂认定说明 ↗</a>');return;}
 const experience=/感受|体验反馈|学长|学姐|往届|评价|就业|去向|毕业|前辈/.test(q),apply=/怎么申请|如何申请|申请.*准备|材料|流程|下一步|怎么报名/.test(q),gain=/收获|得到什么|获得什么|学到|有什么用/.test(q),cost=/费用|多少钱|预算|资助|奖学金/.test(q),language=/雅思|托福|语言|英语/.test(q),deadline=/截止|什么时候|来得及|还能.*报|开放|报名时间/.test(q);
 if(experience||apply||gain||cost||language||deadline){
  const ps=current.length?current:recommend(profile).slice(0,2).map(x=>x.p);
  if(!ps.length){message('<p>请先告诉我你想了解哪个项目，或填写学习阶段与交流目标。</p>');return;}
  let html='';for(const p of ps){html+=`<h4>${esc(p.name)}</h4>`;
   if(experience){html+=p.experience.length?p.experience.map(x=>`<p>${esc(x.text)}<br><small>${esc(x.tag)}，依据项目总结。</small></p>`).join(''):'<p>当前没有收录可核验的往届个人体验，不用宣传目标代替真实评价。</p>';html+=`<p>${esc(p.outcome)}</p>`;}
   if(gain)html+=`<p>${esc(p.gain.join('；'))}。${p.status==='往届案例'?'新一轮安排须重新确认。':''}</p><p>这些是学习内容或预期收获，不保证录取、论文发表或就业结果。</p>`;
   if(apply)html+=`<p>状态：${esc(statusOf(p))}。${!isOpen(p)?'先确认当期是否仍可申请。':''}</p><ol>${p.steps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`;
   if(cost)html+=`<p>资助：${esc(p.fund)}。</p><p>${esc(p.fee)}。费用未核实前不能判断是否符合个人预算。</p>`;
   if(language)html+=`<p>${esc(p.language)}。未填语言成绩不等于符合要求；不要把某项目的语言门槛套给其他项目。</p>`;
   if(deadline)html+=`<p>${esc(statusOf(p))}。${esc(p.deadlineText||p.period)}。动态项目集合须查看单校截止时间；未来年度须等新通知。</p>`;
   html+=sourceLink(p)+`<button class="mini-project" data-detail="${p.id}">打开完整项目与申请清单 →</button>`;
  }message(html);return;
 }
 if(explicit.length){message(explicit.map(p=>`<h4>${esc(p.name)}</h4><p>${esc(p.summary)}</p><p>${esc(p.limits.join('；'))}。</p>${mini(p)}${sourceLink(p)}`).join(''));suggestions(['参加后能得到什么？','往届同学有什么感受？','怎么申请？']);return;}
 if(/分析需求|帮我选|不知道|推荐|适合|想|希望|本科|硕士|博士|课程学习|教学实践|科研训练|学位深造/.test(q)){
  if(!profile.degree){message('<p>先确认你的学习阶段，我会据此排除不适用的项目。</p>');suggestions(['我是本科生','我是硕士研究生','我是博士研究生']);return;}
  if(!profile.goal){message(`<p>已记下你是${esc(profile.degree)}。这次交流最希望获得什么？</p>`);suggestions(profile.degree==='本科生'?['我想课程学习','我想科研训练','我想学位深造','我想教学实践']:['我想科研训练','我想学位深造']);return;}
  if(!profile.time){message('<p>目标已记下。你能安排的是暑期、一个学期，还是长期学习？也可以打开“我的需求”一次填写。</p>');suggestions(['我想暑期出去','我可以安排一个学期','我考虑长期联合培养']);return;}
  if(!profile.college&&profile.degree==='本科生'){message('<p>再确认一个范围：你是教育学院学生，还是其他学院？这有助于区分校级项目与院系项目。</p>');suggestions(['我是教育学院本科生','我是计算机专业本科生，其他学院']);return;}
  contextId=null;recommendMessage();return;
 }
 if(JSON.stringify(before)!==JSON.stringify(profile)){recommendMessage();return;}
 message('<p>当前演示支持项目方向、申请步骤、资助、语言要求和往届反馈等咨询。我暂时无法从这个问题确定你需要哪一项，也不会生成未经核实的回答。</p><p>可以补充学习阶段、交流目标或学校名称，或选择下面的问题。</p>');suggestions(['帮我分析需求','本科生有哪些交流类型？','雏鹰和飞鹰有什么区别？']);
}
function showDemoCase(kind){
 aiHistory=[];profile={degree:kind==='phd'?'博士研究生':'本科生',college:'教育学院',area:'教育学'};contextId=null;matching=false;view='discover';resetFilters();syncNav('discover');switchPanel('talk');$('#messages').innerHTML='';
 const label='<div class="ai-label">案例演示 · 已整理建议，不调用模型</div>';
 if(kind==='phd'){
  profile={...profile,goal:'科研训练',time:'长期'};
  message('我是教育学院博士生，想赴海外高校联合培养6—24个月，也想了解国际组织实习，应该怎么选？',true);
  message(label+'<strong>先分清“完成研究”与“岗位实践”两条路径。</strong><p>以博士论文和导师合作为主，可比较求是飞鹰与CSC博士联合培养，两者是联培资助渠道，时长6—24个月。先落实接收导师和研究计划，再核对资助资格；不能理解为已获得海外院校录取。</p>'+['fei','csc-phd'].map(id=>mini(find(id))).join('')+'<p>希望了解国际公共事务工作，可考虑国际组织实习，通常3—12个月，属于岗位实践，不等同于6—24个月高校联培。自行联系渠道与CSC合作项目的申请步骤不同，校内可咨询就业指导与服务中心。</p>'+mini(find('io'))+'<p><strong>下一步：</strong>围绕论文方向了解接收导师；学院推荐方向包括多伦多大学、阿尔伯塔大学、威斯康星大学麦迪逊分校，具体接收机会仍需联系确认。校内办理核对研究生管理系统，CSC渠道还需按当期要求完成基金委端申请；分别记录学生提交、学院审核和外方截止时间。</p>');
  suggestions(['求是飞鹰怎么申请？','CSC博士联培申请准备','国际组织实习怎么申请？']);
 }else{
  profile={...profile,stage:'低年级探索'};
  message('我是教育学院大一学生，还没想好是否留学，想了解什么项目适合自己，现在可以怎么准备？',true);
  message(label+'<strong>先探索学习方式，再决定申请哪条路径。</strong><p>现在不必马上决定留学。喜欢观察课堂，可以先了解NIE新加坡教学实习；想体验海外大学课程，可以了解校级学期交换；未来明确深造目标，再比较本硕衔接。低年级可以先了解，不能据此认定目前就符合报名条件。</p>'+mini(find('nie'))+'<p><strong>未来路径比较：</strong>NIE 4+1+1与香港教育大学MTeach合作涉及本硕衔接；伯明翰2+2是本科双学位，三者不能混为同一种培养安排。当期年级、成绩、语言、学费和学分要求需要查看新简章。</p>'+['nie-degree','eduhk','birmingham'].map(id=>mini(find(id))).join('')+'<p><strong>全校机会：</strong>还可了解欧洲等地区的学期交换，按专业、授课语言和学分衔接筛选。</p>'+mini(find('europe'))+'<p><strong>本学期先做三件事：</strong>①选一个感兴趣的学习主题；②了解语言与课程准备；③跟踪本科生院和学院通知。申请时核对ZDBK对外交流模块和学院要求，记录校内外截止日期。第四课堂与雏鹰资助需要单独审核，不因参加项目自动获得。</p>');
  suggestions(['NIE实习往届同学有什么感受？','NIE实习怎么申请？','NIE实习能获得第四课堂学分吗？']);
 }
 $('#messages').scrollTop=0;
}

function detail(id){const p=find(id);if(!p)return;contextId=id;const e=evaluate(p,profile);
 $('#detailContent').innerHTML=`<span class="badge-blue">${esc(p.en)}</span><h2 class="detail-title">${esc(p.name)}</h2><div class="tags"><span class="tag">${esc(p.kind)}</span><span class="tag">${esc(p.scope)}</span><span class="tag status ${isOpen(p)?'open':''}">${esc(statusOf(p))}</span></div><p class="small">${esc(p.summary)}</p><div class="detail-grid"><div><small>目的地与时间</small><p>${esc(p.country)}<br>${esc(p.period)} · ${esc(p.duration)}</p></div><div><small>对象与学习方向</small><p>${esc(p.degrees.join(' / ')||'尚未确定')}<br>${esc(p.areas.join('、'))}</p></div><div><small>资助计划（单独核实）</small><p>${esc(p.fund)}</p></div><div><small>费用与语言</small><p>${esc(p.fee)}<br>${esc(p.language)}</p></div></div><section class="detail-section"><h3>01　为什么值得了解</h3><ul>${p.gain.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${Object.keys(profile).length?`<div class="notice"><strong>结合你的需求</strong><br>${esc([...e.good,...e.conflicts,...e.gaps].join('；'))}。</div>`:''}</section><section class="detail-section"><h3>02　往届体验与后续去向</h3>${p.experience.length?p.experience.map(x=>`<div class="quote"><p>${esc(x.text)}</p><small>${esc(x.tag)} · 不代表所有参与者</small></div>`).join(''):'<p>暂未收录可核验的个人反馈；项目介绍和预期目标不当作真实学生评价。</p>'}<p>${esc(p.outcome)}</p></section>${p.hostDirections?`<section class="detail-section"><h3>联培接收高校参考</h3><p><strong>全校目录（2026年版，21所）</strong><br>${esc(p.hostDirections.universityList.institutions.join("、"))}</p><p><strong>教育学院推荐方向</strong><br>${esc(p.hostDirections.collegeRecommendations.institutions.join("、"))}</p><div class="notice">先围绕论文问题确认接收导师、邀请与培养计划。名单不代表外方已开放名额或同意接收。<br>${esc(p.hostDirections.incentive)}</div></section>`:""}<section class="detail-section"><h3>03　申请前先确认</h3><ul>${p.limits.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${p.milestones?`<div class="notice">${p.milestones.map(esc).join('<br>')}<br>以上为北京时间；以原通知及接收方要求为准。</div>`:''}</section><section class="detail-section"><h3>04　我的申请准备清单</h3><p>勾选仅记录你的准备进度，不代表已经向学校提交申请。</p><div class="checklist">${p.steps.map((t,i)=>`<label><input type="checkbox" data-check="${p.id}:${i}" ${checks[p.id+':'+i]?'checked':''}> ${i+1}. ${esc(t)}</label>`).join('')}</div></section><div class="detail-actions"><button class="primary" data-export="${p.id}">下载项目与准备清单 ↓</button><button class="quiet" data-discuss="${p.id}">继续问小E</button></div><div class="source-line">资料依据：${esc(p.source)}<br>${esc(p.linkNote||'仅摘录必要项目事实；未公开内部原始材料。')}<br>核验日期：${verified}<br>${sourceLink(p)}</div>`;
 $('#detailDialog').showModal();}
function showInfo(html){$('#infoContent').innerHTML=html;$('#infoDialog').showModal();}
function showCompare(){const ps=[...compared].map(find);if(ps.length<2){toast('至少选择两个项目，更方便比较');return;}showInfo(`<span class="badge-blue">COMPARE YOUR OPTIONS</span><h2>哪些差异对你更重要？</h2><div class="compare-scroll"><table class="info-table"><tr><th>比较维度</th>${ps.map(p=>`<th>${esc(p.name)}</th>`).join('')}</tr>${[['类型','kind'],['对象','degrees'],['时间','duration'],['报名状态','status'],['收获','gain'],['资助计划','fund'],['费用','fee'],['必须确认','limits']].map(([n,k])=>`<tr><td>${n}</td>${ps.map(p=>`<td>${esc(k==='status'?statusOf(p):Array.isArray(p[k])?p[k].join('；'):p[k])}</td>`).join('')}</tr>`).join('')}</table></div><div class="notice">先比较学习任务与时间安排，再核对语言、经费和申请资格。不以名校排名代替适合程度。</div>`);}
function sourceHTML(){return `<span class="badge-blue">TRACEABLE INFORMATION</span><h2>每条建议，都能找到依据</h2><div class="notice">这是一份2026年11月16日补充的轻量演示资料集，尚未自动同步全校项目或微信公众号。已核验、往届案例与待补充线索分别标明，不把合作意向写成开放招生。</div>${['ug','grad','career','wechat','globalwx','gradwx'].map(k=>`<div class="source-item"><strong>${sources[k].name}</strong><p>${sources[k].note}</p><a href="${sources[k].url}" target="_blank" rel="noopener">打开官方入口 ↗</a></div>`).join('')}<div class="source-item"><strong>教育学院特色资料</strong><p>NIE、汉堡与悉尼项目结项报告及学习总结。已提炼学习内容、匿名反馈、准备建议和办理路径；未上传学生名单、个人联系方式、证件或内部协议。麦吉尔仅保留合作意向，NIE 4+1+1与伯明翰2+2依据学院教师说明收录；香港教育大学本硕合作有官方报道，招生条件仍须查看当期简章。</p></div><div class="notice"><strong>运行方式</strong><br>此版本为可点击的流程演示，使用已整理资料与本地规则，不连接 DeepSeek、不产生模型调用费用。案例建议不冒充实时 AI 生成。费用、学分、录取和资助结果交由官方确认。</div>`;}
function demoHTML(){return `<span class="badge-blue">TWO STUDENTS · TWO PATHWAYS</span><h2>从学生需求，体验两条交流路径</h2><p class="small">两组虚拟需求用于演示。推荐依据实际收录资料，当前批次与资格需核实。</p><div class="flow"><div><b>01</b><h3>教育学院博士生</h3><p>想赴海外高校联合培养6—24个月，也考虑国际组织实习。比较飞鹰、CSC博士联培与国际组织路径。</p><button class="primary" data-preset="phd">开始博士生案例</button></div><div><b>02</b><h3>教育学院低年级本科生</h3><p>刚入学还没方向：先了解自己的兴趣，再比较教学体验、课程交换与未来深造，梳理语言、学分和经费准备。</p><button class="primary" data-preset="education">开始本科生案例</button></div></div><div class="notice">说出需求 → 了解推荐理由 → 追问差异和申请准备 → 点开原文核实。可直接修改提问，无需填完一张表。</div>`;}
function syncNav(v){document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));}
function exportPlan(id){const p=find(id);const text=['E起看世界｜项目了解与申请准备','生成日期：'+new Date().toLocaleDateString('zh-CN'),'资料核验：'+verified,'',p.name,'类型：'+p.kind,'对象：'+p.degrees.join('、'),'状态：'+statusOf(p),'时间：'+p.period+'；'+p.duration,'资助：'+p.fund,'','学习收获（不代表录取承诺）',...p.gain,'','须核实',...p.limits,'','准备清单（非已提交）',...p.steps.map((t,i)=>(checks[id+':'+i]?'[已勾选] ':'[待准备] ')+t),'','往届反馈',...p.experience.map(x=>x.tag+'：'+x.text),p.outcome,'','来源：'+p.source,p.url||'用户提供的学院材料；无公开链接','演示参考，不代替当期通知和学校审批。'].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));a.download=p.name+'-准备清单.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('已下载，可用于后续核对与咨询');}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.type){type=b.dataset.type==='全部类型'?'':b.dataset.type;render();}
 if(b.dataset.save){saved.has(b.dataset.save)?saved.delete(b.dataset.save):saved.add(b.dataset.save);persist();render();}
 if(b.dataset.detail)detail(b.dataset.detail);
 if(b.dataset.ask)ask(b.dataset.ask);
 if(b.dataset.export)exportPlan(b.dataset.export);
 if(b.dataset.discuss){$('#detailDialog').close();switchPanel('talk');$('#assistant').scrollIntoView({behavior:'smooth',block:'center'});message(`<p>继续聊聊${esc(find(b.dataset.discuss).name)}。你想看申请准备、费用，还是往届反馈？</p>`);suggestions(['怎么申请？','往届同学有什么感受？','语言要求是什么？']);}
 if(b.dataset.info==='funding')showInfo(fundingHTML());
 if(b.dataset.view){const v=b.dataset.view;if(v==='funding')showInfo(fundingHTML());else if(v==='sources')showInfo(sourceHTML());else{view=v;matching=false;resetFilters();syncNav(v);}}
 if(b.dataset.preset){$('#infoDialog').close();showDemoCase(b.dataset.preset);$('#assistant').scrollIntoView({behavior:'smooth',block:'center'});}
 if(b.classList.contains('dialog-close'))b.closest('dialog').close();
 if(['emptyReset','clearFilter'].includes(b.id))resetFilters();
 if(b.id==='exitMatch'){matching=false;render();}
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.compare){if(el.checked&&compared.size>=3){el.checked=false;toast('最多比较3个项目');return;}el.checked?compared.add(el.dataset.compare):compared.delete(el.dataset.compare);render();}if(el.dataset.check){checks[el.dataset.check]=el.checked;persist();}});
['#levelFilter','#scopeFilter','#openOnly'].forEach(s=>$(s).addEventListener('change',render));$('#search').addEventListener('input',render);
$('#clearFilter').onclick=resetFilters;$('#compareOpen').onclick=showCompare;$('#compareClear').onclick=()=>{compared.clear();render();};
$('#profileTab').onclick=()=>switchPanel('profile');$('#talkTab').onclick=()=>switchPanel('talk');$('#startGuide').onclick=()=>{switchPanel('profile');$('#assistant').scrollIntoView({behavior:'smooth',block:'center'});};
$('#profilePanel').onsubmit=e=>{e.preventDefault();profile=Object.fromEntries(new FormData(e.target));contextId=null;switchPanel('talk');if(!profile.degree){message('<p>请先选择学习阶段，目标暂不确定也可以咨询，这样我才能避免推荐不适用的项目。</p>');switchPanel('profile');return;}if(aiReady){ask('请根据我的需求推荐：'+Object.values(profile).filter(Boolean).join('、'));}else recommendMessage();};
$('#chatForm').onsubmit=e=>{e.preventDefault();ask($('#question').value);};$('#question').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();ask(e.target.value);}});
$('#newChat').onclick=()=>{aiHistory=[];profile={};contextId=null;matching=false;$('#messages').innerHTML='';switchPanel('talk');welcome();render();
};$('#demoButton').onclick=()=>showInfo(demoHTML());
welcome();render();


function ask(q){ruleAnswer(q);}

document.addEventListener('input',e=>{if(e.target.id==='conferenceSearch')$('#conferenceResults').innerHTML=conferenceResults(e.target.value);});
