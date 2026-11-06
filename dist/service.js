import { setupPageNavigation } from './navigation.js';
import { setupProjectDialog } from './projects.js';
import { setupServiceMotion } from './service-motion.js';

setupPageNavigation();
if (document.querySelector('[data-open-project]')) setupProjectDialog();

async function initMotion() {
  await document.fonts.ready;
  setupServiceMotion();
  // Apply incoming anchors after ScrollTrigger measures the final font layout.
  const initialSection = document.getElementById(location.hash.slice(1));
  if (initialSection) {
    initialSection.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.ScrollTrigger?.update();
  }
}

if (document.readyState === 'complete') initMotion();
else addEventListener('load', initMotion, { once: true });
