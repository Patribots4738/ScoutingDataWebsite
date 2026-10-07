import { useEffect, useState } from "preact/hooks";
import { fetchDataAndProcess } from "../Data";
import "./Tables.css";
import type { DataRow, RawDataResult } from "../types";

type RawDataKey = keyof RawDataResult;

export default function RawData() {
	const [data, setData] = useState<RawDataResult>();
	const [headers, setHeaders] = useState<string[]>([]);
	const [selectedDataMap, setSelectedDataMap] = useState<RawDataKey>("rawDataMap");

	function sortByKey(arr: DataRow[], key: string): DataRow[] {
		return arr.sort((a, b) => {
			if (Number(a[key]) > Number(b[key])) return 1;
			else if (Number(a[key]) < Number(b[key])) return -1;
			else return 0;
		});
	}

	useEffect(() => {
		setTimeout(() => {
			fetchDataAndProcess("RawData").then((data) => {
				console.log("Raw Data Opened");
				setData(data);
				const selectedData = data[selectedDataMap];
				setHeaders(Object.keys(selectedData[0] ?? {}));
				sortByKey(selectedData, "Match Number");
			});
		}, 100);
	}, [selectedDataMap]); // Add selectedDataMap to the dependency array

	if (!data) {
		return <div>Loading...</div>;
	}

	function handleChange(e: Event) {
		const selectedOption = (e.currentTarget as HTMLSelectElement).value;
		setSelectedDataMap(selectedOption === "Num Data" ? "rawDataMap" : "commentDataMap");
	}

	return (
		<div className="raw-data">
			<div className="container">
				<link
					rel="stylesheet"
					href={
						"https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css"
					}
				></link>
				<table className="table">
					<thead className="header">
						<tr>
							{headers.map((header, index) => (
								<th key={index}>{header}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data[selectedDataMap as keyof RawDataResult].map((item, index) => (
							// Use selectedDataMap here
							<tr key={index}>
								{headers.map((header, index) => (
									<td key={index}>{item[header]}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<select onChange={handleChange}>
				<option value={"Num Data"}>Num Data</option>
				<option value={"Comment Data"}>Comment Data</option>
			</select>
		</div>
	);
}
