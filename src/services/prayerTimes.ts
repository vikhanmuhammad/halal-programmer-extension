import * as vscode from 'vscode';
import { Coordinates } from './location';

export interface PrayerTimings {
	Fajr: string;
	Dhuhr: string;
	Asr: string;
	Maghrib: string;
	Isha: string;
}

interface PrayerCache {
	date: string;
	timings: PrayerTimings;
}

const CACHE_KEY = 'halalProgramming.prayerCache';

export function localDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export async function getTodaysTimings(
	context: vscode.ExtensionContext,
	coords: Coordinates,
): Promise<PrayerTimings | undefined> {
	const today = localDateKey(new Date());
	const cached = context.globalState.get<PrayerCache>(CACHE_KEY);
	if (cached && cached.date === today) {
		return cached.timings;
	}

	const fetched = await fetchTimings(coords);
	if (fetched) {
		await context.globalState.update(CACHE_KEY, { date: today, timings: fetched });
		return fetched;
	}

	// Offline fallback: better to keep using a stale cached schedule than show nothing.
	return cached?.timings;
}

async function fetchTimings(coords: Coordinates): Promise<PrayerTimings | undefined> {
	try {
		const method = vscode.workspace.getConfiguration('halalProgramming').get<number>('calculationMethod', 3);
		const timestamp = Math.floor(Date.now() / 1000);
		const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${method}`;
		const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!response.ok) return undefined;

		const data = (await response.json()) as { data?: { timings?: Record<string, string> } };
		const timings = data.data?.timings;
		if (!timings) return undefined;

		return {
			Fajr: stripTimezone(timings.Fajr),
			Dhuhr: stripTimezone(timings.Dhuhr),
			Asr: stripTimezone(timings.Asr),
			Maghrib: stripTimezone(timings.Maghrib),
			Isha: stripTimezone(timings.Isha),
		};
	} catch {
		return undefined;
	}
}

function stripTimezone(value: string): string {
	return value.split(' ')[0];
}
