import { get, ref } from "firebase/database";
import "firebase/database";
import { db } from "../Config";
import type { DatabaseStructure } from "../types";

//Frank's Middle
export async function getAllData(): Promise<DatabaseStructure> {
	try {
		const dbRef = ref(db);
		const snapshot = await get(dbRef);
		if (snapshot.exists()) {
			// Assume it's JSON because it's getting **all** data
			const data = snapshot.val();
			return JSON.parse(data);
		} else {
			console.log("No data available");
		}
	} catch (error) {
		console.error("Error fetching data: ", error);
	}
	return {};
}

//function to get the data of a match a team played in the case of missing data
export async function getData(
	path: string,
): Promise<object | Array<unknown> | string | number | boolean | null> {
	try {
		const dbRef = ref(db, path);
		const snapshot = await get(dbRef);
		if (snapshot.exists()) {
			const data = snapshot.val();
			return JSON.stringify(data);
		} else {
			console.log("No data available");
		}
	} catch (error) {
		console.error("Error fetching data: ", error);
	}
	return {};
}
