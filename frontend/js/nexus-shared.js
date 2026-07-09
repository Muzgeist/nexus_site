/* ============================================
   NEXUS IMPORTS — Shared JavaScript
   Scroll reveal + theme + hamburger + utils
   ============================================ */

// ── URL base da API ──
// Frontend e backend agora são dois serviços separados no Railway,
// cada um com seu próprio domínio — então não dá pra usar
// window.location.origin (isso apontaria pro próprio frontend).
// Em localhost continua batendo na porta 3000 padrão do backend local.
window.NEXUS_API_BASE = (function () {
  const { protocol, hostname } = window.location;
  if (protocol === 'file:') return 'http://localhost:3000';
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:3000';
  return 'https://nexussite-backend-production.up.railway.app';
})();

// ── Scroll Reveal (IntersectionObserver lazy) ──
(function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ── Dispara reveal imediatamente para elementos acima do fold ──
(function revealVisible() {
  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      setTimeout(() => el.classList.add('visible'), 60);
    }
  });
})();

// ── Toast utility ──────────────────────────────
window.nexusToast = function(msg, type /* 'success'|'error' */, duration) {
  let toast = document.getElementById('nexusToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'nexusToast';
    toast.className = 'nexus-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'nexus-toast' + (type ? ' toast-' + type : '');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.classList.remove('show');
  }, duration || 3200);
};

// ── Alternância de tema (dark / light) ─────────
(function initTheme() {
  const STORAGE_KEY = 'nexus-theme';

  function applyTheme(theme) {
    document.body.classList.toggle('theme-light', theme === 'light');
  }

  // Aplica o tema salvo (ou dark por defeito)
  const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  applyTheme(saved);

  // Cria o botão flutuante de tema
  function createThemeButton() {
    if (document.getElementById('btnThemeToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'btnThemeToggle';
    btn.className = 'btn-theme-toggle';
    btn.setAttribute('aria-label', 'Alternar tema');
    btn.setAttribute('title', 'Alternar tema claro/escuro');
    btn.innerHTML = `
      <svg class="icon-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      <svg class="icon-light" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>`;
    btn.addEventListener('click', () => {
      const current = localStorage.getItem(STORAGE_KEY) || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });

    // Insere dentro da área de ações do header, à esquerda do hamburguer.
    // Caso a página não tenha header-actions (compatibilidade), cai para o body.
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      const hamburger = headerActions.querySelector('.btn-hamburger');
      if (hamburger) {
        headerActions.insertBefore(btn, hamburger);
      } else {
        headerActions.insertBefore(btn, headerActions.firstChild);
      }
    } else {
      btn.classList.add('btn-theme-toggle--floating');
      document.body.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createThemeButton);
  } else {
    createThemeButton();
  }
})();

// ── Hamburguer Menu ────────────────────────────
(function initHamburger() {
  function setup() {
    const btn = document.getElementById('btnHamburger');
    const dropdown = document.getElementById('hamburgerDropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      btn.classList.toggle('open', !isOpen);
      dropdown.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
        btn.classList.remove('open');
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Fecha ao pressionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        btn.classList.remove('open');
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

// ── Logout ─────────────────────────────────────
window.nexusLogout = function() {
  sessionStorage.removeItem('usuario');
  sessionStorage.removeItem('fotoPerfil');
  sessionStorage.removeItem('nexus-google-user');
  window.location.href = 'telalogin.html';
};

// ── Google OAuth (simulado – integrar com backend real) ─
window.nexusGoogleLogin = function() {
  // Exibe feedback enquanto não há Client ID real configurado
  const clientId = window.NEXUS_GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    nexusToast('Configure NEXUS_GOOGLE_CLIENT_ID para ativar o login com Google.', 'error', 4000);
    return;
  }

  // Quando o Client ID estiver configurado, redireciona para o fluxo OAuth
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account`;
  window.location.href = url;
};
