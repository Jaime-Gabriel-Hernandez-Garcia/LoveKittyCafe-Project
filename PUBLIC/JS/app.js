// Love Kitty Café — Interactive Logic
// 1. Live theme switcher between Propuesta 1 (Kawaii Pastel) & Propuesta 2 (Rosa Neón Nocturno)
// 2. Live CDMX schedule indicator (Wed-Fri 17:00-22:00, Sat-Sun 14:00-22:00)
// 3. Interactive WhatsApp Order & Table Reservation Builder (+52 55 2865 9717)
// 4. Scroll entrance observer

(() => {
  // 1. Theme / Proposal Switcher
  const themeButtons = document.querySelectorAll('[data-set-theme]');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeButtons.forEach((btn) => {
      const active = btn.getAttribute('data-set-theme') === theme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    try {
      localStorage.setItem('lkc_theme', theme);
    } catch {}
  };

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTheme(btn.getAttribute('data-set-theme'));
    });
  });

  // Respect page default (index.html = pastel, propuesta-2.html = neon) unless URL query overrides
  const params = new URLSearchParams(window.location.search);
  if (params.get('propuesta') === '2') {
    applyTheme('neon');
  } else if (params.get('propuesta') === '1') {
    applyTheme('pastel');
  }

  // 2. Live Open / Closed Status in San Felipe de Jesús, CDMX
  const statusText = document.getElementById('live-status-text');
  if (statusText) {
    const now = new Date();
    const day = now.getDay(); // 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat
    const hour = now.getHours() + now.getMinutes() / 60;
    let isOpen = false;
    let label = 'Hoy cerrado · Abrimos miércoles 17:00 h';

    if (day >= 3 && day <= 5) {
      if (hour >= 17 && hour < 22) {
        isOpen = true;
        label = 'Abierto ahora · Cierra 22:00 h';
      } else {
        label = 'Miércoles a viernes · 17:00 a 22:00 h';
      }
    } else if (day === 0 || day === 6) {
      if (hour >= 14 && hour < 22) {
        isOpen = true;
        label = 'Abierto ahora · Cierra 22:00 h';
      } else {
        label = 'Sábado y domingo · 14:00 a 22:00 h';
      }
    }
    statusText.textContent = label;
    statusText.dataset.open = isOpen ? 'true' : 'false';
  }

  // 3. Interactive WhatsApp Builder (The Live Thing)
  const modeTabs = document.querySelectorAll('[data-builder-mode]');
  const itemOptions = document.querySelectorAll('.item-Option');
  const totalEl = document.getElementById('builder-total');
  const countEl = document.getElementById('builder-count');
  const waBtn = document.getElementById('whatsapp-send-btn');
  const guestName = document.getElementById('guest-name');
  const visitDate = document.getElementById('visit-date');
  const visitTime = document.getElementById('visit-time');
  const guestCount = document.getElementById('guest-count');
  const orderNotes = document.getElementById('order-notes');
  const reservationFields = document.getElementById('reservation-fields');

  let currentMode = 'pedido';

  if (visitDate && !visitDate.value) {
    const today = new Date().toISOString().split('T')[0];
    visitDate.value = today;
  }

  const updateBuilder = () => {
    let total = 0;
    const selectedNames = [];

    itemOptions.forEach((label) => {
      const input = label.querySelector('input[type="checkbox"]');
      if (!input) return;
      if (input.checked) {
        label.classList.add('is-selected');
        const price = Number(input.dataset.price || 0);
        total += price;
        selectedNames.push(`${input.dataset.name} ($${price})`);
      } else {
        label.classList.remove('is-selected');
      }
    });

    if (totalEl) totalEl.textContent = `$${total} MXN`;
    if (countEl) {
      countEl.textContent = selectedNames.length === 1
        ? '1 especialidad seleccionada'
        : `${selectedNames.length} especialidades seleccionadas`;
    }

    if (waBtn) {
      const nameVal = (guestName && guestName.value.trim()) ? guestName.value.trim() : 'Cliente Love Kitty';
      const itemsText = selectedNames.length ? selectedNames.join(', ') : 'Por definir en chat';
      const notesVal = (orderNotes && orderNotes.value.trim()) ? ` · Nota: ${orderNotes.value.trim()}` : '';

      let message = '';
      if (currentMode === 'reserva') {
        const dVal = (visitDate && visitDate.value) ? visitDate.value : 'Próxima visita';
        const tVal = (visitTime && visitTime.value) ? visitTime.value : '18:00';
        const gVal = (guestCount && guestCount.value) ? guestCount.value : '2 personas';
        message = `Hola Love Kitty Café, soy ${nameVal}. Quiero reservar mesa para ${gVal} el día ${dVal} a las ${tVal}. Antojo inicial: ${itemsText} (Estimado $${total} MXN)${notesVal}.`;
        waBtn.textContent = `Confirmar mesa por WhatsApp ($${total} MXN)`;
      } else {
        message = `Hola Love Kitty Café, soy ${nameVal}. Quiero hacer este pedido: ${itemsText}. Total estimado: $${total} MXN${notesVal}.`;
        waBtn.textContent = `Enviar pedido por WhatsApp ($${total} MXN)`;
      }

      waBtn.href = `https://wa.me/525528659717?text=${encodeURIComponent(message)}`;
    }
  };

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      currentMode = tab.getAttribute('data-builder-mode') || 'pedido';
      modeTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (reservationFields) {
        reservationFields.style.display = currentMode === 'reserva' ? 'grid' : 'none';
      }
      updateBuilder();
    });
  });

  itemOptions.forEach((label) => {
    const input = label.querySelector('input[type="checkbox"]');
    if (input) {
      input.addEventListener('change', updateBuilder);
    }
  });

  [guestName, visitDate, visitTime, guestCount, orderNotes].forEach((field) => {
    if (field) field.addEventListener('input', updateBuilder);
  });

  updateBuilder();

  // 4. Scroll Reveal Observer
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  targets.forEach((el) => io.observe(el));

  window.addEventListener('load', () => {
    setTimeout(() => {
      targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 1800);
  });
})();
