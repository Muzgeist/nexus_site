/* ============================================
   NEXUS — Tela de Usuário JS
   Carrega dados reais do usuário logado, permite
   editar nome / e-mail / telefone com persistência
   no backend (PUT /usuario/:id) + edição de foto.
   ============================================ */

(function () {
  'use strict';

  const API = 'http://localhost:3000';

  /* ── 1. GUARD DE AUTENTICAÇÃO ────────────────── */
  const usuarioRaw = sessionStorage.getItem('usuario');
  if (!usuarioRaw) { window.location.replace('telalogin.html'); return; }
  let usuario = {};
  try { usuario = JSON.parse(usuarioRaw); } catch (e) { window.location.replace('telalogin.html'); return; }

  /* ── 2. PREENCHE OS CAMPOS COM OS DADOS REAIS ── */
  const displayNome = document.getElementById('displayNome');
  const elNome      = document.getElementById('nome');
  const elEmail     = document.getElementById('email');
  const elCpf       = document.getElementById('cpf');
  const elTelefone  = document.getElementById('telefone');
  const elEndereco  = document.getElementById('endereco');

  if (displayNome) displayNome.textContent = usuario.nome || 'Nome do Usuário';
  if (elNome)      elNome.textContent      = usuario.nome || '';
  if (elEmail)     elEmail.textContent     = usuario.email || '';
  if (elCpf)        elCpf.textContent      = usuario.cpf_cnpj || '';
  if (elTelefone)   elTelefone.textContent = usuario.telefone || '';
  if (elEndereco)   elEndereco.textContent = usuario.endereco || 'Endereço não informado';

  // Os inputs de edição (escondidos) também recebem o valor atual,
  // já que o HTML traz valores de exemplo fixos.
  document.querySelectorAll('.perfil-campo').forEach(campo => {
    const input = campo.querySelector('.campo-input');
    const valor = campo.querySelector('.campo-valor');
    if (input && valor) input.value = valor.textContent;
  });

  // CPF/CNPJ não pode ser editado (é único e fixo no cadastro)
  const campoCpf = document.querySelector('.perfil-campo[data-field="cpf"]');
  if (campoCpf) {
    const btnEditarCpf = campoCpf.querySelector('.btn-editar');
    if (btnEditarCpf) btnEditarCpf.style.display = 'none';
  }

  /* ── 3. FOTO DE PERFIL (avatar header + sessão) ── */
  const avatarWrap  = document.getElementById('avatarEditWrap');
  const fotoInput   = document.getElementById('fotoInput');
  const fotoPerfil  = document.getElementById('fotoPerfil');
  const avatarFB    = document.getElementById('avatarFallback');

  const fotoSalva = sessionStorage.getItem('fotoPerfil');
  if (fotoSalva && fotoPerfil) {
    fotoPerfil.src = fotoSalva;
    fotoPerfil.style.display = 'block';
    if (avatarFB) avatarFB.style.display = 'none';
  }

  if (avatarWrap && fotoInput) {
    avatarWrap.addEventListener('click', () => fotoInput.click());

    // Redimensiona/comprime a imagem antes de persistir: uma foto de
    // câmera/celular sem compressão (vários MB em base64) estourava a cota
    // do sessionStorage e o setItem falhava silenciosamente — a foto parecia
    // mudar na hora, mas sumia ao recarregar ou trocar de tela.
    function comprimirImagem(file, maxLado = 480, qualidade = 0.85) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          const img = new Image();
          img.onload = () => {
            let { width, height } = img;
            if (width > height && width > maxLado) {
              height = Math.round(height * (maxLado / width));
              width = maxLado;
            } else if (height > maxLado) {
              width = Math.round(width * (maxLado / height));
              height = maxLado;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', qualidade));
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    fotoInput.addEventListener('change', () => {
      const file = fotoInput.files[0];
      if (!file) return;

      const overlay = avatarWrap.querySelector('.avatar-camera-overlay');

      comprimirImagem(file).then(dataUrl => {
        fotoPerfil.src = dataUrl;
        fotoPerfil.style.display = 'block';
        if (avatarFB) avatarFB.style.display = 'none';
        // Persiste a foto localmente (sessão) para ser lida por
        // telaprincipal e demais telas. Upload para o servidor não
        // está implementado nesta versão.
        try {
          sessionStorage.setItem('fotoPerfil', dataUrl);
        } catch (err) {
          if (overlay) {
            overlay.style.opacity = '1';
            overlay.querySelector('span').textContent = 'Foto muito grande, tente outra';
            setTimeout(() => {
              overlay.style.opacity = '';
              overlay.querySelector('span').textContent = 'Alterar foto';
            }, 2200);
          }
          return;
        }

        if (overlay) {
          overlay.style.opacity = '1';
          overlay.querySelector('span').textContent = 'Foto atualizada!';
          setTimeout(() => {
            overlay.style.opacity = '';
            overlay.querySelector('span').textContent = 'Alterar foto';
          }, 1800);
        }
      }).catch(() => {});
    });
  }

  /* ── 4. EDIÇÃO INLINE + SALVAR NO BACKEND ────── */
  document.querySelectorAll('.perfil-campo').forEach(campo => {
    const field     = campo.dataset.field;
    const btnEditar = campo.querySelector('.btn-editar');
    const valorEl   = campo.querySelector('.campo-valor');
    const editWrap  = campo.querySelector('.campo-edit-wrap');
    const inputEl   = campo.querySelector('.campo-input');
    const btnSave   = campo.querySelector('.btn-save');
    const btnCancel = campo.querySelector('.btn-cancel');

    if (!btnEditar || !editWrap || !inputEl) return;

    function openEdit() {
      if (valorEl) valorEl.style.display = 'none';
      editWrap.style.display = 'flex';
      campo.classList.add('editing');
      inputEl.value = valorEl?.textContent || '';
      inputEl.focus();
      inputEl.select();
    }

    function closeEdit() {
      if (valorEl) valorEl.style.display = '';
      editWrap.style.display = 'none';
      campo.classList.remove('editing');
    }

    function setSaving(isSaving) {
      if (btnSave) {
        btnSave.disabled = isSaving;
        btnSave.textContent = isSaving ? 'Salvando...' : 'Salvar';
      }
    }

    function showFieldError(msg) {
      inputEl.style.borderColor = 'var(--error)';
      inputEl.style.boxShadow = '0 0 0 2px var(--error-glow)';
      if (msg) alert(msg);
      setTimeout(() => {
        inputEl.style.borderColor = '';
        inputEl.style.boxShadow = '';
      }, 1200);
    }

    async function saveEdit() {
      const newVal = inputEl.value.trim();
      if (!newVal) { showFieldError(); return; }

      // A rota PUT /usuario/:id atualiza nome/email/telefone/endereço juntos,
      // então sempre reenviamos os 4 (só o campo editado muda de fato).
      const payload = {
        nome:     field === 'nome'     ? newVal : (elNome?.textContent || usuario.nome),
        email:    field === 'email'    ? newVal : usuario.email,
        telefone: field === 'telefone' ? newVal : usuario.telefone,
        endereco: field === 'endereco' ? newVal : usuario.endereco,
      };

      try {
        setSaving(true);
        const res = await fetch(`${API}/usuario/${usuario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resultado = await res.json();

        if (!res.ok) {
          showFieldError(resultado.erro || 'Não foi possível salvar. Tente novamente.');
          return;
        }

        usuario = { ...usuario, ...resultado.usuario };
        sessionStorage.setItem('usuario', JSON.stringify(usuario));

        if (valorEl) valorEl.textContent = newVal;
        if (field === 'nome' && displayNome) displayNome.textContent = newVal;

        closeEdit();

        if (valorEl) {
          valorEl.style.transition = 'color 0.35s ease';
          valorEl.style.color = 'var(--purple-300)';
          setTimeout(() => { valorEl.style.color = ''; }, 1400);
        }
      } catch (erro) {
        showFieldError('Erro ao conectar com o servidor. Verifique se ele está rodando.');
      } finally {
        setSaving(false);
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
