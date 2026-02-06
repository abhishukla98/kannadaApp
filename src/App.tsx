
import React, { useEffect, useState } from 'react'
import { Volume2, MessageCircle, Settings, BookOpen, Layers, Star, ArrowLeft, Gamepad2, Map, Zap, CheckCircle, Brain, RefreshCw, Type as TypeIcon } from 'lucide-react'
import { NOUNS_DATA, VERBS_DATA, ADJECTIVES_DATA, ADVERBS_DATA, PRONOUNS_DATA } from './data/vocabulary'
import { SENTENCES_DATA, PROVERBS_DATA } from './data/sentences'
import { CONVERSATIONS_DATA } from './data/conversations'
import { TENSES_DATA } from './data/grammar'
import { LEARNING_PATH } from './data/learningPath'
import type { Module, Sentence, Vocab } from './types'

const ALL_VOCAB: Vocab[] = [...NOUNS_DATA, ...VERBS_DATA, ...ADJECTIVES_DATA, ...ADVERBS_DATA]

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const kn = voices.find(v => v.lang?.toLowerCase().includes('kn'))
    const hi = voices.find(v => v.lang?.toLowerCase().includes('hi'))
    if (kn) utter.voice = kn; else if (hi) utter.voice = hi
    utter.rate = 0.9
    window.speechSynthesis.speak(utter)
  }
}

const useProgress = () => {
  const [completedModules, setCompletedModules] = useState<string[]>([])
  const [xp, setXp] = useState<number>(0)
  useEffect(()=>{
    try{ const s = JSON.parse(localStorage.getItem('kannada_progress')||'{}'); s.completedModules && setCompletedModules(s.completedModules); s.xp && setXp(s.xp) }catch{}
  },[])
  const persist = (m: string[], x: number) => localStorage.setItem('kannada_progress', JSON.stringify({completedModules:m, xp:x}))
  const completeModule = (moduleId: string) => {
    if(!completedModules.includes(moduleId)){
      const next = [...completedModules, moduleId]
      const nxp = xp + 50
      setCompletedModules(next); setXp(nxp); persist(next, nxp); return true
    }
    return false
  }
  const addXp = (amount:number) => { const nxp = xp + amount; setXp(nxp); persist(completedModules, nxp) }
  return { completedModules, xp, completeModule, addXp }
}

const LevelMap: React.FC<{ onSelectModule: (m: Module)=>void, completedModules: string[] }> = ({ onSelectModule, completedModules }) => (
  <div className="flex flex-col items-center gap-8 py-8 relative">
    <div className="absolute left-1/2 top-10 bottom-10 w-2 bg-gray-200 -translate-x-1/2 rounded-full -z-10"/>
    {LEARNING_PATH.modules.slice(0, 20).map((mod, idx) => {
      const isLocked = idx>0 && !completedModules.includes(LEARNING_PATH.modules[idx-1].id)
      const isCompleted = completedModules.includes(mod.id)
      const isCurrent = !isLocked && !isCompleted
      return (
        <button key={mod.id} disabled={isLocked} onClick={()=>!isLocked && onSelectModule(mod)}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg transition-transform active:scale-95 z-10 
            ${isCompleted ? 'bg-green-500 border-green-600 text-white':''}
            ${isCurrent ? 'bg-brand-500 border-brand-600 text-white animate-bounce-slow':''}
            ${isLocked ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed':''}`}>
          {isCompleted ? <CheckCircle size={32}/> : isLocked ? <Layers size={32}/> : <Star size={32} className="fill-current"/>}
          <div className={`absolute left-24 top-1/2 -translate-y-1/2 w-48 text-left ${isLocked ? 'opacity-50':'opacity-100'}`}>
            <div className="font-bold text-gray-800 text-sm">{mod.title}</div>
            <div className="text-xs text-gray-500 truncate">{mod.description}</div>
          </div>
        </button>
      )
    })}
  </div>
)

const FlashcardGame: React.FC<{ data: (Sentence|Vocab)[], onFinish: ()=>void }> = ({ data, onFinish }) => {
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const current: any = data[index]
  const progress = ((index+1)/data.length)*100
  const next = () => { setIsFlipped(false); if(index < data.length-1) setIndex(index+1); else onFinish() }
  return (
    <div className="flex flex-col h-full max-w-md mx-auto">
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6"><div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{width:`${progress}%`}}/></div>
      <div className="flex-1 flex items-center justify-center perspective-1000">
        <div onClick={()=>setIsFlipped(!isFlipped)} className={`w-full aspect-[3/4] max-h-[420px] bg-white rounded-3xl shadow-xl border-b-4 border-gray-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-500 transform preserve-3d relative ${isFlipped?'rotate-y-180':''}`}>
          <div className="absolute top-4 right-4 text-gray-400"><RefreshCw size={20}/></div>
          {!isFlipped ? (
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-4">English</p>
              <h2 className="text-4xl font-bold text-gray-800">{current.en}</h2>
              {current.hi && <p className="mt-4 text-gray-400 font-medium">({current.hi})</p>}
              <p className="mt-8 text-xs text-brand-500 font-bold">Tap to flip</p>
            </div>
          ) : (
            <div className="transform rotate-y-180">
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">Kannada</p>
              <h2 className="text-4xl font-bold text-brand-600 mb-1">{current.kn}</h2>
              {current.tr_simple && <p className="text-sm text-gray-500 mb-3">{current.tr_simple}</p>}
              <button onClick={(e)=>{ e.stopPropagation(); speak(current.kn) }} className="bg-brand-100 text-brand-600 p-3 rounded-full hover:bg-brand-200 transition-colors"><Volume2 size={24}/></button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 flex gap-4"><button onClick={next} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform">{index === data.length-1 ? 'Finish' : 'Next Card'}</button></div>
    </div>
  )
}

const MindMap: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState(PRONOUNS_DATA[0])
  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-6"><h2 className="text-xl font-bold text-gray-800">Word Network</h2><p className="text-sm text-gray-500">Tap nodes to explore connections</p></div>
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden p-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"><div className="w-24 h-24 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl border-4 border-white">{activeSubject.kn}<div className="text-[10px] absolute bottom-6 opacity-75">{activeSubject.en}</div></div></div>
        {VERBS_DATA.slice(0,6).map((verb,i)=>{ const angle=(i*60)*(Math.PI/180), r=110, x=Math.cos(angle)*r, y=Math.sin(angle)*r; return (
          <div key={verb.id} className="absolute top-1/2 left-1/2 w-16 h-16 bg-blue-50 rounded-full flex flex-col items-center justify-center text-xs text-blue-800 font-bold border border-blue-200 z-10 shadow-sm transition-all hover:scale-110 cursor-pointer" style={{ transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }} onClick={()=>speak(`${activeSubject.kn} ${verb.kn}`)}>
            <span>{verb.kn}</span>
            <span className="text-[8px] text-gray-400">{verb.en}</span>
            <div className="absolute top-1/2 left-1/2 w-[110px] h-[1px] bg-blue-100 -z-10 origin-left -translate-y-1/2 rotate-180" style={{ transform:`rotate(${i*60+180}deg) translateY(-50%)`, width:'110px', left:'50%' }}/>
          </div> )})}
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">{PRONOUNS_DATA.map(p=> (<button key={p.id} onClick={()=>setActiveSubject(p)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeSubject.id===p.id? 'bg-gray-800 text-white':'bg-gray-200 text-gray-600'}`}>{p.kn} ({p.en})</button>))}</div>
    </div>
  )
}

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'journey'|'games'|'reference'>('journey')
  const [activeModule, setActiveModule] = useState<Module|null>(null)
  const [gameMode, setGameMode] = useState<'memory'|'mindmap'|null>(null)
  const { completedModules, xp, completeModule, addXp } = useProgress()
  const [libraryCategory, setLibraryCategory] = useState('Nouns')

  const getModuleContent = (module: Module) => {
    const s = module.refs.map(ref => SENTENCES_DATA.find(x=>x.id===ref)).filter(Boolean)
    if((s as any[]).length<3) return NOUNS_DATA.slice(0,12) as any
    return s as any
  }

  const renderJourney = () => (
    <div className="pb-24">
      <div className="bg-brand-600 text-white p-6 rounded-b-[2.5rem] shadow-xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><Star className="text-yellow-300 fill-current"/></div><div><h1 className="text-2xl font-bold">Course Map</h1><p className="text-brand-100 text-sm">Level {completedModules.length + 1} • {xp} XP</p></div></div>
          <div className="w-12 h-12 rounded-full border-4 border-white/30 overflow-hidden bg-white/10"/>
        </div>
        <div className="bg-black/20 h-3 rounded-full w-full overflow-hidden"><div className="bg-yellow-400 h-full rounded-full" style={{ width: `${(completedModules.length/LEARNING_PATH.modules.length)*100}%` }}/></div>
      </div>
      <div className="px-4"><h2 className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-4 ml-4">Your Path</h2><LevelMap onSelectModule={setActiveModule} completedModules={completedModules}/></div>
    </div>
  )

  const renderGames = () => (
    <div className="px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Practice Arena</h1>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={()=>setGameMode('memory')} className="bg-purple-100 p-6 rounded-2xl text-left hover:bg-purple-200 transition-colors relative overflow-hidden group"><Gamepad2 className="text-purple-600 mb-3" size={32}/><h3 className="font-bold text-gray-800">Memory Match</h3><p className="text-xs text-gray-500">Train your brain</p><div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Gamepad2 size={80}/></div></button>
        <button onClick={()=>setGameMode('mindmap')} className="bg-blue-100 p-6 rounded-2xl text-left hover:bg-blue-200 transition-colors relative overflow-hidden group"><Brain className="text-blue-600 mb-3" size={32}/><h3 className="font-bold text-gray-800">Mind Map</h3><p className="text-xs text-gray-500">Visual connections</p><div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Brain size={80}/></div></button>
        <button className="bg-orange-100 p-6 rounded-2xl text-left hover:bg-orange-200 transition-colors relative overflow-hidden col-span-2 group"><Zap className="text-orange-600 mb-3" size={32}/><h3 className="font-bold text-gray-800">Daily Quiz</h3><p className="text-xs text-gray-500">Earn double XP today!</p></button>
      </div>
    </div>
  )

  const renderReference = () => {
    const categories = ['Nouns','Pronouns','Verbs','Adjectives','Adverbs','Tenses','Conversations','Proverbs']
    const pick = (cat:string): any[] => {
      switch(cat){
        case 'Nouns': return NOUNS_DATA
        case 'Pronouns': return PRONOUNS_DATA
        case 'Verbs': return VERBS_DATA
        case 'Adjectives': return ADJECTIVES_DATA
        case 'Adverbs': return ADVERBS_DATA
        case 'Tenses': return TENSES_DATA as any
        case 'Conversations': return CONVERSATIONS_DATA as any
        case 'Proverbs': return PROVERBS_DATA as any
        default: return NOUNS_DATA
      }
    }
    const data = pick(libraryCategory)

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="px-4 pt-6 pb-2 bg-white shadow-sm z-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Library</h1>
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {categories.map(cat => (<button key={cat} onClick={()=>setLibraryCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${libraryCategory===cat? 'bg-brand-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {['Nouns','Pronouns','Verbs','Adjectives','Adverbs'].includes(libraryCategory) && (
            <div className="grid grid-cols-1 gap-3">
              {data.map((item:any)=> (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{item.kn}</h3>
                      {item.tr_simple && <div className="text-xs text-gray-500 mb-1">{item.tr_simple}</div>}
                      <div className="flex gap-2 text-sm"><span className="text-gray-600 font-medium">{item.en}</span>{item.hi && <span className="text-gray-400">({item.hi})</span>}</div>
                    </div>
                    <button onClick={()=>speak(item.kn)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-brand-50 hover:text-brand-500 transition-colors"><Volume2 size={20}/></button>
                  </div>
                  {item.examples && (
                    <div className="mt-3 space-y-2 text-sm">
                      {item.examples.slice(0,5).map((ex:any, i:number)=> (
                        <div key={i} className="border border-gray-100 rounded-lg p-2">
                          <div className="font-semibold text-gray-800">{ex.kn}</div>
                          <div className="text-xs text-gray-500">{ex.tr_simple}</div>
                          <div className="text-xs text-gray-500">{ex.en}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {libraryCategory==='Tenses' && (
            <div className="space-y-4">
              {data.map((t:any)=> (
                <div key={t.id} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3"><TypeIcon size={18} className="text-blue-600"/><h3 className="font-bold text-gray-800 text-lg">{t.name}</h3></div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><p className="text-blue-800 font-mono text-lg">{t.kn || (t.templates?.kn || '')}</p></div>
                </div>
              ))}
            </div>
          )}
          {libraryCategory==='Conversations' && (
            <div className="space-y-4">
              {data.map((c:any)=> (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3 border-b border-gray-50 pb-2"><MessageCircle size={18} className="text-green-500"/><span className="font-bold text-gray-800">{c.topic}</span></div>
                  <div className="space-y-3">
                    {c.turns.map((turn:any, idx:number)=> (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-gray-800">{turn.kn}</span>
                          <button onClick={()=>speak(turn.kn)} className="text-gray-300 hover:text-green-500"><Volume2 size={14}/></button>
                        </div>
                        {turn.tr_simple && <span className="text-xs text-gray-500">{turn.tr_simple}</span>}
                        <span className="text-sm text-gray-500">{turn.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {libraryCategory==='Proverbs' && (
            <div className="space-y-3">
              {data.map((p:any)=> (
                <div key={p.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-orange-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="font-bold text-xl text-gray-800 mb-1">{p.kn}</p>
                    {p.tr_simple && <p className="text-xs text-gray-500 mb-1">{p.tr_simple}</p>}
                    <p className="text-sm text-gray-600 italic">"{p.en}"</p>
                  </div>
                  <button onClick={()=>speak(p.kn)} className="absolute bottom-2 right-2 p-2 text-orange-300 hover:text-orange-600 transition-colors"><Volume2 size={18}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if(activeModule){
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        <div className="bg-white p-4 flex items-center gap-4 shadow-sm"><button onClick={()=>setActiveModule(null)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button><div><h2 className="font-bold text-lg">{activeModule.title}</h2><p className="text-xs text-gray-500">{activeModule.description}</p></div></div>
        <div className="flex-1 p-6 overflow-hidden"><FlashcardGame data={getModuleContent(activeModule)} onFinish={()=>{ const first = completeModule(activeModule.id); if(first) alert('Module Completed! +50 XP'); setActiveModule(null) }}/></div>
      </div>
    )
  }

  if(gameMode){
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        <div className="bg-white p-4 flex items-center gap-4 shadow-sm"><button onClick={()=>setGameMode(null)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button><h2 className="font-bold text-lg capitalize">{gameMode==='mindmap' ? 'Word Network' : 'Memory Match'}</h2></div>
        <div className="flex-1 p-6 overflow-hidden">{gameMode==='mindmap' && <MindMap/>}{gameMode==='memory' && <div className='text-sm text-gray-500'>Memory game is available in previous build; can re-enable on request.</div>}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 select-none">
      <div className="h-screen overflow-hidden flex flex-col"><div className="flex-1 overflow-hidden relative">{currentTab==='journey' && renderJourney()}{currentTab==='games' && renderGames()}{currentTab==='reference' && renderReference()}</div></div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe flex justify-between items-center z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={()=>setCurrentTab('journey')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab==='journey'? 'text-brand-600':'text-gray-400 hover:text-gray-600'}`}><Map size={24} strokeWidth={currentTab==='journey'?2.5:2}/><span className="text-[10px] font-bold">Path</span></button>
        <button onClick={()=>setCurrentTab('games')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab==='games'? 'text-brand-600':'text-gray-400 hover:text-gray-600'}`}><Gamepad2 size={24} strokeWidth={currentTab==='games'?2.5:2}/><span className="text-[10px] font-bold">Games</span></button>
        <button onClick={()=>setCurrentTab('reference')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab==='reference'? 'text-brand-600':'text-gray-400 hover:text-gray-600'}`}><BookOpen size={24} strokeWidth={currentTab==='reference'?2.5:2}/><span className="text-[10px] font-bold">Library</span></button>
        <button className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-gray-600"><Settings size={24}/><span className="text-[10px] font-bold">Settings</span></button>
      </div>
    </div>
  )
}

export default App
