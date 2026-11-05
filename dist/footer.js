// The home page and service pages share the same live Saint Petersburg clock.
export function setupClock() {
  const clocks = [...document.querySelectorAll('.ast-clock')];
  if (!clocks.length) return;

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
