// Firebase RTDB structure as a type
import type { Margin } from "recharts";

export type DatabaseStructure = {
	[seasonCode: string]: {
		[eventCode: string]: {
			[matchCode: string]: {
				[scouterString: string]: {
					comments: CommentData;
					data: MatchData;
				};
			};
		};
	};
};

export type MergedSeasonMatches = {
	[matchCode: string]: {
		[teamNumber: string]: {
			comments: CommentData;
			data: MatchData;
		};
	};
};

export type CommentData = {
	"Auto Description": string;
	Comments: string;
	Name: string;
	"Off Time": string;
	Team: string;
};

export type MatchData = {
	Alliance: "RED" | "BLUE";
	"Climb Failure": string;
	"Critical Failure": string;
	"Fumble Percent": string;
	"Ground Intake": string;
	"L1 Climb": string;
	"L2 Climb": string;
	"Match Number": string;
	"Over Bump": string;
	"Pass Teleop": string;
	"Score Auto": string;
	"Score Teleop": string;
	"Shooting While Driving": string;
	"Station Intake": string;
	Team: string;
	"Temp Failure": string;
	"Traversal Climb": string;
	"Under Trench": string;
};

export type FrcColorsResponse = {
	teams: {
		[teamNumber: string]: TeamColor;
	};
};

export type TeamColor = {
	teamNumber: number;
	colors: {
		primaryHex: string;
		secondaryHex: string;
		verified: boolean;
	} | null;
};

export type Table = string[][];

export type DataRow = Record<string, string>;

export type DataTable = DataRow[];

export type TeamTableMap = Map<string, Table>;

export type NumericMap = Map<string, number>;

export type RangeMap = Map<string, [string, string]>;

export type ScoreWeightMap = Record<string, number>;

export type TeamOption = {
	value: string;
	label: string;
	color?: string;
};

export type RadarDataPoint = {
	key: string;
	value: number;
	average?: number;
	[team: string]: string | number | undefined;
};

export type RawDataResult = {
	rawDataMap: DataTable;
	commentDataMap: DataTable;
};

export type SearchResult = {
	teamAverageMap: TeamTableMap;
	bigTeamMapSplit: [TeamTableMap, TeamTableMap];
	maxMinOfAverages: RangeMap;
	globalAverageMap: NumericMap;
};

export type RankingsResult = {
	teamAverageMap: TeamTableMap;
	rankingTable: DataTable;
};

export type CompareTeamsResult = {
	teamAverageMap: TeamTableMap;
	maxMinOfAverages: RangeMap;
};

export type ProcessedData = RawDataResult | SearchResult | RankingsResult | CompareTeamsResult;

export const radarDataPoints = ["Endgame", "Teleop", "Auto", "Score", "Rating"];

type RadarConfig = {
	name: string;
	dataKey: string;
	stroke: string;
	fill: string;
	fillOpacity: number;
};

export type RadarGraphProps = {
	data: RadarDataPoint[];
	angleKey: string;
	radiusDomain: [number, number];
	radars: RadarConfig[];
};

type BarConfig = { fill: string };

export type BarChartProps = {
	width: number;
	height: number;
	data: RadarDataPoint[];
	margin: Margin;
	barConfigs: BarConfig[];
	teamList: string[];
};
