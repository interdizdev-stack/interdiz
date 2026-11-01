// Match the opening sculpture to the buttons while rendering all scroll
// states on a single full-height canvas.
export function measureCompactFraming(container) {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  const hero = container.closest('.hero');
  const actions = hero?.querySelector('.hero-actions');
  let buttonsBottom = actions?.offsetHeight ?? height * .5;
  for (let node = actions; node && node !== hero; node = node.offsetParent) {
    buttonsBottom += node.offsetTop;
  }
  const openingHeight = (matchMedia('(max-width: 699px)').matches ? 200 : 260) * 1.4;
  const availableHeight = Math.max(100, height - buttonsBottom + 12);
  const frameHeight = Math.min(openingHeight, availableHeight * 1.15);
  const center = Math.min(height - frameHeight * .42, buttonsBottom - 20 + frameHeight * .44);
  const viewHeight = 24 * Math.tan(19 * Math.PI / 180);
  return {
    scale: 1.55 * frameHeight / height,
    y: (.5 - center / height) * viewHeight,
    sceneScale: Math.min(1.27, width / height * 1.9)
  };
}
