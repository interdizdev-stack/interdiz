// Shared by the home page and every inner page.
let clockStarted = false;
export function setupClock() {
  const clocks = [...document.querySelectorAll('.ast-clock')];
  if (clockStarted || !clocks.length) return;
  clockStarted = true;

  function tick() {
    try {
      const time = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date());
      clocks.forEach(clock => { clock.textContent = `${time} UTC+3`; });
    } catch {}
  }
  setInterval(tick, 1000);
  tick();
}

function setupCopyClipboard() {
  const buttons = [...document.querySelectorAll('[data-copy]')];
  if (!buttons.length) return;
  let toast = document.querySelector('#copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.className = 'copy-toast';
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  let timer;
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        toast.textContent = `✓ ${text} скопирован в буфер!`;
        toast.classList.add('toast-show');
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove('toast-show'), 2500);
      } catch {
        location.href = `mailto:${text}`;
      }
    });
  });
}

setupClock();
setupCopyClipboard();
