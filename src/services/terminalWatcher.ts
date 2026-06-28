import * as vscode from 'vscode';
import { playErrorSound } from '../webview/soundPlayer';

const WINDOW_CHARS = 2_000;
const IDLE_RESET_MS = 2_000;
const ANSI_ESCAPE = /\x1b\[[0-9;]*m/g;
const ERROR_TAG = /\[error\]/i;
const WARNING_TAG = /\[warning\]/i;
const RETRIGGER_COOLDOWN_MS = 5_000;

/**
 * A bare "error" substring match is too broad - tools like the Angular/esbuild compiler print
 * descriptive text such as "Error occurs in the template of..." inside a [WARNING]-tagged
 * block. Prefer the explicit severity tag when present, and only fall back to a bare mention
 * when there's no tag to disambiguate with (e.g. a plain Node stack trace with no [WARNING]/[ERROR]
 * convention at all).
 */
function looksLikeRealError(text: string): boolean {
	if (ERROR_TAG.test(text)) return true;
	if (WARNING_TAG.test(text)) return false;
	return /error/i.test(text);
}

/**
 * Detects failures in the Terminal panel specifically (not Problems/Output/Debug Console) via
 * the Terminal Shell Integration API. This only fires for terminals where shell integration is
 * active - PowerShell and Git Bash on Windows, not cmd.exe - since that's what the API requires.
 *
 * Output is scanned as it streams in, not just once a command ends: long-running dev
 * servers/watch processes (npm run dev, etc.) never "end" while they're running, so an error
 * logged mid-stream would otherwise never be checked.
 */
export function startTerminalErrorWatcher(context: vscode.ExtensionContext): vscode.Disposable {
	const lastTriggerAt = new Map<vscode.TerminalShellExecution, number>();

	function maybeTrigger(execution: vscode.TerminalShellExecution): void {
		if (!isEnabled()) return;
		const now = Date.now();
		if (now - (lastTriggerAt.get(execution) ?? 0) < RETRIGGER_COOLDOWN_MS) return;
		lastTriggerAt.set(execution, now);
		playErrorSound(context);
	}

	const startListener = vscode.window.onDidStartTerminalShellExecution(async (event) => {
		let tail = '';
		let lastChunkAt = 0;
		try {
			for await (const chunk of event.execution.read()) {
				// Re-checked on every chunk, not once up front - a long-running dev server can
				// keep streaming for the whole session, and the setting may be toggled mid-run.
				if (!isEnabled()) continue;

				const now = Date.now();
				// A long-running dev server never "ends" between rebuilds, so a quiet gap is the
				// only generic signal (across Angular CLI/webpack/Vite/etc.) that a new build
				// cycle has started - without it, a stale [ERROR] from a since-fixed build can
				// stay inside the trailing window and falsely re-match on a later, clean rebuild.
				if (lastChunkAt && now - lastChunkAt > IDLE_RESET_MS) {
					tail = '';
				}
				lastChunkAt = now;

				tail = (tail + chunk.replace(ANSI_ESCAPE, '')).slice(-WINDOW_CHARS);

				if (looksLikeRealError(tail)) {
					maybeTrigger(event.execution);
				}
			}
		} catch {
			// Stream read failed - the exit-code check below still applies once the command ends.
		}
	});

	const endListener = vscode.window.onDidEndTerminalShellExecution((event) => {
		lastTriggerAt.delete(event.execution);
		if (!isEnabled()) return;

		if (event.exitCode !== undefined && event.exitCode !== 0) {
			playErrorSound(context);
		}
	});

	return vscode.Disposable.from(startListener, endListener);
}

function isEnabled(): boolean {
	return vscode.workspace.getConfiguration('halalProgramming').get<boolean>('terminalErrorSound.enabled', false);
}
