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

function passives(Team, CurrentCard, Guest){
	let Passive = [0, 0, 0];
	let CurrentCardStrategy = getStrategy(CurrentCard);
	let y = CurrentCard % 3 + 1;
	for(let i = 0; i <= 9; i++){
		let Strategy = getStrategy(i);
		let x = i%3 + 1;
		let AffectedStat = 0; // 0 Appeal, 1 Technique, 2 Stamina
		if(Team[Strategy][x].Ability[0] == "Appeal+"){
			AffectedStat = 0;
		} else if(Team[Strategy][x].Ability[0] == "Technique+"){
			AffectedStat = 1;
		} else if(Team[Strategy][x].Ability[0] == "Stamina+"){
			AffectedStat = 2;
		} 
		
		if(Team[Strategy][x].Ability[1] == "All"){
			Passive[AffectedStat] += Team[Strategy][x].Ability[2];
		} if(Team[Strategy][x].Ability[1] == "Strategy"){
			if(Strategy == CurrentCardStrategy){
				Passive[AffectedStat] += Team[Strategy][x].Ability[2];
			}
		} else if(Team[Strategy][x].Ability[1] == "Type"){
			if(Team[CurrentCardStrategy][y].Type == Team[Strategy][x].Type){
				Passive[AffectedStat] += Team[Strategy][x].Ability[2];
			}
		} else if(Team[Strategy][x].Ability[1] == "Attribute"){
			if(Team[CurrentCardStrategy][y].Attribute == Team[Strategy][x].Attribute){
				Passive[AffectedStat] += Team[Strategy][x].Ability[2];
			}
		} else if(Team[Strategy][x].Ability[1] == "Year"){
			if(Team[CurrentCardStrategy][y].Year == Team[Strategy][x].Year){
				Passive[AffectedStat] += Team[Strategy][x].Ability[2];
			}
		} else if(Team[Strategy][x].Ability[1] == "Character"){
			if(Team[CurrentCardStrategy][y].Character == Team[Strategy][x].Character){
				Passive[AffectedStat] += Team[Strategy][x].Ability[2];
			}
		} else if(Team[Strategy][x].Ability[1] == "Group"){
			if(i != CurrentCard){
				Passive[AffectedStat] += Team[Strategy][x].Ability[2];
			}
		}
	}
	return sumArrays(Passive, addInsightPassives(Team, CurrentCard, Guest));
}

function getStrategy(i){
	let Strategy = "B";
	if(i <= 2){
		Strategy = "A";
	} else if(i >= 6){
		Strategy = "C";
	}
	return Strategy;
}

function sumArrays(A, B){
 	let h = A.length;
 	let C = [];
 	if(B.length > h){
 		h = B.length;
 	}
 	for(let i = 0; i < h; i++){
 		if(!!A[i] == false){
 			A[i] = 0;
 		} if(!!B[i] == false){
 			B[i] = 0;
 		}
 		C[i] = A[i] + B[i];
 	}
 	return C;
}

function getStrategyMod(Strategy){
	let Mod = {
		"Vo": 0,
		"Sp": 0,
		"Gd": 0,
		"Sk": 0
	}
	for(let i = 1; i <= 3; i++){
		if(Strategy[i].Type == "Vo"){
			Mod.Vo += 0.05;
			Mod.Gd -= 0.05;
		} else if(Strategy[i].Type == "Sp"){
			Mod.Sp += 0.05;
			Mod.Sk -= 0.05;
		} else if(Strategy[i].Type == "Gd"){
			Mod.Gd += 0.05;
			Mod.Sp -= 0.05;
		} else if(Strategy[i].Type == "Sk"){
			Mod.Sk += 0.05;
			Mod.Vo -= 0.05;
		}
	}

	return Mod;
}

function addInsightPassives(Team, CurrentCard, Guest){
 	let PassiveAdd = [0, 0, 0];
 	for(let i = 0; i < Guest.insight.length; i++){
 		let InsightType = Guest.insight[i][0];
 		let Condition = Guest.insight[i][1];
 		let Value = Guest.insight[i][2];

 		if(InsightType == "Appeal+"){
 			if(Condition == "All"){
 				PassiveAdd[0] += Value;
 			} else if(Condition == "Group"){
 				if(CurrentCard != Team.SP[1]){
 					PassiveAdd[0] += Value;
 				} // If it's not Center
 			} else if(Condition == "Strategy"){
 				if(getStrategy(CurrentCard) == getStrategy(Team.SP[1])){
 					PassiveAdd[0] += Value;
 				}
 			} else if(Condition == "Attribute"){
				if(Team[getStrategy(CurrentCard)][CurrentCard%3 + 1].Attribute == Team[getStrategy(Team.SP[1])][Team.SP[1] % 3 + 1].Attribute){
					PassiveAdd[0] += Value;
				}
			} else if(Condition == "Year"){
				if(Team[getStrategy(CurrentCard)][CurrentCard%3 + 1].Year == Team[getStrategy(Team.SP[1])][Team.SP[1] % 3 + 1].Year){
					PassiveAdd[0] += Value;
				}
			} 
 		}
 	}
 	return PassiveAdd;
 }

function getAccessoryStats(Stat, Strategy, Team){
	return Team[Strategy][1].Accessory[Stat] + Team[Strategy][2].Accessory[Stat] + Team[Strategy][3].Accessory[Stat];
}

function getMatchingAttribute(CardAttribute, SongAttribute){
	if(CardAttribute == SongAttribute){
		return 1.2;
	}
	return 1;
}

function showStats(){
	let selectedProfile = document.getElementById("profile").options[document.getElementById("profile").selectedIndex].text;
	if(selectedProfile != "(Test JSON file)"){
		json = JSON.parse(localStorage.getItem(selectedProfile));
	} else{
		loadDefaultJSON(setDefaultJSON);
	}

	// calculate pre-live appeal like as-skadi.js does

	BaseAppeal = {
			"A": [0, 0, 0],
			"B": [0, 0, 0],
			"C": [0, 0, 0]
	}
	let BaseStamina = {
			"A": [0, 0, 0],
			"B": [0, 0, 0],
			"C": [0, 0, 0]
	}
	let BaseTechnique = {
			"A": [0, 0, 0],
			"B": [0, 0, 0],
			"C": [0, 0, 0]
	}
	let StrategyMod = {
			"A": {
				"Vo": 0,
				"Sp": 0,
				"Gd": 0,
				"Sk": 0
			},
			"B": {
				"Vo": 0,
				"Sp": 0,
				"Gd": 0,
				"Sk": 0
			},
			"C": {
				"Vo": 0,
				"Sp": 0,
				"Gd": 0,
				"Sk": 0
			}
		}

	for(i = 0; i < 9; i++){
		let Strategy = getStrategy(i);
		let Passives = passives(json.team, i, json.guest);
		BaseAppeal[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Appeal * (1 + Passives[0]) + getAccessoryStats("Appeal", Strategy, json.team);
		
		BaseStamina[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Stamina * (1 + Passives[1]) * getMatchingAttribute(json.team[Strategy][i%3 + 1].Attribute, json.song.attribute) + getAccessoryStats("Stamina", Strategy, json.team);

		BaseTechnique[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Technique * (1 + Passives[2]) * getMatchingAttribute(json.team[Strategy][i%3 + 1].Attribute, json.song.attribute) + getAccessoryStats("Technique", Strategy, json.team);

		if(i%3 == 0){
			StrategyMod[Strategy] = getStrategyMod(json.team[Strategy]);
		}
	}

	for(let i = 1; i < 10; i++){
		let Strategy = getStrategy(i);
		console.log(BaseAppeal[Strategy][i%3]);
	}

	// then do the same but for Guest

	for(let i = 0; i < 9; i++){
		let Strategy = getStrategy(i);
		let currentElement = document.getElementById("description" + i);
		let currentElementBox = document.getElementById("card" + i);
		let critBonus = 0;
		if(Math.floor(BaseTechnique[Strategy][i%3]) > Math.floor(BaseAppeal[Strategy][i%3]) && Math.floor(BaseTechnique[Strategy][i%3]) > Math.floor(BaseStamina[Strategy][i%3])){
			critBonus = 1;
		}
		currentElement.innerHTML = "Appeal: " + Math.floor(BaseAppeal[Strategy][i%3]) + "\nStamina: " + Math.floor(BaseStamina[Strategy][i%3]) + "\nTechnique: " + Math.floor(BaseTechnique[Strategy][i%3]) +"\nCrit chance: " + parseFloat(((BaseTechnique[Strategy][i%3]*0.00003 + critBonus*0.15)*100).toFixed(2)) + "%";
		if(json.team.SP.includes(i)){
			currentElementBox.className += " strategy-sp";
		} else{
			currentElementBox.classList.remove("strategy-sp");
		}
	}

}