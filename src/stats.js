var json;
let bgmrng = new Uint32Array(1);
window.crypto.getRandomValues(bgmrng);
var bgm = new Audio('bgm/' + bgmrng[0] % 2 + '.mp3');
loadAllProfiles();

function toggleBGM(item){
 	if(item.checked){
    	bgm.play();
    } else{
    	bgm.pause();
    }
  }

function toggleDarkMode(item){
	if(item.checked){
		document.getElementById("body").style.backgroundColor = "rgb(30, 30, 30";
		document.getElementById("body").style.color = "rgb(200, 100, 100)";
	} else{
		document.getElementById("body").style.backgroundColor = "rgb(255, 255, 255)";
		document.getElementById("body").style.color = "rgb(0, 0, 0)";
	}
}

function loadAllProfiles(){
	for(let i = 0; i < localStorage.length; i++){
	 	p = document.createElement('option');
	 	p.appendChild(document.createTextNode(localStorage.key(i)));
	 	p.value = i.toString(36) + 'p_' + hash(localStorage.key(i));
	 	document.getElementById('profile').appendChild(p);
 	}	
}

function exportProfile(){
	let selectedProfile = document.getElementById("profile").options[document.getElementById("profile").selectedIndex].text;
	if(selectedProfile != "(Test JSON file)"){
		document.getElementById('jsondata').value = localStorage.getItem(selectedProfile);
	} else{
		loadDefaultJSON(setDefaultJSON);
	}
}

 function loadDefaultJSON(callback) {   
    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', 'settings.json', true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }

 function setDefaultJSON(dJson){
 	document.getElementById('jsondata').value = dJson;
 }

 function hash(s){
	console.log(s);
	let hash = 0;
	let char = 0;  
	if(s.length == 0) return hash; 
    for (i = 0; i < s.length; i++) { 
    	char = s.charCodeAt(i); 
        hash = ((hash << 5) - hash) + char; 
		hash = hash & hash; 
    }               
	return hash.toString(36); 
}

function showStats(){
	let selectedProfile = document.getElementById("profile").options[document.getElementById("profile").selectedIndex].text;
	if(selectedProfile != "(Test JSON file)"){
		json = localStorage.getItem(selectedProfile);
	} else{
		loadDefaultJSON(setDefaultJSON);
	}

	// calculate pre-live appeal like as-skadi.js does

	for(let i = 1; i < 10; i++){
		// check each card and print all of the relevant stuff
	}

	// then do the same but for Guest

	alert("This function is still in development! Please come back later :)");
}