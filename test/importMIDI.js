
/*This reads a MIDI file of a lute piece transcribed in Sibelius and outputs TabCode.
  It probably will fail with any other MIDI files, and certainly with non-lute music
  (though it may generate some kind of 'intabulation')
*/

// global variables
	var allnotes = [];
	var totalDur = 0;
	var PPQ = 480;
	var BPM = 120;
	var lastNoteStart = 0;
	var lastNoteEnd = 0;
	var timeSigNum = 4;
	var timeSigDenom = 4;
	var barcount = 1;

	var MAXCHORDSPERSYSTEM = 30;
	var TabLetter = [];
	var tabcode = [];
	var lastChord = "";
	var theTabCode = "";

	var theTuning = [];
	var gcurrentstring = 0;

	var rhythmSymbol = [];

	var ren_rules = "{<rules>\n<tuning_named>renaissance</tuning_named>\n<rhythm-font>varietie</rhythm-font>\n<pitch>67</pitch>\n<bass_tuning>(-2 -1 -2 -2 -1 -2 -2 -2 )</bass_tuning>\n</rules>}";
	var bar_rules = "<rules>\n<tuning_named>baroque</tuning_named>\n<rhythm-font>weiss</rhythm-font>\n<pitch>65</pitch>\n<bass_tuning>(-2 -2 -1 -2 -2 -2 -1 -2  )</bass_tuning>\n</rules>}";
	var majorKeys = [];
	var minorKeys = [];

	var bar_bassrules = [];
	var ren_bassrules = [];
	var bassrules = "";
	var key = 0;

// Functions

function makeRules(tuning_name, keysig_accids) {
	var rules = "{<rules>\n<tuning_named>";
// 	rules += (tuning_name == "renaissance")? tuning_name : "baroque";
	rules += "baroque";
	rules += "</tuning_named>\n<rhythm-font>";
// 	rules += (tuning_name == "renaissance")? "varietie" : "weiss";
	rules += "weiss";
	rules += "</rhythm-font>\n<pitch>";
// 	rules += (tuning_name == "renaissance")? "67" : "65";
	rules += "65";
	rules += "\n<bass_tuning>(";
// 	if(tuning_name == "renaissance") {
// 	bassrules = ren_bassrules[keysig_accids+7];
// 	}
// 	else {
	bassrules = bar_bassrules[keysig_accids+7];
// 	}
	rules += bassrules;
	rules += ")</bass_tuning>\n</rules>}";
	return rules;
}

// Initialise
function initialiseTabStuff(resolution, tuning) {
	resolution *= 2;

	var Wlength = resolution * 4;
	var Hlength = resolution * 2;
	var Qlength = resolution ;
	var Elength = resolution / 2;
	var Slength = resolution / 4;
	var Tlength = resolution / 8;
	var Ylength = resolution / 16;
	var Zlength = resolution / 32;

	rhythmSymbol[Zlength] = "Z";
	rhythmSymbol[Zlength*3/2] = "Z.";
	rhythmSymbol[Ylength] = "Y";
	rhythmSymbol[Ylength*3/2] = "Y.";
	rhythmSymbol[Tlength] = "T";
	rhythmSymbol[Tlength*3/2] = "T.";
	rhythmSymbol[Slength] = "S";
	rhythmSymbol[Slength*3/2] = "S.";
	rhythmSymbol[Elength] = "E";
	rhythmSymbol[Elength*3/2] = "E.";
	rhythmSymbol[Qlength] = "Q";
	rhythmSymbol[Qlength*3/2] = "Q.";
	rhythmSymbol[Hlength] = "H";
	rhythmSymbol[Hlength*3/2] = "H.";
	rhythmSymbol[Wlength] = "W";
	rhythmSymbol[Wlength*3/2] = "W.";

	TabLetter = "abcdefghiklmnop".split("");

	BarTuning = "65,62,57,53,50,45,43,41,40,38,36,35,33".split(",");
	RenTuning = "67,62,57,53,48,43,41,40,38,36,35,33,31".split(",");
	
	logger.log("BarTuning: "+BarTuning)

	// change default tuning here! (Temporary)
	for(i=0;i<=BarTuning.length-1;i++) {
		theTuning[i] = tuning=="baroque"? BarTuning[i] : RenTuning[i] ;
	}

logger.log("Start tuning: "+theTuning)

	majorKeys["C"]=0;
	majorKeys["C#"]=7;
	majorKeys["D"]=2;
	majorKeys["Eb"]=-3;
	majorKeys["E"]=4;
	majorKeys["F"]=-1;
	majorKeys["F#"]=6;
	majorKeys["G"]=1;
	majorKeys["Ab"]=-4;
	majorKeys["A"]=3;
	majorKeys["Bb"]=-2;
	majorKeys["B"]=5;

	minorKeys["C"]=-3;
	minorKeys["C#"]=4;
	minorKeys["D"]=-1;
	minorKeys["Eb"]=-6;
	minorKeys["E"]=1;
	minorKeys["F"]=-4;
	minorKeys["F#"]=3;
	minorKeys["G"]=-2;
	minorKeys["G#"]=5;
	minorKeys["A"]=0;
	minorKeys["Bb"]=-5;
	minorKeys["B"]=2;

	ren_bassrules[0] = "-3 -1 -2 -2 -2 -2 -2 -2";
	ren_bassrules[1] = "-2 -2 -2 -2 -1 -2 -2 -1";
	ren_bassrules[2] = "-2 -2 -2 -1 -2 -2 -2 -1";
	ren_bassrules[3] = "-2 -2 -2 -1 -2 -2 -1 -2";
	ren_bassrules[4] = "-2 -2 -1 -2 -2 -2 -1 -2";
	ren_bassrules[5] = "-2 -2 -1 -2 -2 -1 -2 -2";
	ren_bassrules[6] = "-2 -1 -2 -2 -2 -1 -2 -2";
	ren_bassrules[7] =  "-2 -1 -2 -2 -1 -2 -2 -2";
	ren_bassrules[8] =  "-1 -2 -2 -2 -1 -2 -2 -1";
	ren_bassrules[9] =  "-1 -2 -2 -1 -2 -2 -2 -1";
	ren_bassrules[10] =  "-1 -2 -2 -1 -2 -2 -1 -2";
	ren_bassrules[11] =  "-1 -2 -1 -2 -2 -2 -1 -2";
	ren_bassrules[12] =  "-1 -2 -1 -2 -2 -1 -2 -2";
	ren_bassrules[13] =  "-1 -1 -2 -2 -2 -1 -2 -2";
	ren_bassrules[14] =  "-1 -1 -2 -2 -1 -2 -2 -2";

	bar_bassrules[0]  = "-3 -2 -1 -2 -2 -1 -2 -2";
	bar_bassrules[1]  = "-3 -1 -2 -2 -2 -1 -2 -2";
	bar_bassrules[2]  = "-3 -1 -2 -2 -1 -2 -2 -2";
	bar_bassrules[3]  = "-2 -2 -2 -2 -1 -2 -2 -1";
	bar_bassrules[4]  = "-2 -2 -2 -1 -2 -2 -2 -1";
	bar_bassrules[5]  = "-2 -2 -2 -1 -2 -2 -1 -2";
	bar_bassrules[6]  = "-2 -2 -1 -2 -2 -2 -1 -2";
	bar_bassrules[7] =  "-2 -2 -1 -2 -2 -1 -2 -2";
	bar_bassrules[8] =  "-2 -1 -2 -2 -2 -1 -2 -2";
	bar_bassrules[9] =  "-2 -1 -2 -2 -1 -2 -2 -2";
	bar_bassrules[10] =  "-1 -2 -2 -2 -1 -2 -2 -2";
	bar_bassrules[11] =  "-1 -2 -2 -1 -2 -2 -2 -1";
	bar_bassrules[12] =  "-1 -2 -2 -1 -2 -2 -1 -2";
	bar_bassrules[13] =  "-1 -2 -1 -2 -2 -2 -1 -2";
	bar_bassrules[14] =  "-1 -2 -1 -2 -2 -1 -2 -2";

}

function AdjustKey(NumofAccs, tuning_type) // for now, tuning_type is "renaissance" or "baroque"
{
//logger.log(NumofAccs)
//logger.log(theTuning)

// 	rules = makeRules(tuning_type, NumofAccs);
	rules = makeRules("baroque", NumofAccs);
	
	logger.log(rules)

	var accsequence = [];

	if(NumofAccs>0) sharps = true;
	else sharps = false;
	accsequence[1] = 11;
	accsequence[2] = 8;
	accsequence[3] = 12;
	accsequence[4] = 9;
	accsequence[5] = 6;
	accsequence[6] = 10;
	accsequence[7] = 7;
	j = 1;

// bar tuning: 65,62,57,53,50,45,43,41,40,38,36,35,33

	if (!sharps) {
		while (j <= (-1 * NumofAccs)) {
// 			i = accsequence[j]-1;
			i = accsequence[j];
			var p=parseInt(theTuning[i]);
			p--;
			theTuning[i]=p.toString();
			logger.log("Changed course "+(i+1)+" to "+theTuning[i]+" accsequence: "+accsequence[j])
			j++;
		}
	}
	else {
		while (j <= (NumofAccs)) {
			i = accsequence[8 - j]-1;
			var p=parseInt(theTuning[i]);
			p++;
			theTuning[i]=p.toString();
			j++;
		}
	}
	logger.log(theTuning)
// 	theTuning[12] = theTuning[5] - 12;  // set bottom octave GG
// 	logger.log(theTuning)
}

function MIDItoTabNote (note) {
	FretNum = 0;
	slashnumber = 0;
	ondiapason = 0;
	finished = 0;
	theNote = 0;
	k = gcurrentstring;
	theNote = note;
//logger.log(barcount+": "+theNote)

	while ((k< 13)&&(!finished))	{
		FretNum = theNote - theTuning[k] ;
		if (FretNum>=0) {
			if (FretNum>14)   /* we're off the top! */	{
				tabcode.push("{MIDI "+theNote+" is out of range of string "+(k+1)+"}");
				logger.log("Bar "+barcount+": MIDI "+theNote+" is out of range of string "+(k+1));
				finished = 1;
				return ;
			}
			else {
				if (k>6)   /* we're on the diapasons */ {
					ondiapason = 1;
					slashnumber = k - 7;
				}
			}
			finished = 1;
		}
		k++;
	}

	if(ondiapason)	{
		var slashstring="";
		j = 0;
		if ((slashnumber < 4)&&(slashnumber >= 0))	{
			for(m=0; m<=slashnumber; m++) slashstring += "/";
			lastChord = tabcode[tabcode.length-1] + "X"+TabLetter[FretNum]+slashstring;
			tabcode[tabcode.length-1] = lastChord;
		}
		else if (slashnumber > 3 )	{
				lastChord = tabcode[tabcode.length-1] + "X"+(slashnumber);
				tabcode[tabcode.length-1] = lastChord;
			}
	}
	else	{
		lastChord = tabcode[tabcode.length-1] + TabLetter[FretNum]+(k);
		tabcode[tabcode.length-1] = lastChord;
	}
		gcurrentstring = k;
//logger.log("\t"+tabcode[tabcode.length-1])
		return;
}
var		allnotes = [];

function getMIDI(url,fname) {

	var midi = new Midi();
	var notes = [];
	var allnotes = [];

	// load a midi file in the browser
	Midi.fromUrl(url).then(midi => {
		allnotes.length=0; //clear the array
		//get the header
		PPQ = midi.header.ppq;
		if(midi.header.tempos.length > 0) BPM = midi.header.tempos[0].bpm;
// 		initialiseTabStuff(PPQ, "renaissance");
		initialiseTabStuff(PPQ, "baroque");
		if(midi.header.timeSignatures.length) {
			timeSigNum = midi.header.timeSignatures[0].timeSignature[0];
			timeSigDenom = midi.header.timeSignatures[0].timeSignature[1];
		}

logger.log("TS: "+timeSigNum+"/"+timeSigDenom)

//			keySig = [midi.header.timeSignatures[0].key,midi.header.timeSignatures[0].scale];
		if (midi.header.keySignatures.length) { 
			key = midi.header.keySignatures[0].key;
	logger.log(midi)
	logger.log("key = "+key)
// 			AdjustKey(midi.header.keySignatures[0].scale == "major"? majorKeys[midi.header.keySignatures[0].key] : minorKeys[midi.header.keySignatures[0].key], "renaissance")
			AdjustKey(midi.header.keySignatures[0].scale == "major"? majorKeys[midi.header.keySignatures[0].key] : minorKeys[midi.header.keySignatures[0].key], "baroque")
		}

logger.log("Time Sig: "+timeSigNum+"/"+timeSigDenom)

		totalDur = ((midi.duration ))

		//get the tracks
		midi.tracks.forEach(track => {
		  //Get all notes from all tracks
			notes = track.notes;
			notes.forEach(note => {
				allnotes.push([note.ticks,note.midi]);
			})
		})
logger.log("allnotes<< has "+allnotes.length+" notes")
		// For TabCode we need *all* sounding notes grouped in their chords in a single time-sequence.
		//notes from different tracks will not be in time-order!! So:
		allnotes.sort(function (a,b) {
			if(a[0]>b[0]) return 1;
			if(a[0]<b[0]) return -1;
			if(a[1]<b[1]) return 1;
			if(a[1]>b[1]) return -1;
			return 0;
		});
		setAndRedrawTabcodeFun(notesToTabcode(allnotes, fname));
// 	}, setAndRedrawTabcode);
	});
// 		document.getElementById("showButton").hidden = false;
//	notesToTabcode(allnotes, fname);
//	setAndRedrawTabcode();
// 	return allnotes;
}
function tempPath(name) {
	var path = URL.createObjectURL(name);
	return path;
}
function printNotes() {
logger.log("Printing notes:")
	var notecount = 0;
	var lastTicks = 0;
	for(i=0;i<=allnotes.length-1;i++) {
		notecount++;
		lastTicks = allnotes[i][0];
	}
}
function ticksToBeat(ticks) {
	return (ticks/60)/16;
}
function lastNotes() {
	lastNoteStart = allnotes[allnotes.length - 1][0]/PPQ;
	lastNoteEnd = (totalDur/60)*BPM
	logger.log("Last note starts at "+(lastNoteStart) + " beats")
	logger.log("... and ends at " + lastNoteEnd+" beats")
	logger.log("... Its duration is "+(lastNoteEnd-lastNoteStart)+" beats")

}
function notesToTabcode(allnotes, fname) {
	var beatcount = 0;
	var lastTicks = -1;
	var systemcount = 1;
	var chordcount = 0;
	var chordDur = 0;
	var badChordDur=false;
	var beatsInBar = timeSigNum*(2/timeSigDenom);
	var needSystemBreak = false;

	// Clear old tabcode from everywhere:
	var tabcodestring = "";
	tabcode.length = 0;
	barcount = 1;

	for(i=0;i<=allnotes.length-1;i++) {
		beatcount = ticksToBeat(allnotes[i][0]);

		// Check to see if the last chord we did is now complete:
		if(allnotes[i][0] > lastTicks) {
			chordcount++;
			gcurrentstring = 0;
			chordDur = allnotes[i][0] - lastTicks;
			if(tabcode.length) {
				if(tabcode[tabcode.length-1].slice(1,2) != "|") {
					if(typeof rhythmSymbol[chordDur*2] == "undefined"){
						lastChord = tabcode[tabcode.length-1];
						badChordDur=true;
					}
					else {
						lastChord = rhythmSymbol[chordDur*2] + tabcode[tabcode.length-1];
					}
					tabcode[tabcode.length-1] = lastChord;
				}
			}
			tabcode.push("");
			if(badChordDur) {
				tabcode.push("{Bad Chord duration "+(chordDur*2)+" not inserted here}");
				badChordDur = false;
			}
		}
		if(beatcount && (allnotes[i][0] > lastTicks)) if(beatcount%beatsInBar==0) {
			barcount++;
			tabcode.push("| {bar "+barcount+"}");
			tabcode.push("");
			// Enter system break if necessary after barline:
			if(needSystemBreak) {
				tabcode.push("{^} {System "+systemcount+"}");
				tabcode.push("");
				needSystemBreak = false;
				chordcount = 0;
			}
		}
		// Check to see if we need a system break:
		if(chordcount&&(chordcount%MAXCHORDSPERSYSTEM == 0)) {
			// Make sure that we haven't just put in a system break:
			if(tabcode[tabcode.length-2].slice(0,3) != "{^}")	{
// 				logger.log("{System Break near here!!}")
				systemcount++;
				needSystemBreak = true;
				}
		}

		MIDItoTabNote(allnotes[i][1]);
		lastTicks = allnotes[i][0];
		
	}
	chordDur = ((totalDur/60)*BPM*PPQ) - lastTicks;
	if(tabcode.length && (tabcode[tabcode.length-1].slice(1,2) != "|")) {
		if(typeof rhythmSymbol[chordDur*2] == "undefined"){
			lastChord = tabcode[tabcode.length-1];
			badChordDur=true;
		}
		else {
			lastChord = rhythmSymbol[chordDur*2] + tabcode[tabcode.length-1];
		}
		tabcode[tabcode.length-1] = lastChord;
	}
	if(badChordDur) {
		tabcode.push("{Bad Chord duration "+(chordDur*2)+" not inserted on prev chord}");
		badChordDur = false;
	}
	tabcode.push("");

	// Insert initial time-signature. NB FIXME - doesn't handle changes
	tabcode.unshift("");
	tabcode.unshift("M("+timeSigNum+":"+timeSigDenom+")")

	// Insert filename
	tabcode.unshift("");
	tabcode.unshift("");
	tabcode.unshift("{Imported from MIDI file: "+fname+"}");

// 	tabcode.unshift(ren_rules); //Need to be absolutely first!
	tabcode.unshift(rules); //Need to be absolutely first!


// 	tabcodestring += "\n\n" + tabcode.join("\n");
	tabcodestring = tabcode.join("\n");

//	logger.log(tabcodestring)
	return tabcodestring;
}

function get_and_convert_MIDI(url,fname,setAndRedrawTabcode) {
	var allnotes = getMIDI(url,fname, setAndRedrawTabcodeFun);
//	tabcodestr = notesToTabcode(allnotes, fname);
//	return tabcodestr;
}
function setAndRedrawTabcodeFun(code) {
	 document.getElementById("code").value = code;
	 refreshFromTabCode();
	 $(document.getElementById('tcshow')).show();
}
