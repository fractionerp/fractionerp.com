(function () {
  'use strict';
  const main = document.getElementById('main');
  const data = JSON.parse(document.getElementById('as-data').textContent);
  const model = window.FractionAssessment;
  const $ = id => document.getElementById(id);
  const chapters = ['Your operation', 'Your daily reality', 'What’s changing'];
  const key = 'fraction-erp-assessment-' + data.version;
  const base = main.dataset.baseurl || '';
  let answers = {}, step = 'intro', savedStep = null, finishedSignature = '', acceptedSignature = '', pendingSignature = '', busy = false, report = null;
  const node = (tag, text, cls) => {const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
  function track(name, params) {
    // Only controlled identifiers/categories enter analytics; never answer or contact text.
    if (!document.cookie.split(';').some(c=>c.trim()==='cookie_consent=accepted')) return;
    if (typeof window.gtag === 'function') window.gtag('event',name,Object.assign({assessment_version:data.version},params || {}));
  }
  function path() {return data.questions.filter(q=>model.visible(q,answers));}
  function save() {try{sessionStorage.setItem(key,JSON.stringify({answers,step,finishedSignature,acceptedSignature}));}catch(e){/* Assessment remains usable when storage is unavailable. */}}
  function isComplete() {return path().every(q=>answers[q.id] && (!q.multi || answers[q.id].length));}
  function unlocked() {return isComplete() && acceptedSignature === JSON.stringify(answers);}
  function submissionPending() {return $('assessment-report-form').querySelector('button[type=submit]').disabled && !unlocked();}
  function reportText() {
    const lines=['Fraction Manufacturing Assessment · '+data.version,'Source: ERP Assessment: Full report request','Preferred contact: Email',report.title,report.summary,'ERP need: '+report.need,'Fraction fit: '+report.fit,'Readiness: '+report.readiness,'','Why we think this:',...report.reasons.map(s=>'• '+s),'','Next steps:',...report.actions.map((s,i)=>(i+1)+'. '+s),'',report.fitReason,'','Answers:'];
    path().forEach(q=>{const values=Array.isArray(answers[q.id])?answers[q.id]:[answers[q.id]];lines.push(q.title+' '+model.options(q,answers,data).filter(o=>values.includes(o[0])).map(o=>o[1]).join('; '));});
    return lines.join('\n');
  }
  function renderQuestion(q) {
    const scene=$('as-scene');scene.replaceChildren();
    const title=node('h1',q.title);title.id='as-question-title';title.tabIndex=-1;scene.append(title);
    const hint=node('p',q.hint,'as-hint');hint.id='as-question-hint';scene.append(hint);
    if(q.visual==='flow'){
      const flow=node('div',null,'as-flow');flow.id='as-flow';flow.setAttribute('aria-hidden','true');flow.dataset.choice=answers[q.id]||'';
      flow.append(node('span','Urgent order','as-flow-order'),node('b','→'),node('span','Production plan','as-flow-plan'),node('b','→'),node('span','Delivery'));scene.append(flow);
    }
    const field=node('fieldset',null,'as-question');field.setAttribute('aria-labelledby',title.id);field.setAttribute('aria-describedby',hint.id);
    const choices=node('div',null,'as-choices');
    model.options(q,answers,data).forEach((option,i)=>{
      const label=node('label',null,'as-choice'),input=document.createElement('input');
      input.type=q.multi?'checkbox':'radio';input.name=q.id;input.value=option[0];input.id='as-option-'+i;
      input.checked=q.multi?(answers[q.id]||[]).includes(option[0]):answers[q.id]===option[0];
      input.addEventListener('change',()=>{
        if(q.multi){
          let selected=[...(answers[q.id]||[])];
          if(input.checked){
            const exclusive=['none','unknown'];if(q.id==='growth')exclusive.push('ambition');
            if(exclusive.includes(option[0]))selected=[option[0]];
            else{selected=selected.filter(v=>!exclusive.includes(v));if(q.max && selected.length>=q.max){input.checked=false;$('as-error').textContent='Choose up to '+q.max+' options. Unselect one to change your choices.';return;}selected.push(option[0]);}
          }else selected=selected.filter(v=>v!==option[0]);
          answers[q.id]=selected;
        }else answers[q.id]=option[0];
        answers=model.sanitise(answers,data);
        choices.querySelectorAll('input').forEach(el=>{el.checked=q.multi?(answers[q.id]||[]).includes(el.value):answers[q.id]===el.value;});
        if($('as-flow'))$('as-flow').dataset.choice=answers[q.id]||'';
        $('as-error').textContent='';save();updateProgress();
      });
      const copy=node('span');copy.append(node('strong',option[1]));if(option[2])copy.append(node('small',option[2]));label.append(input,copy);choices.append(label);
    });
    field.append(choices);scene.append(field);updateProgress();
  }
  function updateProgress(){
    const list=path(),index=list.findIndex(q=>q.id===step),q=list[index];if(!q)return;
    $('as-stage').textContent=chapters[q.chapter];$('as-step-count').textContent='Question '+(index+1)+' of '+list.length;
    $('as-progress-bar').value=(index/list.length)*100;
    $('as-next').textContent=index===list.length-1?'See my assessment →':'Continue →';
  }
  function renderResult(){
    report=model.assess(answers);
    $('as-result-title').textContent=report.title;$('as-result-summary').textContent=report.summary;
    $('as-verdicts').replaceChildren();[['ERP need',report.need],['Fraction fit',report.fit],['Implementation',report.readiness]].forEach(pair=>{const box=node('div',null,'as-verdict');box.append(node('span',pair[0]),node('strong',pair[1]));$('as-verdicts').append(box);});
    const granted=unlocked();
    $('as-result-label').textContent=granted?'Your full report · By Fraction ERP':'Your initial outcome · By Fraction ERP';
    $('as-full-report').hidden=!granted;$('as-contact').hidden=granted;
    if(granted){
    $('as-reasons').replaceChildren(...report.reasons.map(s=>node('li',s)));
    $('as-actions').replaceChildren(...report.actions.map(s=>node('li',s)));
    $('as-priority').textContent=report.priority;$('as-fit-title').textContent=report.fit;$('as-fit-reason').textContent=report.fitReason;$('as-revisit').textContent=report.revisit;
    $('as-fit-link').href=base+(report.fit==='Strong potential fit'?report.resource:'/compare-erp/');
    $('as-fit-link').textContent=report.fit==='Strong potential fit'?'Explore the relevant capabilities →':'What to consider when comparing systems →';
    $('as-answer-list').replaceChildren();path().forEach(q=>{const values=Array.isArray(answers[q.id])?answers[q.id]:[answers[q.id]];$('as-answer-list').append(node('dt',q.title),node('dd',model.options(q,answers,data).filter(o=>values.includes(o[0])).map(o=>o[1]).join('; ')));});
    }else{
      ['as-reasons','as-actions','as-answer-list'].forEach(id=>$(id).replaceChildren());
      ['as-priority','as-fit-title','as-fit-reason','as-revisit'].forEach(id=>$(id).textContent='');
      $('as-report-message').value='';
    }
    const signature=JSON.stringify(answers);
    if(signature!==finishedSignature){track('assessment_complete',{outcome:report.outcome});finishedSignature=signature;save();}
  }
  async function navigate(target, push=true, direction=1){
    if(busy || submissionPending())return;busy=true;
    const old=step==='intro'?$('as-intro'):step==='result'?$('as-result'):$('as-scene');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced && typeof old.animate==='function')await old.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-direction*20)+'px)'}],{duration:120,easing:'ease-in'}).finished.catch(()=>{});
    step=target;
    if(step==='result' && !isComplete())step=path().find(q=>!answers[q.id]).id;
    if(!['intro','result'].includes(step) && !path().some(q=>q.id===step))step=path()[0].id;
    $('as-intro').hidden=step!=='intro';$('as-journey').hidden=['intro','result'].includes(step);$('as-result').hidden=step!=='result';$('as-error').textContent='';
    let focus;
    if(step==='result'){renderResult();focus=$('as-result-title');}
    else if(step==='intro'){focus=$('as-title');focus.tabIndex=-1;}
    else{renderQuestion(path().find(q=>q.id===step));focus=$('as-question-title');track('assessment_step_view',{step_id:step});}
    document.title=(step==='intro'?'Should You Buy an ERP?':step==='result'?'Your ERP Assessment':$('as-step-count').textContent+' · '+chapters[path().find(q=>q.id===step).chapter])+' | Fraction ERP';
    if(push)history.pushState({assessmentStep:step},'',window.location.pathname+(step==='result'&&unlocked()?'#report':''));
    save();window.scrollTo({top:0,behavior:'instant'});focus.focus({preventScroll:true});
    const incoming=step==='intro'?$('as-intro'):step==='result'?$('as-result'):$('as-scene');
    if(!reduced && typeof incoming.animate==='function')await incoming.animate([{opacity:0,transform:'translateX('+(direction*20)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'ease-out'}).finished.catch(()=>{});
    busy=false;
  }
  function reset(){
    if(submissionPending())return;
    answers={};finishedSignature='';acceptedSignature='';pendingSignature='';report=null;$('as-contact').hidden=false;$('as-full-report').hidden=true;
    const form=$('assessment-report-form');form.reset();form.querySelector('button[type=submit]').disabled=false;form.querySelector('.fraction-form-status').textContent='';
  }
  try{const stored=JSON.parse(sessionStorage.getItem(key));if(stored){answers=model.sanitise(stored.answers||{},data);savedStep=stored.step;finishedSignature=typeof stored.finishedSignature==='string'?stored.finishedSignature:'';acceptedSignature=typeof stored.acceptedSignature==='string'?stored.acceptedSignature:'';}}catch(e){/* Invalid or inaccessible session data is ignored. */}
  $('as-start').hidden=false;
  if(Object.keys(answers).length){$('as-resume').hidden=false;}
  $('as-start').addEventListener('click',()=>{reset();track('assessment_start');navigate('activity');});
  $('as-resume').addEventListener('click',()=>navigate(savedStep && savedStep!=='intro'?savedStep:path().find(q=>!answers[q.id])?.id||'result'));
  $('as-next').addEventListener('click',()=>{
    if(busy)return;
    const q=path().find(q=>q.id===step);
    if(!answers[step] || (q.multi && !answers[step].length)){$('as-error').textContent='Choose '+(q.multi?'at least one option':'an answer')+' to continue.';return;}
    const list=path(),index=list.findIndex(item=>item.id===step);navigate(list[index+1]?.id||'result');
  });
  $('as-back').addEventListener('click',()=>{const index=path().findIndex(q=>q.id===step);navigate(index>0?path()[index-1].id:'intro',true,-1);});
  $('as-edit').addEventListener('click',()=>navigate('activity',true,-1));
  $('as-gate-edit').addEventListener('click',()=>navigate('activity',true,-1));
  $('as-restart').addEventListener('click',()=>{if(window.confirm('Start a new assessment? This will clear the answers saved in this tab.')){reset();$('as-resume').hidden=true;navigate('intro',true,-1);}});
  $('as-print').addEventListener('click',()=>{if(!unlocked())return;document.querySelector('.as-answer-details').open=true;track('assessment_report_save');window.print();});
  const form=$('assessment-report-form');
  form.addEventListener('submit',event=>{
    if(unlocked() || form.querySelector('button[type=submit]').disabled){event.preventDefault();event.stopImmediatePropagation();return;}
    if(!report || !isComplete()){event.preventDefault();event.stopImmediatePropagation();return;}
    $('as-report-message').value=reportText();
    pendingSignature=JSON.stringify(answers);
    if(!form.querySelector('input[name=website]').value)track('assessment_report_request');
  },true);
  form.addEventListener('fraction:submitted',()=>{
    acceptedSignature=pendingSignature;
    if(!unlocked())return;
    renderResult();save();
    history.replaceState({assessmentStep:'result'},'',window.location.pathname+'#report');
    document.title='Your Full ERP Assessment Report | Fraction ERP';
    window.scrollTo({top:0,behavior:'instant'});$('as-result-title').focus({preventScroll:true});
    track('assessment_report_view');
  });
  const restoreReport=window.location.hash==='#report' && unlocked();
  history.replaceState({assessmentStep:restoreReport?'result':'intro'},'',window.location.href);
  if(restoreReport)navigate('result',false);
  else if(window.location.hash==='#report')history.replaceState({assessmentStep:'intro'},'',window.location.pathname);
  window.addEventListener('popstate',event=>{navigate(event.state?.assessmentStep||'intro',false,-1);});
})();
