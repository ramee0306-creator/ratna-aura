// Builds the public web pages (privacy policy, terms of use, refund policy, account deletion) from docs/*.md into site/,
// published by .github/workflows/pages.yml at https://ramee0306-creator.github.io/ratna-aura/.
// A small Markdown converter for what these documents use: headings, paragraphs, lists, tables, bold, links.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const out = new URL('../site/', import.meta.url);
/** The effective date of a document: the day it last changed in Git (today if it is not committed yet). */
function changedOn(file) {
  try {
    return execSync(`git log -1 --format=%cs -- ${file}`, { encoding: 'utf8' }).trim() || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2">$2</a>')
    .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');

export function markdownToHtml(md, effective) {
  const lines = md
    .replace(/\[fill in on publishing\]/g, effective)
    .split('\n')
    // Notes meant for the publisher (drafting reminders) are not published.
    .filter((l) => !l.startsWith('> ⚠️'));
  const html = [];
  let para = [];
  let list = null;
  const flush = () => {
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
    if (list) html.push(`</${list}>`);
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    const bullet = /^\s*- (.*)$/.exec(line);
    const numbered = /^\s*\d+\. (.*)$/.exec(line);
    if (!line.trim()) flush();
    else if (heading) {
      flush();
      html.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
    } else if (line.startsWith('|')) {
      flush();
      const rows = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i]);
      i--;
      const cells = (r) => r.split('|').slice(1, -1).map((c) => inline(c.trim()));
      html.push('<div class="table"><table>');
      html.push(`<tr>${cells(rows[0]).map((c) => `<th>${c}</th>`).join('')}</tr>`);
      for (const r of rows.slice(2)) html.push(`<tr>${cells(r).map((c) => `<td>${c}</td>`).join('')}</tr>`);
      html.push('</table></div>');
    } else if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      if (para.length) {
        html.push(`<p>${inline(para.join(' '))}</p>`);
        para = [];
      }
      if (list !== kind) {
        if (list) html.push(`</${list}>`);
        html.push(`<${kind}>`);
        list = kind;
      }
      html.push(`<li>${inline((bullet ?? numbered)[1])}</li>`);
    } else if (list && /^\s{2,}\S/.test(line)) {
      // continuation of the previous list item
      html[html.length - 1] = html[html.length - 1].replace(/<\/li>$/, ` ${inline(line.trim())}</li>`);
    } else para.push(line.trim());
  }
  flush();
  return html.join('\n');
}

const page = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  body { margin: 0; background: #0B0C2C; color: #F6F2E7; font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px max(16px, env(safe-area-inset-left)); }
  h1, h2, h3 { color: #F3DB97; line-height: 1.25; } h1 { font-size: 28px; } h2 { font-size: 20px; margin-top: 32px; }
  a { color: #6EDCA8; } code { background: #141543; padding: 0 4px; border-radius: 4px; }
  .table { overflow-x: auto; } table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { border: 1px solid #2F2E72; padding: 8px; text-align: left; vertical-align: top; } th { background: #141543; }
  nav { margin-bottom: 24px; } nav a { margin-right: 16px; }
</style></head>
<body><main><nav><a href="index.html">Ratna Aura</a><a href="privacy.html">Privacy policy</a><a href="terms.html">Terms of use</a><a href="refund.html">Refunds</a><a href="delete-account.html">Delete account</a></nav>
${body}
</main></body></html>
`;

mkdirSync(out, { recursive: true });
writeFileSync(new URL('privacy.html', out), page('Ratna Aura — Privacy Policy', markdownToHtml(readFileSync(new URL('../docs/privacy-policy.md', import.meta.url), 'utf8'), changedOn('docs/privacy-policy.md'))));
writeFileSync(new URL('terms.html', out), page('Ratna Aura — Terms of Use', markdownToHtml(readFileSync(new URL('../docs/terms-of-use.md', import.meta.url), 'utf8'), changedOn('docs/terms-of-use.md'))));
writeFileSync(new URL('refund.html', out), page('Ratna Aura — Refund & Cancellation Policy', markdownToHtml(readFileSync(new URL('../docs/refund-policy.md', import.meta.url), 'utf8'), changedOn('docs/refund-policy.md'))));
writeFileSync(new URL('delete-account.html', out), page('Ratna Aura — Delete your account', markdownToHtml(readFileSync(new URL('../docs/delete-account.md', import.meta.url), 'utf8'), changedOn('docs/delete-account.md'))));
writeFileSync(
  new URL('index.html', out),
  page(
    'Ratna Aura',
    `<h1>Ratna Aura</h1>
<p>Vedic astrology and numerology in English and 30 Indian languages: kundli, rashifal, panchang, Kundli Milan,
numerology, palm reading and AI astrologers.</p>
<ul><li><a href="privacy.html">Privacy policy</a></li><li><a href="terms.html">Terms of use</a></li><li><a href="refund.html">Refund &amp; cancellation policy</a></li><li><a href="delete-account.html">Delete your account and data</a></li>
<li><a href="https://github.com/ramee0306-creator/ratna-aura">Source code</a> (GNU AGPL v3)</li></ul>
<p>Contact: <a href="mailto:velqorasupport99@gmail.com">velqorasupport99@gmail.com</a></p>`,
  ),
);
console.log('site/ written');
