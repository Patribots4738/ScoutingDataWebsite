export default function CustomizedAxisTick(props: {
	x?: number;
	y?: number;
	payload?: { value: string };
}) {
	const { x, y, payload } = props;
	let label = payload?.value ?? "";
	if (label.length > 7) {
		// Change this value to adjust the maximum length
		label = label.slice(0, 10) + "..."; // Truncate and add ellipsis
	}

	return (
		<g transform={`translate(${x},${y})`}>
			<text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
				{label}
			</text>
		</g>
	);
}
