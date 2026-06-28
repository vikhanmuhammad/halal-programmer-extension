import * as vscode from 'vscode';

export type Lang = 'en' | 'id';

export function getLang(): Lang {
	const value = vscode.workspace.getConfiguration('halalProgramming').get<string>('uiLanguage', 'en');
	return value === 'id' ? 'id' : 'en';
}

const STRINGS = {
	startupHeading: { en: 'Before you start...', id: 'Sebelum mulai...' },
	startupInstruction: {
		en: 'Say or type: <strong>Bismillahirrahmanirrahim</strong> (or just "Bismillah")',
		id: 'Ucapkan atau ketik: <strong>Bismillahirrahmanirrahim</strong> (atau cukup "Bismillah")',
	},
	closeHeading: { en: 'Before you close...', id: 'Sebelum menutup...' },
	closeInstruction: {
		en: 'Say or type: <strong>Alhamdulillahirabbil\'alamin</strong> (or just "Alhamdulillah")',
		id: 'Ucapkan atau ketik: <strong>Alhamdulillahirabbil\'alamin</strong> (atau cukup "Alhamdulillah")',
	},
	gateInputPlaceholder: { en: 'Type the phrase...', id: 'Ketik kalimatnya...' },
	gateSubmit: { en: 'Submit', id: 'Kirim' },
	gateVoiceButton: { en: '🎤 Voice', id: '🎤 Suara' },
	gateVoiceUnsupportedTitle: {
		en: 'Voice input is not available in this VS Code build.',
		id: 'Input suara tidak tersedia di versi VS Code ini.',
	},
	gateEmptyInput: {
		en: 'Please say or type the phrase first.',
		id: 'Silakan ucapkan atau ketik kalimatnya terlebih dahulu.',
	},
	gateListening: { en: 'Listening...', id: 'Mendengarkan...' },
	gateVoiceUnavailable: {
		en: 'Voice unavailable in this VS Code version — please type the phrase instead.',
		id: 'Suara tidak tersedia di versi VS Code ini — silakan ketik kalimatnya.',
	},
	gateRetry: { en: 'Not quite — please try again.', id: 'Belum tepat — silakan coba lagi.' },
	gateAccepted: { en: 'Accepted.', id: 'Diterima.' },
	prayerHeading: { en: '🕌 IT IS TIME FOR PRAYER', id: '🕌 WAKTU SHOLAT TELAH TIBA' },
	prayerNameLabel: { en: 'Prayer time:', id: 'Waktu sholat:' },
	prayerIntro1: {
		en: "Pause your work and answer Allah's call before returning to your worldly tasks.",
		id: 'Hentikan sejenak pekerjaanmu. Penuhi panggilan Allah sebelum melanjutkan urusan dunia.',
	},
	prayerIntro2: {
		en: 'Do not delay your prayer without a valid excuse. Deadlines, coding, meetings, and work will never be more important than fulfilling your obligation to Allah.',
		id: 'Jangan menunda sholat tanpa alasan yang dibenarkan. Kesibukan, deadline, atau pekerjaan tidak akan pernah lebih penting daripada kewajiban kepada Allah.',
	},
	prayerAllahSays1: { en: 'Allah says:', id: 'Allah ﷻ berfirman:' },
	prayerVerse1Translation: {
		en: '"So woe to those who pray, yet are heedless of their prayers."',
		id: '"Maka celakalah orang-orang yang sholat, (yaitu) orang-orang yang lalai terhadap sholatnya."',
	},
	prayerVerse1Ref: { en: "(Qur'an 107:4–5)", id: "(QS. Al-Ma'un: 4–5)" },
	prayerAllahSays2: { en: 'Allah also says:', id: 'Dan Allah ﷻ juga berfirman:' },
	prayerVerse2Translation: {
		en: '"Indeed, prayer has been prescribed upon the believers at fixed times."',
		id: '"Sesungguhnya sholat itu adalah kewajiban yang telah ditentukan waktunya atas orang-orang yang beriman."',
	},
	prayerVerse2Ref: { en: "(Qur'an 4:103)", id: "(QS. An-Nisa': 103)" },
	prayerCallToAction: {
		en: 'Leave your editor for a few minutes. Perform wudu if needed, then establish your prayer before its time passes.',
		id: 'Tinggalkan editor sejenak. Ambil wudhu jika diperlukan. Tunaikan sholat sebelum waktunya berlalu.',
	},
	prayerClosing: {
		en: 'May Allah accept our prayers and make us among those who faithfully guard them.',
		id: 'Semoga Allah menerima amal ibadah kita dan menjadikan kita termasuk orang-orang yang menjaga sholatnya.',
	},
	locationUnavailable: {
		en: 'Halal Programmer could not detect your location. Set halalProgramming.location.latitude/longitude in Settings.',
		id: 'Halal Programmer tidak dapat mendeteksi lokasi Anda. Atur halalProgramming.location.latitude/longitude di Settings.',
	},
	scheduleUnavailable: {
		en: "Halal Programmer could not fetch today's prayer schedule. Check your internet connection.",
		id: 'Halal Programmer tidak dapat mengambil jadwal shalat hari ini. Periksa koneksi internet Anda.',
	},
	todaysPrayerTimes: { en: "Today's prayer times", id: 'Jadwal shalat hari ini' },
	terminalErrorSoundEnabled: { en: 'Terminal error sound: ON', id: 'Suara error terminal: AKTIF' },
	terminalErrorSoundDisabled: { en: 'Terminal error sound: OFF', id: 'Suara error terminal: NONAKTIF' },
} satisfies Record<string, Record<Lang, string>>;

type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, vars?: Record<string, string>): string {
	const lang = getLang();
	let text: string = STRINGS[key][lang];
	if (vars) {
		for (const [name, value] of Object.entries(vars)) {
			text = text.replace(`{${name}}`, value);
		}
	}
	return text;
}
