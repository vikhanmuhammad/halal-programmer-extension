import { BISMILLAH_SLOTS } from '../utils/fuzzyMatch';
import { showPhraseGate } from './phraseGate';

export function showStartupGate(voiceLocale: string): Promise<void> {
	return showPhraseGate({
		panelTitle: 'Halal Programmer',
		heading: 'Before you start...',
		instructionHtml: 'Say or type: <strong>Bismillahirohmanirohim</strong>',
		slots: BISMILLAH_SLOTS,
		voiceLocale,
	});
}
