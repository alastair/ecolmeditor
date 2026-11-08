//var curParams;
var blockassignmentsdiv = true;

function basicwidth() {
  return 950;
  //  return Math.max(parseInt(TabCodeDocument.SVG.style.width), 700);
}

function parseTCDoc(TC) {
  curBeams = 0;
  if (TabCodeDocument) {
    TabCodeDocument = new Tablature(TC, node ? false : document.getElementById('notation'),
      curParams);
  }
  else {
    TabCodeDocument = new Tablature(TC, node ? false : document.getElementById('notation'),
      curParams);
  }
  TabCodeDocument.draw();
  updatePage();
}

var doubleclick=false;
var currKeyStroke=false;
var oldTop = 0;

function updatePage() {
  if (node) return;
  // document.getElementById("background").style.width = TabCodeDocument.SVG.style.width;
  if (document.getElementById("banner")) {
    var w = basicwidth();
    document.getElementById("banner").style.width = w;
    //    document.getElementById("systemimage").style.width = w;
    if (document.getElementById("topstuff")) document.getElementById("topstuff").style.width = w;
    if (document.getElementById("menubar")) document.getElementById("menubar").style.width = w;
    if (document.getElementById("settingsbar")) document.getElementById("settingsbar").style.width = w;
    if (document.getElementById("assignmentbar")) document.getElementById("assignmentbar").style.width = w;
    if (prevdiv) prevdiv.style.marginLeft = w - parseInt(prevdiv.style.width);
  }
//   document.getElementById("rendered").style.width = basicwidth();

  //  TabCodeDocument.makeMidi();

  if (editable) {
    $(".editable .flag.rhythm").click(function(e) {
      var word = $(this).data("word");
      sel_note = word;
      start_wordi = sel_note.n;
      logger.log("Chord " + start_wordi + " selected")
      activeDialog = rhythmFlagSelector(e.pageX, (e.pageY), $(this).data("word"));
      getKeys(activeDialog);
      activeDialog.style.top = 600;
      return false;
    });
    $("#contextflag").click(function(e) {
      buttonBox(contextButtonSet(0, 0, $(this).data("word")), e.pageX, (e.pageY), []);
      return false;
    });
    
    $(".editable .tabnote.French").click(function(e) {
      doubleclick = true;
      var word = $(this).data("word");
      sel_note = word;
      start_wordi = sel_note.chord.n;
      logger.log("Chord " + start_wordi + " selected")
      activeDialog = frenchTabSelector(e.pageX, (e.pageY), word);
      getKeys(activeDialog);
    });


	$(".editable .tabnote.Italian").click(function(e) {
      doubleclick = true;
      var word = $(this).data("word");
      sel_note = word;
      var word = $(this).data("word");
      sel_note = word;
      start_wordi = sel_note.chord.n;
      logger.log("Chord " + start_wordi + " selected")
      activeDialog = italianTabSelector(e.pageX, (e.pageY), word);
      getKeys(activeDialog);
    });

    $(".editable .bassgroup").click(function(e) {
      var word = $(this).data("word");
      var ourlist = this.querySelectorAll(".French")
      if(ourlist.length) {
      	logger.log ("\tstarts: "+ourlist.starts+" ends: "+ourlist.ends)
      var word = $(this).data("word");
      sel_note = word;
      start_wordi = sel_note.chord.n;
      logger.log("Chord " + start_wordi + " selected")
		 activeDialog = frenchTabSelector(e.pageX, (e.pageY), word);
      }
      else activeDialog = italianTabSelector(e.pageX, (e.pageY), word);
      getKeys(activeDialog);
      return false;
    });

    $(".pieceBreak").click(function(e) {
      var word = $(this).data("word");
      breakSelector(e.pageX, (e.pageY), word);
      return false;
    });
    $(".systemBreakBox").click(function(e) {
      var word = $(this).data("word");
// alert("Clicked on "+word);
//       $(".systemBreak")[0].setAttributeNS(null, "fill","pink");
      activeDialog = breakSelector(e.pageX, (e.pageY), word);
//       $(".systemBreak")[0].setAttributeNS(null, "fill","white");
      getKeys(activeDialog);
      return false;
    });
    $(".editable .fingering, .editable .orn").click(function(e) {
      var word = $(this).data("word");
      var orns = new ornamentbox(word);
      orns.draw(e.pageX, (e.pageY));
    });
    $(".barline").click(function(e) {
      var word = $(this).data("word");
      logger.log("Barline " + word.barnumber + " selected")
      start_wordi = nextChord(word).n;
     buttonBox(barlineButtonSet(0, 0, $(this).data("word")),
        e.pageX, (e.pageY), [deleteButton(0, 0, word.starts, word.finishes, "barline")]);
 getKeys(); // ??

    });
    $(".missingFret").click(function(e) {
      var word = $(this).data("word");
      var course = $(this).data("course");
      var ins = word.insertionPoint(course);
      buttonBox(TabCodeDocument.parameters.tabType == "Italian" ?
        italianTabSet([course, ins, false, false]) :
        frenchTabSet([course, ins, false, false]),
        e.pageX, (e.pageY), []);
    });
    $(".missingFlag").click(function(e) {
      var word = $(this).data("word");
      var ins = word.starts;
      buttonBox(rhythmButtonSet(0, 0, [ins, false, false]), e.pageX, (e.pageY), []);
    });
    $(".missingChord").click(function(e) {
      var prec = $(this).data("precedes");
      var ins = TabCodeDocument.code.length; // -1;
      if (prec < TabCodeDocument.TabWords.length) {
        if (prec < TabCodeDocument.TabWords.length - 1 && TabCodeDocument.TabWords[prec].tType === "Comment") {
          ins = TabCodeDocument.TabWords[prec + 1].starts;
        }
        else if (prec == TabCodeDocument.TabWords.length - 1 &&
          TabCodeDocument.TabWords[prec].tType === "Comment") {
          ins = TabCodeDocument.TabWords[prec].finishes + 1;
        }
        else {
          ins = TabCodeDocument.TabWords[prec].starts;
        }
      }
      else {
        ins = TabCodeDocument.code.length;
      }
      var pos = $(this).data("pos");
      insertionButtons(TabCodeDocument.parameters.tabType, ins, pos,
        e.pageX, (e.pageY));
    });
    $(".tscomponent").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      var j = $(this).data("j");
      metricalModButtonBox(word, i, j, e.pageX, (e.pageY));
    });
    $(".missingTSC.above").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "above", e.pageX, (e.pageY));
    });
    $(".missingTSC.below").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "below", e.pageX, (e.pageY));
    });
    $(".missingTSC.before").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "before", e.pageX, (e.pageY));
    });
    $(".missingTSC.after").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "after", e.pageX, (e.pageY));
    });
    $(".beamelement").click(function(e) {
      var word = $(this).data("word");
      var beamgroup = word.beamGroup;
      beamTable(e.pageX, (e.pageY), beamgroup);
    });
  }

document.getElementById("editor_container").scrollTop = oldTop;

}

// Find first chord after a selected barline
function nextChord(barline) {
	var thing = barline.next;
	while (thing.tType != "Chord") thing = thing.next;
	if(thing) return thing;
	else return false;
}

/****** Helper functions for dealing with clicks on editor pane 
        suggested by DL 27Apr2021] *******/
/* See Tablature () in parser.js:
	this.systemOffsets = structure.systems;
*/
function getSystem(y, systems) {
 // Find the system whose top is immediately above the mouse pointer
 // y is mouse y coordinate
 // systems is an array of the form [{top, firstWordIndex, LastWordIndex},{}...]
 var low=0;
 var high = systems.length - 1;
 var mid;

 while(low <= high){
   mid = Math.floor((low + high) / 2);
   if(systems[mid].top > y) {
     // mouse is above this system, so check earlier in array
     high = mid - 1;
   } else if (mid == systems.length - 1 || systems[mid+1].top > y) {
     // mouse is at system[mid] or this is the last system, and mouse is below it
     return systems[mid];
   } else {
     // mouse is below this system, so check later in array
     low = mid + 1;
   }
 }
 // mouse is above all system tops
 return null;
}

function getPreviousChord(x, tabWords, systemStart, systemEnd){
 // Find the Chord that starts immediately to the left of the mouse pointer
 // x is mouse x coordinate
 // tabWords is the array of all tabWords (in TabCodeDocument)
 // systemStart and End are the indices of the first and last words in the system

 
 var clickx = x - (parseInt(document.getElementById("editor_container").style.marginLeft) + parseInt(document.getElementById("rendered").offsetLeft) );
 var low=systemStart;
 var high = systemEnd;
 var mid;
 if(low==high) return tabWords[low]; // only symbol on system
 for(var q=systemStart;q<systemEnd;q++) {
// 	if (clickx < tabWords[q].xpos) return null; // click is before first chord
 	if (clickx < tabWords[q].rpos) {
 		continue;
 	}
 	else {

 // click is on or after current chord, so return it
 		return tabWords[q];
 	}
 }
}

/******** End of new helper functions 28Apr2021 ********/

// Deal with keystrokes for user-interaction in pane
// let keysPressed = [];
function getKeys() {
    document.addEventListener('keydown', keyDownhandler);
//     document.addEventListener('keyup', keyUphandler);
}
// function keyUphandler(event) {
//    logger.log(event.key +" now up")
// }
function keyDownhandler(event) {
   if((event.key == 'Shift')||(event.key == 'Meta')||(event.key == 'Alt')) return;
//   logger.log(event.key +" now down")
   if ((event.key == '.')) {
// Nothing needed as Cancel is builtin!
   }
   if (event.key === "Backspace") {
 	  var target_button = false;
 	  if(event.shiftKey)  {
		  logger.log(event.code +" + Shift [Delete Chord!]");
// 		  target_button = $(".textbutton").filter(function() {
// 			  return $(this).text("Delete Chord") ;
// 			  });
// 		  if(target_button) target_button.click();
		  logger.log("Keystroke not implemented!")
 	  }
 	  else {
//  		  logger.log(event.code +" [Delete]");
		  target_button = $(".textbutton").filter(function() {
			  return $(this).text("Delete");
			  });
		  if(target_button) target_button[0].click();
 	  }
// 	  */
   }
   if(event.key == 'ArrowDown') {
   	if(event.shiftKey) {FrDownCourse(sel_note, (sel_note.course+1)).click();}
 	else {FrDownCourseKeepPitch(sel_note, (sel_note.course+1)).click();}
   }
   else if(event.key == 'ArrowUp') {
      if(event.shiftKey) {FrUpCourse(sel_note, (sel_note.course+1)).click();}
      else {FrUpCourseKeepPitch(sel_note, (sel_note.course+1)).click();}
   }
   
   // Now test keystrokes for tabletters (lower case) and rhythmFlags (upper case):
   var keyString = event.key.toString();
   var keypatt = new RegExp(keyString);
   if(keypatt.test(tabletters)||(keypatt.test(rhythmFlags))) {
	  var target_button = $(".uibutton").filter(function(){
	  	return $(this).text() == keyString;
	  });
	  if(target_button) {
		  target_button.click();
	  }
	  clearButtons();
	  activeDialog = false;	
   }
}  	

function refresh() {
  if (TabCodeDocument) {
    $(TabCodeDocument.SVG).empty();
  }
  if (document.getElementById('code') && document.getElementById('code').value.trim().length) {
    sel_window_scroll = cury;
    parseTCDoc(document.getElementById('code').value);
    if (curUser) {
      dbSynchronise();
    }
  }
  //  parseTCDoc(document.getElementById('code').value);
}

function nextPage() {
  if (nextpage) window.location.href = nextpage + "&browse=1";
}

function prevPage() {
  if (prevpage) window.location.href = prevpage + "&browse=1";
}

function newInitialisePage(example) {
  // FIXME: This is just for now...
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('pchange')).hide();
  $(document.getElementById('hideprevbutton')).hide();
  $(document.getElementById('browse')).hide();
  window.onbeforeunload = function() {
    if (resync) {
      return "Not all your changes have been saved. " +
        "Press 'Cancel' to return to the page and wait or " +
        "'Ok' to continue. Clicking Ok may mean you have " +
        "to redo some or all of your editing next time you log in.";
    }
    return undefined;
  };
  curParams = GETParameters();
  if (!curParams) {
    if (typeof(curUser) == 'undefined' || !curUser) {
      logIn();
    }
    else {
      $("#assignmentsdiv").hide();
    }
  }
  if (curParams) {
    initialisePage2();
  }
}

function initialisePage(example) {
  // FIXME: This is just for now...
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('pchange')).hide();
  curParams = GETParameters();
  if (!curParams) {
    if (typeof(curUser) == 'undefined' || !curUser) {
      logIn();
    }
    else {
      $("#assignmentsdiv").hide();
    }
  }
  if (curParams) {
    initialisePage2();
  }
}

function initialisePage2() {
  if (node) return parseTCDoc(curParams.tabcode);;
  document.getElementById("code").value = curParams.tabcode;
  if (document.getElementById("systemimage")) document.getElementById("systemimage").src = curParams.imageURL;
  if (document.getElementById('preview')) {
    var base = basepathname(curParams.imageURL);
    var face = facename(curParams.imageURL);
    previewinit(base + "/" + face + "_thumb.gif", base + "/" + face + ".png", base + "/" + face + ".staffs");
    //    pageimg.src = base+"/"+face+".png";
    //    document.getElementById('thumb').src = base+"/"+face+"_thumb.gif";
    // previmg.onload = function(){
    //   prevdiv.style.width=previmg.width;
    //   prevdiv.style.height=previmg.height;
    //   prevcan.style.width = previmg.width;
    //   prevcan.style.height = previmg.height;
    //   if(TabCodeDocument){
    //     prevdiv.style.marginLeft = basicwidth() - parseInt(prevdiv.style.width);
    //   }
    // };
  }
  //    document.getElementById("systemimage").height = 180;  
  if (document.getElementById("systemimage")) document.getElementById("systemimage").width = 900;
  if (document.getElementById(curParams.fontName)) document.getElementById(curParams.fontName).checked = true;
  if (document.getElementById(curParams.tabType)) document.getElementById(curParams.tabType).checked = true;
  parseTCDoc(curParams.tabcode);
  if (!nextpage) {
    $("#nextP").attr("disabled", true);
  }
  if (!prevpage) {
    $("#prevP").attr("disabled", true);
  }
}

function italianTabSelector(x, y, note) {
  var set = italianTabSet(note);
  if (!note.extras) note.extras = [];
  var extras = [deleteButton(x, y, note.starts, note.starts + 2 + note.extras.length, "tabNote")];
  extras.push(deleteChordButton(x, y, note.chord.starts, note.chord.finishes, note.chord));
//  extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, note.chord.finishes, note.chord));
  var course = note.chord.mainCourses.indexOf(note);
  var same;
  if (course > 0 && !note.chord.mainCourses[course - 1]) {
    extras.push(ItUpCourse(note, course + 1));
    same = ItUpCourseKeepPitch(note, course + 1);
    if (same) extras.push(same); // Only if on fingerboard
  }
  if (course < 5 && !note.chord.mainCourses[course + 1]) {
    extras.push(ItDownCourse(note, course + 1));
    same = ItDownCourseKeepPitch(note, course + 1);
    if (same) extras.push(same); // Only if on fingerboard
  }
  extras.push(textButton("OrnFing", "orndialogue", function(note, x, y) {
    return function() {
      var orns = new ornamentbox(note);
      orns.draw(x, y);
    };
  }(note, x, y), "Ornaments/Fingerings", false));

  highlightTabWord(note.chord.starts,note.chord.finishes);
  return buttonBox(set, x, y, extras);
}

// Function to highlight/select and scroll to the current TabWord in the code textarea for editing. Takes start/finishes indexes into the TabCode string:
function highlightTabWord(starts,finishes){
  	var input = document.getElementById('code');
  	tcShow();
  	// The following is odd, but works:
  	input.setSelectionRange(starts, starts);
  	input.focus();
  	input.setSelectionRange(starts, finishes);
}

function frenchTabSelector(x, y, note) {
  var set = frenchTabSet(note);
  var extras = [deleteButton(x, y, note.starts, note.starts + 2 + note.extras.length, "tabNote")];
  extras.push(deleteChordButton(x, y, note.chord.starts, note.chord.finishes, note.chord));
//  extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, note.chord.finishes, note.chord));
  
  if(note.chord.mainCourses.indexOf(note)==-1) {
  	// In lieu of a proper dialog for bass courses, we just select the Tabcode element for manual editing:
	highlightTabWord(note.chord.starts,note.chord.finishes);
  }
  else {
	  var course = note.chord.mainCourses.indexOf(note);
	  var same;
	  if (course > 0 && !note.chord.mainCourses[course - 1]) {
	    extras.push(FrUpCourse(note, course + 1));
	    same = FrUpCourseKeepPitch(note, course + 1);
	    if (same) extras.push(same); // Only if on fingerboard
	  }
	  if (course < 5 && !note.chord.mainCourses[course + 1]) {
	    extras.push(FrDownCourse(note, course + 1));
	    same = FrDownCourseKeepPitch(note, course + 1);
	    if (same) extras.push(same); // Only if on fingerboard
	  }
	  extras.push(textButton("OrnFing", "orndialogue", function(note, x, y) {
		    return function() {
			 var orns = new ornamentbox(note);
			 orns.draw(x, y);
		    };
		  }(note, x, y), "Ornaments/Fingerings", false));
	highlightTabWord(note.chord.starts,note.chord.finishes);
	  return buttonBox(set, x, y, extras);
	}
}

function rhythmFlagSelector(x, y, chord, noBeams, noDelete) {
  var set = rhythmButtonSet(x, y, chord);
  var extras = [];
  if (!Array.isArray(chord) && chord.dotted) {
    //FIXME: Not robust
    extras.push(undotButton(x, y, document.getElementById('code').value.indexOf(".", chord.starts)));
  }
  else {
    extras.push(dotButton(x, y, chord.starts + 1));
  }
  if (!noDelete) {
    extras.push(deleteButton(x, y, chord.starts, chord.starts + ((chord.dotted && 2) || 1), "Flag"));
    extras.push(deleteChordButton(x, y, chord.starts, chord.finishes, chord));
//    extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, chord.finishes, chord));
  }
  if (typeof(noBeams) == "undefined" || !noBeams) {
    extras.push(beamifyButton(x, y, chord));
  }
  highlightTabWord(chord.starts,chord.finishes);
  buttonBox(set, x, y, extras);
}

function tidy_rhythms() {
	var newTC="";
	var inComment = false;
	var currTC=document.getElementById("code").value;
	var lines = currTC.split("\n");
	var currRS="";
	var outword = [];
		var outline = [];
	for(var i=0;i<lines.length;i++) {
		var theline = lines[i]; // Use this if the line is unaffected
		word = lines[i].split(" ");
		for(var j=0;j<word.length;j++) {
			var firstChar = word[j].charAt(0);
			var dotted = false;
			if(firstChar == "{") {
				inComment = true;
// logger.log("\tfirstChar: "+firstChar+" so now inComment!")
			}
			if((firstChar == "[")&&(!inComment)) { 
				alert("Cannot (yet) handle beams!!");
				return false;
			}
			var lastChar = word[j].charAt(word[j].length-1);
			if((firstChar == "{")&&(lastChar == "}")) {
// logger.log("Special word! "+ theline)
				if(inComment) {
					outline.push(theline);	// Tabwords like "{^}"
					inComment = false;
					break;
				}
			}
			else if(lastChar == "}") {
				inComment = false;
// logger.log("\tlastChar: "+lastChar+" so now NOT inComment!")
				outword.push(word[j]);	
				continue;	
			}		
			if(inComment) {
// logger.log("\tIn Comment, so skipping word "+word[j]);
				outword.push(word[j]);	
				continue;
			}
			if(word[j].charAt(1)==".") dotted = true;
			var rsloc = rhythmFlags.indexOf(firstChar);
			if(rsloc != -1) { // it's a rhythm sign
				if(rhythmFlags[rsloc] == currRS.charAt(0)) {
					if(dotted && (currRS.charAt(1)==".")) {
						word[j] = word[j].substring(2);
					}
					else if(!dotted && (currRS.charAt(1)!=".")){
						word[j] = word[j].substring(1);
					}
				}
				currRS = rhythmFlags[rsloc];
				if(dotted) currRS += "."
			}
			if (word[j].charAt(0) == "|") currRS = "";
			outword.push(word[j]);
		}
		var theline = outword.join(" ");
		outword.length=0;
// logger.log("\tNew line: "+theline);
		outline.push(theline);
// logger.log("Input line "+ i +": outline: "+outline.length)
		theline.length = 0;
	}
// logger.log(outline)
	document.getElementById("code").value = outline.join("\n");
	refresh();
}

function augment_rhythms() {
	var newTC="";
	var inComment = false;
	var currTC=document.getElementById("code").value;
	var lines = currTC.split("\n");
	var outword = [];
		var outline = [];
	for(var i=0;i<lines.length;i++) {
		var theline = lines[i]; // Use this if the line is unaffected
		word = lines[i].split(" ");
		for(var j=0;j<word.length;j++) {
			var firstChar = word[j].charAt(0);
			if(firstChar == "{") {
				inComment = true;
			}
			if((firstChar == "[")&&(!inComment)) { 
				alert("Cannot (yet) handle beams!!");
				return false;
			}
			var lastChar = word[j].charAt(word[j].length-1);
			if((firstChar == "{")&&(lastChar == "}")) {
				if(inComment) {
					outline.push(theline);	// Tabwords like "{^}"
					inComment = false;
					break;
				}
			}
			else if(lastChar == "}") {
				inComment = false;
				outword.push(word[j]);	
				continue;	
			}		
			if(inComment) {
				outword.push(word[j]);	
				continue;
			}
			var rsloc = rhythmFlags.indexOf(firstChar);
			if((rsloc == rhythmFlags.length-3)) { // already at max value so bail out!
			// the -3 is because we have both "B" and "F" in the list ("F" is not really an rs!)
				alert("Cannot augment all rhythm signs!!");
				return false;
			}
			if(rsloc != -1) { // it's a rhythm sign
				if(rhythmFlags[rsloc] == word[j].charAt(0)) {
					var rest=word[j].substring(1);
					word[j] = rhythmFlags[rsloc+1] + rest;
				}
			}
			outword.push(word[j]);
		}
		var theline = outword.join(" ");
		outword.length=0;
		outline.push(theline);
		theline.length = 0;
	}
	document.getElementById("code").value = outline.join("\n");
	refresh();
}

function diminish_rhythms() {
	var newTC="";
	var inComment = false;
	var currTC=document.getElementById("code").value;
	var lines = currTC.split("\n");
	var outword = [];
		var outline = [];
	for(var i=0;i<lines.length;i++) {
		var theline = lines[i]; // Use this if the line is unaffected
		word = lines[i].split(" ");
		for(var j=0;j<word.length;j++) {
			var firstChar = word[j].charAt(0);
			if(firstChar == "{") {
				inComment = true;
			}
			if((firstChar == "[")&&(!inComment)) { 
				alert("Cannot (yet) handle beams!!");
				return false;
			}
			var lastChar = word[j].charAt(word[j].length-1);
			if((firstChar == "{")&&(lastChar == "}")) {
				if(inComment) {
					outline.push(theline);	// Tabwords like "{^}"
					inComment = false;
					break;
				}
			}
			else if(lastChar == "}") {
				inComment = false;
				outword.push(word[j]);	
				continue;	
			}		
			if(inComment) {
				outword.push(word[j]);	
				continue;
			}
			var rsloc = rhythmFlags.indexOf(firstChar);
 			if((firstChar == "Z")) { // already at min value so bail out!
				alert("Cannot diminish all rhythm signs!!");
				return false;
			}
			if(rsloc != -1) { // it's a rhythm sign
				if(rhythmFlags[rsloc] == word[j].charAt(0)) {
					var rest=word[j].substring(1);
					word[j] = rhythmFlags[rsloc-1] + rest;
				}
			}
			outword.push(word[j]);
		}
		var theline = outword.join(" ");
		outword.length=0;
		outline.push(theline);
		theline.length = 0;
	}
	document.getElementById("code").value = outline.join("\n");
	refresh();
}

function tcShow() {
  if (document.getElementById('tcspan')) {
    $(document.getElementById('tcspan')).show();
    document.getElementById('tcspan').style.width = Math.max(parseInt(TabCodeDocument.SVG.style.width), 250) + 'px';
    $(document.getElementById('tcshow')).hide();
    $(document.getElementById('tchide')).show();
  }
}

function tcHide() {
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('tcshow')).show();
    $(document.getElementById('tchide')).hide();
}