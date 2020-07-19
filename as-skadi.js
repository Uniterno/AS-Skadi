var json;
var bgm = new Audio('bgm.mp3');


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
					document.getElementById('again').disabled = false;
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

function passives(Team, CurrentCard){
	let Passive = [0, 0, 0];
	for(let i = 0; i <= 9; i++){
		let Strategy = getStrategy(i);
		/* console.log(Team);
		console.log(Strategy);
		console.log(i); */
		let x = i%3 + 1;
		if(Team[Strategy][x].Ability[0] == "Appeal+"){
			if(Team[Strategy][x].Ability[1] == "All"){
				Passive[0] += Team[Strategy][x].Ability[2];
			}
		}
	}
	//console.log(Passive);
	return Passive;
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
	//console.log("n: " + n);
	//console.log("chance: " + Chance);
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

function simulate(){
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
	// Base Appeal shown in "Show Formation" - Calculation
	for(i = 0; i <= 9; i++){
		let Strategy = getStrategy(i);
		let Passives = passives(json.team, i);
		BaseAppeal[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Appeal * (1 + Passives[0]) + json.team[Strategy][i%3 + 1].Accessory.Appeal;
	}

	let BaseStamina = getStamina(json.team);
	let CurrentStamina = BaseStamina;
	// Effective Appeal / SP - TODO

	let StaminaThreshold = 1;
	let Results = '';

	for(i = 1; i <= AmountOfNotes; i++){
		PassiveBonuses = passives(json.team, CurrentCard%3 + 1);
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
			if(document.getElementById("showStaminaWarnings").checked){
				Results += 'Dropped to ' + StaminaShow * 100 + '% Stamina at note ' + i + '\n';
			}
			if(StaminaShow == 0){
				i = AmountOfNotes + 1;
			}	
		}
		let CriticalEffect = critical(json.team[CurrentStrategy][CurrentCard%3 + 1]);
		if(CriticalEffect != 1 && document.getElementById("showCriticalWarnings").checked){
			Results += 'Critical hit at note ' + i + '\n';
		}
		Voltage += (BaseAppeal[CurrentStrategy][CurrentCard%3] * CriticalEffect) * StaminaFactor; 
		CurrentStamina -= json.song.damage;
		CurrentCard++;

		// TODO: Calculate SP gain
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