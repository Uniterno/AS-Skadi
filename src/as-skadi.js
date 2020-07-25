var json;
let bgmrng = new Uint32Array(1);
window.crypto.getRandomValues(bgmrng);
var bgm = new Audio('bgm/' + bgmrng[0] % 2 + '.mp3');
loadAllProfiles();
var p;

function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object

	// files is a FileList of File objects. List some properties.

}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
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
					json = JSON.parse(e.target.result);
					simulate();
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
			if(Team[CurrentCardStrategy][y].CharacterName == Team[Strategy][x].CharacterName){
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

function critical(Card){
	let Appeal = Card.Stats.Appeal;
	let Stamina = Card.Stats.Stamina;
	let Technique = Card.Stats.Technique;
	let CriticalEffect = 1; // Base value, not critical
	let Chance = Math.round(Technique * 0.003);
	if(Technique > Appeal && Technique > Stamina){
		Chance += 15;
	}
	// TODO: Add skills/effects that increase chance
	let rng = new Uint32Array(1);
	window.crypto.getRandomValues(rng);
	let n = rng[0] % 100 + 1;
	if(n <= Chance){
		CriticalEffect = 1.5; // + extra crit effect bonuses (TODO)
		// 1.5 is base
	}

	return CriticalEffect;
}

function getStamina(Team){
	let Stamina = 0;
	for(i = 0; i <= 9; i++){
		Stamina += Team[getStrategy(i)][i%3 + 1].Stats.Stamina + Team[getStrategy(i)][i%3 + 1].Accessory.Stamina;
	}
	return Stamina;
}

function getStaminaFactor(BaseStamina, CurrentStamina){
	let Relation = CurrentStamina / BaseStamina;
	let Factor = 1;
	if(Relation <= 0.7){
		Factor = 0.8;
		if(Relation < 0.3){
			Factor = 0.6;
			if(Relation < 0){
				Factor = 0;
			}
		}
	}
	return Factor;
}

function getTiming(TimingSettings){
	let rng = new Uint32Array(1);
	window.crypto.getRandomValues(rng);
	let n = rng[0] % 100 + 1;
	let m = Math.round(TimingSettings.Wonderful * 100);
	if(n <= m){
		return 1.2;
	}
	m += Math.round(TimingSettings.Great * 100);
	if(n <= m){
		return 1.1;
	}
	m += Math.round(TimingSettings.Nice * 100);
	if(n <= m){
		return 1;
	}
	m += Math.round(TimingSettings.Bad * 100);
	if(n <= m){
		return 0.8;
	}
	return 0;
}

function getCombo(CurrentCombo){
	if(CurrentCombo < 10){
		return 1;
	}
	if(CurrentCombo < 30){
		return 1.01;
	}
	if(CurrentCombo < 50){
		return 1.02;
	}
	if(CurrentCombo < 70){
		return 1.03;
	}
	return 1.05;
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

function getMatchingAttribute(CardAttribute, SongAttribute){
	if(CardAttribute == SongAttribute){
		return 1.2;
	}
	return 1;
}

 function getSPFromRarity(rarity){
 	if(rarity == "UR"){
 		return 200;
 	} else if(rarity == "SR"){
 		return 150;
 	} else if(rarity == "R"){
 		return 100;
 	}
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

function simulate(){
	document.getElementById('again').disabled = false;
	let AmountOfNotes = json.song.notes;
	let i = 0;
	let Voltage = 0, SPGauge = 0, CurrentCard = 0;
	let AppealForThisCard = 0;
	let PassiveBonuses = [0, 0, 0]; // Appeal, Stamina and Technique
	let CurrentCardObject;
	let CurrentStrategy = "B";
	let CurrentSPGauge = 0;
	let MaxSPGauge = json.song.maxSPGauge;
	// CurrentCard is CurrentCard%3 + 1

	// Base Appeal shown in "Show Formation" - Initialization
	let BaseAppeal = {
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

	// Base Appeal shown in "Show Formation" - Calculation
	for(i = 0; i < 9; i++){
		let Strategy = getStrategy(i);
		let Passives = passives(json.team, i, json.guest);
		BaseAppeal[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Appeal * (1 + Passives[0]) + json.team[Strategy][i%3 + 1].Accessory.Appeal;
		if(i%3 == 0){
			StrategyMod[Strategy] = getStrategyMod(json.team[Strategy]);
		}
	}

	let BaseStamina = getStamina(json.team);
	let CurrentStamina = BaseStamina;
	// Effective Appeal / SP - TODO

	let StaminaThreshold = 1;
	let Results = '';
	let GreenNF = 1, GreenNL = 1;
	let YellowNF, YellowNL, RedNF, RedNL;

	let Combo = 0;
	let VoltageThisNote;


	for(i = 1; i <= AmountOfNotes; i++){
		PassiveBonuses = passives(json.team, CurrentCard%3 + 1, json.guest);
		let StaminaFactor = getStaminaFactor(BaseStamina, CurrentStamina);
		if(StaminaFactor != StaminaThreshold){
			StaminaThreshold = StaminaFactor;
			let StaminaShow = 1;
			if(StaminaThreshold == 0.8){
				StaminaShow = 0.7;
			} else if(StaminaThreshold == 0.6){
				StaminaShow = 0.3;
			} else{
				StaminaShow = 0;
			}
			if(document.getElementById("showStaminaNotifications").checked){
				if(StaminaShow == 0.7){
					GreenNL = i - 1;
					Results += '(Stamina) Green: ' + GreenNF + ' - ' + GreenNL + '\n';
					YellowNF = GreenNL + 1;
				} else if(StaminaShow == 0.3){
					YellowNL = i - 1;
					Results += '(Stamina) Yellow: ' + YellowNF + ' - ' + YellowNL + '\n';
					RedNF = YellowNL + 1;
				}
				else if(StaminaShow == 0){
					RedNL = i - 1;
					Results += '(Stamina) Red: ' + RedNF + ' - ' + RedNL + '\nStamina ran out\n';
				}

				//Results += '(Stamina) Green: Dropped to ' + StaminaShow * 100 + '% Stamina at note ' + i + '\n';
			}
			if(StaminaShow == 0){
				i = AmountOfNotes + 1;
			}	
		}
		let CriticalEffect = critical(json.team[CurrentStrategy][CurrentCard%3 + 1]);
		if(CriticalEffect != 1 && document.getElementById("showCriticalNotifications").checked){
			Results += 'Critical hit at note ' + i + '\n';
		}
		let TimingEffect = getTiming(json.actions.timing);
		if(document.getElementById("showTimingNotifications").checked){
			let TimingEffectString = "";
			if(TimingEffect == 1.2){TimingEffectString = "Wonderful"}
			else if(TimingEffect == 1.1){TimingEffectString = "Great"}
			else if(TimingEffect == 1){TimingEffectString = "Nice"}
			else if(TimingEffect == 0.8){TimingEffectString = "Bad"}
			else if(TimingEffect == 0){TimingEffectString = "Miss"; Combo = 0}
			Results += '(Timing) ' + TimingEffectString + ' at note ' + i + '\n';
		}

		let ComboEffect = getCombo(Combo);
		let MatchingAttribute = getMatchingAttribute(json.team[CurrentStrategy][CurrentCard%3 + 1].Attribute, json.song.attribute);

		VoltageThisNote = Math.floor(Math.floor(Math.floor(Math.floor(Math.floor(Math.floor(BaseAppeal[CurrentStrategy][CurrentCard%3] * CriticalEffect) * TimingEffect) * ComboEffect) * (1 + StrategyMod[CurrentStrategy].Vo)) * MatchingAttribute) * StaminaFactor);
		if(VoltageThisNote > 50000){
			VoltageThisNote = 50000;
		}
		Voltage += VoltageThisNote;
		CurrentStamina -= json.song.damage;
		CurrentSPGauge += getSPFromRarity(json.team[CurrentStrategy][CurrentCard%3 + 1].Rarity);
		if(CurrentSPGauge > MaxSPGauge){
			CurrentSPGauge = MaxSPGauge;
			if(document.getElementById("showSPNotifications").checked){
				Results += '(SP) SP Gauge fully charged at note ' + i + '\n';	
			}
		}

		CurrentCard++;

		// TODO: Special Time (Bonus after SP)
		// TODO: ACs
	}

	Results += 'Final voltage: ' + Voltage;
	document.getElementById('results').innerHTML = Results;
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

function toggleBGM(item){
 	if(item.checked){
    	bgm.play();
    } else{
    	bgm.pause();
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

function loadProfile(){
	let selectedProfile = document.getElementById("profile").options[document.getElementById("profile").selectedIndex].text;
	if(selectedProfile != "(Test JSON file)"){
		json = JSON.parse(localStorage.getItem(selectedProfile));
		simulate();
	} else{
		loadDefaultJSON(setDefaultJSON)
	}
		alert("Profile has been loaded!");
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
 	json = JSON.parse(dJson);
 	simulate();
 }