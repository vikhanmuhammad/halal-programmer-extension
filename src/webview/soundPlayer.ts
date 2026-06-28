import * as vscode from 'vscode';
import { spawn } from 'child_process';

const SOUND_FILE = 'terminal-error.mp3';
const MAX_FALLBACK_SECONDS = 6;

let warnedSpawnFailure = false;

/**
 * Plays media/terminal-error.mp3 via a spawned PowerShell process using WPF's MediaPlayer
 * (supports mp3, ships with Windows). A webview <audio> tag was tried first, but VS Code's
 * webview blocks audio.play() with NotAllowedError even when muted - there's no JS-side
 * workaround for that, so this avoids the browser entirely.
 */
export function playErrorSound(context: vscode.ExtensionContext): void {
	const soundPath = vscode.Uri.joinPath(context.extensionUri, 'media', SOUND_FILE).fsPath;
	const script = buildPlaybackScript(soundPath);

	const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script], {
		windowsHide: true,
		stdio: 'ignore',
	});

	child.on('error', () => {
		if (!warnedSpawnFailure) {
			warnedSpawnFailure = true;
			void vscode.window.showWarningMessage('Halal Programmer: could not start PowerShell to play the terminal error sound.');
		}
	});
}

function buildPlaybackScript(soundPath: string): string {
	const quotedPath = `'${soundPath.replace(/'/g, "''")}'`;
	return [
		'Add-Type -AssemblyName presentationCore',
		'$player = New-Object system.windows.media.mediaplayer',
		`$player.Open([uri]${quotedPath})`,
		'$deadline = [DateTime]::Now.AddSeconds(5)',
		'while (-not $player.NaturalDuration.HasTimeSpan -and [DateTime]::Now -lt $deadline) { Start-Sleep -Milliseconds 100 }',
		'$player.Play()',
		'if ($player.NaturalDuration.HasTimeSpan) { Start-Sleep -Seconds $player.NaturalDuration.TimeSpan.TotalSeconds }',
		`else { Start-Sleep -Seconds ${MAX_FALLBACK_SECONDS} }`,
		'$player.Stop()',
	].join('\n');
}
