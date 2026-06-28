import * as vscode from 'vscode';
import { showStartupGate } from './webview/startupGate';
import { showCloseGate } from './webview/closeGate';
import { showPrayerBlock } from './webview/prayerBlock';
import { startScheduler } from './services/scheduler';
import { resolveLocation } from './services/location';
import { getTodaysTimings } from './services/prayerTimes';

let schedulerDisposable: vscode.Disposable | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	registerGuardedCloseCommands(context);
	registerPrayerCommands(context);

	await showStartupGate(getVoiceLocale());

	schedulerDisposable = startScheduler(context);
	context.subscriptions.push(schedulerDisposable);
}

export function deactivate(): void {
	schedulerDisposable?.dispose();
}

function getVoiceLocale(): string {
	return vscode.workspace.getConfiguration('halalProgramming').get<string>('voiceLocale', 'en-US');
}

function registerGuardedCloseCommands(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('halalProgramming.guardedCloseWindow', () =>
			guardedClose('workbench.action.closeWindow'),
		),
		vscode.commands.registerCommand('halalProgramming.guardedQuit', () => guardedClose('workbench.action.quit')),
	);
}

async function guardedClose(realCommand: string): Promise<void> {
	const closingGateEnabled = vscode.workspace
		.getConfiguration('halalProgramming')
		.get<boolean>('closingGate.enabled', true);

	if (closingGateEnabled) {
		await showCloseGate(getVoiceLocale());
	}

	await vscode.commands.executeCommand(realCommand);
}

function registerPrayerCommands(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('halalProgramming.debugTriggerPrayerBlock', () => {
			showPrayerBlock('Test');
		}),
		vscode.commands.registerCommand('halalProgramming.showPrayerSchedule', () => showPrayerSchedule(context)),
	);
}

async function showPrayerSchedule(context: vscode.ExtensionContext): Promise<void> {
	const coords = await resolveLocation();
	if (!coords) {
		void vscode.window.showWarningMessage(
			'Halal Programmer could not detect your location. Set halalProgramming.location.latitude/longitude in Settings.',
		);
		return;
	}

	const timings = await getTodaysTimings(context, coords);
	if (!timings) {
		void vscode.window.showWarningMessage("Halal Programmer could not fetch today's prayer schedule. Check your internet connection.");
		return;
	}

	void vscode.window.showInformationMessage(
		`Today's prayer times (lat ${coords.latitude.toFixed(2)}, long ${coords.longitude.toFixed(2)}): ` +
			`Fajr ${timings.Fajr} · Dhuhr ${timings.Dhuhr} · Asr ${timings.Asr} · Maghrib ${timings.Maghrib} · Isha ${timings.Isha}`,
	);
}
