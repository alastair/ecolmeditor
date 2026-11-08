function FrUpCourse(note, course){
  return courseChange(note, course, -1, true);
}

function FrDownCourse(note, course){
  return courseChange(note, course, 1, false);
}

function ItUpCourse(note, course){
  return courseChange(note, course, -1, false);
}

function ItDownCourse(note, course){
  return courseChange(note, course, 1, true);
}

function FrUpCourseKeepPitch(note, course){
  return courseChangeSamePitch(note, course, -1, true);
}
function FrDownCourseKeepPitch(note, course){
  return courseChangeSamePitch(note, course, 1, false);
}

function ItUpCourseKeepPitch(note, course){
  return courseChangeSamePitch(note, course, -1, false);
}
function ItDownCourseKeepPitch(note, course){
  return courseChangeSamePitch(note, course, 1, true);
}

function courseChange(note, course, delta, up) {
  var button = imageButton((up ? "upCourse" : "downCourse"),
                           function(index, from, code, delta){
                             return function(){
                               TabCodeDocument.parameters.history.add(new Modify(index, from, from+delta, code, "course"));
                               clearButtons();
                             };
                           }(note.starts+1, course, document.getElementById('code'), delta),
                          (up ? "upcourse.png" : "downcourse.png"), false);
  // button.style.top = y;
  // button.style.left = x;
//  button.style.position = "fixed";
//  button.style.zIndex = 12;
  return button;
}

function courseChangeSamePitch(note, course, delta, up) {
  var tuning = curTuning; // FIXME: assume fixed tuning ;-)
  var newcourse = course + delta;

//  var newFretPosition = letterPitch(note.fret) + tuning[course] - tuning[newcourse];
//  TC 5Apr21: not sure why, but courses were until now all out by one, so ...
  var newFretPosition = letterPitch(note.fret) + tuning[course-1] - tuning[newcourse-1];
  if(newFretPosition < 0 || newFretPosition > 24){
    return false; // Or octave transpose?
  }
  var newFret = "abcdefghiklmnopqrstuwxyz".charAt(newFretPosition);  
  var button = imageButton((up ? "upCourse" : "downCourse"),
                           function(index, from, to, code){
                             return function(){
                               TabCodeDocument.parameters.history.add(new Modify(index, from, to, code, "course"));
                               clearButtons();
                             };
                           }(note.starts, note.fret + course, 
                             newFret + newcourse, 
                             document.getElementById('code'), delta),
                          (up ? "noteup.png" : "notedown.png"), false);
  // button.style.top = y;
  // button.style.left = x;
//  button.style.position = "fixed";
//  button.style.zIndex = 12;
  return button;
}

// function cancelButton(x, y){
//   var button = textButton("cancelButton", clearButtons, "Cancel", "Normal 12px sans-serif", false);
//   button.style.top = y;
//   button.style.left = x;
//   button.style.position = "fixed";
//   button.style.zIndex = 12;
//   return button;
// }

function deleteButton(x, y, start, end, type){
  var button = textButton("Delete", "textbutton",
                          function(start, end, code, type){
                            return function() {
                              TabCodeDocument.parameters.history.add(new Modify(start, code.value.substring(start, end), "", code, type));
                              clearButtons();
                            };
                          }(start, end, document.getElementById('code'), type),
                          "Delete", false);
//  button.style.zIndex = 12;
  return button;
}

function nchars(char, n) {
  return new Array(n+1).join(char);
}

function deleteBeamedChord(start, end, chord){
  // This is for a chord that is connected to a beam group, 
  // so its deletion has indirect effects
  var group = chord.beamGroup;
  var n = group.length;
  var mods = [];
  var code = document.getElementById('code');
  var found = 0;
  var word, starti, from, to;
  for(var i=n-1; i>=0; i--){
    // For each member of the beamed group:
    word = group[i];
    starti = word.starts;
    // The bit to change should be the rhythm sign, 
    // except in the case of the chord to be deleted entirely
    from = code.value.substring(word.starts, 
      word.rhythmFinishes - (word.dotted ? 1 : 0));
    to = "";
    // Prev and next exclude the chord to be deleted
    prev = i ? group[i-1] : false;
    if(prev===chord) prev = i-1 ? group[i-2] : false; 
    next = i==n-1 ? false : group[i+1];
    if(next===chord) next = i==n-2 ? false : group[i+2]; 
    if(word===chord){
      // Delete whole chord
      starti = start;
      from = code.value.substring(start, end);
    } else if(n==2){
      // The beam group will, after the deletion,
      // only have one member. Convert it to a flag,
      // or this will make no sense.
      to = rhythmFlags.charAt(6-word.beamed);
    } else if(!next){
      // Last element (so any partial beams must point left)
      if(word.beamed > prev.beamed){
        to = nchars("[", word.beamed-prev.beamed);
      }
      to += nchars("]", word.beamed);
    } else {
      // For now, partial beams point right
      if(word.beamed>next.beamed){
        to = nchars("]", word.beamed-next.beamed);
      }
      var opens = word.beamed;
      if(prev) opens -= prev.rbeams;
      to += nchars("[", Math.max(0, opens));
    }
    mods.push([starti, from, to]);
  }
  TabCodeDocument.parameters.history.add(new compoundModify(mods, code,     "deleteBeamedGroup"));
}

function beamifyWords(words){
  var mods = [];
  var start, from, to, word;
  var n = words.length;
  var code = document.getElementById('code');
  var beams = words.map(function(el){
    if(el.beamed) {
      return el.beamed;
    } else if (el.flag) {
      return 6-rhythmFlags.indexOf(el.flag);
    } else {
      var pos = TabCodeDocument.TabWords.indexOf(el);
      var flag = getApplicableFlag(pos);
      return 6-rhythmFlags.indexOf(flag);
    }});
  for(var i=n-1; i>=0; i--){
    // Apply beaming to all words. Start at the end so that 
    // offsets remain correct after each change.
    word = words[i];
    start = words[i].starts;
    // end *before* any dots (no need to change those)
    from = code.value.substring(start, 
      word.rhythmFinishes - (word.dotted ? 1 : 0));
    if(i===n-1){
      // Last element, so any partial beams point left
      to = nchars("[", Math.max(0, beams[i] - beams[i-1]))
        +nchars("]", beams[i]);
    } else {
      to = nchars("]", Math.max(0, beams[i] - beams[i+1]))
        + nchars("[", Math.max(0, beams[i] - (i ? beams[i-1] : 0)));
    }
    mods.push([start, from, to]);
  }
  TabCodeDocument.parameters.history.add(
    new compoundModify(mods, code, "convertToBeams"));
}

function deleteChordButton(x, y, start, end, chord){
  var button;
  if(chord.beamGroup.length){
    button = textButton("DeleteBeamedChord", "textbutton",
       function(start, end, chord){
         return function(){
           deleteBeamedChord(start, end, chord);
           clearButtons();
         }
       }(start, end, chord),
       "Delete Chord", false);
  } else {
    button = textButton("DeleteChord", "textbutton",
                          function(start, end, code){
                            return function() {
                              TabCodeDocument.parameters.history.add(new Modify(start, code.value.substring(start, end), "", code, "chord"));
                              clearButtons();
                            };
                          }(start, end, document.getElementById('code')),
                          "Delete Chord", false);
//  button.style.zIndex = 12;
  }
  return button;
}

function deleteToHereButton(x, y, start, end, chord){
  // FIXME: check beaming
  var button = textButton("DeleteToHere", "textbutton",
                      function(start, end, code){
                        return function(){
                          TabCodeDocument.parameters.history.add(new Modify(start, code.value.substring(start, end), "", code, "chord"));
                          clearButtons();
                        };
                      }(start, end, document.getElementById('code')),
                      "Delete to here", false);  
  return button;
}

function undotButton(x, y, index){
  var button = textButton("removeDot", "textbutton",
                          function(index, code){
                            return function() {
                              TabCodeDocument.parameters.history.add(new Modify(index, ".", "", code, 'Dot'));
                              clearButtons();
                            };
                          }(index, document.getElementById('code')),
                          "Remove dot", false);
//  button.style.zIndex = 12;
  return button;
}

function dotButton(x, y, index){
  var button = textButton("addDot", "textbutton",
                          function(index, code){
                            return function() {
                              TabCodeDocument.parameters.history.add(new Modify(index, "", ".", code, 'Dot'));
                              clearButtons();
                            };
                          }(index, document.getElementById('code')),
                          "Add dot", false);
//  button.style.zIndex = 12;
  return button;
}

function beamifyButton(x, y, chord){
  var button = textButton("beamify", "textbutton",
                          function(chord, code){
                            return function(){
                              if(chord.lbeams >0 || chord.rbeams>0){
                                return; // Should prob throw error
                              }
                              var words = TabCodeDocument.TabWords;
                              var index = words.indexOf(chord);
                              if(index===-1) return; // FIXME: shouldn't happen
                              group = [chord];
                              for(var i=index+1; i<words.length; i++){
                                if(words[i].tType==="Barline"){
                                  if(group.length==1) {
                                    clearButtons();
                                    return;
                                  } else break;
                                } else if(words[i].tType==="Chord"){
                                  if(words[i].beamed){
                                    // If someone opts for a beam group, they 
                                    // probably intend to have a beam group, so
                                    // lets convert the second thing too.
                                    // Here that means a complete beam group.
                                    if(group.length===1){
                                      for(var j=0; j<words[i].beamGroup.length; j++){
                                        group.push(words[i].beamGroup[j]);
                                      }
                                      break;
                                    } else break;
                                  } else if(words[i].flag){
                                    // Unless this is the second chord, 
                                    // probably best to stop here.
                                    if(group.length===1){
                                      group.push(words[i]);
                                    } else break;
                                  } else {
                                    // No explicit rhythm -- add to beam group
                                    group.push(words[i]);
                                  } 
                                }
                              }
                              beamifyWords(group);
//                               var from, to, beam, flag, opens, closes;
//                               if(index==-1){
//                                 return; // no result (should prob throw error)
//                               }
//                               from = chord.flag ? chord.flag : "";
//                               flag = chord.flag ? chord.flag : (getApplicableFlag(index) || "Q");
//                               opens = Math.max(0, 6-rhythmFlags.indexOf(chord.flag));
//                               if(index > 0 &&
//                                  words[index-1].tType == 'chord' &&
//                                  words[index-1].rbeams > 0){
//                                 opens -= words[index-1].rbeams;
//                               }
//                               for(var i=index+1; i<words.length; i++){
//                                 if(words[i].beamed){
//                                   closes = [words[i], words[i].rbeams - opens];
//                                   break;
//                                 }
//                               }
//                               TabCodeDocument.parameters.history.add(
//                                 new Modify(chord.starts,
//                                   from,
//                                   beamString(opens),
//                                   code, 'Beam'));
//                               if(closes){
//                                 TabCodeDocument.parameters.history.add(
//                                   new Modify(closes[0].starts,
//                                   TabCodeDocument.code.substring(closes[0].starts,closes[0].rhythmFinishes),
//                                   beamString(closes[1]),
//                                   code, 'Beam'));
//                               }
                              clearButtons();
                            };}(chord, document.getElementById('code')),
                          "Convert flags to beams", false);
//  button.style.zIndex = 12;
  return button;
}

function getApplicableFlag(index){
  for(var i= index; i>=0; i--){
    if(TabCodeDocument.TabWords[i].tType == 'Chord'){
      if(TabCodeDocument.TabWords[i].flag){
        return TabCodeDocument.TabWords[i].flag;
      } else if(TabCodeDocument.TabWords[i].beamed){
        return rhythmFlags.charAt(6-TabCodeDocument.TabWords[i].beamed);
      }
    }
  }
  return false;
}

function barlineButtonSet(w, y, word){
  var bcode, button, to;
  var i=0;
  var buttons = new Array(16);
  var noSel = Array.isArray(word);
  var codeEl = document.getElementById('code');
  var prefix = noSel && /\S/.exec(codeEl.value[word[0]-1]) ? " " : "";
  for(var lrepeat=0; lrepeat<2; lrepeat++){
    var sel = noSel ? false : (lrepeat ? word.lRepeat : !word.lrRepeat);
    for(var rrepeat=0; rrepeat<2; rrepeat++){
      sel = sel && (rrepeat ? word.rRepeat : !word.rRepeat);
      for(var dblbar=0; dblbar<2; dblbar++){
        sel = sel && (dblbar ? word.doubleBar : !word.doubleBar);
        for(var dashed=0; dashed<2; dashed++){
          sel = sel && (dashed ? word.dashed : !word.dashed);
          bcode = ""+lrepeat+rrepeat+dblbar+dashed;
          to = (lrepeat ? ":" : "") + "|" + (dblbar ? "|" : "")
                 + (dashed ? "=" : "") + (rrepeat ? ":" : "");
          if(noSel) to += " ";
          button = imageButton("b"+bcode,
            function(starts, from, to, code){
              return function(){
                TabCodeDocument.parameters.history.add(new Modify(starts, from, to, code, 'barline')); 
                clearButtons();};
              }(noSel ? word[0] : word.starts, noSel ? "" : word.code, prefix + to + (noSel ? " ":""), codeEl),
            locPrefix+"button_images/small/bar"+bcode+".png", sel);
//          button.style.position = "fixed";
//          button.zIndex = 30;
          buttons[i] = button;
          i++;
        }
      }
    }
  }
  return buttons;
}

function rhythmButtonSet(x, y, word){
  clearButtons();
  var selected = word && !Array.isArray(word) && word.flag;
  if(Array.isArray(word)) {
    var prefix = (word[1] && " ") || "";
    var suffix = (word[2] && " ") || "";
  }
  var startX = x;
  var buttons = new Array(buttonRhythmFlags.length);
  var flag;
  var button;
  for(var i=0; i<buttonRhythmFlags.length; i++){
    flag = buttonRhythmFlags[i];
    if(Array.isArray(word)) {
      button = textButton(flag, "textbutton flag",
        function(starts, to, code) {
          return function(){
            TabCodeDocument.parameters.history.add(new Modify(starts, "", to, code, 'Flag'));
            clearButtons();};}(word[0], prefix+flag+suffix, document.getElementById('code')),
          flag, false);
    } else if(flag==selected){
      button = textButton(flag, "textbutton flag",
          function(){clearButtons();},
          flag, true);
    } else {
      button = textButton(flag,"textbutton flag",
        function(starts, from, to, code) {
          return function(){
            TabCodeDocument.parameters.history.add(new Modify(starts, from, to, code, 'Flag'));
            clearButtons();};
        }(word.starts, word.flag || "", flag, document.getElementById('code')),
          flag, false);
    }
//    button.style.position = "fixed";
//    button.style.left = x;
//    button.style.top = y;
//    button.style.zIndex = 12;
    x += parseInt(button.offsetWidth);
    if(x>900){
      x = startX;
      y += button.height;
    }
    buttons[i] = button;
  }
  if(selected){
    // Common OCR errors are mistaking a flag beam for a dot and vice versa, so E<=>Q.
    if(!word.dotted && selected != "F"){
      var alt = rhythmFlags[rhythmFlags.indexOf(selected)+1];
      button = textButton(alt+".", "textbutton flag",
        function(starts, from, to, code){
          return function(){
            TabCodeDocument.parameters.history.add(new Modify(starts, from, to, code, 'Flag'));
            clearButtons();
          };
        }(word.starts, word.flag || "", alt+".", document.getElementById('code')),
            alt+".", false);
      buttons.push(button);
    } else if(word.dotted && selected != "Z"){
      var alt = rhythmFlags[rhythmFlags.indexOf(selected)-1];
      button = textButton(alt, "textbutton flag",
        function(starts, from, to, code){
          return function(){
            TabCodeDocument.parameters.history.add(new Modify(starts, from, to, code, 'Flag'));
            clearButtons();
          };
        }(word.starts, word.flag+"." || "", alt, document.getElementById('code')),
            alt, false);
      buttons.push(button);
    }
  }
  return buttons;
}

function contextButtonSet(x, y, params){
  clearButtons();
  var selected = params.contextDur;
  var startX = x;
  var buttons = new Array(rhythmFlags.length);
  var flag;
  var button;
  for(var i=0; i<rhythmFlags.length; i++){
    flag = rhythmFlags[i];
    if(flag==selected){
      button = textButton(flag, "textbutton flag",
          function(){clearButtons();},
          flag, true);
    } else {
      button = textButton(flag,"textbutton flag",
        function(p, f) {
          return function(){
//            p.contextDur = f;
            TabCodeDocument.parameters.history.add(new replaceContextFlag(p, f));
            clearButtons();};
        }(params, flag),
          flag, false);
    }
    x += parseInt(button.offsetWidth);
    if(x>900){
      x = startX;
      y += button.height;
    }
    buttons[i] = button;
  }
  return buttons;
}

function italianTabSet(note){
  // If note isn't a note to be modified (i.e. this is an insert),
  // then it's an array of the course number, the offset for
  // insertion and whether a space is needed (for a new word)
  clearButtons();
  var selected = false;
  var prefix = false;
  var suffix = false;
  if(Array.isArray(note)){
    prefix = (note[2] && " ") || "";
    suffix = (note[3] && " ") || "";
  } else {
    selected = letterPitch(note.fret);
  }
  var buttons = new Array(24);
  var fret;
  var button;
//  for(var i=0; i<24; i++){
  for(var i=0; i<16; i++){
    if(!selected && selected !== 0) {
      // This is an insertion
      button = textButton("f-"+i,"Italian",
                          function(starts, to, code){
                            return function(){
                              TabCodeDocument.parameters.history.add(new Modify(starts, "", to, code, "fret"));
                              clearButtons();
                            };
                          }(note[1], prefix+"abcdefghiklmnopqrstuwxyz".charAt(i)+note[0]+suffix,
                            document.getElementById('code')),
                          i, false);
    } else if(i == selected){
      button = textButton("f-"+i, "Italian", function(){clearButtons();}, i, true);
    } else {
      button = textButton("f-"+i, "Italian",
                         function(index, from, to, code) {
                           return function(){
                             TabCodeDocument.parameters.history.add(new Modify(index, from, to, code, 'fret'));
                             clearButtons();};
                         }(note.starts, note.fret, "abcdefghiklmnopqrstuwxyz".charAt(i), document.getElementById('code')),
                         i, false);
    }
    buttons[i] = button;
  }
  if(!selected && selected !== 0){
    // Insert a spacer dash with a star
    buttons.push(textButton("f-star", "Italian",
      function(starts, to, code){
        return function(){
          TabCodeDocument.parameters.history.add(new Modify(starts, "", to, code, "star"));
          clearButtons();
        };
      }(note[1], prefix+"-"+note[0]+"*"+suffix,
         document.getElementById('code')),
      "*", false));
  }
  return buttons;
}

function frenchTabSet(note){
  // If note isn't a note to be modified (i.e. this is an insert),
  // then it's an array of the course number and the offset for
  // insertion
  clearButtons();
  var selected = false;
  var prefix = false;
  var suffix = false;
  if(!Array.isArray(note)){ // desperate hack
    selected = note.fret;
  } else {
    prefix = (note[2] && " ") || "";
    suffix = (note[3] && " ") || "";
  }
  // var buttons = new Array(tabletters.length);
  var buttons = new Array();
  var button;
  var fret;
  for(var i=0; i<tabletters.length; i++){
    fret = tabletters[i];
    if(fret === "j") continue;
    if (!selected){
    	// Tabfont has very bad metrics, causing weirdness in the dialog box, so use images instead
      if(TabCodeDocument.parameters.fontName=="Tabfont") {
      	if(i>15) continue; // forget ridiculously high frets for now
		 button = imageButton(fret,
			 function(starts, to, code){
			   return function(){
				TabCodeDocument.parameters.history.add(new Modify(starts, "", to, code, "fret"));
				clearButtons();};
			   }(note[1], prefix+fret+""+note[0]+suffix, document.getElementById('code')),
			 locPrefix+"button_images/tabfont_letters/small/"+fret+".png", false);
     }
      else {
		 button = textButton(fret, "French "+TabCodeDocument.parameters.fontName,
			 function(starts, to, code){
			   return function(){
				TabCodeDocument.parameters.history.add(new Modify(starts, "", to, code, "fret"));
				clearButtons();};
			   }(note[1], prefix+fret+""+note[0]+suffix, document.getElementById('code')),
			 fret, false);
		}
    } else if (fret == selected){
      button = textButton(fret,  "French "+TabCodeDocument.parameters.fontName, function(){clearButtons();}, fret, true);
    } else {

      if(TabCodeDocument.parameters.fontName=="Tabfont") {
      	if(i>15) continue; // forget ridiculously high frets for now
		 button = imageButton(fret,
			 function(index, from, to, code){
			   return function(){
				TabCodeDocument.parameters.history.add(new Modify(index, from, to, code, "fret"));
				clearButtons();};
//			   }(note[1], prefix+fret+""+note[0]+suffix, document.getElementById('code')),
			   }(note.starts, selected, fret, document.getElementById('code')),
			 locPrefix+"button_images/tabfont_letters/small/"+fret+".png", false);
     }
      else {
      button = textButton(fret,"French "+TabCodeDocument.parameters.fontName,
			function(index, from, to, code) {
			  return function(){
			    TabCodeDocument.parameters.history.add(new Modify(index, from, to, code, 'fret'));
			    clearButtons();};
			}(note.starts, selected, fret, document.getElementById('code')),
			fret, false);
	}
    
    }

    buttons.push(button);
  }
  if(!selected && selected !== 0){
    // Insert a spacer dash with a star
    buttons.push(textButton("f-star", "French",
      function(starts, to, code){
        return function(){
          TabCodeDocument.parameters.history.add(new Modify(starts, "", to, code, "star"));
          clearButtons();
        };
      }(note[1], prefix+"-"+note[0]+"*"+suffix,
         document.getElementById('code')),
      "*", false));
  }
  return buttons;
}

// function genericSelector(set, x, y, extras){
//   var panel = buttonFloat(set);
//   var height = 0;
//   var xpos = x;
//   document.getElementById('background').appendChild(panel);
//   for(var i=0; i<set.length; i++){
//     set[i].style.left = x;
//     set[i].style.top = y;
//     set[i].style.zIndex = 12;
//     height = Math.max(height, set[i].offsetHeight);
//     if(x>=900){
//       x = xpos;
//       y += height;
//       height = 0;
//     } else {
//       x += set[i].offsetWidth;
//     }
//   }
//   y += height;
//   x = xpos;
//   for(i=0; i<extras.length; i++){
//     extras[i].style.left = x;
//     extras[i].style.top = y;
//     panel.appendChild(extras[i]);
//     x+= extras[i].offsetWidth;
//   }
//   panel.appendChild(cancelButton(x, y));
// }

/////////////////////////////////////////////
///
// BEAMS
//
//

function beamTable(x, y, words){
  $(".beams").remove();
  var div = document.createElement('table');
  div.id = "buttonbox";
  var table = document.createElement('table');
  div.appendChild(table);
  document.body.appendChild(div);
  var rows = new Array(7);
  var row, cell, word, rowclasses="", lbeams, rbeams, cellclasses;
  // var start = Number(words[0]);
  // var finish = Number(words[1]);
  // var count = finish - start;
  // var cutwords = TabCodeDocument.TabWords.slice(start,finish);
  table.className = "beams";
  row = document.createElement('tr');
  cell = document.createElement('td');
  cell.colSpan = words.length +2;
  cell.className = "padding";
  row.appendChild(cell);
  table.appendChild(row);
  for(var i=0; i<6; i++){
    row = document.createElement('tr');
    row.id = "beamingRow"+i;
    if(i==0){
      row.className = "nobars";
    }
    rowclasses = rowClasses(i);
    // Spacer -- I know, but it's the easiest way at the moment FIXME
    cell = document.createElement('td');
    cell.className = "padding l";
    row.appendChild(cell);
    for(var j=0; j<words.length; j++){
      word = words[j];
      lbeams = word ? word.lbeams : 1;
      rbeams = word ? word.rbeams : 1;
      if(j>0){
        cell = document.createElement('td');
        cellclasses = "beam inrow"+i+" incol"+j + " "+"l";
        cell.id = "beamingCell"+i+"x"+j+"l";
        if(lbeams>=i && i>0){
          cellclasses += " beamed";
        }
        if(lbeams == i){
          cellclasses += " current";
        }
        cell.className = cellclasses+rowclasses;
        row.appendChild(cell);
      }
      cell = document.createElement('td');
      cellclasses = "beam inrow"+i+" incol"+j + " "+ "r" + (j==words.length-1 ? " rowend":"");
      cell.id = "beamingCell"+i+"x"+j+"r";
      if(rbeams>=i && i>0){
        cellclasses += " beamed";
      }
      if(rbeams == i){
        cellclasses += " current";
      }
      cell.className = cellclasses+rowclasses;
      row.appendChild(cell);
    }
    // Spacer -- I know, but it's the easiest way at the moment FIXME
    cell = document.createElement('td');
    cell.className = "padding r";
    row.appendChild(cell);
    table.appendChild(row);
  }
  row = DOMRow('beamdotrow', false);
  for(var j=0; j<words.length; j++){
    row.appendChild(DOMCell('blank', false, false));
    row.appendChild(DOMCell('dot'+(words[j].dotted ? ' dotted' : ' undotted'), 'dot'+j, 
      DOMSpan(false, false, " ")));
  }
  table.appendChild(row);
  table.style.top = y;
  table.style.left = x;
  table.style.position = "fixed";
  table.style.zIndex = 12;
  var button = textButton("okButton","okButton",
    function(words){
      return function() {
        finaliseBeaming(words);
        clearButtons();
      };
    }(words), "Ok", false);
  div.appendChild(button);
  button.style.zIndex = 12;
  button.style.position = "fixed";
  button.style.top = Number(table.offsetHeight) + 10 + y;
  button.style.left = 10 + x;
  var CB = cancelButton(10+x+ Number(button.offsetWidth), Number(table.offsetHeight) + 10+y);
  div.appendChild(CB);
  CB.style.zIndex = 12;
  CB.style.position = "fixed";
  CB.style.top = Number(table.offsetHeight) + 10 + y;
  CB.style.left = 40 + x+$(button).width();
  button = textButton("ClearBeams", "clearBeams", 
                      function(words){
                        return function(){
                          clearBeams(words);
                          clearButtons();
                        };
                      }(words), "Remove beams", false);
  div.appendChild(button);
  button.style.zIndex = 12;
  button.style.position = "fixed";
  button.style.top = 10 + CB.getBoundingClientRect().bottom;
  button.style.left = 10+x;
  
//  cancelButton.style.top = Number(table.offsetHeight) + 10;
//  cancelButton.st
//  $(table).show();
  $(".beam").click(
    function() {
      beamClick(this);
//      finaliseBeaming(words);
    });
  $(".beamdotrow td.dot").click(
    function(){
      $(this).toggleClass('dotted undotted');
    }
  );
  $(".beam").dblclick(
    function() {
      beamClick(this);
      finaliseBeaming(words);
      $(".beams").remove();
    });
}

function beamClick(object){
  var col = $(".incol"+columnNo(object));
  col = col.filter("."+LorR(object));
  col.removeClass("beamed current");
  var col2 = col.filter(".upto"+rowNo(object));
  col2.addClass("beamed");
  $(object).addClass("current");
}

function columnSpec(beamCell){
  return beamCell.id.split("x")[1];
}

function columnNo(beamCell){
  return parseInt(beamCell.id.split("x")[1].slice(0,-1));
}

function LorR(beamCell){
  return beamCell.id.slice(-1);
}

function rowNo(beamCell){
  return parseInt(beamCell.id.split("x")[0].slice(-1));
}

function beamString(n){
  var str = "";
  if (n<0){
    for(var i=0; i>n; i--){
      str+= "]";
    }
  } else if (n>0){
    for(var i=0; i<n; i++){
      str+= "[";
    }
  }
  return str;
}

function clearBeams(words){
  // Remove beams, and don't replace them
  var mods = new Array();
  var code = document.getElementById('code');
  for(var i=0; i<words.length; i++){
    var rf = words[i].rhythmFinishes;
    var oldflag = code.value.substring(words[i].starts, rf);
    mods.push([words[i].starts, oldflag, ""]);
  }
  if(mods.length) TabCodeDocument.parameters.history.add(new compoundModify(mods, code, "beam"));
};
function finaliseBeaming(words){
  var states = $(".current").get();
  var beamStates = new Array(states.length+1);
  var wordStates = new Array();
  var column, side, prev, opens, closes;
  beamStates[0] = 0;
//  beamStates[beamStates.length - 1] = 0;
  for(var i in states){
    column = columnNo(states[i]);
    side = LorR(states[i]);
    side = side == "l" ? 0 : 1;
    beamStates[column*2 + side] = rowNo(states[i]);
  }
  var currentWordState = "";
  var flag = false;
  for(i = 1; i<beamStates.length; i++){
    if(i<beamStates.length-1 && beamStates[i-1] == 0 && beamStates[i+1] == 0){
      // Convert to flag
      flag = true;
      currentWordState = rhythmFlags.charAt(6-beamStates[i]);
    } else if(i!=1 && beamStates[i-1]-beamStates[i-2]>0){ 
      // FIXME: use comparison directly rather than subtraction
      // Left-facing partial flag
      currentWordState = beamString(beamStates[i-1]-beamStates[i-2]);
    } else if (beamStates.length>i && beamStates[i+1] - beamStates[i]<0) {
      // right-facing partial flag
      currentWordState = beamString(beamStates[i+1]-beamStates[i]);
    }
    if(!flag) currentWordState += beamString(beamStates[i] - beamStates[i-1]);
    flag = false;
    i++;
    wordStates.push(currentWordState);
    currentWordState = "";
  }
//  document.getElementById('debug').innerHTML = "";
  var code = document.getElementById('code');
  var mods = new Array();
  var rf, oldflag, ws;
  for(i=wordStates.length-1; i>=0; i--){
    //FIXME: for now, leave dots alone
    rf = words[i].rhythmFinishes;
    // if(words[i].dotted) {
    //   rf -= 1;
    // }
    oldflag = code.value.substring(words[i].starts, rf);
    ws = wordStates[i];
    if($(document.getElementById('dot'+i)).hasClass("dotted")) ws+=".";
    if(wordStates[i] != code.value.substring(words[i].starts, rf)){
      mods.push([words[i].starts,
                 oldflag,
                 ws]);
    }
  }
  if(mods.length){
    TabCodeDocument.parameters.history.add(new compoundModify(mods, code, "beam"));
  }
  clearButtons();
}

function rowClasses(n){
  var rowclasses = "";
  if(n>0){
    for(var i=6; i>=n; i--){
      rowclasses += " upto"+i;
    }
  }
  return rowclasses;
}

function insertionButtons (tabtype, insertionPoint, vpos, x, y){
  whatToInsertSet(tabtype, insertionPoint, vpos, x, y);
}

function whatToInsertSet(tabtype, insertionPoint, vpos, x, y){
  var buttons = new Array();
  var button;
  if(vpos==0){
    // Rhythm flag
    button = textButton("flag-option", "Flag-Option",
                            function(tabtype, insertionPoint, x, y){
                              return function(){
                                clearButtons();
                                insertionButtonsRhythm(insertionPoint, x, y);
                              };
                            }(tabtype, insertionPoint, x, y),
                            "Add Chord", false);
  } else if (vpos<=lines){
    // Main note
    button = textButton("note-option", "Note-Option",
                            function(tabtype, insertionPoint, vpos, x, y){
                              return function(){
                                clearButtons();
                                insertionButtonsMain(tabtype, insertionPoint, vpos, x, y);
                              };
                            }(tabtype, insertionPoint, vpos, x, y),
                            "Add Chord", false);
  } else {
    // Bass note
    button = textButton("note-option", "Note-Option",
                            function(tabtype, insertionPoint, x, y){
                              return function(){
                                clearButtons();
                                insertionButtonsBass(tabtype, insertionPoint, x, y);
                              };
                            }(tabtype, insertionPoint, x, y),
                            "Add Chord", false);
  }
  buttons.push(button);
  button = textButton("barline-option", "Barline-option",
                     function(insertionPoint, x, y){
                       return function(){
                         clearButtons();
                         insertionButtonsBarlines(insertionPoint, x, y);
                       };
                     }(insertionPoint, x, y),
                     "Add Barline");
  buttons.push(button);
  button = textButton("meter-option", "Meter-option",
                     function(insertionPoint, x, y){
                       return function(){
                         clearButtons();
                         metricalNewButtonBox(insertionPoint, x, y);
                       };
                     }(insertionPoint, x, y),
                     "Add Meter");
  buttons.push(button);
  for(var b=0; b<breakOptions.length; b++){
    button = textButton(breakOptions[b]+"-option", breakOptions[b]+"-option",
                       function(insertionPoint, breakType, code){
                         return function(){
                           clearButtons();
                           TabCodeDocument.parameters.history.add(new Modify(insertionPoint, "", 
                             breakTypes[breakType]+"\n", code, breakType));
                         };
                       }(insertionPoint, breakOptions[b], document.getElementById('code')),
                       "New "+breakOptions[b]);
    buttons.push(button);
  }
  buttonBox(buttons, x, y, []);
}

function insertionButtonsRhythm(ins, x, y){
  rhythmFlagSelector(x, y, [ins, /\S/.exec(document.getElementById('code').value[ins-1]), true], undefined, true);
}

function insertionButtonsMain(type, ins, fret, x, y){
  if(type=="Italian"){
    buttonBox(italianTabSet([7-fret, ins, /\S/.exec(document.getElementById('code').value[ins-1]), true]), x, y, []);
  } else {
    buttonBox(frenchTabSet([fret, ins, /\S/.exec(document.getElementById('code').value[ins-1]), true]), x, y, []);
  }
}

function insertionButtonsBarlines(ins, x, y){
  buttonBox(barlineButtonSet(0, 0, [ins, false, true]), x, y, []);
}

function breakSelector(x, y, b){
  // Delete is the only option
  buttonBox([], x, y, [deleteButton(x, y, b[1], b[2], "pieceBreak")]);
}

function metricalSet(mobject, i, j, extend, index){
  // i and j are offsets to the relevant component of the Replaces
  // Metre object. Index is a number iff replaces is false and
  // indicates the location of an insertion. Extend is true if the
  // symbol is to be added to an exiting metre object.
  clearButtons();
  var selected = false;
  var starti = false;
  var prev;
  var from = "";
  var prefix = "";
  var suffix = "";
  if(index || index === 0){
    // This is an insertion, so we need an extra space
    starti = index+1;
    if( /\S/.exec(document.getElementById('code').value[index])){
      prefix +=" ";
    }
    prefix += "M(";
    suffix = ") ";
  } else if (extend){
    from = "";
    switch(extend){
      case "before":
        starti = mobject.componentStart(i, 0);
        suffix = ";";
        break;
      case "after":
        // Find which component this follows
        var prevj = mobject.components[i].length-1;
        prev = mobject.components[i][prevj];
        starti = mobject.componentStart(i, prevj)+prev.length;
        prefix = ";";
        break;
      case "above":
        starti = mobject.componentStart(i,j);
        suffix = ":";
        break;
      case "below":
        prev = mobject.components[i][j];
        starti = mobject.componentStart(i,j)+prev.length;
        prefix = ":";
    }
  } else {
    selected = mobject.components[i][j];
    from = mobject.components[i][j];
    starti = mobject.componentStart(i, j);
  }
  var buttons = new Array(tsbasics.length);
  var sign, button, signtext;
  for(var b=0; b<tsbasics.length; b++){
    sign = tsbasics[b];
    signtext = sign.length>1 ? sign[1] : sign[0];
    button = textButton("meterbutton-"+sign[0], 
      "textbutton meter "+(sign.length>2 ? sign[2] : ""), 
      sign[0] == selected ?
        function(){ clearButtons(); } :
        function(starts, from, to, code){
          return function(){
            TabCodeDocument.parameters.history.add(
              new Modify(starts, from, to, code, 'meter'));
            clearButtons();
          };
        }(starti, from, prefix+sign[0]+suffix, document.getElementById('code')),
        signtext, sign[0]==selected);
    buttons[b] = button;
  }
  return buttons;
}

function TSCDeleteButton(ts, i, j){
  // Takes component specifiers i, j and removes those items from
  // mobject. This is a little complicated, because:
  /// 1. When there is only one component, this should remove the
  /// tabword
  // 
  /// 2. When there is only one component in the column, the relevant
  /// ; should be removed (the one preceding the last column, or the
  /// ; one following any other column)
  // 
  /// 3. When one of two in a column is removed, the : between them
  /// should be removed
  var start, end;
  if(!i && !j && ts.components.length == 1 && ts.components[i].length == 1){
    // remove *everything*
    start = ts.starts;
    end = ts.finishes;
  } else if (ts.components[i].length == 1) {
    // The column must be removed (including ";")
    if(ts.components.length == i+1){
      // There is no following column (so remove preceding sign)
      start = ts.starts + ts.code.lastIndexOf(";", ts.componentStart(i, j) - ts.starts);
      end = ts.starts + ts.code.lastIndexOf(")");
    } else {
      // Remove up to and including next ";"
      start = ts.componentStart(i, j);
      end = ts.componentStart(i+1, 0);
    }
  } else {
    // Must be two items in the column. Remove this item and the
    // separator
    var compStarts = ts.componentStart(i, j);
    if(j>0){
      // remove preceding :
      start = ts.starts + ts.code.lastIndexOf(":", compStarts - ts.starts);
      end = compStarts+ts.components[i][j].length;
    } else {
      // remove following :
      start = compStarts;
      end = ts.starts+ts.code.indexOf(":", compStarts - ts.starts)+1;
    }
  }
  return deleteButton(0, 0, start, end, "TimeSignatureComponent");
}

function metricalModButtonBox(mobject, i, j, x, y){
  buttonBox(metricalSet(mobject, i, j, false, false), x, y, [TSCDeleteButton(mobject, i, j)]);
}

function metricalInsButtonBox(mobject, i, j, place, x, y){
  buttonBox(metricalSet(mobject, i, j, place, false), x, y, []);
}
function metricalNewButtonBox(index, x, y){
  buttonBox(metricalSet(false, false, false, false, index-1), x, y, []);
}
