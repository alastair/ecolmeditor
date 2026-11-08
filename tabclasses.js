function prevxpos(word){
  if(word.prev){
    if(typeof(word.prev.xpos)=="undefined" && word.prev.prev){
      return prevxpos(word.prev);
    } else {
      return word.prev.xpos;
    }
  } else return false;
}

// First parse classes (i.e. comment-ey things)
function SystemBreak(code) {
	this.tType = "SystemBreak";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
}
function PageBreak(code) {
	this.tType = "PageBreak";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
}
function Comment(code) {
	this.tType = "Comment";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
}
function Apparatus(){
  // multi-word structure
  this.tType = "Apparatus";
  this.content = [];
  this.starts = false;
  this.finishes = false;
  this.startpos = false;
  this.startx = false;
  this.endx = false;
  this.endpos = false;
  this.readings = [];
  this.openRDG = false;
  this.edited = function(){
    return this.readings.some(function(e, i, a){
      return e.attributes.some(function(ee, ii, aa){
        return ee[0].toLowerCase()==="type" && ee[1].toLowerCase()==="edited";
      });
    });
  };
  this.current = function(){
    for(var i=0; i<this.readings.length; i++){
      if(this.readings[i].preferred) return i;
    }
    return false;
  };
  this.currentReading = function(){
    for(var i=0; i<this.readings.length; i++){
      if(this.readings[i].preferred) return this.readings[i];
    }
    return false;
  };
  this.draw = function(SVG){
    var curNo = this.current();
    var count = this.readings.length;
    this.endx = curx;
    var width = this.endx-this.startx;
    var tabwidth = Math.max((width - ld/2) / (this.edited() ? count+1 : count+2), ld/2);
    var pos = this.startx+ld/4;
    var tab;
    for(var i=0; i<count; i++){
      if(editable){
        tab = svgRoundedRect(SVG, pos, cury-(2*ld), (i===curNo ? 2*tabwidth : tabwidth)-(3/2), ld, ld/8, ld/8,
                             "switchTab "+this.readings[i].colour());
        tab.setAttributeNS(null, "title",
                           "Click to view the version by "+this.readings[i].responsibility());
        $(tab).data("apparatus", this);
        $(tab).data("readingNo", i);
      }
      if(editable){
        $(tab).click(function(e){
          app = $(this).data("apparatus");
          ri =  $(this).data("readingNo");
          app.switchReading(ri);
        });
      }
      pos+=(i===curNo ? 2*tabwidth : tabwidth);
    }
    if(!this.edited()){
      if(editable){
        tab = svgRoundedRect(SVG, pos, cury-(2*ld), tabwidth, ld, ld/8, ld/8,
                             "switchTab editTab "+this.currentReading().colour());
        tab.setAttributeNS(null, "title", "Click to edit the current version");
      }
      $(tab).data("apparatus", this);
      $(tab).data("readingNo", curNo);
      if(editable){
        $(tab).click(function(e){
          app = $(this).data("apparatus");
          ri =  $(this).data("readingNo");
          app.addEditedReading(ri);
        });
      }
    }
    if(editable){
      var box = svgRoundedRect(SVG, this.startx, cury-ld, this.endx-this.startx, ld*9,
                            ld/4, ld/4,  "reading "+this.currentReading().colour()+(this.currentReading().readOnly() ? "":" clear"), false);
      $(box).data("apparatus", this);
      $(box).data("readingNo", this.current());
    }
  };
  this.switchReading = function(n){
    TabCodeDocument.parameters.history.add(
      new Modify(this.starts, TabCodeDocument.code.substring(this.starts, this.finishes),
                 this.chooseReading(n), document.getElementById('code'), "Apparatus"));
  };
  this.addEditedReading = function(n){
    TabCodeDocument.parameters.history.add(
      new Modify(this.starts, TabCodeDocument.code.substring(this.starts, this.finishes),
                 this.editReading(n), document.getElementById('code'), "Apparatus"));
  };
  this.chooseReading = function(n){
    var out = "{<app>";
    for(var i=0; i<this.readings.length; i++){
      out+=this.readings[i].toString(i===n);
    }
    out+="</app>}";
    return out;
  };
  this.editReading = function(n){
    var out = "{<app>";
    for(var i=0; i<this.readings.length; i++){
      out+=this.readings[i].toString(false);
    }
    out+=this.readings[n].copy(true, [["type", "edited"], ["resp","editor"],
                                      ["origResp", this.readings[n].responsibility()]]);
    out+="</app>}";
    return out;
  };
  this.add = function(word, offset){
    if(!offset) offset = 0;
    if(word.tType==="StructuredComment"){
      var appOpens = /<app[^>]*>/i.exec(word.comment);
      var appCloses = /<\/app>/i.exec(word.comment);
      if(this.content.length===0 && appOpens) this.starts = word.starts;
      if(appCloses) {
        this.finishes = word.finishes;
        curApparatus = false;
      }
      if(!this.openRDG){
        if(word.comment.indexOf("<rdg", offset)>-1 || word.comment.indexOf("<RDG", offset)>-1){
          this.openRDG = new Reading();
          this.readings.push(this.openRDG);
        } else {
          return;
        }
      }
      this.openRDG.add(word, offset);
      if(this.openRDG.finishes && this.openRDG.finishes>offset
         && this.openRDG.finishes<word.comment.length-1){
        var f = this.openRDG.finishes;
        this.openRDG = false;
        this.add(word, f);
      }
    } else if(this.openRDG){
      this.openRDG.add(word);
    }
    word.apparatus = this;
    if(this.content.indexOf(word)===-1) this.content.push(word);
  };
}
function Reading(){
  this.tType = "ApparatusReading";
  this.preferred = false;
  this.type = false;
  this.contentString = false;
  this.openTag = false;
  this.closeTag = false;
  this.content = [];
  this.starts = false;
  this.startWord = false;
  this.finishes = false;
  this.endWord = false;
  this.attributes = [];
  this.readOnly = function(){
    for(var i=0; i<this.attributes.length; i++){
      if(this.attributes[i][0].toLowerCase()==="type"){
        return this.attributes[i][1].toLowerCase()==="correction";
      }
    }
    return false;
  };
  this.responsibility = function(){
    for(var i=0; i<this.attributes.length; i++){
      if(this.attributes[i][0].toLowerCase()==="resp"){
        return this.attributes[i][1].toLowerCase();
      }
    }
    return false;
  };
  this.colour = function(){
    var resp = this.responsibility();
    if(!resp) return "grey";
    for(var i=0; i<TabCodeDocument.colours.length; i++){
      if(TabCodeDocument.colours[i][0]===resp) return TabCodeDocument.colours[i][1];
    }
    TabCodeDocument.colours.push([resp, colours[TabCodeDocument.colours.length]]);
    return TabCodeDocument.colours[TabCodeDocument.colours.length-1][1];
  };
  this.contentToString = function(){
    var source = TabCodeDocument.code;
    var out = "";
    for(var i=0; i<this.content.length; i++){
      if((i===0 || i===this.content.length-1) && this.preferred) {
        // if PREFERRED, then there is no content in the comment
        continue;
      }
      start = i===0
        ? (this.starts + this.openTag.length+this.content[i].starts)
        : this.content[i].starts;
      finish = i===this.content.length-1 ? this.finishes+this.content[i].starts -6
        : this.content[i].finishes;
      out+=" "+source.substring(start, finish);
    }
    return out.substring(1);
  };
  this.toString = function(preferred){
    var out = this.openTag;
    var start, end;
    if(preferred) out += "}";
    out += this.contentToString();
    out+=" "+(preferred ? "{" : "")+"</rdg>";
    return out;
  };
  this.copy = function(preferred, newAttributes){
    var out = "<rdg";
    for(var i=0; i<newAttributes.length; i++){
      out+=' '+newAttributes[i][0]+"='"+newAttributes[i][1]+"'";
    }
    out +=">";
    if(preferred) out += "}";
    out +=this.contentToString();
    out+=" "+(preferred ? "{" : "")+"</rdg>";
    return out;
  };
  this.add = function(item, start){
    this.content.push(item);
    if(item.tType==="StructuredComment"){
      start = start ? start : 0;
      var text= item.comment.substring(start);
      var openTagRE = /<rdg[^>]*>/gi;
      var attributesRE = /\s([\S]*)\=[\'\"]([^'"]*)[\'\"]/gi;
      var closeTagRE = /<\/rdg>/gi;
      var ct = closeTagRE.exec(text);
      var ot = openTagRE.exec(text);
      var match;
      if(!this.openTag){
        if(!ot) return;
        // Don't grap attributes from the next open tag
        if(ct) text = text.substring(0,ct.index);
        this.openTag = ot[0];
        this.starts = ot.index+start;
        while((match=attributesRE.exec(text)) !== null) {
          this.attributes.push([match[1], match.length>2 ? match[2] : true,
                                match.index+start,
                                attributesRE.lastIndex+start]);
        }
      }
      if(ct){
        this.finishes = ct.index+6+start;
        this.endWord = item;
      }
      if(this.content.length>1){ this.preferred=true;}
    } else {
      this.preferred=true;
      item.reading = this;
    }
  };
}
function StructuredComment(code) {
          logger.log("StructuredComment HERE")
	this.tType = "StructuredComment";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.members = [];
  this.readonly = false;
  this.preferred = false;
  this.apparatus = false;
  this.reading=false;
  this.readings = [];
  this.open = false;
  this.draw = function(){
    if(!(this.apparatus && this.apparatus.content
       && this.apparatus.content.length)){
      return;
    } else if (this===this.apparatus.content[0]){
      this.apparatus.startx = curx;
      this.apparatus.starty = cury;
      curx+=ld/2;
    } else {
      // assume this is the end, which in current circumstances it
      // will be. I'm also assuming single system
      this.apparatus.draw(TabCodeDocument.SVG);
      // var el = svgRoundedRect(TabCodeDocument.SVG, this.apparatus.startx, cury-ld,
      //                         curx-this.apparatus.startx, ld*9, ld/4, ld/4, "reading", false);
      // $(el).data("apparatus", this.apparatus);
      curx += ld/2;
    }
  };
}
function Triplet(){
  this.numerator = 3;
  this.denominator = 2;
  this.unit = false;
  this.code = false;
  this.members = [];
  this.editorial = false;
  this.mapping = false;
  this.addMember = function(member){
    this.members.push(member);
    member.tripletGroup = this;
    if(this.full()){
      curTripletGroup = false;
    }
  };
  this.lastp = function(member){
    return member===this.members[this.members.length-1];
  };
  this.full = function(){
    // FIXME: broken or, at least, simplistic
    return this.members.length===this.numerator;
  };
  this.draw = function(){
    var x = this.members[1].xpos;
    var y = this.members[1].ypos+ld;
    var obj;
    
    y -= 0.8*ld;
    
    if(this.members[1].flag || this.members[1].beamed){
//       y -= 2.5*ld;
      y -= 3*ld;
    }
    obj = svgText(TabCodeDocument.SVG, x, y, "triplet", false, false, this.editorial ? "[3]": "3");
    $(obj).data("group", this);
    return obj;
  };
}

function Chord(flag, dotted, mainCourses, bassCourses, start, finish, lbeams, rbeams, rFinish){
  this.tType = "Chord";
  this.flag = flag;
  this.rule = rule;
  this.dotted = dotted;
  this.starts = start;
  this.finishes = finish;
  this.nextStart = false;
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
  this.rhythmFinishes = rFinish;
  this.startTime = false;
  this.selections = new Array();
  this.mainCourses = mainCourses;
  this.bassCourses = bassCourses;
  this.tripletGroup = false;
  this.lbeams = lbeams;
  this.rbeams = rbeams;
  this.beamGroup = false;
  this.n = false;
  if(lbeams || rbeams){
    curBeamGroup.push(this);
    this.beamGroup = curBeamGroup;
    if(!rbeams) {
      // Ends the group
      curBeamGroup = [];
    }
  }
  this.beamed = Math.max(this.lbeams, this.rbeams);
  this.tuning = false;
  this.DOMObj = false;
  this.xpos = false;
  this.rpos = 0;
  this.ypos = false;
  this.dur = false;
  this.prev = false;
  this.next = false;
  for(var i=0; i<this.mainCourses.length; i++){
    if(this.mainCourses[i]){
      this.mainCourses[i].chord = this;
    }
  }
  for(i=0; i<this.bassCourses.length; i++){
    if(this.bassCourses[i]){
      this.bassCourses[i].chord = this;
    }
  }
  this.drawBeams = function(){
    var group = svgGroup(this.DOMObj, "beamelement"+(this.selections.length ? " selected" : ""),
                         false);
    var x = this.xpos+(ld/3);
    // var y = this.ypos-(ld*6/5);
    var y = this.ypos-(ld*8/5);
//     var beamGap = ld/3.5;
    var beamGap = ld/2.8;
    var lgroup=svgGroup(group, "leftbeams", false);
    var rgroup=svgGroup(group, "rightbeams", false);
    // Vertical stem first
//     svgLine(group, x, y, x, this.ypos+(ld*2/5), "beamstem", false);
    svgLine(group, x, y, x, this.ypos+(ld*2/6), "beamstem", false);
    // Then beams: left, then right
    for(var i=0; i<lbeams; i++){
      if(this.prev){
        var xp = prevxpos(this);
        if(xp){
          svgLine(lgroup, xp+(ld/3)+(ld*3/5)+1/2, y, x+1/2, y, "lbeamelement", false);
        } else {
          svgLine(lgroup, x-(ld*3/5)-1/2, y, x+1/2, y, "lbeamelement", false);
        }
      } else {
        svgLine(lgroup, x-(ld*3/5)-1/2, y, x+1/2, y, "lbeamelement", false);
      }
      y += beamGap;
    }
    // y = this.ypos-(ld*6/5);
    y = this.ypos-(ld*8/5);
    for(i=0; i<rbeams; i++){
      svgLine(rgroup, Math.max(x+(ld*3/5)+1/2, this.rpos) , y, x-1/2, y, "rbeamelement", false);
      y += beamGap;
    }
    $(group).data("word", this);
  };
  this.drawFlag = function(){
//     var obj = svgText(this.DOMObj, (ld/4)+this.xpos, flagy(),
    var obj = svgText(this.DOMObj, (ld/4)+this.xpos, flagy()-(ld/4.8),
      "rhythm flag "+(/[FB]/.test(this.flag) ? "Varietie" : curFontName)
      +(!this.editable || (this.reading && this.reading.readOnly()) ? " readonly" : " editable")
      +(this.selections.length ? " selected" : ""),
      false, false, this.flag);
    $(obj).data("word", this);
    // if(obj.getBBox().width && !this.rpos || (obj.getBBox().width + this.xpos) > this.rpos)
    //   this.rpos = (obj.getBBox().width + this.xpos);
    if(obj.getBoundingClientRect().width && !this.rpos || ((ld/4)+obj.getBoundingClientRect().width + this.xpos) > this.rpos)
      this.rpos = (obj.getBoundingClientRect().width + this.xpos - 4);
  };
  this.drawRhythm = function(){
    if(this.flag){
      this.drawFlag();
    } else if(this.beamed) {
      this.drawBeams();
    } else if(editable && (!this.reading || !this.reading.readOnly())){
		if(not_printing){
		  // No flag -- draw insert box
		  var el = svgRoundedRect(this.DOMObj, curx-ld/4, cury+verticalAdjust()-(2*ld),
								 ld, 7/4*ld, ld/4, ld/4,
								 "missingFlag", false);
		  $(el).data("word", this);
		}
    }
    if(this.dotted){
      // var doty = this.ypos-(ld/4) +
      var doty = this.ypos+
        (this.flag ? Math.max(0, 4-rhythmFlags.indexOf(this.flag)) * ld/6 :
         (this.beamed ? Math.max(0, 2-this.rbeams) * ld/6 : 0));
      svgText(this.DOMObj, this.xpos+(ld*5/15), doty, "rhythmdot", false, false, ".");
    }
  };
  this.drawMainCourses = function(){
    for(var i=0; i<this.mainCourses.length; i++){
      if(this.mainCourses[i]){
        var extraClasses = [];
        for(var j=0; j<this.selections.length; j++){
          if(this.selections[j].appliesToNote(this.mainCourses[i], this)){
            extraClasses.push("select-"+j);
          }
        }
        this.mainCourses[i].draw(this.DOMObj, " "+extraClasses.join(" "));

        if(isNaN(this.mainCourses[i].rpos)) {
//          alert([this.mainCourses[i].fret, this.mainCourses[i].course]);
        } else {
          this.rpos = Math.max(this.rpos, this.mainCourses[i].rpos);
        }
      } else if(editable && (!this.reading || !this.reading.readOnly())){
        var courseadj = curTabType == "Italian" ? 5-i : i;
        if(not_printing){
        var el = svgRoundedRect(this.DOMObj,
          curx-(ld/4), cury+ld*courseadj+verticalAdjust() - ld/2,
          ld, ld, ld/4, ld/4, "missingFret", false);
        $(el).data("word", this);
        $(el).data("course", i+1);
        }
      }

    }
  };
  this.drawBassCourses = function(){
    for(var i=0; i<bassCourses.length; i++){
      if(this.bassCourses[i]){
        var extraClasses = [];
        for(var j=0; j<this.selections.length; j++){
          if(this.selections[j].appliesToNote(this.bassCourses[i], this)){
            extraClasses.push("select-"+j);
          }
        } 
        var yshift=0;
        if(typeof this.bass_yshift != "undefined") yshift = this.bass_yshift;
        this.bassCourses[i].draw(this.DOMObj, extraClasses,yshift);
      }
    }
  };
  this.insertionPoint = function(course){
    for(var i=Math.max(0, course-1); i< this.mainCourses.length; i++){
      if(this.mainCourses[i]){
        return this.mainCourses[i].starts;
      }
    }
    // FIXME: Ignores bass courses
    return this.finishes;
  };
  this.draw = function(){
    this.n = chordCounter;
    chordCounter++;

// 	TC Nov 23

// logger.log("Chord: curx = "+curx+ " SystemEnd: "+currSysEnd)

	if(nice_print) curx = curx + (space_ratio(this.duration(this.dur))*6);

    this.xpos = curx;
    this.ypos = cury;
    this.rpos = curx;
    this.tuning = curTuning;
    if(!this.DOMObj) { // is the test necessary?
      this.DOMObj = svgGroup(TabCodeDocument.SVG,
                             "chord"+(editable && (!this.reading || !this.reading.readOnly())
                                      ? " editable" : " readonly")
                             +extraClasses, "chord-"+this.startTime);
    }
    if((chordCounter>=selectedChord)&&(chordCounter<endChord+ng_len)) {
    	this.DOMObj.classList.add('matched');
    }

    this.drawMainCourses();
    this.drawBassCourses();
    this.drawRhythm();

    var theStartTime = this.startTime - g_startTime;
    
    if(document.getElementById('doublebeat_check').checked)	{
	    if((theStartTime % 1024)==0) this.DOMObj.classList.add('doublebeat');
    }
    if(document.getElementById('mainbeat_check').checked)	{
	    if((theStartTime % 512)==0) this.DOMObj.classList.add('mainbeat');
    }
    if(document.getElementById('secondarybeat_check').checked) {
	    if((theStartTime % 256)==0) this.DOMObj.classList.add('secondarybeat');
    } 
    if(document.getElementById('tertiarybeat_check').checked) {
	    if((theStartTime % 128)==0) this.DOMObj.classList.add('tertiarybeat');
    }
    if(document.getElementById('quaternarybeat_check').checked) {
	    if((theStartTime % 64)==0) this.DOMObj.classList.add('quaternarybeat');
    }
    if(document.getElementById('mainbeat_dot_check').checked)	{
	    if((theStartTime % 768)==0) this.DOMObj.classList.add('mainbeat_dot');
    }
    if(document.getElementById('secondarybeat_dot_check').checked) {
	    if((theStartTime % 384)==0) this.DOMObj.classList.add('secondarybeat_dot');
    } 
    if(document.getElementById('tertiarybeat_dot_check').checked) {
	    if((theStartTime % 192)==0) this.DOMObj.classList.add('tertiarybeat_dot');
    }
    if(document.getElementById('quaternarybeat_dot_check').checked) {
	    if((theStartTime % 96)==0) this.DOMObj.classList.add('quaternarybeat_dot');
    }
    curx = this.rpos ? Math.max(this.rpos + (ld/5), this.xpos + (5/4*ld)) : this.xpos + (4*ld/3);
//     if(justify) curx *= justFactor;

    if(this.selections.length) {
      $(this.DOMObj).data("word", this);
      $(this.DOMObj).click(playSelection);
    }
  };
  this.drawToSVG = function(){

    this.xpos = curx;
    this.ypos = cury;
    this.rpos = curx;
    this.tuning = curTuning;
    if(!this.DOMObj) { // is the test necessary?
      this.DOMObj = svgGroup(TabCodeDocument.SVG,
                             "chord"+(editable && (!this.reading || !this.reading.readOnly())
                                      ? " editable" : " readonly")
                             +extraClasses, "chord-"+this.startTime);
    }
    this.drawMainCourses();
    this.drawBassCourses();
    this.drawRhythm();

    var theStartTime = this.startTime - g_startTime;

    curx = this.rpos ? Math.max(this.rpos + (ld/5), this.xpos + (5/4*ld)) : this.xpos + (4*ld/3);
    if(this.selections.length) {
      $(this.DOMObj).data("word", this);
//       $(this.DOMObj).click(playSelection);
    }
  };
    this.pitches = function(distinct){
    if(!this.tuning) this.tuning = curTuning;
    var pitches = new Array();
    var p = false;
		for(var i=0; i<=6; i++){
			if(this.mainCourses[i] && this.tuning && this.mainCourses[i].pitch(this.tuning)){
        p = this.mainCourses[i].pitch(this.tuning);
        if(!distinct || pitches.indexOf(p)===-1){
          // If *distinct* is true, only add if not already present
			    pitches.push(p);
        }
			}
		}
		for(i=0; i<this.bassCourses.length; i++){
      if(this.bassCourses[i] && this.tuning && this.bassCourses[i].pitch(this.tuning)){
        p = this.bassCourses[i].pitch(this.tuning);
        if(!distinct || pitches.indexOf(p)===-1){
          pitches.push(p);
        }
      }
		}
		return pitches;
  };
  this.sounds = function(){
    // Return true if any tabnotes have pitch. N.B. Am checking
    // whether we know their tuning. This may not be sensible.
    if(!this.tuning) this.tuning = curTuning;
    for(var i=0; i<this.mainCourses.length; i++){
      if(this.mainCourses[i] && this.tuning && this.mainCourses[i].pitch(this.tuning)){
        return true;
      }
    }
    for(i=0; i<this.bassCourses.length; i++){
      if(this.bassCourses[i] && this.tuning && this.bassCourses[i].pitch(this.tuning)){
        return true;
      }
    }
    return false;
  };
  this.duration = function() {
    if(this.dur || this.dur===0) return this.dur;
    if(this.flag){
      if(this.dotted){
        curDur = FlagDur(this.flag)*ticksPerCrotchet*3/2;
      } else {
        curDur = FlagDur(this.flag)*ticksPerCrotchet;
      }
      if(DoubleDurs) curDur *= 2;
      this.dur = curDur;
    } else if(this.beamed){
	    if(this.dotted){
		    this.dur = Math.pow(2, (Math.max(this.lbeams, this.rbeams) - 1) * -1) * ticksPerCrotchet*3/2;
		  } else {
		    this.dur = Math.pow(2, (Math.max(this.lbeams, this.rbeams) - 1) * -1) * ticksPerCrotchet;
		  }
    } else if (!this.sounds()){
      // Consists entirely of non-pitched objects (e.g. tenuto). Give
      // 0 rhythm and don't change curDur
      this.dur = 0;
    } else {
      this.dur = curDur;
    }
    // FIXME: Needs testing
    if(this.tripletGroup){
      this.dur = this.dur * this.tripletGroup.denominator / this.tripletGroup.numerator;
    }
    return this.dur;
  };
}

// TC Nov 23
function space_ratio(dur) {
	var dur_ratios = [
		1, //Z		dur=4
		1.1, //Y	dur=8
		1.15, //T	dur=16
		1.2, //S	dur=32
		1.27, //E	dur=64
		2, //Q		dur=128
		2.5, //H	dur=256
		3, //W		dur=512
		4, //B?		dur=1024
		5, //F		dur=2048
		5 //F		dur=4096
	]
	if(dur) {
		var thedur = dur;
		if(thedur%3 == 0) thedur = (thedur/3)*2; // crudely deal with triplets
		for(var i=0;i<dur_ratios.length;i++) {
 			if(thedur == 2 * Math.pow(2,(i+1))) {
//			if(thedur == Math.pow(2,(i+1))) {
// 				logger.log("\tFOUND - i: "+i+" thedur: "+thedur+ " ratio: "+dur_ratios[i]);
				return dur_ratios[i];
			}
		}
		logger.log("\tNOT FOUND -  thedur: "+thedur+ " (Returning 1)")
		return 1;
	}
}

function TabNote(fret, extras, starts, course){
  this.tType = "TabNote";
  this.fret = fret;
  this.extras = new Array();
  this.starts = starts;
  this.fingerings = false;
  this.TC = extras;
  this.xpos = false;
  this.ypos = false;
  this.rpos = 0;
  this.course = course;
  this.chord = false;
  this.mapping = false;
	this.fretChar = function() {
    // FIXME: HACKHACKHACK
    if(this.fret == "-") return " ";
		return this.rule ? this.rule.tabChar(this.fret) : tabChar(this.fret);
	};
  this.pitch = function(tuning){
    if(this.fret == "-") return false;
    return tuning[this.course]+letterPitch(this.fret);
  };
	this.extendExtras = function(newChar) {
		this.TC = this.TC + newChar;
		var curchar;
		extras = [];
		for(var i=0; i<this.TC.length; i++) {
			curchar = this.TC.charAt(i);
			if(curchar=="("){
				// This is a longhand ornament or fingering
				var code = "";
				while(curchar!=")") {
					i++;
					if(i >= this.TC.length) break;
					curchar = this.TC.charAt(i);
					code+=curchar;
				}
				var newExtra = ParseFullExtra(code, this);
				if(newExtra) {
					this.extras.push(newExtra);
				}
			}
			else if (curchar == ".") {
				// Fingering dots are a special case, because multiple
				// symbols make one piece of information (e.g. a3...)
				var count = 0;
				while(curchar=="."){
					count++;
					i++;
					if(i >= this.TC.length) break;
					curchar = this.TC.charAt(i);
				}
				this.extras.push(new dotFingering(count,7));
				// We've overshot now
				i--;
			} else {
				var newExtra = ShorthandExtra(curchar);
				if(newExtra)
					this.extras.push(newExtra);
			}
      if(this.fret == "-" && this.extras.length) {
        this.extras[this.extras.length-1].nullfret = true;
      }
		}
	};
  this.draw = function(svgEl, extraClasses){
    this.xpos = curx;
    if(document.getElementById('on_line_check').checked) {
	    this.ypos = cury;
    }
    else {
	    this.ypos = cury - ld/2.4;
    }
    this.course = course;
    var fc = this.fretChar();
    var cl = "tabnote "+curTabType+" "+curFontName+(fc===" " ? " space" : "")+extraClasses;
    if(fc===" " && !this.extras.length) fc="-";
    var shiftright = (fc=="d")? 3:0;
    var el = svgText(svgEl, this.xpos + shiftright, this.ypos+yOffset(this.course),
      cl, "chord-"+this.chord.startTime+"-"+this.pitch(this.chord.tuning), false, fc);
    
    el.setAttributeNS("xml", "space", "preserve");
    $(el).data("word", this);
//    this.rpos = curx + el.getBoundingClientRect().width;
    var box = el.getBoundingClientRect();
    this.rpos = box.right - TabCodeDocument.leftishHack;
    for(var i=0; i<this.extras.length; i++){

// IMPLEMENT separee/ensemble lines here?
			if(this.extras[i].eType==="Line") continue;

      this.rpos = Math.max(this.rpos,
        this.extras[i].draw(this.xpos, this.ypos+yOffset(this.course), svgEl, this));
	  }
  };
}

function bassNote(fret, code, course, starts, numeric){
  this.tType = "BassNote";
  this.fret = fret;
  this.extras = new Array();
  this.start = starts;
  this.course = course;
  this.fingerings = false;
  this.numeric = numeric;
  this.TC = code;
  this.xpos = false;
  this.ypos = false;
  this.chord = false;
  this.rule = rule;
  this.DOMObj = false;
  this.mapping = false;
  this.fretChar = function(){
    return this.rule ? this.rule.tabChar(this.fret) : tabChar(this.fret);
  };
  this.extendExtras = function(newChar){
    extendExtras(this, newChar);
  };
  this.draw = function(svgEl, extraClasses, yshift){
    var shiftright = (this.fret=="d")? 3:0;
    cury += yshift; // make space for separeeline if necessary
	this.DOMObj = svgGroup(svgEl, "bassgroup", false);
    if(this.numeric){
      svgText(this.DOMObj, curx-4, cury+systemStep()-(ld/2), "bass number "+curFontName+extraClasses, false, false, this.numeric);
    } else if(this.fret==/^\d{1}$/){ // FIXME: No idea
      svgText(this.DOMObj, curx + shiftright, cury+systemStep()-(ld/2), "bass", false, false, this.fret);
    } else if (curTabType == "French"){
      if(!this.numeric){
        drawSlashes(this.DOMObj, this.course);
        svgText(this.DOMObj, curx + shiftright, cury+systemStep()-(ld*2/3)+this.course*3,
          "bassnote French "+curFontName+extraClasses, false, false, this.fret);
      } else {
        svgText(this.DOMObj, curx, cury+systemStep()-(ld*2/3),
          "bassnote French "+curFontName+extraClasses, false, false, this.course);
      }
    } else {
      drawItalianSlashes(this.DOMObj, this.course);
      svgText(this.DOMObj, curx, cury+(ld*2/3)-this.course*3,
        "bassnote Italian "+curFontName+extraClasses, false, false, letterPitch(this.fret));
    }
    cury -= yshift; // reset y position
    $(this.DOMObj).data("word", this);
  };
  this.pitch = function(tuning){
    return tuning[this.course+mainCourseCount]+letterPitch(this.fret);
  };
return this.DOMObj;
}

var barNumStart=0;
var barNumDisplay = "";
var barNumInterval=0;
var g_startTime=0;

var upbeat = false;

function SetBarNumDisplay(value) {
	barNumDisplay = value;
	switch (barNumDisplay) {
		case "none":
			barNumInterval=0;
			break;
		case "systems": 
			barNumInterval=-1;
			break;
		case "five_bars":
			barNumInterval=5;
			break;
		case "all_bars":
			barNumInterval=1;
			break;
	}
	if(document.getElementById('upbeat_checkbox').checked) {
		barNumStart=1;
		logger.log("Upbeat! barNumStart now "+barNumStart);
// 		g_startTime = get_firstChordTime(true);
		
		upbeat = true;
	}
	else {
		barNumStart=0;
		logger.log("NO Upbeat! barNumStart now "+barNumStart);
// 		g_startTime=0;
		
	}
// 	logger.log("Start time = "+g_startTime);
	TabCodeDocument.draw();
	refresh();
}

function get_firstChordTime(isupbeat) {
	var chordfound = false;
	for(p=0;p<TabCodeDocument.TabWords.length;p++) {
		if(typeof TabCodeDocument.TabWords[p].tType == "undefined") continue;
		if((TabCodeDocument.TabWords[p].tType != "Barline")&&(TabCodeDocument.TabWords[p].tType != "Chord")) continue;
		if((TabCodeDocument.TabWords[p].tType == "Barline")&&(!chordfound)) continue;
		if(TabCodeDocument.TabWords[p].tType == "Chord") {
			chordfound = true;
			if(isupbeat) {
				while(TabCodeDocument.TabWords[p].tType != "Barline") { 
				// go to next element after barline
					p++;
				}
			}
			else return TabCodeDocument.TabWords[p].startTime;
		}
// 		if(isupbeat) logger.log(TabCodeDocument.TabWords[p].tType)
		// having found barline, go to first chord found after barline
		while((TabCodeDocument.TabWords[p].tType != "Chord")) { 
				p++;
			}
		return TabCodeDocument.TabWords[p].startTime;
	}
}

var selectedChord = 0;
var endChord = 0;
var ng_len = 0;
function goto(){
	selectedChord = parseInt(document.getElementById('chord').value);
	endChord = parseInt(document.getElementById('chord_sel_end').value);
	ng_len = parseInt(document.getElementById('ng_len').value);
//	alert("Go to chord "+selectedChord);
    	TabCodeDocument.draw();
    	window.scrollTo(0,sel_window_scroll);
//	refresh();
}

var chordNumDisplay = "";
var chordNumInterval=0;
function SetChordNumDisplay(value) {
	chordNumDisplay = value;
	switch (chordNumDisplay) {
		case "none":
			chordNumInterval=0;
			break;
		case "systems": 
			chordNumInterval=-1;
			break;
		case "five_bars":
			chordNumInterval=5;
			break;
		case "all_bars":
			chordNumInterval=1;
			break;
	}
	TabCodeDocument.draw();
	refresh();
}
function Barline(TC, start, finish) {
	this.tType = "Barline";
  this.code = TC;
  this.xpos = false;
  this.ypos = false;
  this.barnumber = false;
  // FIXME: move these to parser.js
	this.lRepeat = TC.charAt(0)===":";
	this.rRepeat = TC.length>1 && TC.charAt(TC.length - 1)===":";
  this.midDots = TC.indexOf("|:|")>-1;
	this.doubleBar = TC.indexOf("|") != TC.lastIndexOf("|");
	this.dashed = TC.indexOf("=") >= 0;
	this.starts = start;
	this.finishes = finish;
  this.DOMObj = false;
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
  this.prev = false;
  this.next = false;
  this.draw = function(){
    this.xpos = curx;
    this.ypos = cury;
    var localx = curx;
    var left = curx;
    this.DOMObj = svgGroup(TabCodeDocument.SVG, "barline", false);

	var this_bar = (this.barnumber+1-barNumStart);
	var barnum_xoffset = 0;
		if((this.barnumber)&&(this.prev.tType != "SystemBreak")) {
			if(this_bar>0) {
			if(this.barnumber >= 9) barnum_xoffset = 5;
			if(this.barnumber >= 99) barnum_xoffset *= 2;
				svgText(TabCodeDocument.SVG, this.xpos-barnum_xoffset, this.ypos+5, "barNumber", "bar_"+this_bar.toString(), false, this_bar);
			}
		}

    $(this.DOMObj).data("word", this);
    if(this.lRepeat) {
      drawRepeat(this.DOMObj, localx);
      localx+=8;
    }
    
    
    if(this.midDots){
      drawBarline(this.DOMObj, localx, this.dashed, false);
      localx += 3;
      drawRepeat(this.DOMObj, localx);
      localx +=7;
      drawBarline(this.DOMObj, localx, this.dashed, false);
    } else {
      drawBarline(this.DOMObj, localx, this.dashed, this.doubleBar);
    }
    localx = curx;
    if(this.rRepeat){
      drawRepeat(this.DOMObj, localx+12);
    }
    curx += ld;
  };
}

function Meter(TC, starts, finishes){
  this.tType = "Meter";
  this.xpos = false;
  this.ypos = false;
  this.code = TC;
  this.starts = starts;
  this.finishes = finishes;
  this.DOMObj = false;
  this.components = [];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
  this.prev = false;
  this.next = false;
  // FIXME: move these to parser.js
  if(TC.charAt(1) =="(" && TC.charAt(TC.length-1) == ")"){
    var code = TC.substring(2,TC.length-1);
    var subcodes = code.split(";");
    for(var i=0; i<subcodes.length; i++){
      // FIXME: should be objects
      this.components.push(subcodes[i].split(":"));
    }
  }
  this.componentStart = function(i, j){
    var startLooking = 2;
    for(var i2=0; i2<i; i2++){
      startLooking = this.code.indexOf(";", startLooking)+1;
    }
    for(var j2=0; j2<j; j2++){
      startLooking = this.code.indexOf(":", startLooking)+1;
    }
    return startLooking+this.starts;
  };
  this.drawOld = function(){
    this.xpos = curx;
    this.ypos = cury;
    var left = curx;
    var group = svgGroup(TabCodeDocument.SVG, "timesig", false);
    var width;
    if(editable) drawMetricalInsertBox(i, "before", this, TabCodeDocument.SVG);
    for(var i=0; i<this.components.length; i++){
      if(this.components[i].length > 1){
        // FIXME: ignoring third sig in triply stacked sigs
        width = drawTSComponent(group, this.components[i][0], false, i, 0, this);
        drawTSComponent(group, this.components[i][1], width, i, 1, this);
      } else {
        if(editable) drawMetricalInsertBoxes(i, this, TabCodeDocument.SVG);
        drawTSComponent(group, this.components[i][0], 0, i, 0, this);
      }
      if(editable) drawMetricalInsertBox(i, "after", this, TabCodeDocument.SVG);
    }
    curx = this.xpos + group.getBoundingClientRect().width;
  };
  this.draw = function(){
    var group = svgGroup(TabCodeDocument.SVG, "timesig", false);
    var newx = curx;
    this.xpos = curx;
    this.ypos = cury;
    if(editable) drawMetricalInsertBox(0, "before", this, TabCodeDocument.SVG);
    for (var i=0; i<this.components.length; i++){
      if(this.components[i].length==1 && editable){
        drawMetricalInsertBoxes(i, this, TabCodeDocument.SVG);
      }
      for(var j=0; j<this.components[i].length; j++){
        newx = Math.max(curx + drawTSC(group, this, i, j).getBoundingClientRect().width, newx, curx+2*ld);
      }
//       curx = newx;
      curx = newx + (ld*1.5);
    }
    if(editable) drawMetricalInsertBox(this.components.length-1, "after", this, TabCodeDocument.SVG);
  };
}
