import { assignAllScores } from "./RankingSystem";
import { getAllData } from "./widgets/JsonData";
import {
	type CompareTeamsResult,
	type DataRow,
	type DataTable,
	type MergedSeasonMatches,
	type ProcessedData,
	radarDataPoints,
	type RangeMap,
	type RankingsResult,
	type RawDataResult,
	type SearchResult,
	type Table,
	type TeamTableMap,
} from "./types";

let eventCodeTemp = localStorage.getItem("eventCode");
if (!eventCodeTemp) {
	eventCodeTemp = prompt("Event Code:") || "2026test";
	localStorage.setItem("eventCode", eventCodeTemp);
}

const eventCode = eventCodeTemp;
const minQual = parseInt(localStorage.getItem("minQual") || "0");
const maxQual = parseInt(localStorage.getItem("maxQual") || "10000");
const shouldIncludeDead =
	localStorage.getItem("shouldIncludeDead") === null ||
	localStorage.getItem("shouldIncludeDead") === "true";
const shouldDisplayMean =
	localStorage.getItem("average") !== null || localStorage.getItem("average") === "average";

let seasonMatches: MergedSeasonMatches;
let commentData: Table = [];
let numData: Table = [];
let numTeamMap: TeamTableMap = new Map();
let teamAverageMap: TeamTableMap = new Map();
//let commentTeamMap;
//let bigTeamMap;
//let allData;
//let rankingTable;
//let maxMin;
//let maxMinOfAverages;
//let rawDataMap;
//let bigTeamMapSplit;
//let teamScoreMap;
let teamRankingArr: string[] = [];
//let globalAverageScore;

// Use an async function to fetch and process your data
// Working:
export async function fetchDataAndProcess(fileName: "RawData"): Promise<RawDataResult>;
export async function fetchDataAndProcess(fileName: "Search"): Promise<SearchResult>;
export async function fetchDataAndProcess(fileName: "Rankings"): Promise<RankingsResult>;
export async function fetchDataAndProcess(fileName: "CompareTeams"): Promise<CompareTeamsResult>;
export async function fetchDataAndProcess(fileName: string): Promise<ProcessedData>;
export async function fetchDataAndProcess(fileName: string): Promise<ProcessedData> {
	const data = await getAllData();
	if (eventCode.toLowerCase() === "all") {
		const seasonData = data["2026REBUILT"];
		seasonMatches = mergeEventCodes(seasonData);
	} else {
		const seasonData = data["2026REBUILT"];
		seasonMatches = seasonData[getEventCode(Object.keys(seasonData), eventCode)];
	}
	console.log("More Com: " + convertCommentsToTableForm(seasonMatches));
	commentData = resortColumnByPoint(convertCommentsToTableForm(seasonMatches), "Team", 0);
	numData = convertNumDataToTableForm(seasonMatches);
	numData = assignAllScores(numData);

	// 2d Array, numData[0][i] is the ith data point string
	// numData[i][j] the jth datapoint in the (i-1th) match
	numData = resortColumnsByArray(numData, [
		"Team",
		"Score",
		"Match Number",
		// Auto section
		"Score Auto",
		// Teleop section
		"Score Teleop",
		"Pass Teleop",
		"Fumble Percent",
		// Endgame/Climb section
		"L1 Climb",
		"L2 Climb",
		"Traversal Climb",
		"Climb Failure",
		// Other
		"Ground Intake",
		"Station Intake",
		"Temp Failure",
		"Critical Failure",
		"Over Bump",
		"Under Trench",
		"Shooting While Driving",
	]);
	// same formatting as numData
	commentData = resortColumnsByArray(commentData, [
		"Team",
		"Name",
		"Match Number",
		"Auto Path",
		"Auto Description",
		"Off Time",
		"Comments",
	]);

	switch (fileName) {
		case "RawData":
			return {
				rawDataMap: convertTableToMap(numData),
				commentDataMap: convertTableToMap(commentData),
			};
		case "Search":
			console.log();
			numTeamMap = convertToTeamMap(numData);
			teamAverageMap = getTeamAverageMap(
				shouldIncludeDead,
				minQual,
				maxQual,
				shouldDisplayMean,
			);
			// predictMatch(teamAverageMap, [['7', '7', '7'], ['7', '7', '7']]);
			return {
				teamAverageMap: teamAverageMap,
				bigTeamMapSplit: [convertToTeamMap(numData), convertToTeamMap(commentData)],
				maxMinOfAverages: getMaxMinOfAverages(),
				globalAverageMap: getGlobalAverageMap(radarDataPoints),
			};
		case "Rankings":
			numTeamMap = convertToTeamMap(numData);
			teamAverageMap = getTeamAverageMap(
				shouldIncludeDead,
				minQual,
				maxQual,
				shouldDisplayMean,
			);
			return {
				teamAverageMap: teamAverageMap,
				rankingTable: getRankingTable(),
			};
		case "CompareTeams":
			numTeamMap = convertToTeamMap(numData);
			teamAverageMap = getTeamAverageMap(
				shouldIncludeDead,
				minQual,
				maxQual,
				shouldDisplayMean,
			);
			return {
				teamAverageMap: teamAverageMap,
				maxMinOfAverages: getMaxMinOfAverages(),
			};
		default:
			return {
				rawDataMap: convertTableToMap(numData),
				commentDataMap: convertTableToMap(commentData),
			};
	}
}

/*
const getTeamData = (team) => {
  return bigTeamMap.get(team);
};
*/

function getTeamNumData(team: string): Table {
	if (numTeamMap.get(team) === undefined) {
		return [[], []];
	}
	return numTeamMap.get(team) ?? [[], []];
}

/*
const getTeamCommentData = (team) => {
  return commentTeamMap.get(team);
};
*/

// Working
function convertToTableForm(data: MergedSeasonMatches, datatype: "comments" | "data"): Table {
	const table: Table = [];

	// rows of the table
	let row = getIndividualDatapoints(data);
	row[0].push("Team");
	row[1].push("Team");

	// push either commentData or numData datapoints
	// to first index of table (table[0])
	if (datatype === "comments") {
		row[0].push("Match Number");
		table.push(row[0]);
	} else {
		table.push(row[1]);
	}

	// Each Match
	const matches = Object.keys(data);

	// Starts at one because table[0] is dataPoints
	for (let i = 1; i <= matches.length; i++) {
		// matchData simplifies data down to each match
		const matchData = data[matches[i - 1]];
		const bots = Object.keys(matchData);
		for (let j = 0; j < bots.length; j++) {
			if (Object.keys(matchData[bots[j]]).length < 2) {
				continue;
			}
			const row: string[] = [];
			//  gets either num or comment data of each bot
			const botData: Record<string, string> =
				datatype === "comments"
					? matchData[bots[j]]["comments"]
					: matchData[bots[j]]["data"];

			const dataKeys = Object.keys(botData);
			for (let k = 0; k < dataKeys.length; k++) {
				row.push(botData[dataKeys[k]]);
			}
			// gets team number
			let teamNameStart = 0;
			for (let i = 0; i < bots[j].length; i++) {
				if (bots[j][i] === "-") {
					teamNameStart = i + 1;
				}
			}
			row.push(bots[j].substring(teamNameStart, bots[j].length));
			if (datatype === "comments") {
				row.push(matchData[bots[j]]["data"]["Match Number"]);
			}
			table.push(row);
		}
	}

	return table;
}
// Working:
function convertCommentsToTableForm(data: MergedSeasonMatches): Table {
	return convertToTableForm(data, "comments");
}
// Working:
function convertNumDataToTableForm(data: MergedSeasonMatches): Table {
	return convertToTableForm(data, "data");
}

function mergeEventCodes(data: Record<string, MergedSeasonMatches>): MergedSeasonMatches {
	const keys = Object.keys(data);
	const mergedData: MergedSeasonMatches = {};
	for (let i = 0; i < keys.length; i++) {
		let code = keys[i];
		let matches = Object.keys(data[keys[i]]);
		for (let j = 0; j < matches.length; j++) {
			mergedData[code + ": " + matches[j]] = data[code][matches[j]];
		}
	}
	return mergedData;
}

function getEventCode(array: string[], eventCode: string): string {
	for (let i = 0; i < array.length; i++) {
		if (array[i].toLowerCase() === eventCode.toLowerCase()) {
			return array[i];
		}
	}
	return "";
}
// Working:
/*
function convertAllToTableForm(data: MergedSeasonMatches): Table {
  let tempComments = convertCommentsToTableForm(data);
  let tempNumData = convertNumDataToTableForm(data);
  let table = [];
  tempComments[0].pop();
  table.push([tempComments[0], tempNumData[0]].flat());
  table[0].pop();
  for (let i = 0; i < tempComments.length - 1; i++) {
    tempComments[i + 1].pop();
    table.push([tempComments[i + 1], tempNumData[i + 1]].flat());
    table[i + 1].pop();
  }
  return table;
}
*/

function getMaxMin(data: Table): RangeMap {
	console.log(data);
	let sol = new Map();
	if (data.length === 0) {
		return sol;
	}
	for (let i = 0; i < data[0].length; i++) {
		sol.set(data[0][i], [data[1][i], data[1][i]]);
	}
	for (let i = 2; i < data.length; i++) {
		for (let j = 0; j < data[i].length; j++) {
			const range = sol.get(data[0][j]);
			if (!range) continue;
			if (parseFloat(data[i][j]) < parseFloat(range[0])) {
				sol.set(data[0][j], [data[i][j], range[1]]);
			}
			if (parseFloat(data[i][j]) > parseFloat(range[1])) {
				sol.set(data[0][j], [range[0], data[i][j]]);
			}
		}
	}
	return sol;
}

function getGlobalAverageMap(dataPoints: string[]): Map<string, number> {
	const map = new Map<string, number>();
	for (let i = 0; i < dataPoints.length; i++) {
		map.set(dataPoints[i], getGlobalAverage(dataPoints[i]));
	}
	return map;
}

function getMaxMinOfAverages(): RangeMap {
	const arr: Table = [];
	let keys = Array.from(teamAverageMap.keys());
	const firstAverage = teamAverageMap.get(keys[0]);
	if (!firstAverage) return new Map();
	arr.push(firstAverage[0]);
	for (let i = 0; i < keys.length; i++) {
		arr.push(
			shouldDisplayMean
				? getTeamAverage(keys[i], true, minQual, maxQual)[1]
				: getTeamAverageMedian(keys[i], true, minQual, maxQual)[1],
		);
	}
	return getMaxMin(arr);
}
// Working but need to make easier to use:
function resortColumn(data: Table, columnInitial: number, columnGoal: number): Table {
	const table: Table = [];
	let row: string[];
	for (let i = 0; i < data.length; i++) {
		row = [...data[i]];
		let temp = row[columnInitial];
		row[columnInitial] = row[columnGoal];
		row[columnGoal] = temp;
		table.push(row);
	}
	return table;
}

export function resortColumnsByArray(data: Table, orderArr: string[]): Table {
	let newData = [...data];
	for (let i = 0; i < orderArr.length; i++) {
		newData = resortColumnByPoint(newData, orderArr[i], i);
	}
	return newData;
}

export function whitelistDataPoints(data: Table, orderArr: string[]): Table {
	const arr: string[] = [];
	for (const item of data[0]) {
		if (!orderArr.includes(item)) {
			arr.push(item);
		}
	}
	return removeDataPoints(data, arr);
}

export function whitelistDataPointObjArr(data: DataTable, orderArr: string[]): DataTable {
	const newArr: DataTable = [];
	for (let i = 0; i < data.length; i++) {
		const newObj: DataRow = {};
		for (let j = 0; j < orderArr.length; j++) {
			if (data[i][orderArr[j]] === undefined) {
				continue;
			}
			newObj[orderArr[j]] = data[i][orderArr[j]];
		}
		newArr.push(newObj);
	}
	return newArr;
}

// Working but need to make easier to use:
function resortColumnByPoint(data: Table, point: string, columnGoal: number): Table {
	for (let i = 0; i < data[0].length; i++) {
		if (data[0][i] === point) {
			return resortColumn(data, i, columnGoal);
		}
	}
	return data;
}

/*
function renameHeader(data, headerInitial, headerFinal) {
    for (let i = 0; i < data[0].length; i++) {
        if (data[0][i] === headerInitial) {
            data[0][i] = headerFinal;
            break;
        }
    }
}
*/

function getGlobalAverage(dataPoint: string): number {
	let dataPointMap = getDataPointMap(dataPoint);
	let keys = Object.keys(dataPointMap);
	let total = 0;
	for (let i = 0; i < keys.length; i++) {
		total += parseFloat(dataPointMap[keys[i]]);
	}
	return total / keys.length;
}

/*
function getLocalAverage(team, dataPoint) {
    let map = getDataPointMap(dataPoint);
    return map[team];
}
*/

function getDataPointMap(dataPoint: string): Record<string, string> {
	let keys = Array.from(teamAverageMap.keys());
	if (keys.length === 0) {
		return {};
	}
	const scoreTeamMap: Record<string, string> = {};
	const firstAverage = teamAverageMap.get(keys[0]);
	if (!firstAverage) return scoreTeamMap;
	let pointIndex = getDataPointIndex(dataPoint, firstAverage[0]);
	for (let j = 0; j < firstAverage[0].length; j++) {
		if (firstAverage[0][j] === dataPoint) {
			pointIndex = j;
			break;
		}
	}
	for (let i = 0; i < keys.length; i++) {
		const average = teamAverageMap.get(keys[i]);
		if (average) scoreTeamMap[keys[i]] = average[1][pointIndex];
	}
	return scoreTeamMap;
}

function getDataPointIndex(dataPoint: string, dataPoints: string[]): number {
	for (let i = 0; i < dataPoints.length; i++) {
		if (dataPoints[i] === dataPoint) {
			return i;
		}
	}
	return 0;
}

/*
function getTeamRankingArr() {
    let orderedTeamMap = new Map();
    let keys = Object.keys(teamScoreMap);
    for (let i = 0; i < keys.length; i++) {
        orderedTeamMap.set(keys[i], teamScoreMap[keys[i]]);
    }
    orderedTeamMap = new Map([...orderedTeamMap.entries()].sort((a, b) => b[1] - a[1]));
    return Array.from(orderedTeamMap.keys());
}
*/

export function getTeamRank(team: string): number {
	for (let i = 0; i < teamRankingArr.length; i++) {
		if (teamRankingArr[i] === team) {
			return i + 1;
		}
	}
	return -1;
}

function removeDataPoint(data: Table, dataPoint: string): Table {
	const newTeamData: Table = [];
	for (let j = 0; j < data.length; j++) {
		newTeamData.push([]);
		for (let i = 0; i < data[j].length; i++) {
			if (data[0][i] !== dataPoint) {
				newTeamData[j].push(data[j][i]);
			}
		}
	}
	return newTeamData;
}

function removeDataPoints(data: Table, dataPointArr: string[]): Table {
	let newData = data.map((row) => [...row]);
	for (const datapoint of dataPointArr) {
		newData = removeDataPoint(newData, datapoint);
	}
	return newData;
}
// Working
function convertTableToMap(data: Table): DataTable {
	const mapArr: DataTable = [];
	for (const object of data) {
		const map: DataRow = {};
		for (const i in object) {
			map[data[0][i]] = object[i];
		}
		mapArr.push(map);
	}
	return mapArr;
}
// Working
function getRankingTable(): DataTable {
	const dataArr: DataTable = [];
	let teams = Array.from(teamAverageMap.keys());
	for (const team of teams) {
		dataArr.push(
			convertTableToMap(
				shouldDisplayMean
					? getTeamAverage(team, shouldIncludeDead, minQual, maxQual)
					: getTeamAverageMedian(team, shouldIncludeDead, minQual, maxQual),
			)[0],
		);
	}
	return dataArr;
}

// Working:
function getIndividualDatapoints(data: MergedSeasonMatches): Table {
	const dataPoints: Table = [[], []];

	//gets all the matches
	let matchKeys = Object.keys(data);

	// if there are no matches, return empty table
	if (matchKeys.length === 0) {
		return dataPoints;
	}

	// gets all the data points using the data from the first bot in the first match
	// matchKeys[0] is the first match
	// Object.keys(data[matchKeys[0]])[0] is the first bot in the first match

	let botKeys = Object.keys(data[matchKeys[0]]);

	let commentPoints = Object.keys(data[matchKeys[0]][botKeys[0]]["comments"]);

	let numDataPoints = Object.keys(data[matchKeys[0]][botKeys[0]]["data"]);

	// pushes those data points to the first row of the table (the header)
	for (let i = 0; i < commentPoints.length; i++) {
		dataPoints[0].push(commentPoints[i]);
	}
	for (let i = 0; i < numDataPoints.length; i++) {
		dataPoints[1].push(numDataPoints[i]);
	}
	return dataPoints;
}

// Working:
function convertToTeamMap(data: Table): TeamTableMap {
	const teamMap: TeamTableMap = new Map();
	// const points = getIndividualDatapoints(seasonMatches);
	let teamNameIndex = 0;
	if (data.length === 0) {
		return teamMap;
	}
	const points = data[0];
	for (let i = 0; i < data[0].length; i++) {
		if (points[i] === "Team") {
			teamNameIndex = i;
			break;
		}
	}
	for (let i = 1; i < data.length; i++) {
		if (!teamMap.has(data[i][teamNameIndex])) {
			teamMap.set(data[i][teamNameIndex], [data[0], data[i]]);
		} else {
			teamMap.get(data[i][teamNameIndex])?.push(data[i]);
		}
	}
	return teamMap;
}

// Working
function getTeamAverage(team: string, includeDead: boolean, _first: number, _last: number): Table {
	const teamData = getTeamNumData(team);
	if (teamData.length === 0 || teamData[0].length === 0) {
		return [["Team"], [team]];
	}

	const filteredRows: Table = [];
	const critFailIndex = getDataPointIndex("Critical Failure", teamData[0]);
	const matchNumberIndex = getDataPointIndex("Match Number", teamData[0]);

	for (let j = 0; j < teamData.length; j++) {
		if (
			(parseFloat(teamData[j][critFailIndex]) === 1 && !includeDead) ||
			parseFloat(teamData[j][matchNumberIndex]) < minQual ||
			parseFloat(teamData[j][matchNumberIndex]) > maxQual
		) {
			continue;
		}

		const row: string[] = [];
		for (let i = 0; i < teamData[j].length; i++) {
			if (teamData[0][i] !== "Match Number" && teamData[0][i] !== "Team") {
				row.push(teamData[j][i]);
			}
		}
		filteredRows.push(row);
	}

	if (filteredRows.length === 0) {
		return [["Team"], [team]];
	}

	const headers = [...filteredRows[0]];
	const totals = Array.from({ length: headers.length }, () => 0);
	for (const row of filteredRows) {
		for (let i = 0; i < row.length; i++) {
			totals[i] += parseFloat(row[i] || "0");
		}
	}

	const averages = totals.map((value) => (value / filteredRows.length).toFixed(1));
	return [
		["Team", ...headers],
		[team, ...averages],
	];
}

function getTeamAverageMedian(
	team: string,
	includeDead: boolean,
	_first: number,
	_last: number,
): Table {
	const teamData = getTeamNumData(team);
	if (teamData.length === 0 || teamData[0].length === 0) {
		return [["Team"], [team]];
	}

	const filteredRows: Table = [];
	const critFailIndex = getDataPointIndex("Critical Failure", teamData[0]);
	const matchNumberIndex = getDataPointIndex("Match Number", teamData[0]);

	for (let j = 0; j < teamData.length; j++) {
		if (
			(parseFloat(teamData[j][critFailIndex]) === 1 && !includeDead) ||
			parseFloat(teamData[j][matchNumberIndex]) < minQual ||
			parseFloat(teamData[j][matchNumberIndex]) > maxQual
		) {
			continue;
		}

		const row: string[] = [];
		for (let i = 0; i < teamData[j].length; i++) {
			if (teamData[0][i] !== "Match Number" && teamData[0][i] !== "Team") {
				row.push(teamData[j][i]);
			}
		}
		filteredRows.push(row);
	}

	if (filteredRows.length === 0) {
		return [["Team"], [team]];
	}

	const headers = [...filteredRows[0]];
	const medianValues: string[] = [];
	for (let i = 0; i < headers.length; i++) {
		const samples = filteredRows.slice(1).map((row) => parseFloat(row[i] || "0"));
		medianValues.push(median(samples).toFixed(1));
	}
	return [
		["Team", ...headers],
		[team, ...medianValues],
	];
}

function median(arr: number[]): number {
	arr.sort((a, b) => a - b);

	const mid = Math.floor(arr.length / 2);

	if (arr.length % 2 === 0) {
		return (arr[mid - 1] + arr[mid]) / 2;
	} else {
		return arr[mid];
	}
}

// Working:
function getTeamAverageMap(
	includeDead: boolean,
	first: number,
	last: number,
	mean: boolean,
): TeamTableMap {
	const averageMap: TeamTableMap = new Map();
	const teams: string[] = [];
	numTeamMap.forEach((_value, key) => {
		teams.push(key);
	});
	for (let i = 0; i < teams.length; i++) {
		let teamAverage = mean
			? getTeamAverage(teams[i], includeDead, first, last)
			: getTeamAverageMedian(teams[i], includeDead, first, last);
		if (teamAverage.length > 1 && teamAverage[1].length > 0) {
			averageMap.set(teams[i], teamAverage);
		}
	}
	return averageMap;
}
