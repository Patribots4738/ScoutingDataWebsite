import { useEffect, useMemo, useState } from "preact/hooks";
import { lazy, Suspense } from "preact/compat";
import { fetchDataAndProcess, resortColumnsByArray, whitelistDataPoints } from "../Data";
import "./Search.css";
import "./Tables.css";
import Select, { type StylesConfig } from "react-select";
import {
	type FrcColorsResponse,
	type NumericMap,
	type RadarDataPoint,
	radarDataPoints,
	type RangeMap,
	type Table,
	type TeamOption,
	type TeamTableMap,
} from "../types";

export default function Search() {
	const [averageData, setAverageData] = useState<TeamTableMap>(new Map());
	const [matchData, setMatchData] = useState<[TeamTableMap, TeamTableMap]>([
		new Map(),
		new Map(),
	]);
	const [team, setTeam] = useState("");
	const [teamData, setTeamData] = useState<string[][]>([]);
	const [teamMatchDataNum, setTeamMatchDataNum] = useState<Table>([]);
	const [teamMatchDataComment, setTeamMatchDataComment] = useState<Table>([]);
	const [matchDataType, setMatchDataType] = useState<"num" | "comment">("num");
	const [maxMin, setMaxMin] = useState<RangeMap>(new Map());
	const [allTeams, setAllTeams] = useState<string[]>([]);
	const [teamColors, setTeamColors] = useState<FrcColorsResponse>({ teams: {} });
	const [globalAverageMap, setGlobalAverageMap] = useState<NumericMap>(new Map());

	const RadarGraphSearch = lazy(() => import("../widgets/RadarGraphSearch"));

	const numHeaders = [
		"Match Number",
		"Score",
		// Auto section
		"Climb Auto",
		"Start Depot",
		"Start Hub",
		"Start Outpost",
		"Outpost Intake",
		"Depot Intake",
		"Center Intake Auto",
		"Score Auto",
		"Climb Failure Auto",
		"Auto", // If you have an auto total score
		// Teleop section
		"Score Teleop",
		"Pass Teleop",
		"Fumble Percent",
		"Teleop", // If you have a teleop total score
		// Endgame/Climb section
		"L1 Climb",
		"L2 Climb",
		"Traversal Climb",
		"Climb Failure",
		"Endgame", // If you have an endgame total score
		// Other
		"Ground Intake",
		"Station Intake",
		"Temp Failure",
		"Critical Failure",
		"Over Bump",
		"Under Trench",
		"Shooting While Driving",
		"Rating", // If you have a rating score
		"Failure", // If you have a failure score
	];

	const commentHeaders = [
		"Match Number",
		"Name",
		"Team",
		"Auto Path",
		"Auto Description",
		"Off Time",
		"Comments",
	];

	function getAllTeams(data: { teamAverageMap: TeamTableMap }): string[] {
		const teams: string[] = [];
		data.teamAverageMap.forEach((_value, key) => {
			teams.push(key);
		});
		return teams;
	}

	useEffect(() => {
		setTimeout(() => {
			fetchDataAndProcess("Search").then((data) => {
				console.log("Search Opened");
				setAverageData(data.teamAverageMap);
				setMatchData(data.bigTeamMapSplit);
				setMaxMin(data.maxMinOfAverages);
				setAllTeams(getAllTeams(data));
				setGlobalAverageMap(data.globalAverageMap);
			});
		}, 1000);
	}, []);

	useEffect(() => {
		if (averageData.size !== 0) {
			const average = averageData.get(team) ?? [[], []];
			setTeamData(resortColumnsByArray(whitelistDataPoints(average, numHeaders), numHeaders));
		}
		if (matchData[0].size !== 0 || matchData[1].size !== 0) {
			setTeamMatchDataNum(matchData[0].get(team) ?? []);
			setTeamMatchDataComment(matchData[1].get(team) ?? []);
		}
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [team]);

	useEffect(() => {
		// check if the team list is empty or undefined
		if (!allTeams || allTeams.length === 0) return;
		let teamQueryString = "";
		allTeams.forEach((team) => {
			teamQueryString += `team=${team}&`;
		});

		const url = `https://api.frc-colors.com/v1/team?${teamQueryString}`;

		fetch(url)
			.then((response) => response.json())
			.then((data) => {
				setTeamColors(data as FrcColorsResponse);
			})
			.catch((error) => console.error(error));
	}, [team, allTeams]);

	function isEmptyData(data: Table): boolean {
		return data === undefined || data[0] === undefined || data[0].length === 0;
	}

	const getTeamColor = useMemo(() => {
		return (team: string) => {
			if (Object.keys(teamColors.teams).length === 0) return "black";
			try {
				if (!(teamColors.teams[team] && teamColors.teams[team].colors)) return "grey";
				return teamColors.teams[team].colors.primaryHex;
			} catch (error) {
				console.error(error);
				return "black";
			}
		};
	}, [teamColors.teams]);

	function isColorCloseToWhite(color: string) {
		const hex = color.replace("#", "");
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 155;
	}

	const selectorConfig: StylesConfig<TeamOption, false> = {
		control: (base) => ({
			...base,
			color: "white",
			width: 300,
			height: "auto",
			fontSize: 20,
			margin: "23% 0 0 0",
			backgroundColor: "#383838",
		}),

		singleValue: (styles, { data }) => {
			const teamColor = getTeamColor(data.value);
			const isTeamColorCloseToWhite = isColorCloseToWhite(teamColor);
			return {
				...styles,
				color: isTeamColorCloseToWhite ? "black" : "white",
				backgroundColor: getTeamColor(data.value),
				borderRadius: 5,
				justifyContent: "center",
				display: "inline-flex",
				width: 65,
			};
		},

		option: (styles, { data, isDisabled, isFocused, isSelected }) => {
			const teamColor = getTeamColor(data.value);
			let isTeamColorCloseToWhite = false;
			if (isFocused) {
				isTeamColorCloseToWhite = isColorCloseToWhite(teamColor);
			}
			return {
				...styles,
				backgroundColor: isDisabled
					? "#383838"
					: isSelected
						? teamColor
						: isFocused
							? teamColor
							: "#383838",
				color: isDisabled ? "#ccc" : isTeamColorCloseToWhite ? "black" : "white",
				cursor: isDisabled ? "not-allowed" : "default",
			};
		},
	};

	function renderSelect() {
		return (
			<Select<TeamOption, false>
				options={Array.from(allTeams).map((team) => {
					const teamColor = teamColors.teams[team];
					return {
						value: team,
						label: team,
						color: teamColor?.colors?.primaryHex ?? "#000",
					};
				})}
				onChange={(selected) => {
					if (selected) setTeam(selected.value);
				}}
				styles={selectorConfig}
				isMulti={false} // Set isMulti to false for single selection
				defaultValue={team ? { value: team, label: team } : undefined}
			/>
		);
	}

	if (isEmptyData(teamData) || isEmptyData(teamMatchDataNum)) {
		return (
			<div className="search">
				<div className="search-bar">
					<div className="search-input">{renderSelect()}</div>
				</div>
				<div className="team-stats">No Data</div>
			</div>
		);
	}

	// checks data point string against the data point array to
	// see if the data point should be on the radar chart
	function isRadarPoint(dataPoint: string): boolean {
		for (let i = 0; i < radarDataPoints.length; i++) {
			if (dataPoint === radarDataPoints[i]) return true;
		}
		return false;
	}

	// selects data points from teamData and formats them for
	// the radar chart
	function convertRadar() {
		const arr: RadarDataPoint[] = [];
		console.log("Team Data: " + teamData);
		for (let i = 1; i < teamData[0].length; i++) {
			if (isRadarPoint(teamData[0][i])) {
				const range = maxMin.get(teamData[0][i]);
				const averageValue = globalAverageMap.get(teamData[0][i]);
				if (!range || averageValue === undefined) continue;
				const min = Number(range[0]);
				const max = Number(range[1]);
				const val = ((Number(teamData[1][i]) - min) / (max - min)) * 100;
				const average = ((averageValue - min) / (max - min)) * 100;
				console.log(average);
				arr.push({ key: teamData[0][i], value: val, average: average });
			}
		}
		console.log(arr);
		return arr;
	}

	// returns the section of the match data to display based on if the current data
	// type is either numbers or comments
	function matchContent(matchesNum: Table, matchesComment: Table): Table {
		let matches: Table;
		if (matchDataType === "num") {
			matches = resortColumnsByArray(whitelistDataPoints(matchesNum, numHeaders), numHeaders);
		} else {
			matches = resortColumnsByArray(
				whitelistDataPoints(matchesComment, commentHeaders),
				commentHeaders,
			);
		}
		let matchDataNoKeys = matches.slice(1);
		sortByIndex(matchDataNoKeys, 0);
		return [matches[0], ...matchDataNoKeys];
	}

	function sortByIndex(arr: Table, index: number): Table {
		return arr.sort((a, b) => {
			if (Number(a[index]) > Number(b[index])) return 1;
			else if (Number(a[index]) < Number(b[index])) return -1;
			else return 0;
		});
	}

	// changes match data type to either num or comment
	function handleSelectChange(e: Event) {
		const nextType = (e.currentTarget as HTMLSelectElement).value;
		if (nextType === "num" || nextType === "comment") {
			setMatchDataType(nextType);
		}
	}

	let headers = teamData[0].slice(1);
	let stats = teamData[1].slice(1);
	let matches = matchContent(teamMatchDataNum, teamMatchDataComment);

	let matchHeads = matches[0];
	let matchStats = matches.slice(1);

	return (
		<div className="search">
			<div className="search-bar">
				<div className="search-input">{renderSelect()}</div>
			</div>
			<div className="team-stats">
				<div className="team-average-header">Averages</div>
				<div className="average-stats-container">
					<table className="table">
						{/* Render headers */}
						<thead className="header">
							<tr>
								{headers.map((header, index) => (
									<th key={index}>{header}</th>
								))}
							</tr>
						</thead>

						{/* Render content */}
						<tbody>
							<tr>
								{stats.map((cellData, index) => {
									const numericValue = Number(cellData);
									return (
										<td key={index}>
											{Number.isNaN(numericValue)
												? cellData
												: Math.round(numericValue * 100) / 100}
										</td>
									);
								})}
							</tr>
						</tbody>
					</table>
				</div>
				<div className="radar">
					<Suspense fallback={<div>Loading Radar Graph...</div>}>
						<RadarGraphSearch
							data={convertRadar()}
							angleKey="key"
							radiusDomain={[0, 100]}
							radar1={{
								name: team,
								dataKey: "value",
								stroke: "#d4af37",
								fill: "#d4af37",
								fillOpacity: 0.6,
							}}
						/>
					</Suspense>
				</div>
				<div className="team-match-header">Matches</div>
				<div className="match-content-selector">
					<select className="selector" onChange={handleSelectChange}>
						<option value="num">Numbers</option>
						<option value="comment">Comments</option>
					</select>
				</div>
				<div className="match-stats-container">
					<table className="table">
						{/* Render headers */}
						<thead className="header">
							<tr>
								{matchHeads.map((header, index) => (
									<th key={index}>{header}</th>
								))}
							</tr>
						</thead>

						{/* Render data */}
						<tbody>
							{matchStats.map((rowData, rowIndex) => (
								<tr key={rowIndex}>
									{rowData.map((cellData, cellIndex) => (
										<td key={cellIndex}>{cellData}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
