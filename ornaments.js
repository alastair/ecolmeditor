function ShorthandExtra(character){
	switch (character){
	  case ",":
		  return new backfall(1, 5);
	  case "<":
	  case "u":
		  return new forefall2(4);
	  case "#":
      return new bebung1(7);
	  case "x":
      return new martellement(3);
	  case "~":
      return new bebung2(7);
// 		  return new forefall1(7);
	  case ":":
      return new dotFingering(2, 7);
	  case "!":
      return new thumbLine(7);
    case "*":
      return new starTenuto(0);
	  case "-":
	  case '"':
		  return false;
    default:
      return false;
	};
}

function xPosDelta(pos){
	// given an ornament position code, return the x-offset tight to the symbol
	switch(pos){
		case 1:
		case 4:
		case 6:
			return 0;
		case 2:
		case 7:
			return ld / 2;
		case 3:
		case 5:
		case 8:
			return 3 * ld / 4;
	}
}

function yPosDelta(pos){
	// given an ornament position code, return the y-offset tight to the symbol
	switch(pos){
		case 1:
		case 2:
		case 3:
			return 0;
		case 4:
		case 5:
			return ld/2;
		case 6:
		case 7:
		case 8:
			return ld;
	}
}

function xStart(pos, width){
	// given an ornament position code, return the x-offset of the centre
	switch(pos){
		case 1:
		case 4:
		case 6:
			return - ld / 2 - width;
		case 2:
		case 7:
			return ld / 2 - width;
		case 3:
		case 5:
		case 8:
			return 3 * ld / 2 - width;
	}
}

function yStart(pos, height){
	// given an ornament position code, return the x-offset of the centre
	switch(pos){
		case 1:
		case 2:
		case 3:
			return -ld + height;
		case 4:
		case 5:
			return height;
		case 6:
		case 7:
		case 8:
			return ld + height;
	}
}


function ParseFullExtra(code, note) {
	var limit = code.length - 1;
	var i=0;
	if(i>limit){
		return false;
	}
	var curchar = code.charAt(i);
	if(curchar == "O"){
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		var type = curchar;
		var subtype = 0; //default
		var position = false;
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		if(curchar != ":" && curchar != ")"){
			subtype = Number(curchar);
			i++;
			if(i>limit) return false;
			curchar = code.charAt(i);
		}
		if(curchar == ":") {
			i++;
			if(i>limit) return getOrnament(type, subtype, false);
			curchar = code.charAt(i);
			if(Number(curchar))
				position = Number(curchar);
		}
		return getOrnament(type, subtype, position);
	} else
	 if(curchar == "F") {
		var finger = false;
		var position = false;
    var hand = false;
    var obj;
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		if(curchar == "l" || curchar == "r"){
			// could keep this info, but it makes no difference to
			// display
      hand = curchar;
			i++;
			if(i>limit) return false;
			curchar = code.charAt(i);
		}
		if(curchar == "."){
			// dot is a special case
			finger = 0;
			while (curchar == "."){
				finger++;
				i++;
				if(i>limit) return new dotFingering(finger, 7);
				curchar = code.charAt(i);
			}
			obj = new dotFingering(finger, 7);
		} else if(curchar == "1" || curchar == "2" ||
				  curchar == "3" || curchar == "4") {
			obj = new numberFingering(curchar, 3);
		} else {
			obj = new symbolFingering(curchar, 7);
		}
    if(hand) obj.hand = hand;
    return obj;
	}  else
	 if(curchar == "S") {
		var position = false;
		var obj;
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		if(curchar == "d" || curchar == "u"){
			// could keep this info, but it makes no difference to
			// display
			direction = curchar;
			i++;
			if(i>limit) return false;
// 			curchar = code.charAt(i);
		}
		else direction = "u";
		obj = new SepareeLine(direction)
		return obj;
	}  else	
	 if(curchar == "E") {
		// Ensemble line

    let line, id;
		i++;
		curchar = code.charAt(i);
		if(i>=limit) {
 			line = new EnsembleLine(code);
			line.startNote = note;
			return line;
		}
	} else
	 if(curchar == "C") {

    let line, id;
		i++;
		if(i>=limit) {
			// this is a straight line to the next symbol (C)
			line = new ConnectingLine(code, false);
			line.startNote = note;
			return line;
		}
		curchar = code.charAt(i);
		if(curchar==='-'){
			// Retrieve existing line – we're closing it now
			i++;
			if(i>=limit) return false;
			id = code.substr(i).match(/^[0-9]+/);
			if(id){
				// retrieve line from Tablature lines array;
				line = TabCodeDocument.numberedLines[Number(id[0])-1];
				if(!line) {
					console.log("Close without opening for line number", id);
					return;
				}
				line.endNote = note;
				line.endCode = code;
				i += id[0].length;
				if(i>=limit) return line;
				// Get Position
				i++;
				if(i>=limit) return line;
				curchar = code.charAt(i);
				if(isNaN(Number(curchar))) return line;
				line.endPosition = Number(curchar);
				return line;
			}
		} else if(curchar==='d' || curchar==='u'){
			line = new ConnectingLine(code, false);
			line.startNote = note;
			line.direction = curchar;
			return line;
		} else {
			// Make new line
			// i++;
			// if(i>limit) return false;
			id = code.substr(i).match(/^[0-9]+/);
			if(id){
				// retrieve line from Tablature lines array;
				line = new ConnectingLine(code, Number(id[0])-1);
				line.startNote = note;
				// get direction & Position
				i += id[0].length;
				if(i>=limit) return line;
				// Get Position
				if(code.charAt(i) !==':') console.log("Broken connecting line "+code+" at char "+i);
				i++;
				if(i>limit) {
					return line;
				}
				curchar = code.charAt(i);
				if(curchar==='-'){
					line.direction="d";
					i+=2;
					if(i>=limit) return line;
					curchar = code.charAt(i);
				} else if (curchar==='d' || curchar==='u'){
					line.direction = curchar;
					i++;
					curchar = code.charAt(i);
				} else if (i<limit-1){
					line.direction="u";
					i++;
					curchar = code.charAt(i);
				} 
				if(i>=limit) return line;
				if(/^[1-8]+/.test(curchar)) line.startPosition = Number(curchar);
				return line;
			}
		}
		if(curchar == "l" || curchar == "r"){
			// could keep this info, but it makes no difference to
			// display
      hand = curchar;
			i++;
			if(i>limit) return false;
			curchar = code.charAt(i);
		}
		if(curchar == "."){
			// dot is a special case
			finger = 0;
			while (curchar == "."){
				finger++;
				i++;
				if(i>limit) return new dotFingering(finger, 7);
				curchar = code.charAt(i);
			}
			obj = new dotFingering(finger, 7);
		} else if(curchar == "1" || curchar == "2" ||
				  curchar == "3" || curchar == "4") {
			obj = new numberFingering(curchar, 3);
		} else {
			obj = new symbolFingering(curchar, 7);
		}
    if(hand) obj.hand = hand;
    return obj;
	} else

	 if(curchar == "T") {
		// Text item; could be free text like "(T+:Free text!\nHello there!)", or special chars like petite-reprise sign "(T+:\R)" or fermata "(T+:\f)"
		// NB No styling of text at all yet; also, no fine tuning of position yet

		var position = false;
		var obj;
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		if(curchar == "+" || curchar == "-" || curchar == "="){
			where = curchar;
			i++;
			if(i>limit) return false;
		}
		else direction = "+";
		var text = code.slice(3,-1);
		obj = new TextItem(text, where);//where = above (+) or below (-) staff or both (=)
		return obj;
	}	
	return false;
}

function TextItem(text, where) {

  this.position = false;
  this.nullfret = false;
  this.tType = false;
  this.eType = "textitem";
  this.type = "TextItem";
  this.dx = function (){
    // FIXME: ignoring this.position
//     if(this.nullfret) {
//       return 0;
//     } else if (this.tType == "Italian"){
//       return (this.count-1) * -2 + 2.5;
//     } else {
//       return (this.count-1) * -3.5 + 2.5;
//     }
  	return 0;
  };
  this.dy = function (){

		if(this.nullfret) {
		  return 0;
		} else if (this.tType == "Italian"){
		  return 6;
		} else {
		  return -16;
		}
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.textString = function(){
    return text; // but need to parse for special chars, etc. \R, \F, \n within string
  };
//   logger.log("text is "+this.textString())
  this.htmlObj = function(){
    return DOMDiv("textitem", "textitemselector", this.textString());
  };
  this.TCString = function(){
    return "(T"+where+":"+text+")";
  };
/*
  this.getNextNoteInChord = function(startNote) {
	var ourNote = false
	for(p=startNote.course+1;p<6;p++) {
		var theNote = startNote.chord.mainCourses[p];
		if(theNote) {
			ourNote = theNote;
// 			logger.log("Next note at time "+startNote.chord.startTime+" is "+theNote.fret+(theNote.course+1))
			return ourNote;
		}
	}
	for(p=0;p<startNote.chord.bassCourses.length;p++) {
		var theNote = startNote.chord.bassCourses[p];
		if(theNote) {
			ourNote = theNote;
			return ourNote;
		}
	}
		if(!ourNote) {
			logger.log("No next note found in chord at time "+startNote.chord.startTime+"!")
		}
		return ourNote; // even if false
	}
	
this.notePoint = function(note, position){
	if((!note.ypos)&&(note.course == 5)) note.ypos = -30;
	return [note.xpos + xPosDelta(position),
		note.ypos + yPosDelta(position) + 4 + yOffset(note.course) - ld/2];
}*/
  this.draw = function(xpos, ypos, svgel, chord, text) {
	var petite_reprise = false;
	var fermata = false;
	var first_time = false;
	var second_time = false;
	var text_class = "sans-serif";
	var draw_text = this.textString();
	
	if(draw_text.substring(0,1)=="\\") {
// logger.log("Found backslash : "+draw_text);
		switch(draw_text.substring(1,2)) {
			case "R":
				petite_reprise = true;
				text_class = "tab petite-reprise";
				draw_text = "R";
				break;
			case "f":
				fermata = true;
				text_class = "tab fermata";
				draw_text = "F"
				break;
			case "1":
			case "2":
				first_time = true;
				draw_text = draw_text.substring(1); //chop off backslash - weirdly!
				draw_text += ".";
				break;
		}
	}
	else {
		text_class = "sans-serif";
		draw_text = this.textString();
	}
	
	var drawy = yOffset(0) + cury; 
	var placex = xpos + this.dx();
	var do_twice = false;
	var invert = false;
	var extratext = "";
	var style = "";
	switch(where) {
		case "-":
			drawy += (ld * 6) + 48; // Below staff and bass-notes
			if(fermata) invert = true;
			break;
		case "+":
			drawy -= 36; // Above staff, beams and rhythm-signs
			break;
		case "=":
			do_twice = true; // Recursive?
			drawy = drawy - 36;
// 			extratext = " above";
			break;
	}
	
	var el = svgText(svgel, placex, drawy+this.dy(), "extra textitem "+text_class, 
		false, style, draw_text, invert);
	$(el).data("word", chord); // is this right?
	if(do_twice) { 
		drawy = yOffset(0) + cury + (ld * 6) + 48; // Below staff and bass-notes;
		if(fermata == true){
			placex += 8;
			el = svgText(svgel, placex, drawy+this.dy(),
				"extra textitem "+text_class + " invert", 
				false, style, draw_text, true);
			fermata = false;
		}
		else {
			el = svgText(svgel, placex, drawy+this.dy(),
				"extra textitem "+text_class, 
				false, style, draw_text, false);
		}
		do_twice = false;
	}
  };
}

function SepareeLine(direction) {
  // FIXME: Crazy constants, magic numbers

  this.position = 7;
  this.nullfret = false;
  this.tType = false;
  this.eType = "separeeline";
  this.type = "SepareeLine";
  this.dx = function (){
    // FIXME: ignoring this.position
//     if(this.nullfret) {
//       return 0;
//     } else if (this.tType == "Italian"){
//       return (this.count-1) * -2 + 2.5;
//     } else {
//       return (this.count-1) * -3.5 + 2.5;
//     }
  	return 0;
  };
  this.dy = function (){

		if(this.nullfret) {
		  return 0;
		} else if (this.tType == "Italian"){
		  return 6;
		} else {
		  return -16;
		}
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.textString = function(){
    return "/";
  };
  this.htmlObj = function(){
    return DOMDiv("separeeline", "seplineselector", this.textString());
  };
  this.TCString = function(){
    if(direction == "d") return "(Sd)";
    else return "(S)";
  };
  this.getNextNoteInChord = function(startNote) {
	var ourNote = false
	for(p=startNote.course+1;p<6;p++) {
		var theNote = startNote.chord.mainCourses[p];
		if(theNote) {
			ourNote = theNote;
// 			logger.log("Next note at time "+startNote.chord.startTime+" is "+theNote.fret+(theNote.course+1))
			return ourNote;
		}
	}
	for(p=0;p<startNote.chord.bassCourses.length;p++) {
		var theNote = startNote.chord.bassCourses[p];
		if(theNote) {
			ourNote = theNote;
			return ourNote;
		}
	}
		if(!ourNote) {
			logger.log("No next note found in chord at time "+startNote.chord.startTime+"!")
		}
		return ourNote; // even if false
	}
this.notePoint = function(note, position){
	if((!note.ypos)&&(note.course == 5)) note.ypos = -30;
	return [note.xpos + xPosDelta(position),
		note.ypos + yPosDelta(position) + 4 + yOffset(note.course) - ld/2];
}
this.draw = function(xpos, ypos, svgel, note) {
		if(note && note.xpos) {
			let firstPoint = this.notePoint(note, 7); // just under main note
			let nextNote = this.getNextNoteInChord(note);
			let topy = firstPoint[1];
			if(nextNote.tType=="BassNote") var coursediff = 5 - note.course; //crude!!			
			else var coursediff = nextNote.course - note.course;
			if(coursediff > 1) var boty = firstPoint[1] + (coursediff*ld)/2 + ld/2
			else var boty = firstPoint[1] + (coursediff*ld);
			if(note.course == 5) {
				boty += ld;
				if(nextNote.tType=="BassNote") nextNote.chord.bass_yshift = ld/2;
			}
			else  {
				nextNote.chord.bass_yshift = 0;
			}
			if(note.course == 4) {
				if(nextNote.tType=="BassNote") boty += ld/2;
			}
 			let drawy = boty;
	
			this.tType = curTabType;
			if(direction == "d") {
				var el = svgLine(svgel, xpos + this.dx()-4, drawy-(ld/2)+this.dy(),xpos + 16 + this.dx(), drawy+(ld/2)-6+this.dy(),  "extra separeeline", 
					"");
				}
			else {
				// Surely an svgLine would be better here, as above ??
				var el = svgText(svgel, xpos + this.dx(), drawy+this.dy(), "extra separeeline", 
					false, false, this.textString());
				}
			$(el).data("word", note);
		}
	};
}

function EnsembleLine(code) {
// We need to draw a short vertical line immediately beneath this TabNote, 
// vertically centred on the distance between it and the next note in the chord.
// Normally, ensemble lines don't appear between notes on adjacent strings

  this.position = 7;
  this.nullfret = false;
  this.tType = false;
  this.eType = "ensembleline";
  this.type = "EnsembleLine";
  this.dx = function (){
    // FIXME: ignoring this.position
//     if(this.nullfret) {
//       return 0;
//     } else if (this.tType == "Italian"){
//       return (this.count-1) * -2 + 2.5;
//     } else {
//       return (this.count-1) * -3.5 + 2.5;
//     }
  	return 0;
  };
  this.dy = function (){

		if(this.nullfret) {
		  return 0;
		} else if (this.tType == "Italian"){
		  return 6;
		} else {
		  return -16;
		}
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.textString = function(){
    return "";
  };
  this.htmlObj = function(){
    return DOMDiv("ensembleline", "ensemblelineselector", this.textString());
  };
  this.TCString = function(){
    return "(E)";
  };
  this.getNextNoteInChord = function(startNote) {
	var ourNote = false
	for(p=startNote.course+1;p<6;p++) {
		var theNote = startNote.chord.mainCourses[p];
		if(theNote) {
			ourNote = theNote;
			return ourNote;
		}
	}
	for(p=0;p<startNote.chord.bassCourses.length;p++) {
		var theNote = startNote.chord.bassCourses[p];
		if(theNote) {
			ourNote = theNote;
			return ourNote;
		}
	}
		if(!ourNote) {
			logger.log("No next note found in chord at time "+startNote.chord.startTime+"!")
		}
		logger.log("Next note at time "+startNote.chord.startTime+" is "+theNote.fret+(theNote.course+1))
		return ourNote; // even if false
}
  this.notePoint = function(note, position) {
	return [note.xpos + xPosDelta(position),
		note.ypos + yPosDelta(position) + 4 + yOffset(note.course) - ld/2];
  }
  this.draw = function(xpos, ypos, svgel, note) {
	if(this.startNote && this.startNote.xpos) {
		// Safety check (haven't checked spacers yet)
		let firstPoint = this.notePoint(this.startNote, 7);
		let x = firstPoint[0]-2
		let nextNote = this.getNextNoteInChord(this.startNote)
		let endPoint = this.notePoint(nextNote, 2);
			let topy = firstPoint[1];
			let boty = topy
			if(nextNote.tType=="BassNote") var cd = 6 - note.course; //crude!!			
			else var cd = nextNote.course - note.course;
			if(cd <= 1) return false;
			boty = topy + ld/2;
// 			if(nextNote.tType=="BassNote") boty += ld/2 
			boty += ld*(cd-2);
			
		if(endPoint) {
			var el = svgLine(svgel, x, topy, x, boty,  "extra ensembleline", 
					"");
		}
		else return false;
	};
  }
}

function ConnectingLine(code, number){
	this.startCode = code;
	this.number = number;
	this.startNote = false;
	this.startPosition = false;
	this.endNote = false;
	this.endPosition = false;
	this.endCode = false;
	this.direction = false;
	this.tType = false;
	this.eType = "Line";
	this.type = "conectingLine";
	this.DOMObj = false;
	if(this.number || this.number===0) {
		if(TabCodeDocument.numberedLines[this.number]) {
			console.log("ERROR: DUPLICATE ID...OVERWRITING", this.number);
		}
		TabCodeDocument.numberedLines[this.number] = this;
	} else {
		TabCodeDocument.unnumberedLines.push(this);
	}
	this.notePoint = function(note, position){
		return [note.xpos + xPosDelta(position),
//						note.ypos + yPosDelta(position) + yOffset(note.course) - ld/2];
						note.ypos + yPosDelta(position) + 4 + yOffset(note.course) - ld/2];
	}
	this.drawLine = function(svgEl, point1, point2, direction){

// 		point1 = Number.parseFloat(point1).toFixed(2);
// 		point2 = Number.parseFloat(point2).toFixed(2);

		if(!direction){
			return svgLine(svgEl, point1[0], point1[1], point2[0], point2[1], "extra orn connecting");
		} else if(direction==='u'){
			let deltax = point2[0] - point1[0];
			let deltay = point2[1] - point1[1];
			let halfway = deltax / 2;
			let peak = deltay < 0 ? 1.5 * 3 * deltay / 4 :
					(deltay===0 ? - 0.75 * ld / 2 : deltay / 4) ;
			let backPeak = deltay < 0 ? - 1.5 * deltay / 3 :
					(deltay===0 ? - ld / 4 : 0.75 * -2 * deltay / 3);
			return svgPath(svgEl, ['M '+point1.join(" "),
								 "q"+halfway+" "+peak+", "+deltax+" "+deltay,
								 "q"+(-halfway)+" "+backPeak+", "+(-deltax)+" "+(-deltay)], "extra orn connecting");
		} else {
			let deltax = point2[0] - point1[0];
			let deltay = point2[1] - point1[1];
			let halfway = deltax / 2;
			let peak = deltay > 0 ? 3 * deltay / 4 :
					(deltay===0 ? ld / 2 : deltay / 4 );
			let backPeak = deltay > 0 ? - deltay / 3 :
					(deltay===0 ? ld / 4 : -2 * deltay / 3);
			return svgPath(svgEl, ['M '+point1.join(" "),
								 "q"+halfway+" "+peak+", "+deltax+" "+deltay,
								 "q"+(-halfway)+" "+backPeak+", "+(-deltax)+" "+(-deltay)], "extra orn connecting");
		}
	}
	this.draw = function(svgEl, extraClasses){
    if(!this.DOMObj) { 
      this.DOMObj = svgGroup(TabCodeDocument.SVG, "line "+(extraClasses || " "));
		}
		if(this.startNote && this.startNote.xpos) {
			// Safety check (haven't checked spacers yet)
			let firstPoint = this.notePoint(this.startNote, (this.startPosition || 5));
			let endPoint = false;
			if(this.endNote){
				if(this.endNote.xpos > this.startNote.xpos){
					// Stupid check for system break (FIXME: do something cleverer)
					endPoint = this.notePoint(this.endNote, (this.endPosition || 4));
					this.drawLine(this.DOMObj, firstPoint, endPoint, this.direction);
					return;
				} else {
					// We have a line break
					// Don't do the thing that's here
					endPoint = this.notePoint(this.endNote, (this.endPosition || 4));
					this.drawLine(this.DOMObj, firstPoint, endPoint, this.direction);
				}
			} else {
				endPoint = this.notePoint(this.startNote, 5);
				endPoint[0] += ld/2;
				endPoint[1] += ld/4;
				firstPoint[1] += ld/4;
				console.log(endPoint, firstPoint);
				this.drawLine(this.DOMObj, firstPoint, endPoint, this.direction);
			}
		}
	}
}
function numberFingering(number, position) {
	this.number = number;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "numberFingering";
  this.hand = "l";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return 9;
    } else {
      return -12;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return -9;
    } else {
      return -6;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("fingering numbered", "fnumselector", this.number);
  };
  this.TCString = function(){
    return "(F"+this.hand+this.number+":"+this.position+")";
  };
	this.draw = function(xpos, ypos, svgel, note){

// TC crude hack 23 Jan 2025:
//     xpos+=12;

    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos-this.dy(), 
      "extra fingering numbered", false, false, this.number);
    $(el).data("word", note);
	};
}

function dotFingering(count, position) {
  // FIXME: Crazy constants, magic numbers
	this.count = count;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "dotFingering";
  this.hand = "r";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return (this.count-1) * -2 + 2.5;
    } else {
      return (this.count-1) * -3.5 + 2.5;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return 6;
    } else {
      return 8;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.textString = function(){
    return new Array(this.count+1).join(".");
  };
  this.htmlObj = function(){
    return DOMDiv("fingering fdots", "fdotselector", this.textString());
  };
  this.TCString = function(){
    switch(this.count) {
      case 1:
        if(this.hand == "r" && this.position == 7){
          return ".";
        } else {
          return "(F"+this.hand+".:"+this.position+")";
        }
      case 2:
        if(this.hand == "r" && this.position == 7){
          return ":";
        } else {
          return "(F"+this.hand+"..:"+this.position+")";
        }
      default:
        return "(F"+this.hand+this.textString()+":"+this.position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note) {
    this.tType = curTabType;
    var el = svgText(svgel, xpos + this.dx(), ypos+this.dy(), "extra fingering fdots", 
        false, false, this.textString());
    $(el).data("word", note);
	};
}

function symbolFingering(symbol, position) {
  // FIXME: This is nonsense
	this.symbol = symbol;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "symbolFingering";
  this.hand = "r";
  this.dx = function (){
    // FIXME: ignoring this.position
    return 0;
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 5;
    } 
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.symbol===o2.symbol
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("extra fingering symbol "+this.hand, "fsymbolselector", this.symbol);
  };
  this.TCString = function(){
    return "(F"+this.hand+this.symbol+":"+this.position+")";
  };
	this.draw = function(xpos, ypos, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos, ypos+5, "extra fingering symbol", false, false, this.symbol);
    $(el).data("word", note);
	};
}

function getOrnament(type, subtype, position){
	switch(type){
	case "a":
		return new backfall(Number(subtype), position);
		break;
	case "c":
		if(subtype=="2")
 			return new forefall2(position);
		else
		return new forefall1(position);
		break;
	case "d":
		return new etoufment(position);
		break;
	case "e":
		return new bebung1(position);
		break;
	case "f":
		return new mordent(position);
	};
	return false;
}

function backfall(count, position){
	this.count = count;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "backfall";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 10;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    return 0;
  };
  this.htmlObj = function(){
    return DOMDiv("orn backfall", "ornselector",")");
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.TCString = function(){
    if(this.position == 5) {
      return ",";
    } else {
      //FIXME: not true
      return "(Oa"+this.count+":"+this.position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note) {
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), "extra orn backfall", false, false, new Array(1+this.count).join(")"));
    $(el).data("word", note);
    return xpos+this.dx() + el.getBBox().width;
	};
}

function forefall1(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "forefall1";
  this.dx = function (){
    // FIXME: ignoring this.position
    return 0;
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/5;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("orn textforefall", "ornselector","˘");
  };
  this.TCString = function(){
    if(this.position == 7) {
      return "u";
    } else {
      return "(Oc1:"+this.position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){

//     xpos = Number.parseFloat(xpos).toFixed(2);

    this.tType = curTabType;
    var el = svgPath(svgel, 
      ["M "+xpos+","+(ypos+this.dy())+" A 6, 5, 0, 0, 0, "
          + (xpos+ld/1.8)+","+(ypos+this.dy())]
      ,"extra orn forefall", false);
    $(el).data("word", note);
    return xpos+ld/1.8;
	};
}

function forefall2(position){
	if(!position) position = 6;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "forefall2";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return -5;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 0;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.position===o2.position;
  };
  this.htmlObj = function(){
//     return DOMDiv("ornament textforefallii", "ornselector", "(");
    return DOMDiv("ornament textforefallii", "ornselector", "u");
  };
  this.TCString = function(){
    if(position == "4"){
      return "<";
    } else {
      return "(Oc2:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
//     var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
//       "extra orn forefallii", false, false, "(");
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
       "extra orn forefallii", false, '"null"', "u");
//          "extra orn forefallii", false, '"null",transform="rotate(-45)"', "(");
//    "extra orn forefallii", false, 'text-anchor="middle" dominant-baseline="central" transform="rotate(45)"', "(");
    $(el).data("word", note);
    return xpos+this.dx() + el.getBBox().width;
	};
}

function etoufment(position){
	this.position = position;
  this.nullfret = false;  
  this.tType = false;
  this.eType = "Ornament";
  this.type = "etoufment";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return -ld/3;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textetoufment", "ornselector", "//");
  };
  this.TCString = function(){
    return "(Od:"+position+")";
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var step = ld/3;
    var el = svgLine(svgel, xpos+this.dx(), ypos+this.dy, 
      xpos+this.dx()+step, ypos+this.dy()+2*step, 
      "extra orn etoufment", false);
    $(el).data("word", note);
    return xpos+this.dx() + el.getBBox().width;
	};
}

function bebung1(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "bebung1";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return -ld/5;
    } else {
			//			return xCentre(this.position) - ld/2;
			return xStart(this.position, ((ld / 2)-5) ) - 8;
      //return 2 * ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return ld/6;
    } else {
      // return -ld/2;
			//return yCentre(this.position) - ld/2;
			return yStart(this.position, ((ld / 2)-2)) + 8;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textbebung", "ornselector", "#");
  };
  this.TCString = function(){
//     if((!this.nullfret && this.position == "3") || 
//         (this.nullfret && this.position == 0)){
      return "#";
//     } else {
//       return "(Oe:"+position+")";
//     }
  };
  this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn bebungi", false, "baseline-shift:super", "#");
    $(el).data("word", note);
    xpos += 8;
    return xpos+this.dx()+el.getBBox().width;
  };
}

function starTenuto(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "starTenuto";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return -ld/30;
    } else {
      return -ld/30;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return ld/4;
    } else {
      return ld/4;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textstartenuto", "ornselector", "*");
  };
  this.TCString = function(){
    if(this.position == 0){
      return "*";
    } else {
      //FIXME
      return "(O*:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn startenuto", false, false, "*");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function martellement(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "martellement";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 2*ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      // HACKHACK
      if(this.tType == "Italian"){
        return -ld/2;
      } else {
      // return -2*ld/3;
        return 0;
      }
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textmartellement martellement", "ornselector", "x");
  };
  this.TCString = function(){
    if((!this.nullfret && this.position==3) 
      || (this.nullfret && this.position==0)){
      return "x";
    } else {
      return "(Of:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn martellement", false, false, "*");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function mordent(position){
  this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "mordent";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
//       return 2*ld/3;
      return xStart(position, ((ld / 2)-5))
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
//       return 2*ld/3;
      return yStart(position, ((ld / 2)-7))
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textmordent mordent", "ornselector", "*");
  };
  this.TCString = function(){
    return "(Og:"+position+")";
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn mordent", false, false, "^");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function bebung2(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "bebung2";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/3;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textbebungii bebungii", "ornselector", "~");
  };
  this.TCString = function(){
    if(position==3){
      return "~";
    }else {
      return "(Oh:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn bebungii", false, false, "~");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function thumbLine(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "thumbLine";
  this.hand = "r";
  // FIXME: Isn't this a fingering??
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 3*ld/10;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return 2*ld/5;
    } else {
      return 3*ld/4;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textthumbline", "ornselector", "|");
  };
  this.TCString = function(){
    if(position==7){
      return "!";
    }else {
      return "(F"+(this.hand=="r" ? "" : "l")+"!:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note) {
    this.tType = curTabType;
    var el = svgLine(svgel, xpos+this.dx(), ypos+this.dy(), xpos+this.dx(), 
      ypos+this.dy()+3*ld/5-1, "extra fingering thumb", false);
    // if (curTabType == "Italian") {
    //   var el = svgLine(svgel, xpos+(3*ld/10), ypos+(2*ld/5), xpos+(3*ld/10), ypos+ld-1,
    //     "fingering thumb", false);
    // } else {
    //   var el = svgLine(svgel, xpos+(3*ld/10), ypos+(4*ld/5), xpos+(4*ld/3), ypos+ld-1,
    //     "fingering thumb", false);
    // }
    $(el).data("word", note);
    return xpos+(3*ld/10)+el.getBBox().width;
	};
}

allOrnaments = [new backfall(1,5), new forefall2(4), 
  new bebung1(7), new martellement(3), new bebung2(7), new forefall1(7),
  new dotFingering(1,7), new dotFingering(2,7), new dotFingering(3,7),
  new thumbLine(7), new starTenuto(0)];

// function ornamentPresent(orntype, sequence){
//   for(var i=0; i<sequence.length; i++){
//     if(orntype==sequence.type) return true;
//   }
//   return false;
// }

function selectOrnament(htmlobj, orn, current){
  if(orn.eType=="Fingering"){
    $(".selector.fingering "+orn.hand).parents("selected").removeClass("selected");
    htmlobj.addClass("selected");
  }
}
