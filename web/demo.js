'use strict';
let report, context, generation=0, sources=[];
const bank=document.querySelector('#bank'), note=document.querySelector('#note'), status=document.querySelector('#status');
const midi=n=>12*(Number(n.slice(-1))+1)+({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n[0]])+(n.includes('#')?1:n.includes('b')?-1:0);
function updateNotes(){
  note.replaceChildren(...Object.entries(report.banks[bank.value].notes).filter(([,n])=>!n.silent).sort(([a],[b])=>midi(a)-midi(b)).map(([name])=>new Option(name,name)));
  note.value=Object.entries(report.banks[bank.value].notes).filter(([,n])=>!n.silent).sort((a,b)=>b[1].removed_ms-a[1].removed_ms)[0][0];
  draw();
}
function draw(){
  const n=report.banks[bank.value].notes[note.value];
  document.querySelector('#detail').textContent=`${note.value}: original attack ${n.onset_ms.toFixed(1)} ms; removed ${n.removed_ms.toFixed(1)} ms; aligned attack ${n.aligned_onset_ms.toFixed(1)} ms.${n.review?' Threshold-sensitive onset: listening review needed.':''}`;
  const points=n.envelope.map((y,i)=>`${i/500*900},${145-y*130}`).join(' ');
  document.querySelector('#wave').innerHTML=`<polyline points="${points}" fill="none" stroke="#426b57"/><line x1="${n.onset_ms*1.8}" x2="${n.onset_ms*1.8}" y1="0" y2="160" stroke="#c45649"/><line x1="${n.removed_ms*1.8}" x2="${n.removed_ms*1.8}" y1="0" y2="160" stroke="#24956c"/><text x="10" y="20" fill="#555">Original waveform · first 500 ms</text>`;
}
function stop(){generation++;for(const source of sources)source.stop();sources=[];status.textContent='Stopped';}
async function play(mode,scale=false){
  stop(); const token=generation;
  context ||= new (window.AudioContext||window.webkitAudioContext)();
  const resumed=context.resume(); // Keep this inside the actual user gesture.
  const selectedBank=bank.value;
  const notes=scale?Array.from(note.options).map(o=>o.value).filter(n=>midi(n)>=48&&midi(n)<=60):[note.value];
  status.textContent='Loading audio…';
  try{
    await resumed;
    const modes=scale?['original','aligned']:[mode];
    const decoded=await Promise.all(modes.map(async version=>Promise.all(notes.map(async n=>{
      const response=await fetch(`audio/${selectedBank}/${version}/${encodeURIComponent(n)}.wav`);
      if(!response.ok)throw Error(`Sample request failed (${response.status})`);
      const bytes=await response.arrayBuffer();
      return new Promise((resolve,reject)=>context.decodeAudioData(bytes,resolve,reject));
    }))));
    if(token!==generation)return;
    const start=context.currentTime+0.1;
    decoded.forEach((buffers,pass)=>buffers.forEach((buffer,i)=>{
      const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);
      source.start(start+pass*(notes.length*0.4+1)+i*0.4);sources.push(source);
    }));
    status.textContent=scale?'Playing original scale, then aligned scale.':`Playing ${mode==='original'?'original':'aligned'} ${note.value}`;
  }catch(error){if(token===generation)status.textContent=`Playback failed: ${error.message}`;}
}
document.querySelector('#before').onclick=()=>play('original');
document.querySelector('#after').onclick=()=>play('aligned');
document.querySelector('#scale').onclick=()=>play('original',true);
document.querySelector('#stop').onclick=stop;
bank.onchange=()=>{stop();updateNotes();};note.onchange=()=>{stop();draw();};
fetch('analysis.json').then(r=>{if(!r.ok)throw Error('Run tools/process_audio.py first');return r.json();}).then(data=>{
  report=data;updateNotes();status.textContent='Ready';
  document.querySelector('#summary').innerHTML=Object.entries(report.banks).map(([name,b])=>{
    const aligned=Object.values(b.notes).filter(n=>!n.silent).map(n=>n.aligned_onset_ms);
    return `<tr><td>${name}</td><td>${b.summary.sounding_notes}</td><td>${b.summary.min_ms.toFixed(1)}–${b.summary.max_ms.toFixed(1)} ms</td><td>${b.summary.median_ms.toFixed(1)} ms</td><td>${Math.min(...aligned).toFixed(1)}–${Math.max(...aligned).toFixed(1)} ms</td></tr>`;
  }).join('');
}).catch(e=>{status.textContent=e.message;});
