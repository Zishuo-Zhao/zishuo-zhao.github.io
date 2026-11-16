import {projects} from './data.js?v=7';
export function statusOf(p, now=new Date()) {
 if(p.deadline && now>new Date(p.deadline)) return '校内报名已截止';
 if(p.id==='fei' && now.getFullYear()!==2026) return '历史政策待更新';
 return p.status;
}
export function evaluate(p, f={}) {
 const good=[], gaps=[], conflicts=[];let score=0;
 if(!p.degrees.length) return {good:[],gaps:['尚无招生依据，不列入推荐'],conflicts:[],score:-100};
 if(p.scope==='教育学院'&&f.degree&&f.degree!=='本科生'){conflicts.push('学院现有特色项目面向本科生；研究生以校级项目为主');score-=100;}
 if(f.degree){if(p.degrees.includes(f.degree)){good.push('学习阶段与已知对象一致');score+=3;}else{conflicts.push('当前学习阶段不在已知对象范围内');score-=100;}}
 if(p.scope==='教育学院') {if(f.college==='其他学院'){conflicts.push('学院项目面向范围需确认，不作为校级开放项目推荐');score-=100;}else if(f.college==='教育学院'){good.push('与你所在学院的项目方向相关');score+=2;}else gaps.push('须确认是否面向你所在学院');}
 if(f.goal){if(p.goals.includes(f.goal)){good.push('项目内容与你的“'+f.goal+'”目标相关');score+=5;}else {gaps.push('项目重点与你的首要目标不同');score-=2;}}
 if(f.area&&p.areas.includes(f.area)){good.push('已知学习主题与你的专业方向相关');score+=3;}
 if(f.time){if(p.time===f.time){good.push('项目时段或时长与你的偏好接近');score+=2;}else if(p.time!=='待定'){gaps.push('项目时长与你的偏好不同，需重新安排');score-=4;}}
 if(f.language==='暂无证明')gaps.push('尚无语言证明，需要核实要求并准备');
 else gaps.push('语言、成绩与完整申请条件仍需按通知核验');
 if(f.budget==='需要资助')gaps.push('资助尚未获批，需先核实额度与个人自付费用');
 if(['往届案例','校内报名已截止','材料待补充','历史政策待更新'].includes(statusOf(p)))gaps.push('当前仅供了解路径，不能按本页直接申请新批次');
 if(statusOf(p)==='报名窗口内')score+=2;
 return {good,gaps,conflicts,score};
}
export function recommend(profile){return projects.map(p=>({p,...evaluate(p,profile)})).filter(x=>x.score>-50).sort((a,b)=>b.score-a.score);}
export function infer(text, old={}) {
 const p={...old};
 if(/博士|博[一二三四五]/.test(text))p.degree='博士研究生';else if(/硕士|研[一二三]|硕[一二三]/.test(text))p.degree='硕士研究生';else if(/本科|大[一二三四五]|本硕/.test(text))p.degree='本科生';
 if(/教育学院|教院/.test(text))p.college='教育学院';else if(/计算机|机械|材料|医学院|经济学院|法学院|工科/.test(text))p.college='其他学院';
 if(/体育|运动/.test(text))p.area='体育';else if(/教育|教学/.test(text))p.area='教育学';else if(/语言|外语/.test(text))p.area='语言学';else if(/计算机|机械|工程|理工|工科/.test(text))p.area='理工科';
 if(/国际组织/.test(text)&&! /联合培养|联培/.test(text))p.goal='国际组织实践';else if(/联合培养|联培/.test(text))p.goal='科研训练';else if(/教学|教师|中小学|上课实践/.test(text))p.goal='教学实践';else if(/科研|研究训练|实验室/.test(text))p.goal='科研训练';else if(/读硕|学位|本硕|升学|深造/.test(text))p.goal='学位深造';else if(/课程|学分|交换/.test(text))p.goal='课程学习';
 if(/暑期|暑假|夏天/.test(text))p.time='暑期';else if(/学期|半年交换/.test(text))p.time='学期';else if(/一年|长期|联培|联合培养|本硕/.test(text))p.time='长期';
 if(/没有雅思|没考|暂无语言|没有语言/.test(text))p.language='暂无证明';
 if(/大[一二]/.test(text))p.stage='低年级探索';else if(/大[三四五]/.test(text))p.stage='高年级申请';
 if(/预算有限|需要资助|奖学金|没钱|资助/.test(text))p.budget='需要资助';
 return p;
}
export function eligibleProjects(ids,profile={}){return [...new Set(ids)].filter(id=>{const p=projects.find(p=>p.id===id);return p&&evaluate(p,profile).conflicts.length===0&&p.degrees.length;});}
export function referencedProjects(text){
 const rules=[['nie-degree',/[34]\+1\+1|NIE.*本硕|NIE.*学位/i],['nie',/NIE|南洋|新加坡.*实习/i],['hamburg',/汉堡|hamburg/i],['sydney',/悉尼|sydney/i],['kth',/KTH|皇家理工|3\+2/i],['mitacs',/Mitacs/i],['mcgill',/麦吉尔|mcgill/i],['fei',/飞鹰/],['io',/国际组织/],['eduhk',/香港教育大学|港教大|MTeach/i],['birmingham',/伯明翰|2\+2/i],['csc-phd',/(CSC|留学基金委|国家公派).*(博士|联培|联合培养)/i],['csc',/CSC|国家公派/i],['hmt',/香港|港澳台/]];
 const ids=rules.filter(([,r])=>r.test(text)).map(([id])=>id);
 return ids.filter(id=>!(id==='nie'&&ids.includes('nie-degree'))&&!(id==='hmt'&&ids.includes('eduhk'))&&!(id==='csc'&&(ids.includes('csc-phd')||ids.includes('io'))));
}
