import { useEffect, useState } from "preact/hooks";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import type { BarChartProps, RadarDataPoint } from "../types";
import CustomizedAxisTick from "./CustomizedAxisTick";

export default function MyBarChart(barChartProps: BarChartProps) {
	const [max, setMax] = useState(0);

	function findMax(values: RadarDataPoint[]) {
		return values.reduce((max, obj) => {
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (key === "key") continue;
					const value = obj[key];
					if (typeof value !== "number" || Number.isNaN(value)) continue;
					if (value > max) {
						max = value;
					}
				}
			}
			return max;
		}, 0);
	}

	useEffect(() => {
		let myMax;
		// find the max value in the array of objects and ignore any values that are not numbers or could be a number
		myMax = findMax(barChartProps.data);

		setMax(myMax);
	}, [barChartProps.data]);

	return (
		<BarChart
			width={barChartProps.width}
			height={barChartProps.height}
			data={barChartProps.data}
			margin={barChartProps.margin}
		>
			<CartesianGrid strokeDasharray="3 3" />
			<XAxis dataKey="key" tick={<CustomizedAxisTick />} />
			<YAxis
				domain={[0, max]}
				tickCount={10}
				tickFormatter={(value: number) =>
					`${max === 0 ? 0 : Math.min(100, (value / max) * 100).toFixed(0)}%`
				}
			/>
			<Tooltip cursor={false} />
			<Legend height={36} position={"top"} />
			{barChartProps.teamList.map((team, index) => {
				return (
					<Bar key={index} dataKey={team} fill={barChartProps.barConfigs[index].fill} />
				);
			})}
		</BarChart>
	);
}
