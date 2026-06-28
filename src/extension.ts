import * as vscode from 'vscode';
import { showStartupGate } from './webview/startupGate';
import { showCloseGate } from './webview/closeGate';
import { startScheduler } from './services/scheduler';

let schedulerDisposable: vscode.Disposable | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	registerGuardedCloseCommands(context);

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
