export function setupCasePresentation(frame) {
  let observer;
  let childWindow;
  let content;
  const sync = () => {
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      // A document's scrollHeight includes the old viewport after a rotation.
      const height = content ? Math.ceil(content.getBoundingClientRect().height)
        : Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
      if (height && frame.style.height !== `${height}px`) frame.style.height = `${height}px`;
    } catch { /* Keep the frame scrollable if its source cannot be inspected. */ }
  };
  const loaded = () => {
    try {
      const doc = frame.contentDocument;
      childWindow = frame.contentWindow;
      content = doc?.querySelector('[data-case-content]');
      sync();
      if (typeof ResizeObserver !== 'undefined' && doc?.body) {
        observer?.disconnect();
        observer = new ResizeObserver(sync);
        observer.observe(content || doc.body);
      }
      doc?.fonts?.ready.then(sync).catch(() => {});
      childWindow?.addEventListener('resize', sync);
    } catch { /* The normal iframe scrollbars remain available. */ }
  };
  frame.addEventListener('load', loaded);
  try {
    if (frame.contentDocument?.readyState === 'complete' && frame.contentWindow?.location.href !== 'about:blank') loaded();
  } catch {}
  return () => {
    frame.removeEventListener('load', loaded);
    childWindow?.removeEventListener('resize', sync);
    observer?.disconnect();
  };
}
