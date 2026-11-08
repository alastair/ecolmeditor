// CONSTANTS
var logger = typeof(window)!=='undefined' ? window.console : console;
if(typeof(node)=="undefined") var node = false;
var extraClasses = "";
var locPrefix = "";
var ren_G = [67, 62, 57, 53, 48, 43, 41, 40, 38, 36, 35, 33, 31];
var ren_G_abzug = [67, 62, 57, 53, 48, 41, 40, 38, 38, 36, 35, 33, 31];
var ren_A = [69, 64, 59, 55, 50, 45, 43, 42, 40, 38, 37, 35, 33];
var bar_d = [65, 62, 57, 53, 50, 45, 43, 41, 40, 38, 36, 34, 33];
var bar_d_415 = [64, 61, 56, 52, 49, 44, 42, 40, 39, 37, 35, 33, 31];
var ren_guit = [67, 62, 58, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var bandora = [57, 52, 48, 43, 36, 34, 29, 27, 0, 0, 0, 0, 0];
var tunings = [["Renaissance (G)", ren_G],
  ["Renaissance abzug (G)", ren_G_abzug],
  ["Renaissance guitar", ren_guit],
  ["Baroque D minor", bar_d],
  ["Bandora", bandora]];
var ticksPerCrotchet = 128;
var rhythmFlags = "ZYTSEQHWFB";
var buttonRhythmFlags = "ZYTSEQHF";
var tsbasics = [[1], [2], [3], [4], [5], [6], [8], [12],
  ["C"], ["C/", "Ç"], ["D", "C", "reverse"], ["D/", "d"],
  ["O", "0"]];
//var tabletters = "abcdefghijklmnopqrstuvwxyz";
var tabletters = "abcdefghijklmnop";
var allOrnaments;
var colours = ["redReading", "blueReading", "greenReading"]; //==> collation editor?

// Variable declarations
var barCount = 0;
var nextpage = false;
var prevpage = false;
var rule = false;
// var fill = true;
var fill = false;
var test = true;//false;
var curx = 0;
var cury = 0;

// Pagination/justification stuff. Very simple!!:
// var A4width = 2480; // @ 300 dpi
// var A4height = 3508; // @ 300 dpi
var A4width = 1112; 
var A4height = 1573; 
var leftMargin = 24;
var rightMargin = leftMargin; // i.e. width of the margin, not position
var systemEnd = A4width - rightMargin; // position of end of system = 1088
var systemWidth = systemEnd - leftMargin; // = 1064
//var topMargin = 20;
//var topMargin = 40;
var topMargin = 60;
var TITLEHEIGHT = 150; // the default text box for titles
var currSysEnd;
var systemEnds = [];
var justify = false;
var MINSYMFORJUST = 20; // minimum number of drawn symbols on a system for justification
// var justFactors = []; // Amount each system needs stretching for justification
// var justFactor = 1; // current factor

not_printing = true; // Draw empty boxes for insertion - if false, don't!

var ld = 15; // staff-line-distance;
var lines = 6;
// var editable = true;
var editable = false;
var mainCourseCount = 6;
var TabCodeDocument = false;
var Extract;
var curBeams = 0;
var curBeamGroup = [];
var curTripletGroup = false;
var curStaves;
var curHistory = false;
var curDur = ticksPerCrotchet;
var curTime = 0;
var curFont;
var curTabType;
var curFontName;
var curApparatus = false; //=>collation editor?
var curTuning = ren_G;
var tempoFactor = 1.0;  // 256 ticks per second - i.e. 120 bpm
var breaks = "stop"; // options are: TRUE (observe breaks), FALSE (ignore them), "stop" (up
                     // to first break)
var breakTypes = {Piece: "{/}", System: "{^}", Page: "{>}"};
var breakOptions = ["Piece"];
var chordCounter = 0;
var hilite = [];
var sel_window_scroll = 0;

var activeDialog = false;
var sel_note = false; //currently-selected note  

// TC 30 Sep 2026:
// so we can set this from a click in the score to implement "Play from click"
// This needs to be global
var start_wordi; 

function tabxmlp(comment){
  return /^{<\/?(app|rdg)[^>]*>/i.test(comment[0]);
}

function rulesp(comment){
  // This tells me that it's intended as a rule, but not that it's
  // legal
  return /{<rules>[\s\S]*<\/rules>}/.test(comment[0]);
}

function pagep(code){
  // Did TC devise a numbered variant that breaks this?
	return(/{\>}/.test(code));
}
function systemp(code) {
	return(/{\^}/.test(code));
}

function FlagDur(rhythm) {
  // Return a duration in multiples of crotchets given a flag
  // FIXME: add scaling factor?
	var pos = rhythmFlags.indexOf(rhythm);
	if (pos>7){
		pos--;
	}
	
	return Math.pow(2, (pos - (DoubleDurs? 6 : 5)));
}

function letterPitch(fretChar){
	var pos = tabletters.indexOf(fretChar);
	if(pos>20){
		pos -= 2;
	}else if(pos>8){
		pos--;
	}
	return pos;
}
function tabChar(tabLetter){
  if(curTabType == "Italian"){
    return letterPitch(tabLetter);
  } else {
    return tabLetter;
  }
}
