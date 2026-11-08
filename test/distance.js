// Attempt at Needleman-Wunsch for two tabcode objects

function filter(seq){
  //strip comments
  var newseq = [];
  for(var i=0; i<seq.length; i++){
    if(seq[i].tType!=="Comment" && seq[i].tType!=="ruleset") newseq.push(seq[i]);
  }
  return newseq;
}
function describeWord(word){
  if(word.tType =="Chord"){
    return describeChord(word);
  } else {
    return word.tType;
  }
}
function describeChord(chord){
  var description = "";
  description += chord.flag;
  if(chord.beamed){
    var b = new Array(chord.lbeams+1);
    description+=b.join("]");
    b = new Array(chord.rbeams+1);
    description+=b.join("[");
  }
  if(chord.dotted) description += ".";
  for(var i=0; i<chord.mainCourses.length; i++){
    if(chord.mainCourses[i]){
      description += chord.mainCourses[i].fret+(i+1);
    }
  }
  return description;
}
function dist(w1, w2){
  if(w1.tType!==w2.tType) return 1;
  switch (w1.tType){
    case "SystemBreak":
    case "PageBreak":
    case "PieceBreak":
    case "Barline":
      // ignore differences in detail
      return 0;
    case "Meter":
      return meterDiff(w1, w2);
    case "Chord":
      return chordDiff(w1, w2);
    default:
//       alert(w1.tType);
      return 0;
  }
}

function meterDiff(m1, m2){
  // FIXME: for now
  return this.code===this.code ? 0 : 1;
}
function chordDiff(m1, m2){
  var cost = 0;
  var max = 0;
  if(m1.flag || m2.flag){
    max++;
    if(m1.flag!==m2.flag) cost++;
  }
  if(m1.dotted || m2.dotted){
    max++;
  }
  if(m1.beamed || m2.beamed){
    max++;
    if(m1.beamed!==m2.beamed) cost++;
  }
  for(var i=0; i<m1.mainCourses.length; i++){
    if(m1.mainCourses[i] || m2.mainCourses[i]){
      max++;
      if(!m1.mainCourses[i] || !m2.mainCourses[i]){
        cost++;
      } else {
        if(m1.mainCourses[i].fret!==m2.mainCourses[i].fret) cost++;
      }
    }
  }
  for(i=0; i<m1.bassCourses.length; i++){
    if(m1.bassCourses[i] || m2.bassCourses[i]){
      max++;
      if(!m1.bassCourses[i] || !m2.bassCourses[i]){
        cost++;
      } else {
        if(m1.bassCourses[i].fret!==m2.bassCourses[i].fret) cost++;
      }
    }
  }
  return cost/max;
}

function NW (seq1, seq2){
  this.s1 = filter(seq1);
  this.s2 = filter(seq2);
  this.a=false;
  this.from = false;
  this.diff = false;
  this.setCosts = function (){
    var subst, del, ins, min, subdist;
    if(!this.s1.length || !this.s2.length) {
      // This is non-music in at least one example
      if(!this.s1.length || !this.s2.length){
        return 0;
      } else {
        return Math.max(this.s1.length, this.s2.length);
      }
    } 
    this.a=new Array(this.s1.length);
    this.from=new Array(this.s1.length);
    for(var i=0; i<this.s1.length; i++){
      this.a[i] = new Array(this.s2.length);
      this.from[i]=new Array(this.s2.length);
      min = 100;
      for(var j=0; j<this.s2.length; j++){
        if(!i) {
          this.a[i][j]=j;
          this.from[i][j] = j ? "deletion" : false;
        } else if(!j) {
          this.a[i][j]=i;
          this.from[i][j] = "insertion";
        } else {
          subdist = dist(this.s1[i], this.s2[j]);
          subst = this.a[i-1][j-1]+subdist;
          del = this.a[i-1][j]+1;
          ins = this.a[i][j-1]+1;
          min = Math.min(subst, del, ins);
          this.a[i][j] = min;
          this.from[i][j] = (subst == min ? (subdist ? "substitution" : "same") : (ins == min ? "deletion" : "insertion"));
        }
      }
    }
    return this.a[this.s1.length-1][this.s2.length-1];
  };
  this.operations = function(){
    var i=this.s1.length-1;
    var j=this.s2.length-1;
    if(!this.a) this.setCosts();
    this.diff = [];
    while(i || j){
      this.diff.push([this.from[i][j], this.s1[i], this.s2[j]]);
      if(this.from[i][j]==="deletion"){
        j--;
      } else if(this.from[i][j]==="insertion"){
        i--;
      } else {
        j--;
        i--;
      }
    }
    this.diff.reverse();
    return this.diff;
  };
  this.HumanReadableDiff = function(){
    var description = [];
    if(!this.diff) this.operations();
    for(var i=0; i<this.diff.length; i++){
      if(this.diff[i][0]!=="same"){
        description.push([i, this.diff[i][0], 
          describeWord(this.diff[i][1]), describeWord(this.diff[i][2])]);
      }
    }
    return description;
  };
}

 // SystemBreak
 // PageBreak
 // Comment
 // Chord
 // TabNote
 // bassNote
 // Barline
 // Meter
