import * as vscode from 'vscode';
import { showStartupGate } from './webview/startupGate';
import { showCloseGate } from './webview/closeGate';
import { showPrayerBlock } from './webview/prayerBlock';
import { startScheduler } from './services/scheduler';
import { resolveLocation } from './services/location';
import { getTodaysTimings } from './services/prayerTimes';
import { getLang, t } from './i18n';

let schedulerDisposable: vscode.Disposable | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	registerGuardedCloseCommands(context);
	registerPrayerCommands(context);
	registerLanguageCommand(context);

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
		void vscode.window.showWarningMessage(t('locationUnavailable'));
		return;
	}

	const timings = await getTodaysTimings(context, coords);
	if (!timings) {
		void vscode.window.showWarningMessage(t('scheduleUnavailable'));
		return;
	}

	void vscode.window.showInformationMessage(
		`${t('todaysPrayerTimes')} (lat ${coords.latitude.toFixed(2)}, long ${coords.longitude.toFixed(2)}): ` +
			`Fajr ${timings.Fajr} · Dhuhr ${timings.Dhuhr} · Asr ${timings.Asr} · Maghrib ${timings.Maghrib} · Isha ${timings.Isha}`,
	);
}

const LANGUAGE_OPTIONS: { label: string; value: 'en' | 'id' }[] = [
	{ label: 'English', value: 'en' },
	{ label: 'Bahasa Indonesia', value: 'id' },
];

function registerLanguageCommand(context: vscode.ExtensionContext): void {
	context.subscriptions.push(vscode.commands.registerCommand('halalProgramming.changeLanguage', changeLanguage));
}

async function changeLanguage(): Promise<void> {
	const current = getLang();
	const picked = await vscode.window.showQuickPick(
		LANGUAGE_OPTIONS.map((option) => ({
			label: option.value === current ? `${option.label} (current)` : option.label,
			value: option.value,
		})),
		{ placeHolder: 'Select the language for Halal Programmer' },
	);

	if (!picked) return;

	await vscode.workspace
		.getConfiguration('halalProgramming')
		.update('uiLanguage', picked.value, vscode.ConfigurationTarget.Global);
}
