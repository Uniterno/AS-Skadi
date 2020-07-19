var json;
let bgmrng = new Uint32Array(1);
window.crypto.getRandomValues(bgmrng);
var bgm = new Audio('bgm/' + bgmrng[0] % 2 + '.mp3');


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
	for(i = 0; i <= 9; i++){
		let Strategy = getStrategy(i);
		let Passives = passives(json.team, i);
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
		if(CriticalEffect != 1 && document.getElementById("showCriticalWarnings").checked){
			Results += 'Critical hit at note ' + i + '\n';
		}
		let TimingEffect = getTiming(json.actions.timing);
		if(document.getElementById("showTimingWarnings").checked){
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
		CurrentCard++;

		// TODO: Calculate SP gain
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