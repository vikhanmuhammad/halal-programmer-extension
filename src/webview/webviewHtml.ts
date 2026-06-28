export function getNonce(): string {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export interface WebviewHtmlOptions {
	title: string;
	bodyHtml: string;
	styleText: string;
	scriptText: string;
}

/** All webviews render inline-only content (no remote resources), so a strict nonce-scoped CSP with no connect-src/media-src is sufficient. */
export function buildWebviewHtml(options: WebviewHtmlOptions): string {
	const nonce = getNonce();
	const csp = [`default-src 'none'`, `style-src 'nonce-${nonce}'`, `script-src 'nonce-${nonce}'`].join('; ');

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title>${options.title}</title>
<style nonce="${nonce}">${options.styleText}</style>
</head>
<body>
${options.bodyHtml}
<script nonce="${nonce}">${options.scriptText}</script>
</body>
</html>`;
}
