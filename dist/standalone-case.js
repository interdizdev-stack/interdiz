import { createCaseShortcut } from './quick-home.js';

// Embedded presentations use the control in the surrounding case page or dialog.
if (window.self === window.top) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./quick-home.css', import.meta.url).href;
  document.head.append(stylesheet);
  const shortcut = createCaseShortcut(document.scrollingElement, document.body);
  shortcut.classList.add('standalone-case-shortcut');
  document.body.append(shortcut);
}
