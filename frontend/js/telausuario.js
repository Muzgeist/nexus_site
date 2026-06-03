/* ============================================
   NEXUS — Tela de Usuário JS
   Edição inline de campos do perfil
   ============================================ */

(function () {
  'use strict';

  // ── Edição inline por campo ──────────────────
  document.querySelectorAll('.perfil-campo').forEach(campo => {
    const btnEditar   = campo.querySelector('.btn-editar');
    const valorEl     = campo.querySelector('.campo-valor');
    const editWrap    = campo.querySelector('.campo-edit-wrap');
    const inputEl     = campo.querySelector('.campo-input');
    const btnSave     = campo.querySelector('.btn-save');
    const btnCancel   = campo.querySelector('.btn-cancel');

    if (!btnEditar || !editWrap || !inputEl) return;

    let originalValue = valorEl?.textContent || '';

    // Abrir edição
    function openEdit() {
      if (valorEl)   valorEl.style.display = 'none';
      editWrap.style.display = 'flex';
      campo.classList.add('editing');
      inputEl.value = valorEl?.textContent || '';
      originalValue = valorEl?.textContent || '';
      inputEl.focus();
      inputEl.select();
    }

    // Fechar edição (cancelar)
    function closeEdit() {
      if (valorEl)   valorEl.style.display = '';
      editWrap.style.display = 'none';
      campo.classList.remove('editing');
    }

    // Salvar
    function saveEdit() {
      const newVal = inputEl.value.trim();
      if (!newVal) {
        inputEl.style.borderColor = 'var(--error)';
        inputEl.style.boxShadow = '0 0 0 2px var(--error-glow)';
        setTimeout(() => {
          inputEl.style.borderColor = '';
          inputEl.style.boxShadow   = '';
        }, 1200);
        return;
      }

      if (valorEl) valorEl.textContent = newVal;

      // Se for o campo "nome", atualiza o nome exibido no avatar
      if (campo.dataset.field === 'nome') {
        const displayNome = document.getElementById('displayNome');
        if (displayNome) displayNome.textContent = newVal;
      }

      closeEdit();

      // Feedback visual de salvo
      valorEl.style.color = 'var(--purple-300)';
      valorEl.style.transition = 'color 0.4s ease';
      setTimeout(() => {
        valorEl.style.color = '';
      }, 1400);
    }

    btnEditar.addEventListener('click', openEdit);
    btnCancel.addEventListener('click', closeEdit);
    btnSave.addEventListener('click', saveEdit);

    // Enter = salvar, Esc = cancelar
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); saveEdit(); }
      if (e.key === 'Escape') closeEdit();
    });
  });

})();
