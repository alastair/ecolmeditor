function dialogueBoxFloat() {
  if(document.getElementById('buttonbox')){
    $('#buttonbox').empty();
    return document.getElementById('buttonbox');
  } else {
    var div = DOMDiv('dialoguebox', 'buttonbox', false);
    document.body.appendChild(div);
    return div;
  }
}

function imageButton(id, callback, src, selected){
  var button = DOMDiv(selected ? "uibutton selected" : "uibutton", false,
                      DOMImage(false, false, src));
  button.onclick = callback;
  return button;
}

function textButton(id, cname, callback, text, selected){
  var button = DOMDiv(selected ? "uibutton selected" : "uibutton", false,
                      DOMSpan(cname, false, text+""));
  button.onclick = callback;
  return button;
}

function DOMObjectButton(id, cname, callback, object, selected){
  var button = DOMDiv((selected ? "uibutton selected" : "uibutton"), false, object);
  button.onclick = callback;
  return button;
}

function cancelButton(){
  return textButton("cancelButton", "textbutton", clearButtons, 
    "Cancel", false);
}

function clearButtons(){
  document.removeEventListener('keydown', keyDownhandler);
  $('#buttonbox').remove();
}

function boxHeight(n){
  // Given a a grid with n members, what width and height gives the
  // nicest arrangement of members?
  // For now at least, my assumption is that we want to
  // minimise travel, but will accept more horizontal than vertical
  // movement (partly because I'm allowing movement left, right and
  // down, but not up). So, assume
  //   width = 2 * height AND width x height = n
  return Math.round(Math.sqrt(n/2));
}

// function buttonBox(buttons, x, y, extras){
function buttonBox(buttons, x, y, extras){

  var box = dialogueBoxFloat();
  var height = boxHeight(buttons.length);
  var width = Math.ceil(buttons.length/height);
  var row,cell;
  var i=0;
  for(var rowi=0; rowi<height; rowi++){
    row = DOMDiv("buttonrow", false, false);
    box.appendChild(row);
    for(var coli=0; coli<width; coli++){
      if(buttons[i]){
        cell=DOMDiv("buttoncell", false, false);
        row.appendChild(cell);
        cell.appendChild(buttons[i]);
        i++;
        if(i>=buttons.length) break;
      }
    }
  }
  row = DOMDiv("buttonrow extrarow", false, false);
  box.appendChild(row);
  for(i=0; i<extras.length; i++){
    cell=DOMDiv("buttoncell", false, false);
    row.appendChild(cell);
    cell.appendChild(extras[i]);
  }
  cell=DOMDiv("buttoncell", false, false);
  row.appendChild(cell);
  cell.appendChild(cancelButton());
//  box.style.top = Math.min(y, window.innerHeight - box.offsetHeight) + window.innerHeight + window.pageXOffset;
// TC 31 Jan 21
	box.style.top = "600px";
//   box.style.top = $(window).scrollTop() + $(window).height() - 250;
//   box.style.left = Math.max(0, x - (box.offsetWidth/2));
  return box;
}
