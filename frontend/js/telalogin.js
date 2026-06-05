/* ============================================
   NEXUS — Tela de Login JS
   ============================================ */

(function () {
  'use strict';

  const validators = {
    nome:  v => v.trim().length >= 2,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    senha: v => v.length >= 8,
  };

  const msgs = {
    nome:  'Informe seu nome',
    email: 'E-mail inválido',
    senha: 'Senha inválida',
  };

  function validateField(input) {
    const campo = input.closest('[data-field]');
    if (!campo) return;
    const field   = campo.dataset.field;
    const msgEl   = campo.querySelector('.campo-msg');
    const isValid = validators[field]?.(input.value);

    if (input.value === '') {
      campo.classList.remove('valid', 'invalid');
      if (msgEl) msgEl.textContent = '';
      return;
    }

    campo.classList.toggle('valid',   !!isValid);
    campo.classList.toggle('invalid', !isValid);
    if (msgEl) msgEl.textContent = isValid ? '' : (msgs[field] || '');
  }

  document.querySelectorAll('.campo-wrap input').forEach(input => {
    input.addEventListener('input', () => validateField(input));
    input.addEventListener('blur', () => {
      if (input.value === '') {
        const campo = input.closest('[data-field]');
        if (!campo) return;
        campo.classList.add('invalid');
        const msgEl = campo.querySelector('.campo-msg');
        if (msgEl) msgEl.textContent = msgs[campo.dataset.field] || 'Obrigatório';
      }
    });
  });

  // Mostrar/ocultar senha
  const senhaInput  = document.getElementById('senha');
  const senhaToggle = document.getElementById('senhaToggle');
  if (senhaToggle && senhaInput) {
    senhaToggle.addEventListener('click', () => {
      const isPass = senhaInput.type === 'password';
      senhaInput.type = isPass ? 'text' : 'password';
      senhaToggle.style.color = isPass ? 'var(--purple-300)' : 'var(--text-muted)';
    });
  }

  // Submit
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async e => {
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
      //adicionar aqui 
      if (!allValid) {
    e.preventDefault();
    return;
}

e.preventDefault();

const dados = {
    email: form.querySelector('[data-field="email"] input').value,
    senha: form.querySelector('[data-field="senha"] input').value,
};

try {
    const resposta = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
        alert('Login realizado com sucesso!');
        window.location.href = 'telausuario.html';
    } else {
        alert(resultado.erro);
    }
} catch (erro) {
    alert('Erro ao conectar com o servidor');
}
    });
  }

})();
