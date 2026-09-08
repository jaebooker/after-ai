'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, ArrowRight, ArrowLeft, Asterisk, Compass, Check, RotateCcw, List, Grid2X2, Plus, Minus, MoveDown, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { scenarios, questions, dimensions, rankScenarios, validateAnswers, sourceUrl, type Answers, type Scenario } from './futures';

const emptyAnswers = (): (string | undefined)[] => Array(5).fill(undefined);
const toValues = (answers: (string | undefined)[]): Answers => answers.map(v => v === undefined || v === 'unsure' ? null : Number(v)) as Answers;
const number = (n:number) => String(n).padStart(2,'0');
const external = { target: '_blank', rel: 'noopener noreferrer' };
type ModelContext = {registerTool: (tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};

export default function Home() {
 const [answers,setAnswers] = useState<(string|undefined)[]>(emptyAnswers);
 const [step,setStep] = useState(0);
 const [finished,setFinished] = useState(false);
 const [selected,setSelected] = useState<Scenario|null>(null);
 const [method,setMethod] = useState(false);
 const questionHeading=useRef<HTMLHeadingElement>(null);
 const resultHeading=useRef<HTMLHeadingElement>(null);
 const focusRequested=useRef(false);
 const values=toValues(answers);
 const ranked=finished?rankScenarios(values):[];
 const top=ranked.slice(0,3);
 const q=questions[step];
 const completed=answers.filter(v=>v!==undefined).length;
 const topIds=new Set(top.map(r=>r.scenario.id));

 useEffect(()=>{
  if(focusRequested.current){(finished?resultHeading:questionHeading).current?.focus({preventScroll:true});focusRequested.current=false;}
 },[step,finished]);
 useEffect(()=>{
  const context=(document as Document & {modelContext?:ModelContext}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const register=(tool:Parameters<ModelContext['registerTool']>[0])=>{
   try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability. */}
  };
  register({name:'complete_values_exploration',title:'Explore futures from five values',description:'Complete the visible values journey using five user-supplied choices ordered as agency, distribution, pluralism, development, continuity. Each value is -1, 0, 1, or null for unsure; do not infer the user’s values. Updates the visible results; these are discussion matches, not predictions.',inputSchema:{type:'object',properties:{answers:{type:'array',items:{enum:[-1,0,1,null]},minItems:5,maxItems:5}},required:['answers'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
   if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='answers'))throw new Error('Expected an answers object.');
   const inputAnswers=validateAnswers((input as {answers:unknown}).answers);
   flushSync(()=>{setAnswers(inputAnswers.map(v=>v===null?'unsure':String(v)));setStep(4);setFinished(true);});
   document.getElementById('values')?.scrollIntoView({behavior:'instant'});
   return {kind:'discussion_matches',matches:rankScenarios(inputAnswers).slice(0,3).map(r=>({id:r.scenario.id,name:r.scenario.name,dimensionsCompared:r.compared.length})),prediction:false};
  }});
  register({name:'open_ai_scenario',title:'Open a future scenario',description:'Open the visible detail dialog for one of the twelve AI futures.',inputSchema:{type:'object',properties:{id:{type:'string',enum:scenarios.map(s=>s.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
   if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='id'))throw new Error('Expected a scenario id.');
   const s=scenarios.find(s=>s.id===(input as {id:unknown}).id);if(!s)throw new Error('Unknown scenario.');
   flushSync(()=>setSelected(s));return {id:s.id,name:s.name,summary:s.summary,warning:s.profile===null};
  }});
  return ()=>lifecycle.abort();
 },[]);

 function navigate(next:number){focusRequested.current=true;setStep(next);}
 function finish(){focusRequested.current=true;setFinished(true);}
 function reset(){focusRequested.current=true;setAnswers(emptyAnswers());setStep(0);setFinished(false);}
 function edit(){focusRequested.current=true;setStep(0);setFinished(false);}
 function choose(value:unknown){setAnswers(prev=>prev.map((v,i)=>i===step?String(value):v));}

 return <main>
  <a className="skip" href="#values">Skip to the values explorer</a>
  <header className="site-header">
   <a href="#" className="brand" aria-label="After AI home"><Asterisk aria-hidden="true"/><span>AFTER<span className="brand-ai">AI</span></span></a>
   <nav aria-label="Main navigation"><a href="#futures">The futures</a><a href="#values">Your values</a><a href="#about">The thinking behind it <ArrowUpRight size={14}/></a></nav>
   <span className="header-note"><i/> A FIELD GUIDE TO WHAT COMES NEXT</span>
  </header>

  <section className="hero" aria-labelledby="hero-title">
   <div className="hero-art"><img src="/future-city.png" width="1672" height="941" alt="A lone person faces two diverging bridges toward a vast cyan city beneath an amber sun." fetchPriority="high"/><div className="hero-art-shade"/></div>
   <div className="hero-copy">
    <p className="eyebrow">+ MANY POSSIBLE WORLDS. ONE SHARED FUTURE.</p>
    <h1 id="hero-title">The future<br/>isn’t written.<br/><span>Where do<br/>you stand?</span></h1>
    <p className="hero-intro">AI could change what it means to be human.<br/>Explore twelve possible futures. Find out what matters to you.</p>
    <div className="hero-actions"><a className="button orange" href="#values">Find your future <ArrowUpRight size={20}/></a><a className="text-link" href="#futures">Explore all 12 <ArrowRight size={17}/></a></div>
    <p className="hero-meta">5 QUESTIONS <span>·</span> ABOUT 2 MINUTES <span>·</span> NO RIGHT ANSWERS</p>
   </div>
   <div className="art-caption"><span>THE NEXT CHAPTER IS STILL OPEN</span><span>IMAGINE / QUESTION / CHOOSE <Plus size={15}/></span></div>
  </section>
  <div className="bridge"><span>More intelligence is only part of the story.</span><span>Who has power? Who benefits? What do we preserve? <MoveDown size={19}/></span></div>

  <section className="values-section" id="values" aria-labelledby="values-title">
   <div className="values-heading"><p className="eyebrow">01 / YOUR VALUES, YOUR COMPASS</p><h2 id="values-title">A good future<br/>starts with<br/><em>what matters.</em></h2><p>Five questions about the choices beneath the technology.</p><p>Your answers connect you with futures to think through, including the parts you might reject.</p><div className="privacy-note"><ShieldCheck size={17}/><span>Your answers stay in this page.<br/>Reloading clears them.</span></div><button className="underlined" onClick={()=>setMethod(true)}>How the compass works <ArrowUpRight size={15}/></button></div>
   <div className="quiz-surface">
    {!finished ? <>
     <div className="quiz-top"><span className="eyebrow">{number(step+1)} / 05</span><span>{dimensions[step]}</span><Compass size={23}/></div>
     <Progress value={completed/5*100} aria-label={`${completed} of 5 questions answered`} className="quiz-progress"/>
     <h3 ref={questionHeading} tabIndex={-1}>{q.title}</h3><p className="question-context">{q.context}</p>
     <RadioGroup key={step} aria-label={q.title} value={answers[step]??null} onValueChange={choose} className="answer-options">
      {q.options.map((option,i)=><label key={option.value} className={`answer-option ${answers[step]===String(option.value)?'chosen':''}`}><RadioGroupItem value={String(option.value)} aria-label={option.title}/><span className="answer-letter">{String.fromCharCode(65+i)}</span><span><strong>{option.title}</strong><small>{option.detail}</small></span>{answers[step]===String(option.value)&&<Check size={19} className="answer-check"/>}</label>)}
      <label className={`unsure-option ${answers[step]==='unsure'?'chosen':''}`}><RadioGroupItem value="unsure" aria-label="Unsure or it depends"/><span>Unsure / it depends</span></label>
     </RadioGroup>
     <div className="quiz-bottom"><button className="back-button" disabled={step===0} onClick={()=>navigate(step-1)}><ArrowLeft size={17}/> Back</button><span>{step===4?'A starting point for reflection.':'You can change your answers.'}</span><button className="button ink" disabled={answers[step]===undefined} onClick={()=>step<4?navigate(step+1):finish()}>{step===4?'See my futures':'Continue'}<ArrowRight size={17}/></button></div>
    </> : <div className="results">
     <div className="quiz-top"><span className="eyebrow">YOUR COMPASS</span><Compass size={23}/></div>
     <h3 ref={resultHeading} tabIndex={-1}>{top.length?'Three futures to think through.':'Your compass is still open.'}</h3>
     <p className="question-context">{top.length?'These scenarios connect with your answers. None captures everything you value, and none is a prediction or an endorsement.':'You chose “unsure” throughout. There is no basis for a match yet. Explore the atlas or revisit any question when you’re ready.'}</p>
     {top.map((r,i)=><article className="result-card" key={r.scenario.id}><div className="result-number">{number(i+1)}</div><div className="result-body"><div className="result-label">{i===0?'CLOSEST DISCUSSION MATCH':Math.abs(r.distance-top[0].distance)<1e-9?'TIED ON AFFINITY':'ALSO WORTH EXPLORING'} <span>· {r.compared.length}/5 dimensions compared</span></div><button className="result-title" onClick={()=>setSelected(r.scenario)}>{r.scenario.name}<ArrowUpRight size={22}/></button><p><strong>{r.agreements.length?'Connects on: ':'Nearest trade-off: '}</strong>{(r.agreements.length?r.agreements:r.compared).map(v=>dimensions[v.dimension].toLowerCase()).join(', ')}.</p><p className="result-tension"><strong>Question to keep: </strong>{r.scenario.question}</p>{r.differences.length>0&&<p className="mismatch">Different from your choices on {r.differences.map(v=>dimensions[v.dimension].toLowerCase()).join(', ')}.</p>}</div></article>)}
     {top.length>0&&<p className="result-caveat">Some scenarios leave values unspecified. Fewer compared dimensions means a thinner basis for reflection. Equal affinities are ordered by coverage, then name.</p>}
     <div className="result-actions"><button className="button ink" onClick={edit}>Revisit my answers <ArrowLeft size={16}/></button><button className="back-button" onClick={reset}><RotateCcw size={16}/> Start over</button><a className="underlined" href="#futures">{top.length?'See matches on the map':'Explore the atlas'} <ArrowRight size={16}/></a></div>
    </div>}
   </div>
  </section>

  <section id="futures" className="atlas-section" aria-labelledby="atlas-title">
   <div className="section-heading"><div><p className="eyebrow">02 / THE POSSIBILITY SPACE</p><h2 id="atlas-title">Twelve futures.<br/><span>No single destination.</span></h2></div><div className="section-aside"><p>Explore the worlds in Max Tegmark’s <em>Life 3.0</em>. Select a future to see its central idea and a question worth asking.</p><p>These thought experiments can overlap. They are neither exhaustive nor forecasts. <a href={sourceUrl} {...external}>Read the original <ArrowUpRight size={14}/></a></p></div></div>
   <Tabs defaultValue="map" className="atlas-tabs">
    <div className="atlas-toolbar"><TabsList aria-label="Atlas view" className="view-tabs"><TabsTrigger value="map"><Grid2X2 size={16}/> Map of futures</TabsTrigger><TabsTrigger value="list"><List size={17}/> All 12 scenarios</TabsTrigger></TabsList><div className="legend"><span><i/> Discussion scenarios</span><span className="warning"><i/> Warning scenarios</span>{top.length>0&&<span className="match"><i/> Your matches</span>}</div></div>
    <TabsContent value="map">
     <div className="map-scroll" role="region" aria-label="Interactive AI futures map. Scroll horizontally on smaller screens, or use All 12 scenarios." tabIndex={0}>
      <div className="map-canvas">
       <div className="axis-y-title">WHO HAS FINAL AUTHORITY?</div><span className="axis-human">HUMANS</span><span className="axis-ai">AI / SUCCESSORS</span>
       <div className="map-plot"><div className="map-grid" aria-hidden="true"/>
        {scenarios.filter(s=>s.id!=='self-destruction').map(s=><button key={s.id} className={`map-node ${!s.profile?'warning':''} ${topIds.has(s.id)?'matched':''}`} style={{left:`${s.x}%`,top:`${s.y}%`}} onClick={()=>setSelected(s)} aria-label={`Explore ${s.name}${!s.profile?', warning scenario':''}${topIds.has(s.id)?', one of your matches':''}`}><span className="node-dot"/><span>{s.name}</span>{topIds.has(s.id)&&<span className="node-match-label">YOUR MATCH</span>}</button>)}
       </div>
       <div className="axis-x"><span>LITTLE OR NO AI</span><span>HOW MUCH AI CAPABILITY? <ArrowRight size={15}/></span><span>VERY HIGH</span></div>
      </div>
     </div>
     <div className="map-foot"><button className="outside-map" onClick={()=>setSelected(scenarios[11])}><span className="warning-dot"/><span><strong>Self-destruction</strong><small>Outside the axes: no continuing society.</small></span><ArrowUpRight size={20}/></button><p>Positions are an editorial sketch, not measurements. Mixed authority and transitions are simplified. Adapted from <a href="https://thorehusfeldt.com/2018/05/25/superintelligence-in-sf-part-iii-aftermaths/" {...external}>Thore Husfeldt’s map <ArrowUpRight size={13}/></a>.</p></div>
    </TabsContent>
    <TabsContent value="list"><div className="scenario-list">{scenarios.map((s,i)=><button key={s.id} className={`scenario-row ${!s.profile?'warning':''} ${topIds.has(s.id)?'matched':''}`} onClick={()=>setSelected(s)}><span className="row-number">{number(i+1)}</span><span className="row-name">{s.name}{topIds.has(s.id)&&<small>YOUR MATCH</small>}{!s.profile&&<small>WARNING SCENARIO</small>}</span><span className="row-summary">{s.summary}</span><ArrowUpRight size={22}/></button>)}</div></TabsContent>
   </Tabs>
   <p className="atlas-note">The scenario names and concise summaries follow <a href={sourceUrl} {...external}>FLI’s guide to Tegmark <ArrowUpRight size={13}/></a>. Warning labels, questions, positions, and matching profiles are editorial choices for this exploration.</p>
  </section>

  <section className="thinking-section" id="about" aria-labelledby="thinking-title">
   <div className="thinking-intro"><p className="eyebrow">03 / KEEP THE QUESTION OPEN</p><h2 id="thinking-title">A compass,<br/><span>not a crystal ball.</span></h2><p>A future can be prosperous without being fair, safe without being free, or intelligent without being humane. The useful question is what we would want to protect—and who gets a say.</p><button className="underlined" onClick={()=>setMethod(true)}>Read the method and its limits <ArrowUpRight size={17}/></button></div>
   <div className="research-notes"><article><span className="source-number">[01]</span><div><h3>Abundance is a governance question.</h3><p>The OECD links AI benefits with inclusion, human agency, transparency, and accountability. More output alone does not answer who benefits.</p><a href="https://www.oecd.org/en/topics/ai-principles.html" {...external}>OECD AI Principles <ArrowUpRight size={14}/></a></div></article><article><span className="source-number">[02]</span><div><h3>Different people can want different futures.</h3><p>UNESCO’s ethics recommendation grounds AI governance in dignity, diversity, participation, and human responsibility. A five-question quiz cannot speak for that diversity.</p><a href="https://www.unesco.org/en/artificial-intelligence/recommendation-ethics" {...external}>UNESCO Recommendation on AI Ethics <ArrowUpRight size={14}/></a></div></article><article><span className="source-number">[03]</span><div><h3>Digital minds raise a separate question.</h3><p>Long and colleagues argue for investigating possible AI welfare under uncertainty. This does not establish that AI is conscious, or imply that humanity should be replaced.</p><a href="https://arxiv.org/abs/2411.00986" {...external}>Taking AI Welfare Seriously, 2024 <ArrowUpRight size={14}/></a></div></article></div>
  </section>
  <footer><a className="brand" href="#"><Asterisk aria-hidden="true"/><span>AFTER<span className="brand-ai">AI</span></span></a><div><p>An independent exploration inspired by <a href={sourceUrl} {...external}>Max Tegmark / Future of Life Institute</a>, <a href="https://thorehusfeldt.com/wp-content/uploads/2018/05/tegmark-001.png" {...external}>Thore Husfeldt’s chart</a>, and <a href="https://www.tomorrows-ai.org/" {...external}>Tomorrow’s AI</a>.</p><p>Not affiliated with or endorsed by these organizations. Original AI-generated illustration.</p></div><a className="back-to-top" href="#">BACK TO TOP <ArrowUpRight size={16}/></a></footer>

  <Dialog open={selected!==null} onOpenChange={open=>{if(!open)setSelected(null);}}>
   <DialogContent className="scenario-dialog">
    {selected&&<><p className={`eyebrow ${!selected.profile?'warning-text':''}`}>{selected.profile?'A POSSIBLE WORLD':'A WARNING SCENARIO'} / {number(scenarios.indexOf(selected)+1)}</p><DialogTitle className="dialog-heading">{selected.name}</DialogTitle><DialogDescription className="scenario-summary">{selected.summary}</DialogDescription><a className="source-link" href={sourceUrl} {...external}>Scenario source: FLI / Life 3.0 <ArrowUpRight size={14}/></a><div className="reflection-block"><p className="eyebrow">A QUESTION TO TAKE WITH YOU</p><h3>{selected.question}</h3><p>{selected.tension}</p><small>Original reflection prompt and commentary.</small></div>{selected.profile?<details className="profile-details"><summary>How this future appears in the compass <Plus size={16}/></summary><p>These are editorial interpretations. An unspecified dimension is excluded from matching.</p><dl>{dimensions.map((d,i)=><div key={d}><dt>{d}</dt><dd>{selected.profile![i]===null?'Not specified':questions[i].options.find(o=>o.value===selected.profile![i])!.title}</dd></div>)}</dl>{selected.id==='egalitarian'&&<p>The limit on stronger AI comes from Husfeldt’s adaptation, rather than FLI’s short summary.</p>}</details>:<p className="warning-explainer">This scenario is available for reflection but excluded from quiz matches.</p>}<div className="dialog-nav"><button className="text-link" onClick={()=>setSelected(scenarios[(scenarios.indexOf(selected)+11)%12])}><ArrowLeft size={16}/> Previous</button><span>{number(scenarios.indexOf(selected)+1)} / 12</span><button className="text-link" onClick={()=>setSelected(scenarios[(scenarios.indexOf(selected)+1)%12])}>Next future <ArrowRight size={16}/></button></div></>}
   </DialogContent>
  </Dialog>
  <Dialog open={method} onOpenChange={setMethod}><DialogContent className="method-dialog"><p className="eyebrow">READING THE COMPASS</p><DialogTitle className="dialog-heading">An invitation to reflect.</DialogTitle><DialogDescription className="scenario-summary">Your values do not predict what will happen. These matches identify questions you might want to explore.</DialogDescription><ol><li><strong>Five editorial dimensions.</strong> Agency, distribution, pluralism, development ambition, and continuity. They are not a validated psychological test.</li><li><strong>Three positions per dimension.</strong> The options are coded −1, 0, and +1. “Unsure” is excluded; it is not treated as a middle position.</li><li><strong>Compare what is specified.</strong> Each scenario has an editorial profile, visible in its detail panel. We average the absolute differences only where both your answer and its profile are specified, with equal weight.</li><li><strong>Offer three discussion matches.</strong> Lower average differences rank first. Ties are ordered by the number of dimensions compared, then name. Sparse profiles can appear close on limited evidence. With all answers unsure, we return no matches.</li><li><strong>Keep warnings visible.</strong> Conquerors, Zookeeper, 1984, and Self-destruction stay in the atlas but are excluded from matches. This is an editorial choice, not a claim that the other scenarios are desirable.</li></ol><p className="method-note">The map’s positions are approximate, not data. The source scenarios overlap and omit many possible futures. “Superintelligence” here means hypothetical AI that greatly exceeds human abilities; an “upload” is a hypothetical digital version of a human mind.</p><a className="source-link" href={sourceUrl} {...external}>Start with the original twelve scenarios <ArrowUpRight size={16}/></a></DialogContent></Dialog>
 </main>;
}
