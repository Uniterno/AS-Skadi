var json;
let bgmrng = new Uint32Array(1);
window.crypto.getRandomValues(bgmrng);
var bgm = new Audio('bgm/' + bgmrng[0] % 2 + '.mp3');
loadAllProfiles();
var p;
var simStatus = {
	"AmountOfNotes": 0,
	"i": 0,
	"Voltage": 0,
	"SPGauge": 0,
	"CurrentCard": 0,
	"CurrentSPGauge": 0,
	"MaxSPGauge": 0,
	"BaseAppeal": {},
	"ActiveEffects": []
};

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

function getStamina(Team, BaseStaminaCards){
	let Stamina = 0;
	for(i = 0; i <= 9; i++){
		Stamina += BaseStaminaCards[getStrategy(i)][i%3];
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

function useSP(){
 	if(simStatus.CurrentSPGauge >= simStatus.MaxSPGauge){
 		simStatus.CurrentSPGauge = 0;
 		let f = simStatus.BaseAppeal[getStrategy(json.team.SP[0])][json.team.SP[0] % 3] * (1 + getEffectiveAppealFactorSP(getStrategy(json.team.SP[0]), json.team.SP[0] % 3 + 1)); // Appeal
 		f += simStatus.BaseTechnique[getStrategy(json.team.SP[0])][json.team.SP[0] % 3] * 1.2; // Technique * 1.2
 		let s = simStatus.BaseAppeal[getStrategy(json.team.SP[1])][json.team.SP[1] % 3] * (1 + getEffectiveAppealFactorSP(getStrategy(json.team.SP[1]), json.team.SP[0] % 3 + 1)); // Appeal
 		s += simStatus.BaseTechnique[getStrategy(json.team.SP[1])][json.team.SP[1] % 3] * 1.2 // Technique * 1.2
		let t = simStatus.BaseAppeal[getStrategy(json.team.SP[2])][json.team.SP[2] % 3] * (1 + getEffectiveAppealFactorSP(getStrategy(json.team.SP[2]), json.team.SP[0] % 3 + 1)); // Appeal
 		t += simStatus.BaseTechnique[getStrategy(json.team.SP[2])][json.team.SP[2] % 3] * 1.2 // Technique * 1.2
 		simStatus.Voltage += Math.floor(f + s + t);
 		let mathData = "Appeal1 + Appeal2 + Appeal3 + (Technique1 + Technique2 + Technique3) * 1.2\n\n" + Math.round(simStatus.BaseAppeal[getStrategy(json.team.SP[0])][json.team.SP[0] % 3] * (1 + getEffectiveAppealFactorSP(getStrategy(json.team.SP[0]), json.team.SP[0] % 3 + 1))) + " + " + Math.round(simStatus.BaseAppeal[getStrategy(json.team.SP[1])][json.team.SP[1] % 3] * (1 + getEffectiveAppealFactorSP(getStrategy(json.team.SP[1]), json.team.SP[1] % 3 + 1))) + " + " + Math.round(simStatus.BaseAppeal[getStrategy(json.team.SP[2])][json.team.SP[2] % 3] * (1 + getEffectiveAppealFactorSP(getStrategy(json.team.SP[2]), json.team.SP[2] % 3 + 1))) + " + (" + Math.round(simStatus.BaseTechnique[getStrategy(json.team.SP[0])][json.team.SP[0] % 3]) + " + " + Math.round(simStatus.BaseTechnique[getStrategy(json.team.SP[1])][json.team.SP[1] % 3]) + " + " + Math.round(simStatus.BaseTechnique[getStrategy(json.team.SP[2])][json.team.SP[2] % 3]) + ") * 1.2";
		simStatus.Results += "<div class='tooltip'><a>" + simStatus.i + " - SP used! Obtained " + Math.floor(f + s + t) + " voltage!</a><a class='tooltiptext'>" + mathData + "</a></div>\n";
 		//simStatus.Results += simStatus.i + " - SP used! Obtained " + Math.floor(f + s + t) + " voltage!\n";
 		simStatus.Results += 'Current voltage: ' + simStatus.Voltage + '\n';
 		document.getElementById('results').innerHTML = simStatus.Results;
 		document.getElementById('useSP').hidden = true;
 		checkActionMargin();
 	}
 }

function switchStrategy(strategy){
 	simStatus.CurrentStrategy = strategy;
 	simStatus.SwitchCooldown = 5;
 	let rng = new Uint32Array(1);
	window.crypto.getRandomValues(rng);
	let effectCard = rng[0] % 3 + 1;
	let effect = json.team[strategy][effectCard].Type;
	if(effect == "Vo"){
		let voltageGain = Math.floor(json.team[strategy][effectCard].Stats.Appeal * 0.05);
		simStatus.Voltage += voltageGain;
		simStatus.Results += simStatus.i + " - (Switch) Gained " + voltageGain + " voltage\n";
		simStatus.Results += 'Current voltage: ' + simStatus.Voltage + '\n';
	} else if(effect = "Sp"){
		simStatus.CurrentSPGauge += 300;
		simStatus.Results += simStatus.i + " - (Switch) Gained 300 SP Gauge\n";
	} else if(effect = "Gd"){
		simStatus.CurrentStamina += simStatus.BaseStamina * 0.15;
		simStatus.Results += simStatus.i + " - (Switch) Restored 15% Stamina (" + simStatus.BaseStamina * 0.15 + ")\n";
	} else if(effect = "Sk"){
		simStatus.SwitchCooldown = 3;
		simStatus.Results += simStatus.i + " - (Switch) Note required for Strategy Switch Down by 2\n";
	}
	document.getElementById('results').innerHTML = simStatus.Results;
	document.getElementById('switchA').disabled = true;
	document.getElementById('switchB').disabled = true;
	document.getElementById('switchC').disabled = true;
}

function getAccessoryStats(Stat, Strategy, Team){
	return Team[Strategy][1].Accessory[Stat] + Team[Strategy][2].Accessory[Stat] + Team[Strategy][3].Accessory[Stat];
}

function skillActivated(Card){
	let rng = new Uint32Array(1);
	window.crypto.getRandomValues(rng);
	let n = rng[0] % 10000 + 1;
	if(!!Card.active_skill == false){
		return false;
	}
	return (n <= Card.active_skill.trigger_probability);
}

function doSkill(Card){
	if(Card.active_skill.skill_id == "-bpujib"){ // Heal based on Stamina
		let HealAmount = Math.floor(Card.Stats.Stamina * Card.active_skill.levels[Card.active_skill.skill_level - 1][2]/10000);
		simStatus.CurrentStamina += HealAmount;
		if(simStatus.CurrentStamina > simStatus.BaseStamina){
			simStatus.CurrentStamina = simStatus.BaseStamina;
		}
		simStatus.Results += simStatus.i + " - (Skill) Healed " + HealAmount + " stamina!\n";
	} else if(Card.active_skill.skill_id == "e1d11p"){ // Shield based on Stamina
		let ShieldAmount = Math.floor(Card.Stats.Stamina * Card.active_skill.levels[Card.active_skill.skill_level - 1][2]/10000);
		simStatus.CurrentShield += ShieldAmount;
		if(simStatus.CurrentShield > simStatus.BaseStamina){
			simStatus.CurrentShield = simStatus.BaseStamina;
		}
		simStatus.Results += simStatus.i + " - (Skill) Gained " + ShieldAmount + " shields!\n";
	} else if(Card.active_skill.skill_id == "-p0ri30"){ // Appeal Up
		let Affects = generateAffects(Card);
		addEffect("Appeal+", 5, Card.active_skill.levels[Card.active_skill.skill_level - 1][2]/10000, Affects);
		if(Affects.Details != -1){
			simStatus.Results += simStatus.i + " - (Skill) Appeal of " + Affects.Who + " (" + Affects.Details + ") increased by " + Card.active_skill.levels[Card.active_skill.skill_level - 1][2]/100 +"% for 5 notes!\n";
		} else{
			simStatus.Results += simStatus.i + " - (Skill) Appeal of " + Affects.Who + " increased by " + Card.active_skill.levels[Card.active_skill.skill_level - 1][2]/100 +"% for 5 notes!\n";
		}
	} else if(Card.active_skill.skill_id == "rwrtr2"){ // SP Gauge gain
		let ChargeAmount = Math.floor(simStatus.MaxSPGauge * Card.active_skill.levels[Card.active_skill.skill_level - 1][2]/10000);
		simStatus.CurrentSPGauge += ChargeAmount;
		if(simStatus.CurrentSPGauge > simStatus.BaseStamina){
			simStatus.CurrentStamina = simStatus.BaseStamina;
		}
		simStatus.Results += simStatus.i + " - (Skill) Gained " + ChargeAmount + " SP gauge!\n";
	}
}

function generateAffects(Card){
	let Affects = {
		"Who": "Nobody",
		"ActivatedBy": {
			"Strategy": simStatus.CurrentStrategy,
			"Card": simStatus.CurrentCard % 3 + 1
		},
		"IgnoreSelf": !!Card.active_skill.target.not_self,
		"Details": -1
	}
	// Who: Who the skill affects
	// ActivatedBy: who activated the skill
	// IgnoreSelf: whether to ignore self
	// Details: additional data on Who, like the name of the school, the character or the year, etc.

	if(Card.active_skill.target.self_only){
		Affects.Who = "Self";
	} else if(Card.active_skill.target.owner_party){
		Affects.Who = "All";
	} else if(Card.active_skill.target.owner_school){
		Affects.Who = "School";
		Affects.Details = Card.School;
	} else if(Card.active_skill.target.owner_year){
		Affects.Who = "Year";
		Affects.Details = Card.Year;
	} else if(Card.active_skill.target.owner_subunit){
		Affects.Who = "Year";
		Affects.Details = Card.Year;
	} else if(Card.active_skill.target.owner_subunit){
		Affects.Who = "Group";
	} else if(Card.active_skill.target.owner_attribute){
		Affects.Who = "Attribute";
		Affects.Details = Card.Attribute;
	} else if(Card.active_skill.target.owner_role){
		Affects.Who = "Type";
		Affects.Details = Card.Type;
	}

	return Affects;
}

function addEffect(EffectType, Notes, Value, Affects){
	let Effect = {
		"Type": EffectType,
		"RemainingNotes": Notes,
		"Value": Value,
		"Affects": Affects
	}
	simStatus.ActiveEffects.push(Effect);
}

function updateRemainingNotesFromActiveEffects(){
	for(let i = 0; i < simStatus.ActiveEffects.length; i++){
		if(simStatus.ActiveEffects[i].RemainingNotes != -1){
			simStatus.ActiveEffects[i].RemainingNotes--;
			if(simStatus.ActiveEffects[i].RemainingNotes == 0){
				simStatus.ActiveEffects.splice(i, 1);
				i--;
			}
		}
	}
}

function getEffectiveAppealFactor(){
	let v = 0;

	for(let i = 0; i < simStatus.ActiveEffects.length; i++){
		let valid = false;
		if(simStatus.ActiveEffects[i].Affects.Who == "Self"){
			if(simStatus.ActiveEffects[i].ActivatedBy.Strategy == simStatus.CurrentStrategy){
				if(simStatus.ActiveEffects[i].ActivatedBy.Card == simStatus.CurrentCard % 3 + 1){
					valid = true;
				}
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "All"){
			valid = true;
		} else if(simStatus.ActiveEffects[i].Affects.Who == "School"){
			if(simStatus.ActiveEffects[i].Details == json.team[simStatus.CurrentStrategy][simStatus.CurrentCard % 3 + 1].School){
				valid = true;	
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Year"){
			if(simStatus.ActiveEffects[i].Details == json.team[simStatus.CurrentStrategy][simStatus.CurrentCard % 3 + 1].Year){
				valid = true;	
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Group"){
			if(simStatus.ActiveEffects[i].ActivatedBy.Strategy == simStatus.CurrentStrategy){
				if(simStatus.ActiveEffects[i].ActivatedBy.Card != simStatus.CurrentCard % 3 + 1){
					valid = true;
				}
			} else{
				valid = true;
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Attribute"){
			if(simStatus.ActiveEffects[i].Details == json.team[simStatus.CurrentStrategy][simStatus.CurrentCard % 3 + 1].School){
				valid = true;	
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Type"){
			if(simStatus.ActiveEffects[i].Details == json.team[simStatus.CurrentStrategy][simStatus.CurrentCard % 3 + 1].Type){
				valid = true;	
			}
		}

		if(valid){
			if(simStatus.ActiveEffects[i].Type == "Appeal+"){
				v += simStatus.ActiveEffects[i].Value;
			}
		}
	}
	return v;
}

function getEffectiveAppealFactorSP(Strategy, Card){
	let v = 0;

	for(let i = 0; i < simStatus.ActiveEffects.length; i++){
		let valid = false;
		if(simStatus.ActiveEffects[i].Affects.Who == "Self"){
			if(simStatus.ActiveEffects[i].ActivatedBy.Strategy == Strategy){
				if(simStatus.ActiveEffects[i].ActivatedBy.Card == Card){
					valid = true;
				}
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "All"){
			valid = true;
		} else if(simStatus.ActiveEffects[i].Affects.Who == "School"){
			if(simStatus.ActiveEffects[i].Details == json.team[Strategy][Card].School){
				valid = true;	
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Year"){
			if(simStatus.ActiveEffects[i].Details == json.team[Strategy][Card].Year){
				valid = true;	
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Group"){
			if(simStatus.ActiveEffects[i].ActivatedBy.Strategy == Strategy){
				if(simStatus.ActiveEffects[i].ActivatedBy.Card != Card){
					valid = true;
				}
			} else{
				valid = true;
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Attribute"){
			if(simStatus.ActiveEffects[i].Details == json.team[Strategy][Card].School){
				valid = true;	
			}
		} else if(simStatus.ActiveEffects[i].Affects.Who == "Type"){
			if(simStatus.ActiveEffects[i].Details == json.team[Strategy][Card].Type){
				valid = true;	
			}
		}

		if(valid){
			if(simStatus.ActiveEffects[i].Type == "Appeal+"){
				v += simStatus.ActiveEffects[i].Value;
			}
		}
	}
	return v;
}


function simulate(type){
	// type -1: Read file, only pre-generate values
	// type 0: Next note only
	// type 1: Next x notes
	// type 2: Next relevant event
	// type 3: Skip to the end
	if(type == -1){
		document.getElementById('nextNote').disabled = false;
		document.getElementById('skipXNotes').disabled = false;
		document.getElementById('nextEvent').disabled = false;
		document.getElementById('toEnd').disabled = false;	
		document.getElementById('again').disabled = false;
		simStatus.AmountOfNotes = json.song.notes;
		simStatus.i = 0;
		simStatus.Voltage = 0;
		simStatus.SPGauge = 0;
		simStatus.CurrentCard = 0;
		simStatus.PassiveBonuses = [0, 0, 0]; // Appeal, Stamina and Technique
		simStatus.CurrentStrategy = "B";
		simStatus.CurrentSPGauge = 0;
		simStatus.MaxSPGauge = json.song.maxSPGauge;
		simStatus.SwitchCooldown = 0;
		simStatus.ActiveEffects = [];
		document.getElementById('switchA').disabled = false;
		document.getElementById('switchB').disabled = true;
		document.getElementById('switchC').disabled = false;
		document.getElementById('useSP').hidden = true;

		// CurrentCard is CurrentCard%3 + 1

		// Base Appeal shown in "Show Formation" - Initialization
		simStatus.BaseAppeal = {
			"A": [0, 0, 0],
			"B": [0, 0, 0],
			"C": [0, 0, 0]
		}

		simStatus.BaseTechnique = {
			"A": [0, 0, 0],
			"B": [0, 0, 0],
			"C": [0, 0, 0]
		}

		simStatus.BaseStaminaCards = {
			"A": [0, 0, 0],
			"B": [0, 0, 0],
			"C": [0, 0, 0]
		}

		simStatus.StrategyMod = {
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
			simStatus.Passives = passives(json.team, simStatus.i, json.guest);
			simStatus.BaseAppeal[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Appeal * (1 + simStatus.Passives[0]) + getAccessoryStats("Appeal", Strategy, json.team);
			simStatus.BaseTechnique[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Technique * (1 + simStatus.Passives[1]) * getMatchingAttribute(json.team[Strategy][i%3 + 1].Attribute, json.song.attribute) + getAccessoryStats("Technique", Strategy, json.team);
			simStatus.BaseStaminaCards[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Stamina * (1 + simStatus.Passives[2]) * getMatchingAttribute(json.team[Strategy][i%3 + 1].Attribute, json.song.attribute) + getAccessoryStats("Stamina", Strategy, json.team);
			if(i%3 == 0){
				simStatus.StrategyMod[Strategy] = getStrategyMod(json.team[Strategy]);
			}
		}

		simStatus.BaseStamina = getStamina(json.team, simStatus.BaseStaminaCards);
		simStatus.CurrentStamina = simStatus.BaseStamina;
		simStatus.CurrentShield = 0;

		simStatus.StaminaThreshold = 1;
		simStatus.Results = '';
		simStatus.GreenNF = 1;
		simStatus.GreenNL = 1;
		simStatus.YellowNF = undefined;
		simStatus.YellowNL = undefined;
		simStatus.RedNF = undefined;
		simStatus.RedNL = undefined;
		simStatus.Combo = 0;

	}

	let iterationController;
	let iterationCondition = function(iterationController, type, calculatedNotesAtOnce){
          if(type == 0 || type == 1 || type == 3){
          	return !(calculatedNotesAtOnce >= iterationController); // iterationController - i should be the amount of turns left to calculate
          } else if(type == 2){
          	return !iterationController; // iterationController will be a boolean, whether or not a relevant event has been encountered
          }
    }
	if(type == 0){
		iterationController = 1;
	} else if(type == 1){
		let v = prompt("Amount of notes to skip: ");
		if(v <= 0 || !!v == false || isNaN(v)){
			alert("This amount is not valid!");
			return;
		}
		if(v > 200){
			alert("The maximum of notes at once is 200, so only 200 notes will be skipped.");
			v = 200;
		}
		iterationController = v;
	} else if(type == 2){
		iterationController = false; // yet to encounter a relevant event, turns to true when done
	} else if(type == 3){
		iterationController = simStatus.AmountOfNotes - simStatus.i;
	}

	let calculatedNotesAtOnce = 0;
	while(iterationCondition(iterationController, type, calculatedNotesAtOnce)){

		let EffectiveAppealFactor = getEffectiveAppealFactor();

		let VoltageThisNote;
		simStatus.i++;
		simStatus.PassiveBonuses = passives(json.team, simStatus.CurrentCard%3 + 1, json.guest);
		let currentStrategyClass = "strategy-none";
		if(simStatus.CurrentStrategy == "B"){
			currentStrategyClass = "strategy-green";
		} else if(simStatus.CurrentStrategy == "A"){
			currentStrategyClass = "strategy-red";
		} else if(simStatus.CurrentStrategy == "C"){
			currentStrategyClass = "strategy-blue";
		}

		let StaminaFactor = getStaminaFactor(simStatus.BaseStamina, simStatus.CurrentStamina);
		if(StaminaFactor != simStatus.StaminaThreshold){
			if(type == 2){
				iterationController = true;
			}
			simStatus.StaminaThreshold = StaminaFactor;
			let StaminaShow = 1;
			if(simStatus.StaminaThreshold == 0.8){
				StaminaShow = 0.7;
			} else if(simStatus.StaminaThreshold == 0.6){
				StaminaShow = 0.3;
			} else{
				StaminaShow = 0;
			}
			if(document.getElementById("showStaminaNotifications").checked){
				if(StaminaShow == 0.7){
					simStatus.GreenNL = simStatus.i;
					simStatus.Results += '(Stamina) Green: ' + simStatus.GreenNF + ' - ' + simStatus.GreenNL + '\n';
					simStatus.YellowNF = simStatus.GreenNL + 1;
				} else if(StaminaShow == 0.3){
					simStatus.YellowNL = simStatus.i;
					simStatus.Results += '(Stamina) Yellow: ' + simStatus.YellowNF + ' - ' + simStatus.YellowNL + '\n';
					simStatus.RedNF = simStatus.YellowNL + 1;
				}
				else if(StaminaShow == 0){
					simStatus.RedNL = simStatus.i;
					simStatus.Results += '(Stamina) Red: ' + simStatus.RedNF + ' - ' + simStatus.RedNL + '\nStamina ran out\n';
				}
			
			}
			if(StaminaShow == 0){
				simStatus.i = simStatus.AmountOfNotes + 1;
				document.getElementById("nextNote").disabled = true;
				document.getElementById("skipXNotes").disabled = true;
				document.getElementById("nextEvent").disabled = true;
				document.getElementById('toEnd').disabled = true;
				break;
			}	
		}
		let CriticalEffect = critical(json.team[simStatus.CurrentStrategy][simStatus.CurrentCard%3 + 1]);
		
		let TimingEffect = getTiming(json.actions.timing);
		if(document.getElementById("showTimingNotifications").checked){
			let TimingEffectString = "";
			if(TimingEffect == 1.2){TimingEffectString = "Wonderful"}
			else if(TimingEffect == 1.1){TimingEffectString = "Great"}
			else if(TimingEffect == 1){TimingEffectString = "Nice"}
			else if(TimingEffect == 0.8){TimingEffectString = "Bad"}
			else if(TimingEffect == 0){TimingEffectString = "Miss"; Combo = 0}
			simStatus.Results += simStatus.i + ' - (Timing) ' + TimingEffectString + '\n';
		}

		simStatus.Combo++;
		let ComboEffect = getCombo(simStatus.Combo);
		let MatchingAttribute = getMatchingAttribute(json.team[simStatus.CurrentStrategy][simStatus.CurrentCard%3 + 1].Attribute, json.song.attribute);

		VoltageThisNote = Math.floor(Math.floor(Math.floor(Math.floor(Math.floor(Math.floor(simStatus.BaseAppeal[simStatus.CurrentStrategy][simStatus.CurrentCard%3] * (1 + EffectiveAppealFactor) * CriticalEffect) * TimingEffect) * ComboEffect) * (1 + simStatus.StrategyMod[simStatus.CurrentStrategy].Vo)) * MatchingAttribute) * StaminaFactor);
		if(VoltageThisNote > 50000){
			VoltageThisNote = 50000;
		}
		simStatus.Voltage += VoltageThisNote;
		if(CriticalEffect != 1 && document.getElementById("showCriticalNotifications").checked){
			simStatus.Results += "<div class='tooltip'><a class='" + currentStrategyClass + "'>" + simStatus.i + ' - Critical!';
		} else{
			simStatus.Results += "<div class='tooltip'><a class='" + currentStrategyClass + "'>" + simStatus.i + ' - ';
		}
		let mathData = "Base Appeal * (1 + AppealUp) * Critical * Timing * Combo * (1 + StrategyMod) * MatchingAttribute * Stamina\n\n" + Math.floor(simStatus.BaseAppeal[simStatus.CurrentStrategy][simStatus.CurrentCard%3]) + " * (1 + " + parseFloat(EffectiveAppealFactor.toFixed(2)) + ") * " + CriticalEffect + " * " + TimingEffect + " * " + parseFloat(ComboEffect.toFixed(2)) + " * (1 + " + parseFloat((simStatus.StrategyMod[simStatus.CurrentStrategy].Vo).toFixed(2)) + ") * " + MatchingAttribute + " * " + StaminaFactor;
		simStatus.Results += " [" + json.team[simStatus.CurrentStrategy][simStatus.CurrentCard%3 + 1].Character + " - " + json.team[simStatus.CurrentStrategy][simStatus.CurrentCard%3 + 1].Set + "] Voltage gain: " + VoltageThisNote + "</a><a class='tooltiptext'>" + mathData + "</a></div>\n";
		
		simStatus.CurrentShield -= json.song.damage;
		if(simStatus.CurrentShield < 0){
			simStatus.CurrentStamina += simStatus.CurrentShield;
			simStatus.CurrentShield = 0;
		}

		simStatus.CurrentSPGauge += getSPFromRarity(json.team[simStatus.CurrentStrategy][simStatus.CurrentCard%3 + 1].Rarity);

		updateRemainingNotesFromActiveEffects();

		// Activate skills

		if(skillActivated(json.team[simStatus.CurrentStrategy][simStatus.CurrentCard%3 + 1])){
			doSkill(json.team[simStatus.CurrentStrategy][simStatus.CurrentCard%3 + 1]);
		}

		
		if(simStatus.CurrentSPGauge >= simStatus.MaxSPGauge){
			simStatus.CurrentSPGauge = simStatus.MaxSPGauge;
			if(document.getElementById("showSPNotifications").checked && document.getElementById("useSP").hidden){
				simStatus.Results += simStatus.i + ' - SP Gauge fully charged\n';
				if(type == 2){
					iterationController = true;
				}
			}
			document.getElementById("useSP").hidden = false;
			checkActionMargin();
		}


		simStatus.CurrentCard++;
		calculatedNotesAtOnce++;
		simStatus.SwitchCooldown--;
		if(simStatus.SwitchCooldown < 0){
			simStatus.SwitchCooldown = 0;
		}
		if(simStatus.SwitchCooldown == 0){
			if(simStatus.CurrentStrategy != "A"){
				document.getElementById('switchA').disabled = false;
			}
			if(simStatus.CurrentStrategy != "B"){
				document.getElementById('switchB').disabled = false;
			}
			if(simStatus.CurrentStrategy != "C"){
				document.getElementById('switchC').disabled = false;
			}
			if(type == 2 && document.getElementById("considerSwitchRelevantEvent").checked){
				iterationController = true;
			}
		}
	}
		// TODO: Special Time (Bonus after SP)
		// TODO: ACs

	simStatus.Results += simStatus.i + ' - Current voltage: ' + simStatus.Voltage + '\n';

	document.getElementById('results').innerHTML = simStatus.Results;

	if(simStatus.i >= simStatus.AmountOfNotes){
		document.getElementById("nextNote").disabled = true;
		document.getElementById("skipXNotes").disabled = true;
		document.getElementById("nextEvent").disabled = true;
		document.getElementById('toEnd').disabled = true;	
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
		simulate(-1);
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
 	simulate(-1);
 }

function restartSimulation(){
 	simStatus = {
	"AmountOfNotes": 0,
	"i": 0,
	"Voltage": 0,
	"SPGauge": 0,
	"CurrentCard": 0,
	"CurrentSPGauge": 0,
	"MaxSPGauge": 0,
	"BaseAppeal": {}
	};
	simulate(-1);
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

function checkActionMargin(){
	if(document.getElementById("useSP").hidden){
		document.getElementById("actionMargin").hidden = true;
	} else{
		document.getElementById("actionMargin").hidden = false;
	}
}