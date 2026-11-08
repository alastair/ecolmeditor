// Some useful regexps for rules:
var fontsize = 15;
var fonts = ["normal "+fontsize+"px Varietie3", 
  "normal "+fontsize+"px TabRegular", "normal "+fontsize+"px Helvetica"];
var notationp = /<notation>[^<]*<\/notation>/;
var crotchetflagp = /<crotchet[-_]flag>[^>]*<\/crotchet[-\_]flag>/;
var tuningp = /<tuning(-named|_named)*>[^>]*<\/tuning(-named|_named)*>/;
var tuninglistedp = /<tuning>[^>]*<\/tuning>/;
var tuningnamedp = /<tuning[-_]named>[^>]*<\/tuning[-\_]named>/;
var basstuningp = /<bass[_-]tuning(-named|_named)*>[^>]*<\/bass[_-]tuning(-named|_named)*>/;
var basstuninglistedp = /<bass[_-]tuning>[^>]*<\/bass[_-]tuning>/;
var basstuningnamedp = /<bass[_-]tuning[-_]named>[^>]*<\/bass[_-]tuning[-_]named>/;
var pitchp = /<pitch>[^>]*<\/pitch>/;
var renaissanceIntervals = [5, 5, 4, 5, 5];
var baroqueIntervals = [3, 5, 4, 3, 5];
var renaissanceGuitarIntervals = [5, 4, -7];
var modernGuitarIntervals = [5, 4, 5, 5, 5];
var renaissanceBassIntervals = [2, 1, 2, 2, 1, 2, 2];
var baroqueBassIntervals = [2, 2, 1, 2, 2, 2, 1];
var namedTunings = [[/renaissance/, renaissanceIntervals],
                    [/baroque/, baroqueIntervals],
                    [/harpway-sarabande/, [5, 3, 4, 5, 5]],
                    [/gaultier/, [4, 3, 4, 5, 5]],
                    [/harpway-flat/, [5, 4, 3, 5, 5]],
                    [/french-flat/, [3, 4, 3, 5, 5]],
                    [/cordes-avallee/, [5, 4, 5, 7, 5]]];
var namedBassTunings = [[/renaissance_minor8/, [2, 3]],
                        [/baroque/, [3, 5, 4, 3, 5]]];

function Ruleset(code, prevSet) {
  this.fType = "Ruleset";
  this.tType = "Ruleset";
  this.previousRuleset = prevSet;
  this.comment = code[0];
  this.rules = this.comment.toLowerCase();
  this.ulc_rules = this.comment;
  this.rules = this.rules.substring(this.rules.indexOf("<rules>")+7,
      this.rules.indexOf("</rules>"));
  if(this.rules.includes("<title>")) {
      this.rules = this.ulc_rules}
  this.starts = code[1];
  this.finishes = code[2];
  this.notation = false;
  this.tuning = false;
  this.pieceTitle = false;
  this.getRule = function(rulename){
    //FIXME: case sensitivity
    var rex = new RegExp("<" + rulename + ">[^<]*<\/"+rulename+">");
    var result = this.rules.match(rex);
    if(result){
      result = result[result.length-1];
      result = result.substring(result.indexOf(">")+1);
      result = result.substring(0, result.indexOf("<"));
      // result = result[result.length - 1].substring(rulename.length + 2);
      // result = result.substring(0, result.length - rulename.length - 3);
      var start = result.search(/\S/);
      if(start || start == 0){
        return result.substring(start);
      }
    }
    return false;
  };
  // Notation first
  var thisRule = this.getRule("notation");
//  var thisrule = this.rules.match(notationp);
  // Always use the last match in a set -- a la css
//  if(thisrule && thisrule[thisrule.length-1].match(/italian|french/)){
  if(thisRule && /italian/.test(thisRule)){
    this.notation = "Italian";
  } else if (thisRule && /french/.test(thisRule)) {
    this.notation = "French";
  } else if (this.previousRuleset){
    this.notation = this.previousRuleset.notation;
  } else if (Extract) {
    this.notation = Extract.tabType;
  } else {
    this.notation = "French";
  }
  
//   Very crude implementation of crotchet-flag rule for now! (Only works for Q=|\\) 
  if(thisRule = this.getRule("crotchet[-_]flag")) {
	  DoubleDurs = (thisRule && /[Ee]/.test(thisRule));
	  document.getElementById("q_flag").src= "flag_E.jpg";
  }
  
  if(thisRule = this.getRule("title")) {
  	this.pieceTitle = thisRule;
  }
  
  this.getTuning = function() {
    // Now tuning -- this is a bit more complicated
    // Have to combine various bits of rules for named or listed
    // tunings, pitch and bass courses
    var fullTuning = this.previousRuleset ? 
                       this.previousRuleset.tuning :
                       (Extract ?
                        Extract.contextTuning :
                        ren_G);
    var pitch = this.getRule("pitch");
    if(pitch) {
      thisRule = pitch.match(/[0-9]+/);
      if(thisRule){
        fullTuning = fullTuning.map(pitchFunction(thisRule[0]));
      }
    }
    var namedTuning = this.getRule("tuning[-_]named");
    var listedTuning = this.getRule("tuning");
    if(namedTuning){
      for(var i=0; i<namedTunings.length; i++){
        if(namedTuning.match(namedTunings[i][0])){
//          fullTuning = fullTuning.map(namedTuningFunction(0, namedTunings[i][1]));
          fullTuning = fullTuning.map(namedTuningFunction(1, namedTunings[i][1]));
          break;
        }
      }
    } else if(listedTuning){
      fullTuning = retune2(fullTuning, 1, stringnumlistToArray(listedTuning));
    }
    namedTuning = this.getRule("bass[-_]tuning[-_]named");
    listedTuning = this.getRule("bass[-_]tuning");
    if(namedTuning){
      for(var i=0; i<namedBassTunings.length; i++){
        if(namedTuning.match(namedBassTunings[i][0])){
          fullTuning = fullTuning.map(namedTuningFunction(6, namedBassTunings[i][1]));
          break;
        }
      }
    } else if(listedTuning) {
      fullTuning = retune2(fullTuning, 6, stringnumlistToArray(listedTuning));
    }
    this.tuning = fullTuning;
  };
  this.fontFamily = function(){
    var family = this.getRule("font-family") 
      || this.getRule("font_family");
    //FIXME:
    if(!family) family = this.getRule("rhythm-font");
    switch(family){
      case "Weiss":
      case "weiss":
        return "TabFont";
      case "varietie":
      case "Varietie":
        return "Varietie";
      default:
        return false;
    }
  };
  this.isBaroque = function(){
    if(this.fontFamily()==="TabFont"){
      return true;
    } else {
      this.getTuning();
      if(this.tuning[1]-this.tuning[0]===3 && this.tuning[2]-this.tuning[1]===5){
        return true;
      } else return false;
    }
  };
  this.staffLines = function(){
    var family = this.getRule("staff-lines") 
      || this.getRule("staff_lines");
    return parseInt(family);
  };
  this.flagFont = function(){
    if(this.notation == "French"){
      var flagrule = this.getRule("rhythm-font");
      if(flagrule && flagrule==="Weiss") return "TabFont";
      return Extract.font();
    } else {
      return fonts[0];
    }
  };
  this.flagy = function (y){
    if(this.notation == "Italian"){
      return y-6;
    } else {
      return y;
    }
  };
  this.tabChar = function(tabChar){
    if (this.notation == "Italian")
      return letterPitch(tabChar);
	  else
	    return tabChar;
  };
	this.fretFont = function() {
		if(this.notation == "Italian") {
			// Normal numbers rather than a special font
			return fonts[2]; //FIXME: This is a non-free font
		} else {
			return Extract.font();
		}
  };
  this.yOffset = function(course){
    if(this.notation == "Italian"){
      return 20+(15*(6-course)) - 9.5;
    } else {
      return 20+(15*course);
    }
  };
  this.draw = function(){
    curTabType = this.notation;
    curTuning = this.tuning;
  };
  this.getTuning();
  

}

function retune2(tuning, course, list){
  for(var i=0; i<list.length; i++){
    tuning[course+i] = Math.max(0, tuning[course+i-1]+list[i]);
  }
  return tuning;
}

function retune(tuning, course, list){
  var interval = "";
  for(var i=0; i<list.length; i++){
    if(/[-0-9]/.test(list.charAt(i))){
      interval += ""+list.charAt(i);
    } else if(interval.length){
      tuning[course+1] = Math.max(0, tuning[course] + Number(interval));
      interval = "";
      course++;
    }
  }
  return tuning;
}

function pitchFunction(rule){
  return function (e, i, a){
    return Math.max(0, e-(a[0] - Number(rule)));
  };
}

function namedTuningFunction(course, tuningData){
  return function (e, i, a){
    var soFar = 0;
    for(var n=0; n<i; n++){
      soFar += tuningData[n];
    }
    return i<course ? e : Math.max(0, a[0]-soFar);
  };
}

function stringnumlistToArray(string){
  return string.match(/-?[0-9]+/ig).map(function(e){return Number(e);});
}
