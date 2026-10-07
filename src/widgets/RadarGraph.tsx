import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import type { RadarGraphProps } from "../types";

export default function RadarGraph(props: RadarGraphProps) {
	const radars = props.radars.slice(0, 10); // Limit to 10 teams

	return (
		<div>
			<RadarChart outerRadius={90} width={400} height={300} data={props.data}>
				<PolarGrid />
				<PolarAngleAxis dataKey={props.angleKey} />
				<PolarRadiusAxis angle={30} domain={props.radiusDomain} />
				{radars.map((radar) => (
					<Radar
						key={radar.dataKey}
						dataKey={radar.dataKey}
						stroke={radar.stroke}
						fill={radar.fill}
						fillOpacity={radar.fillOpacity}
					/>
				))}
			</RadarChart>
		</div>
	);
}
