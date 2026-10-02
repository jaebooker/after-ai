'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, ArrowRight, ArrowLeft, Compass, Check, List, Grid2X2, Plus, MoveDown, ShieldCheck, Map as MapIcon, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { scenarios, questions, dimensions, rankScenarios, validateAnswers, sourceUrl, type Answers, type Scenario } from './futures';
import { PublicVote } from './public-vote';
import { SurveyCompare } from './survey-compare';

const total = questions.length;
const emptyAnswers = (): (string | undefined)[] => Array(total).fill(undefined);
const toValues = (answers: (string | undefined)[]): Answers => answers.map(v => v === undefined || v === 'unsure' ? null : Number(v)) as Answers;
const number = (n:number) => String(n).padStart(2,'0');
const external = { target: '_blank', rel: 'noopener noreferrer' };
type ModelContext = {registerTool: (tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};

type Stage = 'quiz' | 'results' | 'vote';
type Panel = 'atlas' | 'about' | null;
const stages: { id: Stage; label: string; detail: string }[] = [
 { id: 'quiz', label: 'Answer six questions', detail: 'About two minutes.' },
 { id: 'results', label: 'See your futures', detail: 'Three to think through.' },
 { id: 'vote', label: 'Choose one', detail: 'And see what others chose.' },
];

export default function Home() {
 const [answers,setAnswers] = useState<(string|undefined)[]>(emptyAnswers);
 const [step,setStep] = useState(0);
 const [stage,setStage] = useState<Stage>('quiz');
 const [selected,setSelected] = useState<Scenario|null>(null);
 const [panel,setPanel] = useState<Panel>(null);
 const [atlasView,setAtlasView] = useState('list');
 const stageHeading=useRef<HTMLHeadingElement>(null);
 const dialogTop=useRef<HTMLSpanElement>(null);
 const focusRequested=useRef(false);
 const values=toValues(answers);
 const finished=stage!=='quiz';
 const ranked=finished?rankScenarios(values):[];
 const top=ranked.slice(0,3);
 const q=questions[step];
 const last=total-1;
 const completed=answers.filter(v=>v!==undefined).length;
 const topIds=new Set(top.map(r=>r.scenario.id));
 const stageIndex=stages.findIndex(s=>s.id===stage);

 useEffect(()=>{
  if(focusRequested.current){stageHeading.current?.focus({preventScroll:true});stageHeading.current?.closest('.quiz-surface')?.scrollIntoView({block:'nearest'});focusRequested.current=false;}
 },[step,stage]);
 // Each dialog view starts at its top, not at the first link further down.
 useEffect(()=>{dialogTop.current?.parentElement?.scrollTo({top:0});},[selected,panel]);
 useEffect(()=>{
  const context=(document as Document & {modelContext?:ModelContext}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const register=(tool:Parameters<ModelContext['registerTool']>[0])=>{
   try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability. */}
  };
  register({name:'complete_values_exploration',title:'Explore futures from six values',description:'Complete the visible values journey using six user-supplied choices ordered as agency, distribution, pluralism, development, continuity, oversight. Each value is -1, 0, 1, or null for unsure; do not infer the user’s values. Updates the visible results; these are discussion matches, not predictions.',inputSchema:{type:'object',properties:{answers:{type:'array',items:{enum:[-1,0,1,null]},minItems:total,maxItems:total}},required:['answers'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
   if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='answers'))throw new Error('Expected an answers object.');
   const inputAnswers=validateAnswers((input as {answers:unknown}).answers);
   flushSync(()=>{setAnswers(inputAnswers.map(v=>v===null?'unsure':String(v)));setStep(last);setStage('results');});
   document.getElementById('values')?.scrollIntoView({behavior:'instant'});
   return {kind:'discussion_matches',matches:rankScenarios(inputAnswers).slice(0,3).map(r=>({id:r.scenario.id,name:r.scenario.name,dimensionsCompared:r.compared.length})),prediction:false};
  }});
  register({name:'open_ai_scenario',title:'Open a future scenario',description:'Open the visible detail dialog for one of the twelve AI futures.',inputSchema:{type:'object',properties:{id:{type:'string',enum:scenarios.map(s=>s.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
   if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='id'))throw new Error('Expected a scenario id.');
   const s=scenarios.find(s=>s.id===(input as {id:unknown}).id);if(!s)throw new Error('Unknown scenario.');
   flushSync(()=>setSelected(s));return {id:s.id,name:s.name,summary:s.summary,warning:s.profile===null};
  }});
  return ()=>lifecycle.abort();
 },[last]);

 function navigate(next:number){focusRequested.current=true;setStep(next);}
 function go(next:Stage){focusRequested.current=true;if(next==='quiz')setStep(0);setStage(next);}
 function choose(value:unknown){setAnswers(prev=>prev.map((v,i)=>i===step?String(value):v));}
 function openAtlas(){setAtlasView('list');setSelected(null);setPanel('atlas');}
 function openAbout(){setSelected(null);setPanel('about');}
 function closePanel(){setPanel(null);setSelected(null);}
 const index=selected?scenarios.indexOf(selected):-1;

 return <main>
  <a className="skip" href="#values">Skip to the values compass</a>
  <header className="site-header">
   <a href="#" className="brand" aria-label="After AI home"><Compass aria-hidden="true"/><span>After<span className="brand-ai">AI</span></span></a>
   <nav aria-label="Main navigation"><a href="#values">Your compass</a><button onClick={openAtlas}>The 12 futures</button><button onClick={openAbout}>How it works</button></nav>
   <span className="header-note">AN ATLAS OF POSSIBLE FUTURES</span>
  </header>

  <section className="hero" aria-labelledby="hero-title">
   <div className="hero-art"><img src="/future-city.webp" width="1672" height="941" alt="A lone person faces two diverging bridges toward a vast cyan city beneath an amber sun." fetchPriority="high"/><div className="hero-art-shade"/></div>
   <div className="hero-copy">
    <p className="eyebrow">MANY POSSIBLE WORLDS. ONE SHARED FUTURE.</p>
    <h1 id="hero-title">The future is<br/>not yet written.<br/><span>Where do you stand?</span></h1>
    <p className="hero-intro">AI could change what it means to be human. <br/>Answer six questions, see which futures fit your values, then choose the one you would want.</p>
    <div className="hero-actions"><a className="button orange" href="#values">Find your future <ArrowUpRight size={20}/></a><button className="text-link" onClick={openAtlas}>Or browse all 12 <ArrowRight size={17}/></button></div>
    <p className="hero-meta">6 QUESTIONS <span>·</span> ABOUT 2 MINUTES <span>·</span> NO RIGHT ANSWERS</p>
   </div>
   <div className="art-caption"><span>PLATE I — THE WORLD AHEAD</span><span>IMAGINE · QUESTION · CHOOSE <Plus size={15}/></span></div>
  </section>
  <div className="bridge"><span>More intelligence is only part of the story.</span><span>Who has power? Who checks it? Who benefits? <MoveDown size={19}/></span></div>

  <section className="values-section" id="values" aria-labelledby="values-title">
   <div className="values-heading">
    <p className="eyebrow">YOUR VALUES, YOUR COMPASS</p>
    <h2 id="values-title">A good future <br/>starts with <br/><em>what matters.</em></h2>
    <ol className="journey-steps" aria-label="Steps">{stages.map((s,i)=><li key={s.id} data-state={i<stageIndex?'done':i===stageIndex?'current':'todo'} aria-current={i===stageIndex?'step':undefined}><span className="journey-mark">{i<stageIndex?<Check size={14}/>:i+1}</span><span><strong>{s.label}</strong><small>{s.detail}</small></span></li>)}</ol>
    <div className="privacy-note"><ShieldCheck size={17}/><span>Your answers stay on this page unless you choose to share them.</span></div>
   </div>
   <div className="quiz-surface">
    {stage==='quiz' && <>
     <div className="quiz-top"><span className="eyebrow">{number(step+1)} / {number(total)}</span><span>{dimensions[step]}</span><Compass size={23}/></div>
     <Progress value={completed/total*100} aria-label={`${completed} of ${total} questions answered`} className="quiz-progress"/>
     <h3 ref={stageHeading} tabIndex={-1}>{q.title}</h3><p className="question-context">{q.context}</p>
     <RadioGroup key={step} aria-label={q.title} value={answers[step]??null} onValueChange={choose} className="answer-options">
      {q.options.map((option,i)=><label key={option.value} className={`answer-option ${answers[step]===String(option.value)?'chosen':''}`}><RadioGroupItem value={String(option.value)} aria-label={option.title}/><span className="answer-letter">{String.fromCharCode(65+i)}</span><span><strong>{option.title}</strong><small>{option.detail}</small></span>{answers[step]===String(option.value)&&<Check size={19} className="answer-check"/>}</label>)}
      <label className={`unsure-option ${answers[step]==='unsure'?'chosen':''}`}><RadioGroupItem value="unsure" aria-label="Unsure or it depends"/><span>Unsure / it depends</span></label>
     </RadioGroup>
     <div className="quiz-bottom"><button className="back-button" disabled={step===0} onClick={()=>navigate(step-1)}><ArrowLeft size={17}/> Back</button><button className="button ink" disabled={answers[step]===undefined} onClick={()=>step<last?navigate(step+1):go('results')}>{step===last?'See my futures':'Continue'}<ArrowRight size={17}/></button></div>
    </>}
    {stage==='results' && <div className="results">
     <div className="quiz-top"><span className="eyebrow">STEP 2 OF 3</span><span>Your futures</span><Compass size={23}/></div>
     <h3 ref={stageHeading} tabIndex={-1}>{top.length?'Three futures to think through.':'Your compass is still open.'}</h3>
     <p className="question-context">{top.length?'The closest fits to your answers. Starting points for thinking, not predictions.':'You chose “unsure” throughout, so there is nothing to match yet. You can still choose a future in the next step.'}</p>
     {top.map((r,i)=><article className="result-card" key={r.scenario.id}><div className="result-number">{number(i+1)}</div><div className="result-body"><div className="result-label">{i===0?'CLOSEST MATCH':Math.abs(r.distance-top[0].distance)<1e-9?'TIED':'ALSO CLOSE'} <span>· {r.agreements.length} of {r.compared.length} values in common</span></div><button className="result-title" onClick={()=>setSelected(r.scenario)}>{r.scenario.name}<ArrowUpRight size={22}/></button><p>{r.scenario.summary}</p><p className="result-tension"><strong>Question to keep: </strong>{r.scenario.question}</p>{r.differences.length>0&&<p className="mismatch">Differs from you on {r.differences.map(v=>dimensions[v.dimension].toLowerCase()).join(', ')}.</p>}</div></article>)}
     <SurveyCompare answers={values} onAbout={openAbout}/>
     <div className="stage-next"><button className="button ink" onClick={()=>go('vote')}>Next: choose your future <ArrowRight size={17}/></button><button className="back-button" onClick={()=>go('quiz')}><ArrowLeft size={16}/> Change my answers</button></div>
    </div>}
    {stage==='vote' && <div className="results">
     <div className="quiz-top"><span className="eyebrow">STEP 3 OF 3</span><span>Your choice</span><Compass size={23}/></div>
     <h3 ref={stageHeading} tabIndex={-1}>Which future would you choose?</h3>
     <p className="question-context">{top.length?'Your matches are listed first, but the choice is yours. Pick any of the twelve.':'Pick any of the twelve.'} <button className="underlined inline" onClick={openAtlas}>Read about them first</button></p>
     <PublicVote matches={top.map(r=>r.scenario.id)} onAbout={openAbout}/>
     <div className="stage-next"><button className="back-button" onClick={()=>go('results')}><ArrowLeft size={16}/> Back to my futures</button></div>
    </div>}
   </div>
  </section>

  <section className="explore" aria-label="Go deeper">
   <button className="explore-card" onClick={openAtlas}><MapIcon aria-hidden="true"/><span><strong>The twelve futures</strong><small>Read every scenario, or see them on the map.</small></span><ArrowUpRight size={22}/></button>
   <button className="explore-card" onClick={openAbout}><BookOpen aria-hidden="true"/><span><strong>How it works, and its limits</strong><small>The method, what is stored, and the thinking behind it.</small></span><ArrowUpRight size={22}/></button>
  </section>
  <footer><a className="brand" href="#"><Compass aria-hidden="true"/><span>After<span className="brand-ai">AI</span></span></a><div><p>An independent exploration inspired by <a href={sourceUrl} {...external}>Max Tegmark / Future of Life Institute</a>, <a href="https://thorehusfeldt.com/wp-content/uploads/2018/05/tegmark-001.png" {...external}>Thore Husfeldt’s chart</a>, and <a href="https://www.tomorrows-ai.org/" {...external}>Tomorrow’s AI</a>. Not affiliated with or endorsed by them.</p></div><a className="back-to-top" href="#">BACK TO TOP <ArrowUpRight size={16}/></a></footer>

  <Dialog open={panel!==null||selected!==null} onOpenChange={open=>{if(!open)closePanel();}}>
   <DialogContent initialFocus={dialogTop} className={selected?'scenario-dialog':panel==='atlas'?'scenario-dialog atlas-dialog':'method-dialog'}>
    <span ref={dialogTop} tabIndex={-1} className="dialog-top"/>
    {selected ? <>
     {panel==='atlas'&&<button className="text-link dialog-back" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> All 12 futures</button>}
     <p className={`eyebrow ${!selected.profile?'warning-text':''}`}>{selected.profile?'A POSSIBLE WORLD':'A WARNING SCENARIO'} / {number(index+1)}{topIds.has(selected.id)?' · YOUR MATCH':''}</p>
     <DialogTitle className="dialog-heading">{selected.name}</DialogTitle>
     <DialogDescription className="scenario-summary">{selected.summary}</DialogDescription>
     <a className="source-link" href={sourceUrl} {...external}>Scenario source: FLI / Life 3.0 <ArrowUpRight size={14}/></a>
     <div className="reflection-block"><p className="eyebrow">A QUESTION TO TAKE WITH YOU</p><h3>{selected.question}</h3><p>{selected.tension}</p></div>
     {selected.profile?<details className="profile-details"><summary>How this future appears in the compass <Plus size={16}/></summary><dl>{dimensions.map((d,i)=><div key={d}><dt>{d}</dt><dd>{selected.profile![i]===null?'Not specified':questions[i].options.find(o=>o.value===selected.profile![i])!.title}</dd></div>)}</dl></details>:<p className="warning-explainer">A warning scenario. It is left out of compass matches.</p>}
     <div className="dialog-nav"><button className="text-link" onClick={()=>setSelected(scenarios[(index+11)%12])}><ArrowLeft size={16}/> Previous</button><span>{number(index+1)} / 12</span><button className="text-link" onClick={()=>setSelected(scenarios[(index+1)%12])}>Next future <ArrowRight size={16}/></button></div>
    </> : panel==='atlas' ? <>
     <p className="eyebrow">THE POSSIBILITY SPACE</p>
     <DialogTitle className="dialog-heading">Twelve futures.</DialogTitle>
     <DialogDescription className="atlas-lede">The worlds in Max Tegmark’s <em>Life 3.0</em>. Select one to read its central idea and a question worth asking.</DialogDescription>
     <Tabs value={atlasView} onValueChange={v=>setAtlasView(String(v))} className="atlas-tabs">
      <div className="atlas-toolbar"><TabsList aria-label="Atlas view" className="view-tabs"><TabsTrigger value="list"><List size={17}/> List</TabsTrigger><TabsTrigger value="map"><Grid2X2 size={16}/> Map</TabsTrigger></TabsList><div className="legend"><span><i/> Scenarios</span><span className="warning"><i/> Warnings</span>{top.length>0&&<span className="match"><i/> Your matches</span>}</div></div>
      <TabsContent value="map">
       <div className="map-scroll" role="region" aria-label="Map of AI futures. Scroll sideways on smaller screens, or use the list." tabIndex={0}>
        <div className="map-canvas">
         <div className="axis-y-title">WHO HAS FINAL AUTHORITY?</div><span className="axis-human">HUMANS</span><span className="axis-ai">AI / SUCCESSORS</span>
         <div className="map-plot"><div className="map-grid" aria-hidden="true"/>
          {scenarios.filter(s=>s.id!=='self-destruction').map(s=><button key={s.id} className={`map-node ${!s.profile?'warning':''} ${topIds.has(s.id)?'matched':''}`} style={{left:`${s.x}%`,top:`${s.y}%`}} onClick={()=>setSelected(s)} aria-label={`${s.name}${!s.profile?', warning scenario':''}${topIds.has(s.id)?', one of your matches':''}`}><span className="node-dot"/><span>{s.name}</span>{topIds.has(s.id)&&<span className="node-match-label">YOUR MATCH</span>}</button>)}
         </div>
         <div className="axis-x"><span>LITTLE OR NO AI</span><span>HOW MUCH AI CAPABILITY? <ArrowRight size={15}/></span><span>VERY HIGH</span></div>
        </div>
       </div>
       <div className="map-foot"><button className="outside-map" onClick={()=>setSelected(scenarios[11])}><span className="warning-dot"/><span><strong>Self-destruction</strong><small>Off the map: no continuing society.</small></span><ArrowUpRight size={20}/></button></div>
      </TabsContent>
      <TabsContent value="list"><div className="scenario-list">{scenarios.map((s,i)=><button key={s.id} className={`scenario-row ${!s.profile?'warning':''} ${topIds.has(s.id)?'matched':''}`} onClick={()=>setSelected(s)}><span className="row-number">{number(i+1)}</span><span className="row-name">{s.name}{topIds.has(s.id)&&<small>YOUR MATCH</small>}{!s.profile&&<small>WARNING SCENARIO</small>}</span><span className="row-summary">{s.summary}</span><ArrowUpRight size={22}/></button>)}</div></TabsContent>
     </Tabs>
     <p className="atlas-note">An editorial sketch, not a forecast. Scenarios follow <a href={sourceUrl} {...external}>FLI’s guide to Tegmark</a>; positions are adapted from <a href="https://thorehusfeldt.com/2018/05/25/superintelligence-in-sf-part-iii-aftermaths/" {...external}>Thore Husfeldt’s map</a>.</p>
    </> : panel==='about' ? <>
     <p className="eyebrow">A COMPASS, NOT A CRYSTAL BALL</p>
     <DialogTitle className="dialog-heading">How it works.</DialogTitle>
     <DialogDescription className="scenario-summary">Your answers point to futures worth thinking about. They do not predict what will happen.</DialogDescription>
     <h3 className="about-heading">The method</h3>
     <ol><li><strong>Six values.</strong> Agency, distribution, pluralism, development ambition, continuity, and oversight. Each answer is coded −1, 0, or +1. “Unsure” is skipped, not treated as a middle position.</li><li><strong>Each future has a profile.</strong> You can see it in the future’s detail panel. Where the source says nothing about a value, that value is skipped.</li><li><strong>Closest fit wins.</strong> We average the differences across the values both you and the profile specify. Ties go to the future compared on more values.</li><li><strong>Warnings are left out.</strong> Conquerors, Zookeeper, 1984, and Self-destruction stay in the atlas but never appear as matches.</li></ol>
     <h3 className="about-heading">The limits</h3>
     <p className="method-note">This is an editorial tool, not a validated test. The profiles, map positions, warning labels, and questions are our own readings of the source. A future matched on few values is a thin match. The twelve scenarios overlap and leave many futures out. Shared answers and votes come from whoever visits, so they are not a representative survey.</p>
     <h3 className="about-heading">What is stored</h3>
     <p className="method-note">Nothing, unless you share or vote. Then we store your six answers and closest match, or your chosen future, against a random browser ID kept in a cookie for up to a year. No names, emails, or IP addresses. One response and one vote per browser; you can change or remove either. Clearing cookies or using another device allows repeats.</p>
     <h3 className="about-heading">The thinking behind it</h3>
     <div className="research-notes"><article><div><h3>Abundance is a governance question.</h3><p>The OECD links AI benefits with inclusion, human agency, transparency, and accountability. More output alone does not answer who benefits.</p><a href="https://www.oecd.org/en/topics/ai-principles.html" {...external}>OECD AI Principles <ArrowUpRight size={14}/></a></div></article><article><div><h3>Different people can want different futures.</h3><p>UNESCO’s ethics recommendation grounds AI governance in dignity, diversity, participation, and human responsibility.</p><a href="https://www.unesco.org/en/artificial-intelligence/recommendation-ethics" {...external}>UNESCO Recommendation on AI Ethics <ArrowUpRight size={14}/></a></div></article><article><div><h3>Digital minds raise a separate question.</h3><p>Long and colleagues argue for investigating possible AI welfare under uncertainty.</p><a href="https://arxiv.org/abs/2411.00986" {...external}>Taking AI Welfare Seriously, 2024 <ArrowUpRight size={14}/></a></div></article></div>
     <a className="source-link" href={sourceUrl} {...external}>The original twelve scenarios <ArrowUpRight size={16}/></a>
    </> : null}
   </DialogContent>
  </Dialog>
 </main>;
}
