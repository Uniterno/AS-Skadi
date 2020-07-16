var json;

function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object

	// files is a FileList of File objects. List some properties.

}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object

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

function critical(Appeal, Technique){
	let CriticalEffect = 1; // Base value, not critical
	let Chance = Math.round(Technique * 0.003);
	if(Technique > Appeal){
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

function simulate(){
	let AmountOfNotes = json.song.notes;
	let i = 0;
	let Voltage = 0, SPGauge = 0, CurrentCard = 0;
	let AppealForThisCard = 0;
	let PassiveBonuses = [0, 0, 0]; // Appeal, Stamina and Technique
	let CurrentCardObject;
	let CurrentStrategy = "B";
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
		//console.log(json.team[Strategy][i%3 + 1].Stats.Appeal);
		BaseAppeal[Strategy][i%3] = json.team[Strategy][i%3 + 1].Stats.Appeal * (1 + Passives[0]) + json.team[Strategy][i%3 + 1].Accesory.Appeal;
		//console.log(Strategy + " (" + i + "):" + BaseAppeal[Strategy][i%3]);
	}

	// Effective Appeal / SP - TODO

	for(i = 1; i <= AmountOfNotes; i++){
		PassiveBonuses = passives(json.team, CurrentCard%3 + 1);
		Voltage += BaseAppeal[CurrentStrategy][CurrentCard%3] * critical(json.team[CurrentStrategy][CurrentCard%3 + 1].Stats.Appeal, json.team[CurrentStrategy][CurrentCard%3 + 1].Stats.Technique);
		//console.log(BaseAppeal);
		CurrentCard++;
		//console.log(i + ":" + Voltage);
	}

	let Results = "Voltage: " + Voltage;
	document.getElementById('results').innerHTML = Results;
	//document.getElementById('results').innerHTML = JSON.stringify(json);
	//alert('json global var has been set to parsed json of this file here it is unevaled = \n' + JSON.stringify(json));
}