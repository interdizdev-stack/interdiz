import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The home page is the source for the closing contact section and footer.
// Keep static HTML on every page so contacts also work without JavaScript.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const home = path.join(root, 'index.html');
const source = await readFile(home, 'utf8');
const footerPattern = /<footer\b[^>]*>[\s\S]*?<\/footer>/g;
const footer = source.match(footerPattern)?.find(block => /class="contact"/.test(block));
if (!footer) throw new Error('The home page contact footer is missing.');
const shortcut = source.match(/<a class="quick-home"[^>]*>[^<]*<\/a>/)?.[0];
if (!shortcut) throw new Error('The home page back-to-top link is missing.');
const controls = `<div class="display-controls">\n    ${shortcut}\n  </div>`;
const controlsPattern = /<div class="display-controls">\s*<a\b[^>]*>[^<]*<\/a>\s*<\/div>/;
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
    let html = original;
    if (!html.includes('</body>')) continue;

    const prefix = path.relative(directory, root).split(path.sep).join('/') || '.';
    const sharedFooter = footer.replace('class="wordmark" href="#top"',
      `class="wordmark" href="${prefix}/#top" aria-label="InterDIZ — на главную"`);
    const existing = html.match(footerPattern) || [];
    if (existing.length > 1) throw new Error(`Expected a single footer: ${filename}`);
    const updated = existing.length
      ? html.replace(footerPattern, () => sharedFooter)
      : html.includes('</main>')
        ? html.replace('</main>', `</main>\n\n  ${sharedFooter}`)
        : html.replace('</body>', `  ${sharedFooter}\n</body>`);
    html = updated.replace(/href="(?:\.\/|(?:\.\.\/)+|(?:\.\.\/)*index\.html)?#contact"/g, 'href="#contact"');
    // Keep the shortcut outside animated content so it stays fixed to the viewport.
    html = controlsPattern.test(html)
      ? html.replace(controlsPattern, controls)
      : html.replace('</body>', `  ${controls}\n</body>`);
    const moduleTag = `<script type="module" src="${prefix}/footer.js"></script>`;
    if (!html.includes(moduleTag)) html = html.replace('</head>', `  ${moduleTag}\n</head>`);
    if (html === original) continue;
    if (check) {
      console.error(`Footer needs synchronization: ${path.relative(root, filename)}`);
      process.exitCode = 1;
    } else {
      await writeFile(filename, html);
      console.log(`Synchronized footer: ${path.relative(root, filename)}`);
    }
  }
}

await syncDirectory(root);
