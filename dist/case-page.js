import { setupPageNavigation } from './navigation.js';
import { setupCasePresentation } from './case-presentation.js';

setupPageNavigation();

document.querySelectorAll('[data-case-frame]').forEach(setupCasePresentation);
