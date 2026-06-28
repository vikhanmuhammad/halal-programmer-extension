import * as vscode from 'vscode';
import { buildWebviewHtml } from './webviewHtml';
import { t } from '../i18n';

const VERSE_1_ARABIC = 'فَوَيْلٌ لِّلْمُصَلِّيْنَۙ الَّذِيْنَ هُمْ عَنْ صَلَاتِهِمْ سَاهُوْنَۙ';
const VERSE_2_ARABIC = 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا';

const STYLE = `
body {
	font-family: var(--vscode-font-family);
	color: var(--vscode-foreground);
	background: var(--vscode-editor-background);
	margin: 0;
	padding: 32px 24px;
	min-height: 100vh;
	box-sizing: border-box;
	display: flex;
	justify-content: center;
}
.block { max-width: 640px; text-align: center; line-height: 1.7; }
h1 { font-size: 1.8em; margin: 0 0 6px; }
.prayerName { font-size: 1.05em; font-weight: 600; opacity: 0.85; margin: 0 0 28px; }
p { margin: 14px 0; }
.attribution { font-weight: 600; margin-bottom: 6px; }
.arabic {
	direction: rtl;
	font-family: 'Traditional Arabic', 'Arabic Typesetting', Tahoma, 'Segoe UI', sans-serif;
	font-size: 1.7em;
	line-height: 2.1;
	margin: 6px 0 16px;
}
blockquote {
	margin: 0 0 24px;
	padding: 10px 18px;
	border-left: 3px solid var(--vscode-textBlockQuote-border);
	background: var(--vscode-textBlockQuote-background);
	font-style: italic;
	text-align: left;
}
.ref { display: block; margin-top: 6px; font-style: normal; opacity: 0.75; font-size: 0.9em; }
.closing { margin-top: 28px; font-style: italic; opacity: 0.9; }
`;

export function showPrayerBlock(prayerName: string): void {
	const panel = vscode.window.createWebviewPanel('halalProgrammingPrayerBlock', 'Halal Programmer', vscode.ViewColumn.One, {
		enableScripts: false,
		retainContextWhenHidden: false,
	});

	panel.webview.html = buildWebviewHtml({
		title: 'Halal Programmer',
		bodyHtml: `
<div class="block">
	<h1>${t('prayerHeading')}</h1>
	<p class="prayerName">${t('prayerNameLabel')} ${prayerName}</p>
	<p>${t('prayerIntro1')}</p>
	<p>${t('prayerIntro2')}</p>
	<p class="attribution">${t('prayerAllahSays1')}</p>
	<p class="arabic">${VERSE_1_ARABIC}</p>
	<blockquote>${t('prayerVerse1Translation')}<span class="ref">${t('prayerVerse1Ref')}</span></blockquote>
	<p class="attribution">${t('prayerAllahSays2')}</p>
	<p class="arabic">${VERSE_2_ARABIC}</p>
	<blockquote>${t('prayerVerse2Translation')}<span class="ref">${t('prayerVerse2Ref')}</span></blockquote>
	<p>${t('prayerCallToAction')}</p>
	<p class="closing">${t('prayerClosing')}</p>
</div>`,
		styleText: STYLE,
		scriptText: '',
	});

	// Longer than the original 60s — there's now enough text that a reader needs more time.
	const timeout = setTimeout(() => panel.dispose(), 90_000);
	panel.onDidDispose(() => clearTimeout(timeout));
}
