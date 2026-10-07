import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import type { RadarDataPoint } from "../types";

export default function RadarGraphSearch(props: {
	data: RadarDataPoint[];
	angleKey: string;
	radiusDomain: [number, number];
	radar1: {
		name: string;
		dataKey: string;
		stroke: string;
		fill: string;
		fillOpacity: number;
	};
}) {
	return (
		<div>
			<RadarChart outerRadius={90} width={350} height={250} data={props.data}>
				<PolarGrid />
				<PolarAngleAxis dataKey={props.angleKey} />
				<PolarRadiusAxis angle={30} domain={props.radiusDomain} />
				<Radar
					dataKey={props.radar1.dataKey}
					stroke={props.radar1.stroke}
					fill={props.radar1.fill}
					fillOpacity={props.radar1.fillOpacity}
				/>
				<Radar
					stroke={props.radar1.stroke}
					fill="#82ca9d"
					fillOpacity={0.6}
					dataKey={"average"}
				/>
			</RadarChart>
		</div>
	);
}
