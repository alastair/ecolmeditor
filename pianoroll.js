var events = [];
var tempo = false;
var legato_factor = 1.1;
var playing = false;
var thesoundfont = false;
var leadTime = 0.1;

//  PLAYBACK FUNCTIONS

function jsPlay(start, end, starti){
  jsStop();
  playing = false;
  ctx = new AudioContext();
  var playContext = ctx;
  // Resume synchronously in the Play/selection/tempo gesture, before loading.
  var resumed = ctx.resume();
  playbackMessage('Loading audio…');
  soundfont = new Soundfont(ctx);
  // instrument = soundfont.instrument('acoustic_guitar_nylon');
  thesoundfont = getSoundfont(TabCodeDocument);
  instrument = soundfont.instrument(thesoundfont+'/acoustic_grand_piano');
  curTuning = curParams.contextTuning;
  var words = TabCodeDocument.TabWords;
  var started = false;
  starti = starti || 0;
  var playInstrument = instrument;
  return Promise.all([resumed, instrument.onready(function(){})]).then(function(){
    // Stop or a newer Play may have cancelled this pending load.
    if(ctx !== playContext) return;
    if(ctx.state !== 'running') throw new Error('Audio is suspended. Click Play again.');
    var now = ctx.currentTime + Math.max(0.05, leadTime);
    var playbackStart = now;
    playbackMessage('Playing');
    playing=new Playing();
    playing.doc = TabCodeDocument;
    playing.words = words;
    playing.now = new Date().getTime();
    $(".playing").each(function(){
        this.classList.remove('playing');
    });
    for(var i=starti; i<words.length; i++){
      if(start && !started && start!==words[i]) continue;
      started = true;
      if(words[i].tType==="Chord"){
        if(!playing.wordi && playing.wordi!==0) playing.wordi = i;
        now = bufferChord(words[i], now, playInstrument, i, words);
      }
      if(end && end===words[i]) break;
    }
    TabCodeDocument.duration = (now-playbackStart)*64;
    $(".playback.control").toggleClass("start", false);
    $(".playback.control").toggleClass("stop", true);  
    playingTimeout = setTimeout(switchControls, (now-ctx.currentTime+0.05)*1000);
  }).catch(function(error){
    if(ctx !== playContext) return;
    jsStop();
    playing = false;
    playbackMessage('Playback failed: ' + error.message);
  });
}
function playbackMessage(message){
  var status = document.getElementById('audioStatus');
  if(status) status.textContent = message;
}
function jsStop(){
  if(ctx && ctx.state !== 'closed') ctx.close().catch(function(){});
  $(".playback.control").toggleClass("start", true);
  $(".playback.control").toggleClass("stop", false);
  if(playingTimeout){
    window.clearTimeout(playingTimeout);
    playingTimeout = false;    
  }
  if(playing && playing.timeout){
    window.clearTimeout(playing.timeout);
    playing.timeout = false;
  }
  ctx = false;
  playbackMessage('Stopped');
}
function switchControls(){
  $(".playback.control").toggleClass("start", true);
  $(".playback.control").toggleClass("stop", false);
  jsStop();
}

function playSelection(){
  var word = $(this).data("word");
  word.selections[0].play();
}
function playDoc(doc){
  var otcd = TabCodeDocument;
  TabCodeDocument = doc;
  jsPlay();
  TabCodeDocument = otcd;  
}

// TC 1 Oct 2026:
function playFrom(chordNum) {
	jsPlay(false,false,TCindexFromChord(chordNum));
}
function TCindexFromChord(n) {
	var TCD = TabCodeDocument;
// 	logger.log(TCD.TabWords.length + " TabWords")
	for(var i=0;i<TCD.TabWords.length;i++) {
		if((TCD.TabWords[i].tType == "Chord")&&(TCD.TabWords[i].n==n)) return i;
	}
	return 0;
}

function playOrStop(){
  if(isPlaying()){
    jsStop();
  } else {
    playDoc($(this).data("doc"));
  }
}
var playingTimeout = false;
function isPlaying(){
  return playingTimeout;
}
function playOrResume(){
  if(ctx) return; // Includes a pending bank load.
  if(playing && playing.wordi<playing.doc.TabWords.length){
    playing.resume();
  } else {
    jsPlay();
  }
}
function stopOrPause(){
// TC 30 Sep 2026: save playing.wordi as ?(global) last_played_wordi
// so we can play from here 
// (which might be computed from a click in the tab or tabcode)
		start_wordi = playing ? playing.wordi : 0;
		
  if(playing && playing.timeout){
    playing.pause();
  } else if(playing && playing.wordi){
    var lastWord = playing.doc.TabWords[playing.wordi];
    if(lastWord && lastWord.DOMObj) lastWord.DOMObj.classList.remove('playing');

    playing.wordi = 0;
  } else {
    jsStop();
  }
}
function resumePlaying(){
//  jsPlay(false, false, this.wordi+1); // FIXME: add some time
  jsPlay(false, false, playing.wordi+1);
}
function pausePlaying(){
  window.clearTimeout(this.timeout);
  playing.timeout = false;
  jsStop();
}
function follow(){
  var doc = playing.doc;
  var words = playing.words;
  words[playing.wordi].DOMObj.classList.remove('playing');
  playing.wordi++;
  while(words.length>playing.wordi && words[playing.wordi].tType!=="Chord"){
    playing.wordi++;
  }
  if(words.length>playing.wordi){
    words[playing.wordi].DOMObj.classList.add('playing');
    centrePlayingSystem(words[playing.wordi]);
    var nextInterval = 1000*(words[playing.wordi].dur/64) / (3/2*playing.tempoFactor);
    var now = new Date().getTime();
    var prevError = playing.interval - (now - playing.now);
    playing.now = now;
    nextInterval += prevError;
    playing.interval = nextInterval;
    playing.timeout = window.setTimeout(follow, nextInterval);
  }
}

// The renderer inserts a Staves group before the chords of each drawn system.
// Use that group rather than a chord's varying rhythm/bass-note bounds.
function centrePlayingSystem(chord, force){
  var option = document.getElementById('followPlayback');
  var editor = document.getElementById('editor_container');
  if(!option || !option.checked || !editor || !playing || !chord || !chord.DOMObj) return;
  var staff = chord.DOMObj.previousElementSibling;
  while(staff && !staff.classList.contains('Staves')) staff = staff.previousElementSibling;
  if(!staff || (!force && playing.followedStaff === staff)) return;
  var bounds = editor.getBoundingClientRect();
  var top = Math.max(0, bounds.top + editor.clientTop);
  var bottom = Math.min(window.innerHeight, bounds.top + editor.clientTop + editor.clientHeight);
  if(bottom <= top) return;
  var system = staff.getBoundingClientRect();
  var target = editor.scrollTop + (system.top + system.bottom - top - bottom) / 2;
  editor.scrollTop = Math.max(0, Math.min(editor.scrollHeight - editor.clientHeight, target));
  playing.followedStaff = staff;
}

function toggleFollowPlayback(){
  if(playing && playing.timeout) centrePlayingSystem(playing.words[playing.wordi], true);
}

function Playing(){
  this.ctx = ctx;
  this.doc = false;
  this.wordi = false;
  this.timeout = false;
  this.now = 0;
  this.interval = 0;
  this.tempoFactor = 1;
  this.followedStaff = null;
  this.pause = pausePlaying;
  this.resume = resumePlaying;
}

function getTempo(){
  if(tempo){
    return tempo;
  } else if (document.getElementById('tempoSelect')){
    return document.getElementById('tempoSelect').value;
  } else return 1;
}
function getSoundfont(doc){
  if(document.getElementById('soundSelect')){
    return document.getElementById('soundSelect').value;
  } else if(doc.rules && doc.rules.length && doc.rules[0].isBaroque()){
    return "Bar_lute";
  } else {
    return "G_lute";
  }
}

function noteName(MIDIPitch){
  var oct = Math.max(0, Math.floor(MIDIPitch / 12) - 1);
  var pc = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'][MIDIPitch%12];
  return pc+oct;
}

var src = false;
function updateTempo(){
  // alert(Number(document.getElementById('tempoSlider').value) / 90);
  //if(src) src.playbackRate.value = Number(document.getElementById('tempoSlider').value) / 90;
  if(playing && playing.timeout && isPlaying()){
    playing.pause();
    playing.resume();
  } 
}
function showTempoValue(value) {
  var out = document.getElementById('tempoReadOutvalue');
  if(out){
    if(!value){
      value = document.getElementById('tempoSlider').value;
    }
    var dispVal = value / 2;
    out.innerHTML = dispVal.toFixed(0);
  }
}
function getTempoFactorFromPage(){
  if(document.getElementById('tempoSlider')){
    return Number(document.getElementById('tempoSlider').value) / 90;
  } else if(document.getElementById('tempoSelect')) {
    return Number(document.getElementById('tempoSelect').value);
  } else return false;
  
}
function extraDurMain(course, index, words){
  // 
  var dur = 0;
  var max_extra_dur = 128;
  for(var i=index+1; i<words.length; i++){
    if(words[i].tType==="Chord"){
      if(words[i].mainCourses[course]) {
        return dur;
      }
      dur +=words[i].dur / 64;
      if(dur>=max_extra_dur){
        return max_extra_dur;
      }
    }
  }
  return dur;
}
function extraDurBass(course, index, words){
  // 
  var dur = 0;
  var max_extra_dur = 128;
  for(var i=index+1; i<words.length; i++){
    if(words[i].tType==="Chord"){
      if(words[i].bassCourses[course]) {
        return dur;
      }
      dur +=words[i].dur / 64;
      if(dur>=max_extra_dur){
        return max_extra_dur;
      }
    }
  }
  return dur;
}
function bufferChord(chord, t, instrument, wordi, words){
  var notes = chord.pitches();
  // Tab durations in this program use 1 as the tatum (i.e. demi-semi-hemi whatever), so ...
  var baseDur = (chord.dur / 64);
  // And this playback stuff is realtime, so we need to use tempo too...
  var tempoFactor = getTempoFactorFromPage() || 1;
  var dur = baseDur / (3 / 2 * tempoFactor);
  if(playing && !playing.timeout) {
    playing.tempoFactor = tempoFactor;
    var firstInterval = 1000 * (dur + Math.max(0, t - ctx.currentTime));
    playing.timeout = window.setTimeout(follow, firstInterval);
    playing.interval = firstInterval;
    chord.DOMObj.classList.add('playing');
    centrePlayingSystem(chord);
  }
  for(var i=0; i<chord.mainCourses.length; i++){
    if(chord.mainCourses[i]){
      var pitch = chord.mainCourses[i].pitch(chord.tuning);
      if(pitch){
        var soundingDur = dur+(extraDurMain(i, wordi, words)/(3/2*tempoFactor));
        src = instrument.play(noteName(pitch), t,
                            soundingDur * legato_factor);
      }
    }
  }
  for(i=0; i<chord.bassCourses.length; i++){
    if(chord.bassCourses[i]){
      var pitch = chord.bassCourses[i].pitch(chord.tuning);
      if(pitch){
        var soundingDur = dur+(extraDurBass(i, wordi, words)/(3/2*tempoFactor));
        src = instrument.play(noteName(pitch), t,
                            soundingDur * legato_factor);
      }
    }
  }
  return t+dur;
}
var ctx = false;
var soundfont = false;
var instrument = false;
var AudioContext = window.AudioContext || window.webkitAudioContext;


// SEARCH RESULT FUNCTIONS

function resultDiagram(result){
  // Result is of the form index, hit count, vector list
  var id = result[0];
  var ribbon = DOMDiv('result-ribbon',  'result-ribbon-'+id, false);
  var pieceArray = corpusVectors.find(function(x){return x[0]==id;});
  var pieceDur = pieceArray[2];
  var vectors = result[2];
  var queryDur = (TabCodeDocument.duration / 4) / pieceDur;
  for(var i=0; i<vectors.length; i++){
    var match = DOMDiv('result-block t'+vectors[i][0]+' p'+vectors[i][1]+' n'+i, 'result-block', false);
    var prop = Math.min(vectors[i][0]/pieceDur, 1);
    ribbon.appendChild(match);
    $(match).css('left', Math.floor(prop*100)+'%');
    $(match).css('width', Math.max(1, Math.floor(queryDur*100))+'%');
  }
  return ribbon;
}
function summariseResult(result){
  // Result is of the form index, hit count, vector list. For now, let's just list vectors.
  var vectors = result[2];
//  var intervals = ["a semitone", "a tone", "a minor third", "a third", "a fourth", "a tritone",
//                  "a fifth", "a minor sixth", "a sixth", "a minor seventh", "a seventh"];
  var intervals = ["s-tone", "tone", "min 3rd", "3rd", "4th", "aug 4th",
                  "5th", "min 6th", "6th", "min 7th", "7th"];
  var out = [];
  var id = result[0];
  var title = id.toString().substring(12);
  var pieceArray = corpusVectors.find(function(x){return x[0]==id});
  var queryDur = TabCodeDocument.duration;
//  var targetNotes = corpusVectors[id][1].length;
//  var targetDur = (corpusVectors[id][1][targetNotes-1][0]);
  var targetNotes = pieceArray[1].length;
  var targetDur = pieceArray[2];
  for(var i=0; i<vectors.length; i++){
    var str = "";
    if(vectors[i][0]!=0){
   
//      str+= vectors[i][0]/32+" crotchets in";
//      str+= Math.round(100*(vectors[i][0]/targetDur))+"% ";
//      str+= title+": durations: "+(vectors[i][0])+"/"+(targetDur-(queryDur / 4))+" ("+Math.round(100*(vectors[i][0]/(targetDur-(queryDur / 4))))+"%)";
      str+= "at "+(vectors[i][0])+"/"+(targetDur-(queryDur / 4))+" ("+Math.round(100*(vectors[i][0]/(targetDur-(queryDur / 4))))+"% of piece)";
 //     str += targetDur+" Query is " + queryDur/4 + " ticks long";
    }
    else {
    	str += "at start";
    }
    if(vectors[i][1]>0){
      str+=(str.length ? ", " : "")+"up "+intervals[(vectors[i][1] % 12)-1];
    } else if (vectors[i][1]<0){
      str+=(str.length ? ", " : "")+"down "+intervals[(Math.abs(vectors[i][1] % 12))-1];
    } else { 
      str+=(str.length ? ", " : "")+"same pitch ";
    }
    if(str.length) out.push(str);
  }
  return out.length ? "("+out.join("; ")+")" : "";
}
function resultOut(num, result, max){
	var num;
//  return DOMSpan('resultStats', false, (num+1) + ") "+ Math.round(100*(result[1]/max))+"% "
//                +summariseResult(result));
//  return DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  var span = DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  span.appendChild(resultDiagram(result));
  return span;
}
function GerbodeResultOut(num, result, max){
	var num;
//  return DOMSpan('resultStats', false, (num+1) + ") "+ Math.round(100*(result[1]/max))+"% "
//                +summariseResult(result));
//  return DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  var span = DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  span.appendChild(resultDiagram(result));
  return span;
}
var ECOLMStuff = {};
function corpusSearch(cutOff){
  if(TabCodeDocument){
    if(!corpusVectors.length) {
      getCorpus();
      window.setTimeout(corpusSearch, 1000, cutOff);
      return;
    }
    tcHide(); // make some screen space
    var needle = vectorizeTabCodeObject(TabCodeDocument, curParams.contextTuning);
    ECOLMStuff.query = needle;
    if(!cutOff) cutOff=Math.round(needle.length/2);
    cutOff = needle.length;
    ECOLMStuff.queryDuration = TabCodeDocument.duration;
    var results = searchCorpusWithIDs(needle, corpusVectors, cutOff);
    if(!results.length){
      logger.log('no results');
    var div = document.getElementById('searchResults');
    $(div).empty();
      
      return;
    }
    else logger.log(results);
    var div = document.getElementById('searchResults');
    $(div).empty();
    $(div).show();
    var top = div.getBoundingClientRect().top;
    $(div).css("height", "calc(100% - "+(10+top)+"px");
    for(var i=0; i<results.length; i++){
      
      if(document.getElementById("CorpusSelection").value == "ecolm") {
	var sr = DOMDiv('searchResult', false, resultOut(i, results[i], needle.length));
	if(!ECOLMStuff[results[i][0]]) ECOLMStuff[results[i][0]] = {};
	ECOLMStuff[results[i][0]].results = [results[i][1], results[i][2]];
	resultAjax(results[i][0], sr, ECOLMStuff);
      }
      else if(document.getElementById("CorpusSelection").value == "gerbode") {
	var sr = DOMDiv('searchResult', false, GerbodeResultOut(i, results[i], needle.length));
	if(!ECOLMStuff[results[i][0]]) ECOLMStuff[results[i][0]] = {};
	ECOLMStuff[results[i][0]].results = [results[i][1], results[i][2]];
	resultGerbode(results[i][0].substring(12), sr, ECOLMStuff);
      }
      div.appendChild(sr);
    }
  }
}
function resultMetadata(data){
  var parent = DOMSpan('metadata', false, false);
  if(data.ptitle) {
    parent.appendChild(DOMSpan('PieceTitle', false, data.ptitle));
    if(data.pieceAliases) parent.appendChild(DOMSpan('AlternativePieceTitle', false, 
                                                     " ("+data.pieceAliases+")"));
  }
  if(data.stitle || data.shtitle || data.shelf || data.sourceAliases){
    parent.appendChild(document.createTextNode(" in "));
    if(data.shtitle){
      parent.appendChild(DOMSpan('SourceTitle', false, data.shtitle));
    } else if(data.stitle){
      parent.appendChild(DOMSpan('SourceTitle', false, data.stitle));
      if(data.ssubtitle){
        parent.appendChild(DOMSpan('SourceSubtitle', false, data.ssubtitle));
      }
    }
    if(data.shelf){
      parent.appendChild(DOMSpan('Shelfmark', false, data.shelf));
    }
  }
  return parent;
}
function resultTab(){
  var stuff = ECOLMStuff[Number(this.id)];
  var tc = stuff.data.Tabcode;
  $(".searchResult").toggleClass("clicked", false);
  $(this).parents(".searchResult").toggleClass("clicked", true);
  var otcd = TabCodeDocument;//This is *bad*
  var doc = new Tablature(tc, svg(650, 650), copyParams(TabCodeDocument.parameters));
  var svgDiv = document.getElementById('resultTab');
  $(svgDiv).show();
  var vectors = stuff.results[1];
  var exDur = 0;
  var start = 0;
  ECOLMStuff[Number(this.id)].tablature = doc;
  for(var i=0; i<vectors.length; i++){
    // start = vectors[i][0]/64; // I don't know why I don't need to convert this back
    //start = vectors[i][0];
    start = vectors[i][0]*4;// WHY??? WHY???
    doc.selections.push(new Selection(start, start+ECOLMStuff.queryDuration, ECOLMStuff.query, vectors[i][1]));
  }
  if(svgDiv){
    $(svgDiv).empty();
    var top = svgDiv.getBoundingClientRect().top;
    $(svgDiv).css("height", "calc(100% - "+(top+5)+"px");
    svgDiv.appendChild(doc.SVG);
    var oedit = editable;
    var old = ld;
    editable = false;
    ld = 8;
    var oldBreaks=breaks;
    breaks=650;
    doc.draw();
    breaks=oldBreaks;
    var matchwidth = doc.SVG.getBoundingClientRect().width;
    var querywidth = document.getElementById('notation').getBoundingClientRect().right;
    $(document.body).css("min-width", matchwidth+querywidth+25+"px");
    $("#codediv").css("width", querywidth+"px");
    $("#searchResults").css("width", "calc(100% - "+(10+matchwidth)+"px)");
    ld = old;
    editable = oedit;
    TabCodeDocument = otcd;
  }
}
function resultAjax(ID, domObj, resultsObj){
  var anchor = DOMAnchor('resultAnchor', false, "(DB entry)",
                             "http://doc.gold.ac.uk/isms/ecolm/database/?type=41&ID="+ID);
  if(resultsObj[ID] && resultsObj[ID].data) {
      var result = resultMetadata(resultsObj[ID].data);
      result.id = ID;
      domObj.appendChild(result);
      domObj.appendChild(anchor);
      $(result).click(resultTab);
      return;
  }
  $.ajax({
    type: 'POST',
    async: true,
    url: '../db.php',
    datatype: 'json',
    data: { lookup:   ID },
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      logger.log("Retrieval failed for ECOLMID", ID);
    },
    success: function(data){
      if(!data) return;
      if(!resultsObj[ID]) resultsObj[ID] = {};
      resultsObj[ID].data=JSON.parse(data);
      var result = resultMetadata(resultsObj[ID].data);
      result.id = ID;
      domObj.appendChild(result);
      domObj.appendChild(anchor);
      $(result).click(resultTab);
    }
  });
}
function resultDiagram(result){
  // Result is of the form index, hit count, vector list
  var id = result[0];
  var ribbon = DOMDiv('result-ribbon',  'result-ribbon-'+id, false);
  var pieceArray = corpusVectors.find(function(x){return x[0]==id;});
  var pieceDur = pieceArray[2];
  var vectors = result[2];
  var queryDur = (TabCodeDocument.duration / 4) / pieceDur;
  for(var i=0; i<vectors.length; i++){
    var match = DOMDiv('result-block t'+vectors[i][0]+' p'+vectors[i][1]+' n'+i, 'result-block', false);
    var prop = Math.min(vectors[i][0]/pieceDur, 1);
    ribbon.appendChild(match);
    $(match).css('left', Math.floor(prop*100)+'%');
    $(match).css('width', Math.max(1, Math.floor(queryDur*100))+'%');
  }
  return ribbon;
}
function resultOut(num, result, max){
	var num;
//  return DOMSpan('resultStats', false, (num+1) + ") "+ Math.round(100*(result[1]/max))+"% "
//                +summariseResult(result));
//  return DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  var span = DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  span.appendChild(resultDiagram(result));
  return span;
}
function summariseResult(result){
  // Result is of the form index, hit count, vector list. For now, let's just list vectors.
  var vectors = result[2];
//  var intervals = ["a semitone", "a tone", "a minor third", "a third", "a fourth", "a tritone",
//                  "a fifth", "a minor sixth", "a sixth", "a minor seventh", "a seventh"];
  var intervals = ["s-tone", "tone", "min 3rd", "3rd", "4th", "aug 4th",
                  "5th", "min 6th", "6th", "min 7th", "7th"];
  var out = [];
  var id = result[0];
  var title = id.toString().substring(12);
  var pieceArray = corpusVectors.find(function(x){return x[0]==id});
  var queryDur = TabCodeDocument.duration;
//  var targetNotes = corpusVectors[id][1].length;
//  var targetDur = (corpusVectors[id][1][targetNotes-1][0]);
  var targetNotes = pieceArray[1].length;
  var targetDur = pieceArray[2];
  for(var i=0; i<vectors.length; i++){
    var str = "";
    if(vectors[i][0]!=0){
   
//      str+= vectors[i][0]/32+" crotchets in";
//      str+= Math.round(100*(vectors[i][0]/targetDur))+"% ";
//      str+= title+": durations: "+(vectors[i][0])+"/"+(targetDur-(queryDur / 4))+" ("+Math.round(100*(vectors[i][0]/(targetDur-(queryDur / 4))))+"%)";
      if(document.getElementById("CorpusSelection").value != "gerbode") {
        str+= "at "+(vectors[i][0])+"/"+(targetDur-(queryDur / 4))+" ("+Math.round(100*(vectors[i][0]/(targetDur-(queryDur / 4))))+"% of piece)";
      }
 //     str += targetDur+" Query is " + queryDur/4 + " ticks long";
    }
    else {
    	str += "at start";
    }
    if(vectors[i][1]>0){
      str+=(str.length ? ", " : "")+"up "+intervals[(vectors[i][1] % 12)-1];
    } else if (vectors[i][1]<0){
      str+=(str.length ? ", " : "")+"down "+intervals[(Math.abs(vectors[i][1] % 12))-1];
    } else { 
      str+=(str.length ? ", " : "")+"same pitch ";
    }
    if(str.length) out.push(str);
  }
  return out.length ? "("+out.join("; ")+")" : "";
}
function GerbodeResultTab(){
//  var stuff = ECOLMStuff[Number(this.id)];
  var this_id = this.id;
  var stuff = ECOLMStuff[(this_id)];
//  var tc = stuff.data.Tabcode;
  var tc = get_incipit_tabcode(this.id);
  if(!tc) return;
  $(".debug_mess").innerHTML = tc;
  $(".searchResult").toggleClass("clicked", false);
  $(this).parents(".searchResult").toggleClass("clicked", true);
  var otcd = TabCodeDocument;//This is *bad*
  var doc = new Tablature(tc, svg(650, 650), copyParams(TabCodeDocument.parameters));
  var svgDiv = document.getElementById('resultTab');
  $(svgDiv).show();
  var vectors = stuff.results[1];
  var exDur = 0;
  var start = 0;
  ECOLMStuff[this_id].tablature = doc;
  for(var i=0; i<vectors.length; i++){
    // start = vectors[i][0]/64; // I don't know why I don't need to convert this back
    //start = vectors[i][0];
    start = vectors[i][0]*4;// WHY??? WHY???
    doc.selections.push(new Selection(start, start+ECOLMStuff.queryDuration, ECOLMStuff.query, vectors[i][1]));
  }
  if(svgDiv){
    $(svgDiv).empty();
    var top = svgDiv.getBoundingClientRect().top;
    $(svgDiv).css("height", "calc(100% - "+(top+5)+"px");
    svgDiv.appendChild(doc.SVG);
    var oedit = editable;
    var old = ld;
    editable = false;
    ld = 8;
    var oldBreaks=breaks;
    breaks=650;
    doc.draw();
    breaks=oldBreaks;
    var matchwidth = doc.SVG.getBoundingClientRect().width;
    var querywidth = document.getElementById('notation').getBoundingClientRect().right;
    $(document.body).css("min-width", matchwidth+querywidth+25+"px");
    $("#codediv").css("width", querywidth+"px");
    $("#searchResults").css("width", "calc(100% - "+(20+matchwidth)+"px)");
    ld = old;
    editable = oedit;
    TabCodeDocument = otcd;
  }
}
function get_incipit_tabcode(ID) {
	var tc = $.ajax({
	    type: 'POST',
	    async: false,
	    url: './get_tabcode.php',
	    data: { id_url:   "incipits_tc/"+ID },
	    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
	    failure: function(){
	      logger.log("TabCode retrieval failed for Gerbode item " + ID);
	    },
	    success: function(data){
	      if(!data) return;
	    } 
	}); 
	return  tc.responseText;
}
// TC: Function to retrieve metadata for a Gerbode search - TEMPORARY!
function resultGerbodeMetadata(data){
  var parent = DOMSpan('metadata', false, false);
  fields = data.length;
  var title = data[fields-1];
  // We just fake something which might work for now:
  parent.appendChild(DOMSpan('PieceTitle', false, title));
  parent.appendChild(DOMSpan('SourceTitle', false, data[0]));
  if(fields>2)  parent.appendChild(DOMSpan('SourceSubtitle', false, data[1]));
  if(fields>3)  parent.appendChild(DOMSpan('Shelfmark', false, data[2]));
  if(fields>4)  parent.appendChild(DOMSpan('MoreMetadata1', false, data[3]));
  if(fields>5)  parent.appendChild(DOMSpan('MoreMetadata2', false, data[4]));
  return parent;
}
// TC: Function to retrieve metadata and link to matched tab for a Gerbode search - TEMPORARY!
function resultGerbode(ID, domObj, resultsObj){

  if(resultsObj[ID] && resultsObj[ID].data) {
      var result = resultGerbodeMetadata(resultsObj[ID].data);
      result.id = ID;
      domObj.appendChild(result);
//      domObj.appendChild(anchor);
      $(result).click(GerbodeResultTab);
      return;
  }
  $.ajax({
    type: 'POST',
    async: true,
    url: './gerbode_lookup.php',
    datatype: 'json',
    data: { lookup:   ID },
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      logger.log("Retrieval failed for Gerbode item " + ID);
    },
    success: function(data){
      if(!data) return;
      if(!resultsObj[ID]) resultsObj[ID] = {};
      resultsObj[ID].data=JSON.parse(data);
      var result = resultGerbodeMetadata(resultsObj[ID].data);
      result.id = ID;
      domObj.appendChild(result);
//      domObj.appendChild(anchor);
      $(result).click(GerbodeResultTab);
    }
  });
}
function GerbodeResultOut(num, result, max){
	var num;
//  return DOMSpan('resultStats', false, (num+1) + ") "+ Math.round(100*(result[1]/max))+"% "
//                +summariseResult(result));
//  return DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  var span = DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  span.appendChild(resultDiagram(result));
  return span;
}
function Selection(start, finish, query, transposition){
  this.start = start;
  this.finish = finish;
  this.query = query;
  this.transposition = transposition;
  this.chords = [];
  this.notes = [];
  this.translatedQuery = {};
  this.doc = TabCodeDocument;
  for(var i=0; i<this.query.length; i++){
    if(this.translatedQuery[this.query[i][0]*4+this.start]){
      this.translatedQuery[this.query[i][0]*4+this.start][this.query[i][1]+this.transposition] =true;
    } else {
      this.translatedQuery[this.query[i][0]*4+this.start]={};
      this.translatedQuery[this.query[i][0]*4+this.start][this.query[i][1]+this.transposition] =true;
    }
  };
  this.appliesToTime = function(time){
    return time>=this.start && time<this.finish;
  };
  this.appliesToNote = function(note, chord){
    var pitch = note.pitch(chord.tuning);
    if(this.translatedQuery[chord.startTime] && this.translatedQuery[chord.startTime][pitch]) {
      return true;
    } else { 
      return false;
    }
  };
  this.play = function(){
    var otcd = TabCodeDocument;
    TabCodeDocument = this.doc;
    jsPlay(this.chords[0], this.chords[this.chords.length -1]);
    TabCodeDocument = otcd;
  };
}

