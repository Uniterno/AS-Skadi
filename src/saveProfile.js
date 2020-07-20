var json;
let bgmrng = new Uint32Array(1);
window.crypto.getRandomValues(bgmrng);
var bgm = new Audio('bgm/' + bgmrng[0] % 2 + '.mp3');

function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object

	// files is a FileList of File objects. List some properties.

}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
document.getElementById('jsondata').addEventListener('input', checkJSONIntegrityButton, false);
//document.getElementById('darkMode').addEventListener('change', toggleDarkMode, false);

function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object

	if(files[0].size > 1048576){
		alert('Your file surpasses the maximum allowed size. Your JSON file should never be this big.');
		return;
	}

	// files is a FileList of File objects. List some properties.
	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
		var reader = new FileReader();


		// Closure to capture the file information.
		reader.onload = (function (theFile) {
			return function (e) {
				try {
					document.getElementById('jsondata').value = e.target.result;
					checkJSONIntegrityButton();
				} catch (ex) {
					console.log(ex);
					alert('This file could not be read. Make sure you are following the appropiate AS-Skadi format.');
				}
			}
		})(f);
		reader.readAsText(f);
	}

}

document.getElementById('files').addEventListener('change', handleFileSelect, false);



function toggleBGM(item){
 	if(item.checked){
    	bgm.play();
    } else{
    	bgm.pause();
    }
  }

function hash(s){
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

function saveProfile(){
	let name = prompt("Enter the name of this profile: ");
	if(!!name){
		localStorage.setItem(name, document.getElementById("jsondata").value);
		console.log(document.getElementById("jsondata").value);
		alert("Profile saved!");
	} else{
		alert("Your profile couldn't be saved!");
	}
}

function checkJSONIntegrityButton(){
	if(checkJSONIntegrity(document.getElementById('jsondata').value)){
		document.getElementById('save').disabled = false;
	} else{
		document.getElementById('save').disabled = true;
	}
}

function checkJSONIntegrity(str){
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
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
