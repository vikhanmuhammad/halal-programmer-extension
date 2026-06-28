import { BISMILLAH_SLOTS } from '../utils/fuzzyMatch';
import { showPhraseGate } from './phraseGate';
import { t } from '../i18n';

export function showStartupGate(voiceLocale: string): Promise<void> {
	return showPhraseGate({
		panelTitle: 'Halal Programmer',
		heading: t('startupHeading'),
		instructionHtml: t('startupInstruction'),
		slots: BISMILLAH_SLOTS,
		voiceLocale,
	});
}
