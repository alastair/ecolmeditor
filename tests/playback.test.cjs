const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');

function scheduler() {
  const pending = [], scheduled = [], contexts = [], timers = [];
  const status = {textContent:''};
  class AudioContext {
    constructor() { this.currentTime = 0; this.state = 'suspended'; contexts.push(this); }
    resume() { this.state = 'running'; this.resumed = true; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  const box = {Promise, Date, console, AudioContext,
    document:{getElementById:id => id === 'soundSelect' ? {value:'G_lute'} : id === 'audioStatus' ? status : null},
    $:()=>({each(){},toggleClass(){}}),
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;}, clearTimeout(){},
    curParams:{contextTuning:[]},
    TabCodeDocument:{TabWords:[{tType:'Chord',dur:64}], duration:0},
    Soundfont:class {
      instrument() {
        assert.equal(contexts.at(-1).resumed, true, 'resume must precede loading');
        const promise = new Promise((resolve,reject)=>pending.push({resolve,reject}));
        return {onready:callback=>promise.then(callback)};
      }
    }
  };
  box.window = box;
  vm.createContext(box);
  vm.runInContext(fs.readFileSync(path.join(root,'pianoroll.js'),'utf8'),box);
  const realBufferChord = box.bufferChord;
  box.bufferChord = (_chord,time)=>{scheduled.push(time);return time+2;};
  return {box,pending,scheduled,contexts,timers,status,realBufferChord};
}

test('slow bank loading schedules the first note in the future',async()=>{
  const s=scheduler(); const done=s.box.jsPlay();
  s.contexts[0].currentTime=5; s.pending[0].resolve(); await done;
  assert.equal(s.scheduled[0],5.1);
  assert.ok(Math.abs(s.box.TabCodeDocument.duration-128)<1e-9);
  assert.ok(Math.abs(s.timers.at(-1).ms-2150)<1e-6);
});

test('Stop during loading prevents delayed playback',async()=>{
  const s=scheduler(); const done=s.box.jsPlay();
  s.box.jsStop(); s.pending[0].resolve(); await done;
  assert.deepEqual(s.scheduled,[]);
});

test('superseded bank load cannot schedule into a newer context',async()=>{
  const s=scheduler(); const old=s.box.jsPlay(); const current=s.box.jsPlay();
  s.pending[0].resolve(); await old; assert.deepEqual(s.scheduled,[]);
  s.pending[1].resolve(); await current; assert.equal(s.scheduled.length,1);
});

test('loading errors close the context and appear in the editor',async()=>{
  const s=scheduler(); const done=s.box.jsPlay();
  s.pending[0].reject(new Error('Missing bank')); await done;
  assert.equal(s.contexts[0].state,'closed');
  assert.equal(s.status.textContent,'Playback failed: Missing bank');
});

test('Stop is safe after the score follower reaches the end',()=>{
  const s=scheduler();
  s.box.playing={wordi:1,timeout:false,doc:{TabWords:[{}]}};
  s.box.stopOrPause();
  assert.equal(s.box.playing.wordi,0);
});

test('first score-follow timer includes the audio scheduling lead',()=>{
  const s=scheduler(); s.box.ctx={currentTime:10}; s.box.playing={timeout:false};
  s.realBufferChord({dur:96,pitches:()=>[],mainCourses:[],bassCourses:[],DOMObj:{classList:{add(){}}}},10.1,{},0,[]);
  assert.ok(Math.abs(s.timers[0].ms-1100)<1e-6);
});

test('loader accepts generated WAV maps without losing the final note',()=>{
  const box={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'soundfont-player.js'),'utf8'),box);
  const Soundfont=box.window.Soundfont;
  const result=Soundfont.dataToJson('MIDI.Soundfont.acoustic_grand_piano = {"C4":"one","D4":"two"};');
  assert.equal(JSON.stringify(result),JSON.stringify({C4:'one',D4:'two'}));
  assert.equal(Soundfont.nameToUrl('G_lute/acoustic_grand_piano'),'../sft/G_lute/acoustic_grand_piano-wav.js');
});

function scrollFixture(){
  const s=scheduler();
  const option={checked:true};
  const editor={scrollTop:0,scrollHeight:2000,clientHeight:600,clientTop:0,
    getBoundingClientRect:()=>({top:100})};
  const staff={classList:{contains:name=>name==='Staves'},
    getBoundingClientRect:()=>({top:800,bottom:900})};
  const chord={DOMObj:{previousElementSibling:staff}};
  s.box.document.getElementById=id=>id==='followPlayback'?option:id==='editor_container'?editor:null;
  s.box.innerHeight=800;
  s.box.playing={timeout:1,words:[chord],wordi:0};
  return {...s,option,editor,staff,chord};
}

test('follow playback centres the staff inside the editor pane',()=>{
  const s=scrollFixture(); s.box.centrePlayingSystem(s.chord);
  assert.equal(s.editor.scrollTop,450);
});

test('disabled follow playback leaves manual scrolling untouched',()=>{
  const s=scrollFixture(); s.option.checked=false; s.editor.scrollTop=123;
  s.box.centrePlayingSystem(s.chord);
  assert.equal(s.editor.scrollTop,123);
});

test('follow playback scrolls only when the drawn system changes',()=>{
  const s=scrollFixture(); s.box.centrePlayingSystem(s.chord);
  s.editor.scrollTop=250; s.box.centrePlayingSystem(s.chord);
  assert.equal(s.editor.scrollTop,250);
  const next={...s.staff,getBoundingClientRect:()=>({top:1000,bottom:1100})};
  s.box.centrePlayingSystem({DOMObj:{previousElementSibling:next}});
  assert.equal(s.editor.scrollTop,900);
});

test('enabling follow during playback recentres even on the same system',()=>{
  const s=scrollFixture(); s.box.playing.followedStaff=s.staff;
  s.box.toggleFollowPlayback();
  assert.equal(s.editor.scrollTop,450);
});

test('follow playback clamps the last system to the end of the pane',()=>{
  const s=scrollFixture(); s.editor.scrollTop=1300;
  s.box.centrePlayingSystem(s.chord);
  assert.equal(s.editor.scrollTop,1400);
});
