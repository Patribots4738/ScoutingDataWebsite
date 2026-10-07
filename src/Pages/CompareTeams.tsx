import { lazy, Suspense } from "preact/compat";
import { useEffect, useMemo, useState } from "preact/hooks";
import "./CompareTeams.css";
import "./Tables.css";
import { fetchDataAndProcess } from "../Data";
import Select, { type StylesConfig } from "react-select";
import type {
	RadarDataPoint,
	RangeMap,
	Table,
	TeamColor,
	TeamOption,
	TeamTableMap,
} from "../types";

export default function Compare() {
	const [averageData, setAverageData] = useState<TeamTableMap>(new Map());
	const [allTeams, setAllTeams] = useState<string[]>([]);
	const [teamData, setTeamData] = useState<Table[]>([]);
	const [maxMin, setMaxMin] = useState<RangeMap>(new Map());
	const [teamColors, setTeamColors] = useState<Record<string, TeamColor>>({});
	const [teamList, setTeamList] = useState<string[]>([]);

	const MyBarChart = lazy(() => import("../widgets/MyBarChart"));
	const RadarGraph = lazy(() => import("../widgets/RadarGraph"));

	const radarDataPoints = [
		"Endgame",
		"Teleop",
		"Branch Pieces",
		"Net",
		"Processor",
		"L1",
		"Auto",
	];

	function getAllTeams(data: { teamAverageMap: TeamTableMap }): string[] {
		const teams: string[] = [];
		data.teamAverageMap.forEach((_value, key) => {
			teams.push(key);
		});
		return teams;
	}

	// make a get request to https://api.frc-colors.com/v1/team?team=581&team=254&team=1678
	// to get the team colors
	useEffect(() => {
		// check if the team list is empty
		if (teamList.length === 0) return;
		const teamQueryString = teamList.map((team) => `team=${team}`).join("&");
		const url = `https://api.frc-colors.com/v1/team?${teamQueryString}`;
		fetch(url)
			.then((response) => response.json())
			.then((data: { teams: Record<string, TeamColor> }) => {
				setTeamColors(data.teams);
			})
			.catch((error) => console.error(error));
	}, [teamList]);

	useEffect(() => {
		setTimeout(() => {
			fetchDataAndProcess("CompareTeams").then((data) => {
				console.log("Compare Teams Opened");
				setAllTeams(getAllTeams(data));
				setAverageData(data.teamAverageMap);
				setMaxMin(data.maxMinOfAverages);
			});
		}, 1000);
	}, []);

	useEffect(() => {
		const allTeamData: Table[] = [];
		teamList.forEach((team) => {
			const thisTeamData = averageData.get(team);
			if (thisTeamData) allTeamData.push(thisTeamData);
		});

		setTeamData(allTeamData);
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [teamList]);

	function emptyData(data: Table[]): boolean {
		return data === undefined || data[0] === undefined || data[0].length === 0;
	}

	function updateAfterSelect(selectedOption: readonly TeamOption[]) {
		setTeamList(selectedOption.map((option) => option.value));
	}

	const getTeamColor = useMemo(() => {
		return (team: string) => {
			if (Object.keys(teamColors).length === 0) return "black";
			try {
				if (!(teamColors[team] && teamColors[team].colors)) return "grey";
				return teamColors[team]["colors"]["primaryHex"];
			} catch (error) {
				console.error(error);
				return "black";
			}
		};
	}, [teamColors]);

	const selectorConfig: StylesConfig<TeamOption, true> = {
		control: (base) => ({
			...base,
			width: 300,
			height: "auto",
			fontSize: 20,
			margin: "23% 0 0 0",
			backgroundColor: "--background-color",
		}),

		multiValue: (base, { data }) => ({
			...base,
			backgroundColor: `${getTeamColor(data.value)}70`, // Add alpha value (80) for transparency
			color: "white",
		}),

		multiValueLabel: (base) => ({
			...base,
			color: "white",
		}),

		multiValueRemove: (base) => ({
			...base,
			color: "white",
			":hover": {
				backgroundColor: "black",
				color: "white",
			},
		}),

		option: (styles, { data, isDisabled, isFocused, isSelected }) => {
			return {
				...styles,
				backgroundColor: isDisabled
					? "#383838"
					: isSelected
						? "black"
						: isFocused
							? "black"
							: "#ffffff",
				color: isDisabled ? "#ccc" : isSelected ? "white" : isFocused ? "white" : "black",
				cursor: isDisabled ? "not-allowed" : "default",
				":active": {
					...styles[":active"],
					backgroundColor: isSelected ? (data.color ?? "black") : "black",
				},
			};
		},
	};

	function renderSelect() {
		return (
			<Select<TeamOption, true>
				options={Array.from(allTeams).map((team) => ({
					value: team,
					label: team,
				}))}
				isMulti
				onChange={(selectedOption) => {
					if (selectedOption.length <= 6) updateAfterSelect(selectedOption);
				}}
				closeMenuOnSelect={false}
				styles={selectorConfig}
				value={teamList.map((team) => ({ value: team, label: team }))}
			/>
		);
	}

	if (emptyData(teamData)) {
		return (
			<div className="search-compare">
				<div className="search-bar-compare">{renderSelect()}</div>
				<div className="team-stats-compare">No Data</div>
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
	function convertForReCharts(isBar: boolean): RadarDataPoint[] {
		const arr: RadarDataPoint[] = [];
		console.log(teamData);
		for (let i = 1; i < teamData[0][0].length; i++) {
			if (isRadarPoint(teamData[0][0][i])) {
				const categoryObj: RadarDataPoint = { key: teamData[0][0][i], value: 0 };
				for (let j = 0; j < teamData.length; j++) {
					const range = maxMin.get(teamData[j][0][i]);
					if (!range) continue;
					const min = Number(range[0]);
					const max = Number(range[1]);
					const val = ((Number(teamData[j][1][i]) - min) / (max - min)) * 100;
					if (isBar) {
						categoryObj[teamList[j]] = teamData[j][1][i];
					} else {
						categoryObj[teamList[j]] = val;
					}
				}
				arr.push(categoryObj);
			}
		}

		console.log(arr);
		return arr;
	}

	const colors = [
		"#d4af37",
		"#3AD437",
		"#D43737",
		"#3776D4",
		"#D43776",
		"#76D437",
		"#D47637",
		"#3737D4",
		"#D4D437",
		"#37D4D4",
	]; // Add more colors if needed

	const colorConfig: Record<string, { fill: string }> = colors.reduce<
		Record<string, { fill: string }>
	>((config, color, index) => {
		config[`team${index + 1}`] = {
			fill: color,
		};
		return config;
	}, {});

	return (
		<div className="search-compare">
			<div className="search-bar-compare">{renderSelect()}</div>
			<div className="team-stats-compare">
				<div className="bar-chart">
					<Suspense fallback={<div>Loading...</div>}>
						<MyBarChart
							width={1000}
							height={200}
							data={convertForReCharts(true)}
							margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
							barConfigs={teamList.map(
								(_team, index) => colorConfig[`team${index + 1}`],
							)}
							teamList={teamList}
						/>
					</Suspense>
				</div>

				<div className="radar-ct">
					<Suspense fallback={<div>Loading...</div>}>
						<RadarGraph
							data={convertForReCharts(false)}
							angleKey="key"
							radiusDomain={[0, 100]}
							radars={teamList.slice(0, 10).map((team, index) => ({
								name: team,
								dataKey: team,
								stroke: colorConfig[`team${index + 1}`].fill,
								fill: colorConfig[`team${index + 1}`].fill,
								fillOpacity: 0.4,
							}))}
						/>
					</Suspense>
				</div>
			</div>
		</div>
	);
}
