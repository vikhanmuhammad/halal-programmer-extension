import * as vscode from 'vscode';

export interface Coordinates {
	latitude: number;
	longitude: number;
}

export async function resolveLocation(): Promise<Coordinates | undefined> {
	const fromIp = await tryIpGeolocation();
	if (fromIp) return fromIp;

	const config = vscode.workspace.getConfiguration('halalProgramming');
	const latitude = config.get<number | null>('location.latitude');
	const longitude = config.get<number | null>('location.longitude');
	if (typeof latitude === 'number' && typeof longitude === 'number') {
		return { latitude, longitude };
	}

	return undefined;
}

async function tryIpGeolocation(): Promise<Coordinates | undefined> {
	try {
		const response = await fetch('http://ip-api.com/json', { signal: AbortSignal.timeout(5000) });
		if (!response.ok) return undefined;

		const data = (await response.json()) as { status?: string; lat?: number; lon?: number };
		if (data.status === 'success' && typeof data.lat === 'number' && typeof data.lon === 'number') {
			return { latitude: data.lat, longitude: data.lon };
		}
		return undefined;
	} catch {
		return undefined;
	}
}
