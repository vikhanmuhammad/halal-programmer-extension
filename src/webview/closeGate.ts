import { ALHAMDULILLAH_SLOTS } from '../utils/fuzzyMatch';
import { showPhraseGate } from './phraseGate';
import { t } from '../i18n';

/**
 * This gate only catches window-close/quit actions that are routed through VS Code's
 * keybinding/command service (Ctrl+Shift+W, Ctrl+Q, and Command Palette invocations of
 * "Close Window"/"Quit"). The title-bar X button, Alt+F4, and force-quit go straight to
 * Electron's native window-close event, which the extension API never sees — there is no
 * way to intercept those. Accepted limitation per the spec: a strong reminder, not a hard block.
 */
export function showCloseGate(voiceLocale: string): Promise<void> {
	return showPhraseGate({
		panelTitle: 'Halal Programmer',
		heading: t('closeHeading'),
		instructionHtml: t('closeInstruction'),
		slots: ALHAMDULILLAH_SLOTS,
		voiceLocale,
	});
}
