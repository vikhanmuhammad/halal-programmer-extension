export function normalize(text: string): string {
	return text.toLowerCase().replace(/[^a-z]/g, '');
}

export function levenshtein(a: string, b: string): number {
	const rows = a.length + 1;
	const cols = b.length + 1;
	const dist: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

	for (let i = 0; i < rows; i++) dist[i][0] = i;
	for (let j = 0; j < cols; j++) dist[0][j] = j;

	for (let i = 1; i < rows; i++) {
		for (let j = 1; j < cols; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			dist[i][j] = Math.min(
				dist[i - 1][j] + 1,
				dist[i][j - 1] + 1,
				dist[i - 1][j - 1] + cost,
			);
		}
	}

	return dist[rows - 1][cols - 1];
}

/** Checks whether `needle` appears inside `haystack` allowing up to `maxDistance` typos, to survive transcription/typing errors in concatenated transliterations (e.g. "bismillahirohmanirohim" has no spaces). */
export function fuzzyContains(haystack: string, needle: string, maxDistance: number): boolean {
	if (needle.length === 0) return true;
	const minLen = Math.max(1, needle.length - maxDistance);
	const maxLen = needle.length + maxDistance;

	for (let len = minLen; len <= maxLen; len++) {
		for (let start = 0; start + len <= haystack.length; start++) {
			const window = haystack.substr(start, len);
			if (levenshtein(window, needle) <= maxDistance) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Each inner array is a set of acceptable spellings for that keyword slot; all slots must be
 * present (in any order) for a match. Only the core keyword is required, not the full phrase —
 * the full phrase already contains the core keyword as a prefix, so this accepts both
 * "Bismillah"/"Alhamdulillah" alone and the full "...irrahmanirrahim"/"...irabbil'alamin" forms.
 */
export type PhraseSlots = string[][];

export const BISMILLAH_SLOTS: PhraseSlots = [['bismillah']];

export const ALHAMDULILLAH_SLOTS: PhraseSlots = [['alhamdulillah']];

export function matchesPhrase(input: string, slots: PhraseSlots, maxDistancePerKeyword = 1): boolean {
	const normalized = normalize(input);
	return slots.every((variants) =>
		variants.some((variant) => fuzzyContains(normalized, variant, maxDistancePerKeyword)),
	);
}
