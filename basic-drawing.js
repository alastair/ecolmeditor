function verticalAdjust(){
  // This is the amount by which staff lines are lower than cury
  return ld * 4/3;
}

function advance (){
  return (4 + lines) * ld;
}

function staffHeight() {
  return ld*mainCourseCount;
}
function systemStep(){
  return ld*(mainCourseCount+2);
}

function yOffset(course){
  if(curTabType == "Italian"){
    // return topMargin+(ld*(6-course)) - 9.5; // ??!
    return (ld*(6-course+0.75));
  } else {
    // return topMargin+(ld*course);
    return ld*(course+1.35);
//    return cury+(ld*course);
  }
}
function flagy(){
  // if(curTabType == "Italian"){
    return cury - (ld * 2/5);
  // }
  // return cury;
}

////////////////////////////////
// 
// Drawing utility functions
//

function drawRepeat(svg, x){
  for(var i=0; i<3; i++){
    svgCircle(svg, x+(ld/7), cury+(ld*(i+(17/6))), ld/7, "repeatdot", false);
  }
  curx+=ld*2/5;
}

function drawDashedBarline(svg, x){
  for(var i=0; i<lines; i++){
    svgCircle(svg, x+ld/10, cury+(ld*(5/6*i))+(7/4*ld), ld/10, "barlinedots", false);
  }
}

function drawBarline(svg, x, dashed, dble){
 if(justify && !nowjustify) x = 1; // if justify, initial barline at left end of staff
 
 if(dashed){
    drawDashedBarline(svg, x);
    curx -= ld/5;
  } else {
    svgLine(svg, x, cury+(ld*4/3), x, cury+(ld*4/3)+(ld*(lines-1)), "barlineline", false);
    curx -= ld/2; // why?!
  }
  if(dble) {
    drawBarline(svg, x+(ld/3), dashed, false);
    curx += ld/2;
  }
  else {
    curx += ld/3;
  }
// logger.log("Barline at "+curx)
}
/*
}
  curx += ld;
}
*/
// 
// // put the xpos of last object to be drawn on each system into global systemEnds array
// // - needed for justification
// function getSystemEnds() {
// 	var TCD = TabCodeDocument;
// 	var systemnumber = 0;
// 	for(var i=0; i<TCD.TabWords.length; i++){
// 		dur = 0;
// 		switch(TCD.TabWords[i].tType){
// 			case "SystemBreak":
// 			case "PageBreak":
// 				currSysEnd = TCD.TabWords[i-1].xpos;
// 				systemEnds[systemnumber]=currSysEnd;
// 				systemnumber++;
// 				break;
// 			case "Chord":
// 			case "Barline":
// 				currSysEnd = TCD.TabWords[i].xpos;
// 				systemEnds[systemnumber]=currSysEnd;
// 				systemnumber++;
// 				break;
// 
//     	}
// 	}
// 	logger.log(systemEnds);
// 	return systemEnds;
// }
// 
function drawSystemBreak(obj,i) {
	if(!not_printing) return false;
	var el = svgWhiteRect(TabCodeDocument.SVG, systemEnd+4, cury+40, 20, 20, "systemBreakBox", "sys_"+obj.systemnumber.toString());
	$(el).data("word", obj.tokens[i]);
	var label = svgText(TabCodeDocument.SVG, systemEnd+10, cury+56, "systemBreakBox", false, false, "^");
	$(label).data("word", obj.tokens[i]); 
	
// logger.log("System break at "+curx+"\n")
}

function drawTSC(svg, TS, i, j){
  var alone = j==0 && TS.components[i].length==1;
  var el = svgGroup(svg, "tscomponent i"+i+"j"+j, false);
  var symbol = TS.components[i][j];
  var slashed = /\//.test(symbol);
  var compClass = alone ? "lone" : "stacked";
  var ystep = ld * (alone ? 4 : (j ? 5 : 2.75));
  $(el).data("word", TS);
  $(el).data("i", i);
  $(el).data("j", j);
  switch(symbol.charAt(0)){
    case "C":
      svgText(el, curx, cury+ystep, compClass+" tsc", false, false, (slashed ? "Ç" : "C"));
      slashed = false;
      break;
    case "D":
      svgText(el, curx, cury+ystep, compClass+" tsc", false, false, (slashed ? "d" : "D"));
      slashed = false;
      break;
    case "O":
      svgText(el, curx, cury+ystep, compClass+" tsc", false, false, "0");
      break;
    default:
      // Not a symbol sig (most likely a number)
      // FIXME: If it's not a number, then this won't work
      if (!isNaN(symbol.toString())) {
		  svgText(el, curx+(ld/4), cury+ystep, compClass+" tsc tstext", false, false,
        (/[\/\.]/.test(symbol) ? symbol.substring(0,symbol.search(/[\/\.]/)) : symbol));
        }
  }
  if(slashed){
    // If were here, it has a slash that we don't have a glyph for
    svgLine(el, curx+(el.getBBox().width/2), cury+2*ld,
        curx+(el.getBBox().width/2), cury+6*ld,
        "tsslash", false);    
  }
  if (/\./.test(symbol)){
    svgCircle(el, curx+(el.getBBox().width/2), cury+ystep, ld/6, "tsdot", false);
  }
  return el;
}

function drawTSComponent(svg, symbol, minStep, i, j, TS){
  // FIXME: obsolete if I parse TS properly
  var compClass = minStep===0 ? "lone" : "stacked";
  var ystep = minStep === 0 ? ld * 4 :( minStep ? ld * 5 : ld * 3);// FIXME: ??
  var el = svgGroup(svg, "tscomponent i"+i+"j"+j, false);;
  var skipSlash = false;
  $(el).data("word", TS);
  $(el).data("i", i);
  $(el).data("j", j);
  switch(symbol.charAt(0)){
    case "C":
      if(/\//.test(symbol)) {
        svgText(el, curx, cury + ystep, compClass+" tsc", false, false, "Ç");
        skipSlash = true;
      } else {
        svgText(el, curx, cury + ystep, compClass+" tsc", false, false, "C");
      }
      break;
    case "D":
      // draw at origin first
      // el.setAttributeNS(null, "transform", "scale(-1 1) translate("+(-curx-ld*3)
      //              +", "+(cury+ystep)+")");
      // svgText(el, 0, 0, compClass+" tsd", false, false, "C");
      if(/\//.test(symbol)){
        svgText(el, curx, cury+ystep, compClass+" tsc dslash", false, false, "d");
        skipSlash= true;
      } else {
        svgText(el, curx, cury+ystep, compClass+" tsc tsc-D", false, false, "D");
      }
      // then flip
//      el.setAttributeNS(null, "transform", "scale(-1, 1)");
      // then move into pos (FIXME: won't start centred about origin, so a bit crooked)
      // el.setAttributeNS(null, "transform", "translate("+(curx+el.getBBox().width)
      //                   +", "+(cury+ystep)+")");
      break;
    case "O":
      svgText(el, curx, cury + ystep, compClass+" tsc tso", false, false, "0");
      break;
    default:
      // Not C, D, or O (probably means is a number)
      // Print verbatim, but for multichar symbol need to stop BEFORE any . or /
      var tmpsymbol = symbol;
      if(symbol.search(/[\/\.]/)!=-1) {
        tmpsymbol = symbol.substring(0,symbol.search(/[\/\.]/));
      }
      svgText(el, curx-ld, cury+ystep, compClass+" tsc tstext", 
        false, false, tmpsymbol);
  }  
  // Slashes (FIXME: a bit crude, and lacking +)
  if(!skipSlash){
    if(/\//.test(symbol)){
      // FIXME: fix this
      svgLine(el, curx+(el.getBBox().width/2), cury+2*ld,
        curx+(el.getBBox().width/2), cury+6*ld,
        "tsslash", false);
    } else if(/\./.test(symbol)){
      svgCircle(el, curx+(el.getBBox().width/2), cury+ystep, ld/6, "tsdot", false);
    }
  }
  if(minStep || minStep === 0) {
    curx += Math.max(el.getBBox().width, minStep);
  }
  return el.getBBox().width; // el.width;
}

function drawSlashes(svgEl, n) {
  var starty = cury+systemStep()-(ld*3/4);
//   var leftstart = curx - 4;
  var leftstart = curx - 5;
  for(var i=0; i<n; i++){
//     svgLine(svgEl, curx, starty, curx+ld, starty-(ld/2), "bassslash", false);
    svgLine(svgEl, leftstart, starty, leftstart+ld, starty-(ld/2), "bassslash", false);
    starty += 3;
  }
}

function drawItalianSlashes(svgEl, n) {
  var starty = cury+(ld*4/5);
  for(var i=0; i<n; i++){
    svgLine(svgEl, curx, starty, curx+ld, starty-(ld/2), "bassslash", false);
    starty -= 3;
  }
}

function drawInsertBox(x, y, i, svgEl){
//  var el = svgRoundedRect(svgEl, x-ld/2, y, 1/3*ld, 7*ld, ld/4, ld/4, "missingChord", "I-"+i);
  var el;
  var voff;
  for(var j=0; j<lines+2; j++){
    if(j==lines+1){
      // FIXME: No bass courses please, we can't do 'em yet
      continue;
    }
    voff = j ? ld * (j-1/4) : -ld;
    if(not_printing) {
    // thinned this to avoid blocking barlines
		el = svgRoundedRect(svgEl, x-(3/4*ld), y+voff, 8/16*ld, j ? ld : 7/4* ld, ld/4, ld/4, "missingChord", "n"+i+"p"+j);
		$(el).data("follows", i);
		$(el).data("precedes", i+1);
		$(el).data("pos", j);
    }
  }
}

function drawMetricalInsertBoxes(i, word, svgEl){
  if(not_printing) {
	  var ela = svgRoundedRect(svgEl, curx-ld, cury+3/2*ld, ld*2, ld, 
		ld/4, ld/4, "missingTSC above", false);
	  var elb = svgRoundedRect(svgEl, curx-ld, cury+11/2*ld, ld*2, ld,  
		ld/4, ld/4, "missingTSC below", false);
	  $(ela).data("word", word);
	  $(elb).data("word", word);
	  $(ela).data("i", i);
	  $(elb).data("i", i);
  }
}
function drawMetricalInsertBox(i, type, word, svgEl){
  if(not_printing) {
	  var el = svgRoundedRect(svgEl, curx-ld/2, cury+2*ld, ld/2, 4*ld,
		ld/4, ld/4, "missingTSC "+type, false);
	  $(el).data("word", word);
	  $(el).data("i", i);
  }
}
