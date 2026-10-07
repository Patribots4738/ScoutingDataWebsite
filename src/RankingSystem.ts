// Working
const autoWeights = {
	"Climb Auto": 15,
	"Score Auto": 1,
};

// Teleop weights
const teleopWeights = {
	"Score Teleop": 1,
};

const endGameWeights = {
	"L1 Climb": 10,
	"L2 Climb": 20,
	"Transversal Climb": 30,
};

const failureWeights = {
	"Temp Failure": 0.5,
	"Critical Failure": 1,
};

const scoreWeights = {
	...autoWeights,
	...teleopWeights,
	...endGameWeights,
	...failureWeights,
};

const ratingWeights = {
	"Score Teleop": 1,
	"Score Auto": 1,
	"Climb Auto": 15,
	"L2 Climb": 10,
	"L1 Climb": 20,
	"Transversal Climb": 30,
};

import type { ScoreWeightMap, Table } from "./types";

const weightMaps: Record<string, ScoreWeightMap> = {
	Auto: autoWeights,
	Teleop: teleopWeights,
	Endgame: endGameWeights,
	Failure: failureWeights,
	Rating: ratingWeights,
};

export function assignMatchScoreToEach(data: Table, dataType: string): Table {
	const weightMap = weightMaps[dataType] ?? scoreWeights;
	const newData: Table = data.map((row) => [...row]);
	for (const item of newData) {
		item.push(assignScore(item, newData[0], weightMap));
	}
	newData[0].push(dataType);
	return newData;
}

export function assignScores(data: Table, dataTypeArr: string[]): Table {
	let newData = data.map((row) => [...row]);
	for (const item of dataTypeArr) {
		newData = assignMatchScoreToEach(newData, item);
	}
	return newData;
}

export function assignAllScores(data: Table): Table {
	return assignScores(data, ["Auto", "Teleop", "Endgame", "Failure", "Score", "Rating"]);
}

function assignScore(match: string[], dataPoints: string[], weightMap: ScoreWeightMap): string {
	let score = 0;
	for (let i = 0; i < match.length; i++) {
		if (weightMap[dataPoints[i]] === undefined) continue;
		score += parseFloat(match[i]) * weightMap[dataPoints[i]];
	}
	return score.toFixed(2);
}
