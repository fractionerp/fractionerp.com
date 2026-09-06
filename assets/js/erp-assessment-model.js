/* Shared, deterministic assessment rules. Keep changes versioned with the question data. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FractionAssessment = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const has = (a, key, value) => Array.isArray(a[key]) && a[key].includes(value);
  const pains = a => (a.pains || []).filter(v => v !== 'none');
  function visible(q, a) {
    if (a.activity === 'nonmanufacturing') return q.id === 'activity';
    if (q.when === 'erp') return ['erp_workarounds', 'connected'].includes(a.systems);
    if (q.when === 'pain') return pains(a).length > 0;
    if (q.when === 'priority') return pains(a).length > 1;
    if (q.when === 'specialist') return ['group', 'specialist', 'offline'].some(v => has(a, 'requirements', v));
    return true;
  }
  function options(q, a, data) {
    if (!q.optionsFrom) return q.options;
    return data.questions.find(item => item.id === q.optionsFrom).options.filter(o => has(a, q.optionsFrom, o[0]) && o[0] !== 'none');
  }
  function sanitise(input, data) {
    const clean = {};
    data.questions.forEach(q => {
      if (!visible(q, clean)) return;
      const allowed = options(q, clean, data).map(o => o[0]);
      const value = input[q.id];
      if (q.multi && Array.isArray(value)) {
        let values = [...new Set(value.filter(v => allowed.includes(v)))];
        if (values.includes('none')) values = ['none'];
        if (values.includes('unknown')) values = ['unknown'];
        if (q.id === 'growth' && values.includes('ambition')) values = ['ambition'];
        if (values.length) clean[q.id] = values.slice(0, q.max || allowed.length);
      } else if (!q.multi && allowed.includes(value)) clean[q.id] = value;
    });
    return clean;
  }
  const recommendations = {
    low: ['We don’t see a strong case for buying an ERP yet.', 'The complexity and disruption you described do not currently make a clear case for a new ERP. Keep your current tools consistent and reassess when the work becomes harder to coordinate.'],
    investigate: ['An ERP could help. Investigate the case first.', 'There are useful areas to explore, but we would establish the causes and business impact before recommending an ERP investment.'],
    strong: ['We think an ERP is worth serious consideration.', 'Your production dependencies, recurring disruption and information gaps make a practical case for investigating connected manufacturing control.'],
    prepare: ['There is a case for ERP. Build the foundations first.', 'An integrated system could help with the complexity you described. Clear ownership and dependable records will make the next step more achievable.'],
    keep: ['There is no clear reason to replace your current system.', 'Your connected system appears to be meeting your needs. Keep reviewing performance and make targeted improvements before considering a replacement.'],
    improve: ['Review your current ERP before replacing it.', 'Your answers point towards setup, data or adoption issues. Find out what your current system can do with those addressed before starting a replacement project.'],
    constraint: ['Tackle the main operating constraint first.', 'The causes you selected centre on capacity or supplier and customer changes. An ERP may improve visibility, but it will not create machine capacity or make a supplier more reliable by itself.'],
    uncertain: ['We need a little more detail to give a clear recommendation.', 'Some important answers are unknown or point in different directions. Clarifying these will give you a firmer basis for a systems decision.'],
    outside: ['Your business needs a different kind of assessment.', 'This assessment is designed around manufacturing. We can’t responsibly infer your need for ERP from questions about production when you mainly provide services or distribute products.']
  };
  const priorities = {
    scheduling: ['Production planning and visibility', 'Map how an urgent order changes the plan, then check capacity and operation times before comparing scheduling tools.', '/production-scheduling-software/'],
    visibility: ['Seeing where each job stands', 'Agree when job progress is recorded and who updates it. Follow one real order from acceptance through to delivery.', '/shopfloor-data-capture-software/'],
    shortages: ['Material availability', 'Review a recent shortage: check stock accuracy, purchasing lead times and whether demand was visible early enough.', '/purchasing-inventory-software/'],
    stock: ['Dependable inventory', 'Count a focused set of important parts, investigate discrepancies and agree how receipts and issues are recorded.', '/purchasing-inventory-software/'],
    admin: ['Reducing duplicate administration', 'Follow one order and note every time the same information is entered again. Prioritise the most frequent handover.', '/replace-excel-manufacturing/'],
    costing: ['Understanding job costs', 'Compare estimated and actual material and labour on a few completed jobs. Establish where reliable actuals are missing.', '/bill-of-materials-software/'],
    traceability: ['Material and quality records', 'Trace a finished job back to its material receipt. Identify where references or supporting records become disconnected.', '/traceability/'],
    reporting: ['Useful management information', 'Choose the three decisions that need better information. Define the records and update frequency each decision needs.', '/features/'],
    delivery: ['Reliable delivery promises', 'Review recent late orders and separate capacity, material and information causes before choosing a software remedy.', '/production-scheduling-software/']
  };
  function assess(a) {
    if (a.activity === 'nonmanufacturing') return {outcome:'outside', title:recommendations.outside[0], summary:recommendations.outside[1], need:'Not assessed', fit:'Unlikely fit', fitReason:'Fraction is built around manufacturing operations. Consider an assessment focused on your service or distribution workflows.', readiness:'Not assessed', reasons:['You told us that your business mainly provides services or distributes products.'], actions:['Map your main order-to-delivery or service workflow.', 'Identify recurring problems and the systems or processes involved.', 'Compare software designed for your operating model.'], priority:'Understand your operating model', resource:'/compare-erp/', revisit:'Reassess here if manufacturing becomes a substantial part of your operation.'};
    const reasons = [];
    const structure = Number(['many','thousands','extensive'].includes(a.parts)) + Number(['several','many'].includes(a.operations)) + ['assemblies','resources','subcontract','traceability'].filter(v => has(a,'dependencies',v)).length;
    const complexity = structure >= 2 ? 'High' : structure === 1 || a.operations === 'varies' || a.operations === 'few' || a.parts === 'some' ? 'Moderate' : 'Low';
    const recurring = ['weekly','daily'].includes(a.frequency);
    const impact = recurring || ['high','veryhigh'].includes(a.hours) || ['move','miss'].includes(a.delivery);
    const fragmented = ['manual','accounts','separate','erp_workarounds'].includes(a.systems);
    const friction = fragmented || a.urgent === 'rebuild' || ['manual','sheets','mixed'].includes(a.materials) || has(a,'causes','information') || has(a,'causes','software');
    const existing = ['connected','erp_workarounds'].includes(a.systems);
    const growth = ['orders','complexity','expansion'].some(v => has(a,'growth',v));
    const unknowns = ['parts','operations','delivery','hours'].filter(k=>a[k]==='unknown').length + Number(has(a,'dependencies','unknown'));
    const contradiction = has(a,'pains','none') && (['move','miss'].includes(a.delivery) || ['high','veryhigh'].includes(a.hours));
    const physicalCauses = (a.causes || []).length > 0 && (a.causes || []).every(v=>['capacity','external'].includes(v));
    const prep = a.data === 'poor' || a.owner === 'none';
    let outcome = 'investigate';
    let need = complexity === 'High' ? 'Moderate' : 'Low';
    if (complexity === 'High' && impact && friction) {outcome='strong';need='High';}
    else if (complexity === 'Low' && !impact && !growth) outcome='low';
    else need='Moderate';
    if (outcome==='strong' && prep) outcome='prepare';
    if (physicalCauses && !has(a,'pains','admin') && !has(a,'pains','reporting')) outcome='constraint';
    if (existing && (['setup','adoption'].includes(a.erp_reason) || a.data==='poor') && outcome!=='low') outcome='improve';
    if (a.systems==='connected' && a.erp_reason==='none' && !impact && !growth) {outcome='keep';need=complexity==='High'?'High (already served)':'Currently served';}
    if (unknowns>=2 || contradiction) {outcome='uncertain';need='Needs clarification';}
    if (unknowns===1 && outcome==='low') {outcome='investigate';need='Needs clarification';}
    const signals=[];
    if(['many','thousands','extensive'].includes(a.parts)) signals.push({'many':'251–1,000 active parts','thousands':'1,001–5,000 active parts','extensive':'over 5,000 active parts'}[a.parts]);
    if(['several','many'].includes(a.operations)) signals.push(a.operations==='several'?'4–6 production stages':'7 or more production stages');
    [['assemblies','subassemblies or multi-level BOMs'],['resources','shared machines or specialist people'],['subcontract','subcontract operations'],['traceability','batch, serial or material traceability']].forEach(([key,label])=>{if(has(a,'dependencies',key))signals.push(label);});
    if (structure>=2) reasons.push('Your operation combines '+signals.join(', ')+'. These create dependencies that need coordinating.');
    if (complexity==='Low') reasons.push('The parts, stages and dependencies you described suggest relatively straightforward production coordination.');
    if (a.urgent==='rebuild') reasons.push('An urgent order requires someone to rebuild the production plan manually.');
    if (fragmented) reasons.push('Your production information relies on manual records, separate systems or significant ERP workarounds.');
    if (recurring) reasons.push('The problems you selected disrupt work '+(a.frequency==='daily'?'most days.':'every week.'));
    if (['high','veryhigh'].includes(a.hours)) reasons.push('You estimate '+(a.hours==='high'?'11–20':'more than 20')+' team hours a week go into chasing, re-keying and replanning.');
    if (['move','miss'].includes(a.delivery)) reasons.push('Delivery dates often move or are missed, according to your answers.');
    if (physicalCauses) reasons.unshift('You identified capacity or supplier/customer changes as the main causes of disruption.');
    if (outcome==='improve') reasons.unshift('Your current ERP may be held back by setup, adoption or unreliable records.');
    if (outcome==='keep') reasons.unshift('You said your connected system largely meets your needs and there is no significant reason to change.');
    if (prep) reasons.push(a.data==='poor'?'You reported significant gaps in your production records.':'There is not yet a clear owner for a systems improvement project.');
    if (growth) reasons.push('You expect a confirmed change in orders, products, stages, machines or sites.');
    if (unknowns) reasons.unshift('Some production or performance information is not yet measured or known.');
    if (contradiction) reasons.unshift('You selected no significant problems, but also reported delivery disruption or substantial administrative time. Review those answers together.');
    if (!impact && !unknowns) reasons.push('Your answers do not indicate frequent disruption or a large weekly administrative burden.');
    let fit = 'Strong potential fit';
    let fitReason = 'Your manufacturing model aligns with Fraction’s production, purchasing and inventory workflows. A demonstration using your own work would confirm the details.';
    if (a.activity==='moulding') fitReason='Your operation may align with Fraction’s Moulding Edition. Confirm your tooling, material, cycle and production requirements in a demonstration.';
    if (['process','mixed'].includes(a.activity) || ['group','specialist','unknown'].some(v=>has(a,'requirements',v)) || a.people==='large') {
      fit='Needs a closer look';fitReason='Your operating model, scale or specialist requirements need a detailed review. These answers alone do not establish whether Fraction can meet every essential requirement.';
    }
    if (has(a,'requirements','offline') || has(a,'specialist','offline') || has(a,'specialist','formula')) {
      fit='Unlikely fit';fitReason=has(a,'requirements','offline')||has(a,'specialist','offline')?'You require offline working or an on-premise installation. Fraction is a cloud system that requires an internet connection.':'You require specialist formulation or continuous-process capabilities. Fraction’s documented focus is discrete manufacturing; explore systems designed around those requirements.';
    }
    const priorityKey = a.priority || pains(a)[0];
    const priority = priorities[priorityKey];
    let actions = [priority ? priority[1] : 'Map your current order-to-production workflow and keep responsibilities clear.'];
    if (outcome==='constraint') actions=['Review the capacity or supplier constraint behind your recent delays.','Separate physical limitations from delays caused by missing information.','Evaluate targeted improvements before committing to a wider systems project.'];
    else if (outcome==='improve') actions=['Review your most important workarounds with your current ERP supplier.','Address the setup, data and training gaps behind those workarounds.','Compare replacement systems only against requirements your current setup cannot reasonably meet.'];
    else if (outcome==='uncertain') actions=['Review the unknown or conflicting answers with your production team.','Record delivery performance, disruption and administrative effort over a typical month.','Revisit the assessment once you have a shared picture of the operation.'];
    else if (outcome==='keep') actions=['Review the current system against your next operational priorities.','Make targeted improvements to the workflows that need attention.','Reassess replacement only when you can identify a material unmet requirement.'];
    else {
      actions.push(a.data==='poor'||a.data==='gaps'?'Check your stock, part and production records and assign responsibility for maintaining them.':'Measure the time and delivery impact of your current approach over a typical month.');
      actions.push(prep?'Give a named project owner time and management support to define the next step.':['strong','prepare'].includes(outcome)?'Ask shortlisted suppliers to demonstrate your priority workflow using a representative job.':growth?'Review how the confirmed growth will affect your current tools before committing to new software.':'Set a review point based on recurring delays, more production dependencies or rising administration.');
    }
    return {outcome,title:recommendations[outcome][0],summary:recommendations[outcome][1],need,fit,fitReason,readiness:prep?'Preparation needed':a.owner==='ready'&&a.data==='good'?'Foundations in place':'Review before implementation',reasons,actions,priority:priority?priority[0]:'Understand your workflow',resource:priority?priority[2]:'/spreadsheet-readiness-checklist/',revisit:'Reassess when your production dependencies, delivery performance, administrative workload or essential system requirements change.'};
  }
  return {visible, options, sanitise, assess};
});
