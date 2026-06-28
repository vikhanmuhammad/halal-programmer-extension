import * as vscode from 'vscode';
import { buildWebviewHtml } from './webviewHtml';
import { PhraseSlots, matchesPhrase } from '../utils/fuzzyMatch';
import { t } from '../i18n';

export interface PhraseGateOptions {
	panelTitle: string;
	heading: string;
	instructionHtml: string;
	slots: PhraseSlots;
	voiceLocale: string;
	viewColumn?: vscode.ViewColumn;
}

interface GateStrings {
	placeholder: string;
	submitLabel: string;
	voiceLabel: string;
	voiceUnsupportedTitle: string;
	emptyInput: string;
	listening: string;
	voiceUnavailable: string;
	retry: string;
	accepted: string;
}

function getGateStrings(): GateStrings {
	return {
		placeholder: t('gateInputPlaceholder'),
		submitLabel: t('gateSubmit'),
		voiceLabel: t('gateVoiceButton'),
		voiceUnsupportedTitle: t('gateVoiceUnsupportedTitle'),
		emptyInput: t('gateEmptyInput'),
		listening: t('gateListening'),
		voiceUnavailable: t('gateVoiceUnavailable'),
		retry: t('gateRetry'),
		accepted: t('gateAccepted'),
	};
}

/**
 * Shows a gate webview that only resolves once the user has typed or spoken a phrase
 * matching `slots`. There is no custom-HTML modal API in VS Code, so this approximates
 * blocking by re-revealing the panel whenever it stops being the active tab (a "nag",
 * not a true block) and by re-opening itself if the user manages to close the tab
 * before validating.
 */
export function showPhraseGate(options: PhraseGateOptions): Promise<void> {
	return new Promise((resolve) => {
		const column = options.viewColumn ?? vscode.ViewColumn.One;
		const panel = vscode.window.createWebviewPanel('halalProgrammingPhraseGate', options.panelTitle, column, {
			enableScripts: true,
			retainContextWhenHidden: false,
		});

		let resolved = false;

		const viewStateListener = panel.onDidChangeViewState((e) => {
			if (!resolved && !e.webviewPanel.active) {
				panel.reveal(column, false);
			}
		});

		panel.webview.onDidReceiveMessage((message: { type: string; text?: string }) => {
			if (message?.type !== 'attempt') return;

			if (matchesPhrase(message.text ?? '', options.slots)) {
				resolved = true;
				panel.webview.postMessage({ type: 'success' });
				viewStateListener.dispose();
				setTimeout(() => panel.dispose(), 600);
			} else {
				panel.webview.postMessage({ type: 'retry' });
			}
		});

		panel.onDidDispose(() => {
			viewStateListener.dispose();
			if (resolved) {
				resolve();
			} else {
				resolve(showPhraseGate(options));
			}
		});

		const strings = getGateStrings();
		panel.webview.html = buildWebviewHtml({
			title: options.panelTitle,
			bodyHtml: getBodyHtml(options, strings),
			styleText: SHARED_STYLE,
			scriptText: getScript(options.voiceLocale, strings),
		});
	});
}

const SHARED_STYLE = `
body {
	font-family: var(--vscode-font-family);
	color: var(--vscode-foreground);
	background: var(--vscode-editor-background);
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	margin: 0;
}
.gate { max-width: 480px; padding: 32px; text-align: center; }
h1 { font-size: 1.4em; margin-bottom: 8px; }
.row { margin: 12px 0; display: flex; gap: 8px; justify-content: center; }
input[type=text] {
	flex: 1;
	padding: 6px 8px;
	background: var(--vscode-input-background);
	color: var(--vscode-input-foreground);
	border: 1px solid var(--vscode-input-border);
	border-radius: 2px;
}
button {
	padding: 6px 14px;
	background: var(--vscode-button-background);
	color: var(--vscode-button-foreground);
	border: none;
	border-radius: 2px;
	cursor: pointer;
}
button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
button:disabled { opacity: 0.5; cursor: default; }
.message { min-height: 1.4em; font-size: 0.9em; }
.message.error { color: var(--vscode-errorForeground); }
.message.success { color: var(--vscode-terminal-ansiGreen); }
`;

function getBodyHtml(options: PhraseGateOptions, strings: GateStrings): string {
	return `
<div class="gate">
	<h1>${options.heading}</h1>
	<p>${options.instructionHtml}</p>
	<div class="row">
		<input id="phraseInput" type="text" autocomplete="off" placeholder="${strings.placeholder}" />
		<button id="submitBtn">${strings.submitLabel}</button>
	</div>
	<div class="row">
		<button id="voiceBtn" class="secondary">${strings.voiceLabel}</button>
	</div>
	<p id="message" class="message"></p>
</div>`;
}

function getScript(voiceLocale: string, strings: GateStrings): string {
	return `
(function () {
	const vscodeApi = acquireVsCodeApi();
	const input = document.getElementById('phraseInput');
	const submitBtn = document.getElementById('submitBtn');
	const voiceBtn = document.getElementById('voiceBtn');
	const message = document.getElementById('message');
	const voiceLocale = ${JSON.stringify(voiceLocale)};
	const strings = ${JSON.stringify(strings)};

	function setMessage(text, kind) {
		message.textContent = text;
		message.className = 'message' + (kind ? ' ' + kind : '');
	}

	function submit(text) {
		if (!text || !text.trim()) {
			setMessage(strings.emptyInput, 'error');
			return;
		}
		vscodeApi.postMessage({ type: 'attempt', text: text });
	}

	submitBtn.addEventListener('click', function () { submit(input.value); });
	input.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') submit(input.value);
	});

	const SpeechRecognitionImpl = window.webkitSpeechRecognition || window.SpeechRecognition;

	if (!SpeechRecognitionImpl) {
		voiceBtn.disabled = true;
		voiceBtn.title = strings.voiceUnsupportedTitle;
	} else {
		voiceBtn.addEventListener('click', function () {
			let recognition;
			try {
				recognition = new SpeechRecognitionImpl();
			} catch (err) {
				setMessage(strings.voiceUnavailable, 'error');
				return;
			}
			recognition.lang = voiceLocale;
			recognition.interimResults = false;
			recognition.maxAlternatives = 1;

			voiceBtn.disabled = true;
			setMessage(strings.listening, '');

			recognition.onresult = function (event) {
				const transcript = event.results[0][0].transcript;
				input.value = transcript;
				submit(transcript);
			};
			recognition.onerror = function () {
				setMessage(strings.voiceUnavailable, 'error');
				voiceBtn.disabled = false;
			};
			recognition.onend = function () {
				voiceBtn.disabled = false;
			};

			try {
				recognition.start();
			} catch (err) {
				setMessage(strings.voiceUnavailable, 'error');
				voiceBtn.disabled = false;
			}
		});
	}

	window.addEventListener('message', function (event) {
		const msg = event.data;
		if (msg.type === 'retry') {
			setMessage(strings.retry, 'error');
			input.value = '';
			input.focus();
		} else if (msg.type === 'success') {
			setMessage(strings.accepted, 'success');
			input.disabled = true;
			submitBtn.disabled = true;
			voiceBtn.disabled = true;
		}
	});

	input.focus();
})();
`;
}
