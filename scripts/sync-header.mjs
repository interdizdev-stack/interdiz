import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The home page owns the header markup. Inner pages share its theme and mobile styles.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const home = path.join(root, 'index.html');
const headerPattern = /<header\b[^>]*\bclass="[^"]*\bheader\b[^"]*"[^>]*>[\s\S]*?<\/header>/g;
const source = (await readFile(home, 'utf8')).replace(/\r\n/g, '\n');
const headers = source.match(headerPattern) || [];
if (headers.length !== 1) throw new Error('Expected a single home page header.');
const contents = headers[0].replace(/^<header\b[^>]*>/, '').replace(/<\/header>$/, '');
const check = process.argv.includes('--check');

async function syncDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['assets', 'vendor'].includes(entry.name)) await syncDirectory(filename);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html') || filename === home) continue;
    const original = await readFile(filename, 'utf8');
    if (!original.includes('</body>')) continue;
    const html = original.replace(/\r\n/g, '\n');
    const existing = html.match(headerPattern) || [];
    if (existing.length > 1) throw new Error(`Expected a single header: ${filename}`);
    const prefix = path.relative(directory, root).split(path.sep).join('/') || '.';
    const sharedContents = contents
      .replace(/href="([^"]+)"/g, (attribute, href) => {
        if (href === '#contact' || /^(?:[a-z]+:|\/)/i.test(href)) return attribute;
        return `href="${prefix}/${href.replace(/^\.\//, '')}"`;
      })
      .replace('aria-label="InterDIZ — в начало"', 'aria-label="InterDIZ — на главную"');
    let opening = existing[0]?.match(/^<header\b[^>]*>/)[0] || '<header class="header page-header">';
    opening = opening.replace(/class="([^"]*)"/, (_, classes) =>
      `class="${[...new Set([...classes.split(/\s+/), 'page-header'])].join(' ')}"`);
    if (!/\bid="top"/.test(html)) opening = opening.replace(/>$/, ' id="top">');
    const sharedHeader = `${opening}${sharedContents}</header>`;
    const updated = existing.length
      ? html.replace(headerPattern, () => sharedHeader)
      : html.replace(/<main\b/, `${sharedHeader}\n\n  <main`);
    if (updated === html && !existing.length) throw new Error(`Cannot place header: ${filename}`);
    if (!/id="mobile-menu"/.test(html)) throw new Error(`The shared header requires the mobile menu: ${filename}`);
    if (updated === html) continue;
    if (check) {
      console.error(`Header needs synchronization: ${path.relative(root, filename)}`);
      process.exitCode = 1;
    } else {
      await writeFile(filename, original.includes('\r\n') ? updated.replace(/\n/g, '\r\n') : updated);
      console.log(`Synchronized header: ${path.relative(root, filename)}`);
    }
  }
}

await syncDirectory(root);
