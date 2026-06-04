/* ============================================
   NEXUS — Tela de Cadastro JS
   Validação em tempo real, avatar, força de senha
   ============================================ */

(function () {
  'use strict';

  // ── Avatar / Foto de Perfil ─────────────────
  const avatarBtn   = document.getElementById('avatarBtn');
  const avatarInput = document.getElementById('foto');
  const avatarPrev  = document.getElementById('avatarPreview');
  const avatarPH    = document.getElementById('avatarPlaceholder');

  if (avatarBtn && avatarInput) {
    avatarBtn.addEventListener('click', () => avatarInput.click());

    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        avatarPrev.src = e.target.result;
        avatarPrev.style.display = 'block';
        avatarPH.style.display = 'none';
        avatarBtn.classList.add('has-photo');
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Validadores ─────────────────────────────
  const validators = {
    nome:     v => v.trim().length >= 2,
    email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    cpf:      v => v.replace(/\D/g, '').length >= 11,
    telefone: v => v.replace(/\D/g, '').length >= 10,
    endereco: v => v.trim().length >= 5,
    senha:    v => v.length >= 8,
  };

  const msgs = {
    nome:     'Informe seu nome completo',
    email:    'E-mail inválido',
    cpf:      'CPF/CNPJ inválido',
    telefone: 'Telefone inválido',
    endereco: 'Informe um endereço válido',
    senha:    'A senha deve ter pelo menos 8 caracteres',
  };

  // ── Máscara CPF/CNPJ ────────────────────────
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', () => {
      let v = cpfInput.value.replace(/\D/g, '');
      if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, '$1.$2')
             .replace(/(\d{3})(\d)/, '$1.$2')
             .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      } else {
        v = v.substring(0, 14)
             .replace(/(\d{2})(\d)/, '$1.$2')
             .replace(/(\d{3})(\d)/, '$1.$2')
             .replace(/(\d{3})(\d)/, '$1/$2')
             .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
      }
      cpfInput.value = v;
    });
  }

  // ── Máscara Telefone ─────────────────────────
  const telInput = document.getElementById('telefone');
  if (telInput) {
    telInput.addEventListener('input', () => {
      let v = telInput.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
      if (v.length > 10) v = v.substring(0,10) + '-' + v.substring(10);
      telInput.value = v;
    });
  }

  // ── Força da senha ───────────────────────────
  const senhaInput   = document.getElementById('senha');
  const strengthFill  = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');
  const senhaCampo   = document.querySelector('[data-field="senha"]');

  function calcStrength(v) {
    let score = 0;
    if (v.length >= 8)  score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return score;
  }

  if (senhaInput && strengthFill && strengthLabel) {
    senhaInput.addEventListener('input', () => {
      if (senhaInput.value.length > 0) {
        senhaCampo.classList.add('typing');
      } else {
        senhaCampo.classList.remove('typing');
      }

      const score = calcStrength(senhaInput.value);
      const pct = (score / 5) * 100;
      const colors = ['#ff2d55','#ff6b35','#ffd60a','#7c00e0','#bb86fc'];
      const labels = ['Muito fraca','Fraca','Razoável','Forte','Muito forte'];
      strengthFill.style.width = pct + '%';
      strengthFill.style.background = colors[Math.min(score - 1, 4)] || colors[0];
      strengthLabel.textContent = score > 0 ? labels[Math.min(score - 1, 4)] : '';
      strengthLabel.style.color = colors[Math.min(score - 1, 4)] || 'transparent';
    });
  }

  // ── Mostrar/ocultar senha ───────────────────
  const senhaToggle = document.getElementById('senhaToggle');
  if (senhaToggle && senhaInput) {
    senhaToggle.addEventListener('click', () => {
      const isPass = senhaInput.type === 'password';
      senhaInput.type = isPass ? 'text' : 'password';
      senhaToggle.style.color = isPass
        ? 'var(--purple-300)'
        : 'var(--text-muted)';
    });
  }

  // ── Validação por campo ──────────────────────
  function validateField(el) {
    const campo = el.closest('[data-field]');
    if (!campo) return;
    const field   = campo.dataset.field;
    const msgEl   = campo.querySelector('.campo-msg');
    const isValid = validators[field]?.(el.value);

    if (el.value === '') {
      campo.classList.remove('valid', 'invalid');
      if (msgEl) msgEl.textContent = '';
      return;
    }

    if (isValid) {
      campo.classList.add('valid');
      campo.classList.remove('invalid');
      if (msgEl) msgEl.textContent = '';
    } else {
      campo.classList.remove('valid');
      campo.classList.add('invalid');
      if (msgEl) msgEl.textContent = msgs[field] || '';
    }
  }

  // Blur = toca o campo e valida
  document.querySelectorAll('.campo-wrap input').forEach(input => {
    input.addEventListener('input',  () => validateField(input));
    input.addEventListener('blur',   () => {
      if (input.value === '') {
        const campo = input.closest('[data-field]');
        if (campo) {
          campo.classList.remove('valid');
          campo.classList.add('invalid');
          const msgEl = campo.querySelector('.campo-msg');
          const field = campo.dataset.field;
          if (msgEl) msgEl.textContent = msgs[field] || 'Campo obrigatório';
        }
      }
    });
  });

  // ── Submit ───────────────────────────────────
  const form = document.getElementById('cadastroForm');
  if (form) {
    form.addEventListener('submit', e => {
      let allValid = true;
      form.querySelectorAll('.campo-wrap input').forEach(input => {
        const campo = input.closest('[data-field]');
        if (!campo) return;
        if (!validators[campo.dataset.field]?.(input.value)) {
          campo.classList.add('invalid');
          campo.classList.remove('valid');
          const msgEl = campo.querySelector('.campo-msg');
          if (msgEl) msgEl.textContent = msgs[campo.dataset.field] || 'Campo obrigatório';
          allValid = false;
        }
      });
      if (!allValid) e.preventDefault();
    });
  }

})();
