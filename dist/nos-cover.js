const preference = matchMedia('(prefers-reduced-motion: reduce)');
function updateCover() {
  const reduced = preference.matches || document.documentElement.classList.contains('reduced-motion');
  document.querySelectorAll('img[data-animated][data-still]').forEach(image => {
    const desired = reduced ? image.dataset.still : image.dataset.animated;
    if (image.getAttribute('src') !== desired) image.setAttribute('src', desired);
  });
}
new MutationObserver(updateCover).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
preference.addEventListener('change', updateCover);
window.addEventListener('pageshow', updateCover);
updateCover();
