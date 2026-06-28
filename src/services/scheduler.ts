import * as vscode from 'vscode';
import { resolveLocation } from './location';
import { getTodaysTimings, localDateKey, PrayerTimings } from './prayerTimes';
import { showPrayerBlock } from '../webview/prayerBlock';

const LAST_SHOWN_KEY = 'halalProgramming.lastShownPrayer';
const GRACE_MINUTES = 15;
const PRAYER_NAMES: (keyof PrayerTimings)[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

let warnedNoLocation = false;

export function startScheduler(context: vscode.ExtensionContext): vscode.Disposable {
	const tick = () => void runTick(context);

	tick();
	const interval = setInterval(tick, 60_000);
	// Sleep/hibernate can skip interval ticks; re-check as soon as the window regains focus.
	const focusListener = vscode.window.onDidChangeWindowState((e) => {
		if (e.focused) tick();
	});

	return new vscode.Disposable(() => {
		clearInterval(interval);
		focusListener.dispose();
	});
}

async function runTick(context: vscode.ExtensionContext): Promise<void> {
	const enabled = vscode.workspace.getConfiguration('halalProgramming').get<boolean>('prayerNotification.enabled', true);
	if (!enabled) return;

	const coords = await resolveLocation();
	if (!coords) {
		if (!warnedNoLocation) {
			warnedNoLocation = true;
			void vscode.window.showWarningMessage(
				'Halal Programmer could not detect your location for prayer times. Set halalProgramming.location.latitude/longitude in Settings.',
			);
		}
		return;
	}

	const timings = await getTodaysTimings(context, coords);
	if (!timings) return;

	const now = new Date();
	const today = localDateKey(now);
	const nowMinutes = now.getHours() * 60 + now.getMinutes();

	for (const name of PRAYER_NAMES) {
		const prayerMinutes = toMinutes(timings[name]);
		if (prayerMinutes === undefined) continue;

		const minutesSincePrayer = nowMinutes - prayerMinutes;
		if (minutesSincePrayer < 0 || minutesSincePrayer > GRACE_MINUTES) continue;

		const shownKey = `${today}-${name}`;
		if (context.globalState.get<string>(LAST_SHOWN_KEY) === shownKey) continue;

		await context.globalState.update(LAST_SHOWN_KEY, shownKey);
		showPrayerBlock(name);
	}
}

function toMinutes(hhmm: string): number | undefined {
	const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
	if (!match) return undefined;
	return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}
