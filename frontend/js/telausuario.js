/* ============================================
   NEXUS — Tela de Usuário JS
   Edição inline de campos + edição de foto
   ============================================ */

(function () {
  'use strict';

  // ── Edição de Foto de Perfil ─────────────────
  const avatarWrap  = document.getElementById('avatarEditWrap');
  const fotoInput   = document.getElementById('fotoInput');
  const fotoPerfil  = document.getElementById('fotoPerfil');
  const avatarFB    = document.getElementById('avatarFallback');

  if (avatarWrap && fotoInput) {
    // Clicar no avatar abre o seletor de arquivo
    avatarWrap.addEventListener('click', () => fotoInput.click());

    fotoInput.addEventListener('change', () => {
      const file = fotoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        fotoPerfil.src = e.target.result;
        fotoPerfil.style.display = 'block';
        if (avatarFB) avatarFB.style.display = 'none';
        // Persiste a foto para ser lida por telaprincipal e demais telas
        try { sessionStorage.setItem('fotoPerfil', e.target.result); } catch (_) {}

        // Feedback de atualização
        const overlay = avatarWrap.querySelector('.avatar-camera-overlay');
        if (overlay) {
          overlay.style.opacity = '1';
          overlay.querySelector('span').textContent = 'Foto atualizada!';
          setTimeout(() => {
            overlay.style.opacity = '';
            overlay.querySelector('span').textContent = 'Alterar foto';
          }, 1800);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Edição inline de campos ──────────────────
  document.querySelectorAll('.perfil-campo').forEach(campo => {
    const btnEditar = campo.querySelector('.btn-editar');
    const valorEl   = campo.querySelector('.campo-valor');
    const editWrap  = campo.querySelector('.campo-edit-wrap');
    const inputEl   = campo.querySelector('.campo-input');
    const btnSave   = campo.querySelector('.btn-save');
    const btnCancel = campo.querySelector('.btn-cancel');

    if (!btnEditar || !editWrap || !inputEl) return;

    let originalValue = '';

    function openEdit() {
      if (valorEl) valorEl.style.display = 'none';
      editWrap.style.display = 'flex';
      campo.classList.add('editing');
      inputEl.value = valorEl?.textContent || '';
      originalValue = valorEl?.textContent || '';
      inputEl.focus();
      inputEl.select();
    }

    function closeEdit() {
      if (valorEl) valorEl.style.display = '';
      editWrap.style.display = 'none';
      campo.classList.remove('editing');
    }

    function saveEdit() {
      const newVal = inputEl.value.trim();
      if (!newVal) {
        inputEl.style.borderColor = 'var(--error)';
        inputEl.style.boxShadow = '0 0 0 2px var(--error-glow)';
        setTimeout(() => {
          inputEl.style.borderColor = '';
          inputEl.style.boxShadow = '';
        }, 1200);
        return;
      }

      if (valorEl) valorEl.textContent = newVal;

      // Atualiza nome exibido sobre avatar
      if (campo.dataset.field === 'nome') {
        const displayNome = document.getElementById('displayNome');
        if (displayNome) displayNome.textContent = newVal;
      }

      closeEdit();

      // Flash de confirmação roxo
      if (valorEl) {
        valorEl.style.transition = 'color 0.35s ease';
        valorEl.style.color = 'var(--purple-300)';
        setTimeout(() => { valorEl.style.color = ''; }, 1400);
      }
    }

    btnEditar.addEventListener('click', openEdit);
    btnCancel.addEventListener('click', closeEdit);
    btnSave.addEventListener('click', saveEdit);

    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); saveEdit(); }
      if (e.key === 'Escape') closeEdit();
    });
  });

})();
