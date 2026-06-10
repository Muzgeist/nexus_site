/* ============================================
   NEXUS IMPORTS — Tela Principal (Home) JS
   - Guarda de autenticação
   - Foto de perfil no header
   - Partículas de fundo
   - Card "Produtos" (placeholder até página existir)
   ============================================ */

(function () {
  'use strict';

  /* ── 1. GUARDA DE AUTENTICAÇÃO ─────────────────
     Se não houver sessão ativa, redireciona para login.
     Deve ser a primeira coisa a rodar.
  ──────────────────────────────────────────────── */
  const usuarioRaw = sessionStorage.getItem('usuario');
  if (!usuarioRaw) {
    window.location.replace('telalogin.html');
    return; // interrompe todo o resto
  }

  let usuario = {};
  try {
    usuario = JSON.parse(usuarioRaw);
  } catch (e) {
    window.location.replace('telalogin.html');
    return;
  }

  /* ── 2. NOME DO USUÁRIO NO HERO ────────────────
     Usa o campo "nome" vindo do backend (ou fallback).
  ──────────────────────────────────────────────── */
  const heroName = document.getElementById('heroUserName');
  if (heroName && usuario.nome) {
    // Exibe só o primeiro nome para caber no hero
    const primeiroNome = usuario.nome.trim().split(' ')[0].toUpperCase();
    heroName.textContent = primeiroNome;
  }

  /* ── 3. AVATAR NO HEADER ───────────────────────
     Tenta recuperar a foto salva em sessionStorage
     (mesma chave usada por telausuario.js via FileReader).
     Se não houver foto, mantém o ícone de fallback.
  ──────────────────────────────────────────────── */
  const avatarImg      = document.getElementById('avatarHeaderImg');
  const avatarFallback = document.getElementById('avatarHeaderFallback');
  const fotoSalva      = sessionStorage.getItem('fotoPerfil');

  if (avatarImg && fotoSalva) {
    avatarImg.src = fotoSalva;
    avatarImg.style.display = 'block';
    if (avatarFallback) avatarFallback.style.display = 'none';
  }

  // Clique no avatar leva para o perfil
  const btnAvatar = document.getElementById('btnAvatarHeader');
  if (btnAvatar) {
    btnAvatar.addEventListener('click', () => {
      window.location.href = 'telausuario.html';
    });
  }

  /* ── 4. CARD "PRODUTOS" ────────────────────────
     Enquanto não existe uma telaprodutos.html dedicada,
     o card aponta para o carrinho. Quando a página for
     criada basta alterar o data-href do elemento.
  ──────────────────────────────────────────────── */
  const cardProdutos = document.getElementById('cardProdutos');
  if (cardProdutos) {
    const destino = cardProdutos.dataset.href || 'telacarrinho.html';
    cardProdutos.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = destino;
    });
    // Garante que o href reflita o data-href para acessibilidade
    cardProdutos.setAttribute('href', destino);
  }

  /* ── 5. PARTÍCULAS DE FUNDO ────────────────────
     Canvas leve com pontos flutuantes na paleta do projeto.
     Só carrega elementos que estão na tela (IntersectionObserver
     não se aplica a canvas — usamos visibility check no RAF).
  ──────────────────────────────────────────────── */
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  let W, H;
  const COLORS = ['#9d33ff', '#e040fb', '#bb86fc', '#f570ff'];
  const TOTAL  = 55;
  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    return {
      x:    rand(0, W),
      y:    rand(0, H),
      r:    rand(0.6, 2.2),
      vx:   rand(-0.18, 0.18),
      vy:   rand(-0.22, -0.06),
      alpha:rand(0.15, 0.65),
      color:COLORS[Math.floor(Math.random() * COLORS.length)],
      life: rand(0, 1),        // fase inicial aleatória
      speed:rand(0.003, 0.008) // velocidade do ciclo de vida
    };
  }

  function resetParticle(p) {
    p.x     = rand(0, W);
    p.y     = H + 10;
    p.r     = rand(0.6, 2.2);
    p.vx    = rand(-0.18, 0.18);
    p.vy    = rand(-0.22, -0.06);
    p.alpha = rand(0.15, 0.65);
    p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    p.life  = 0;
    p.speed = rand(0.003, 0.008);
  }

  resize();
  for (let i = 0; i < TOTAL; i++) particles.push(createParticle());
  window.addEventListener('resize', resize);

  let rafId;
  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.life += p.speed;
      if (p.life > 1) { resetParticle(p); continue; }

      // Fade-in / fade-out suave
      const fade = p.life < 0.15
        ? p.life / 0.15
        : p.life > 0.8
          ? (1 - p.life) / 0.2
          : 1;

      p.x += p.vx;
      p.y += p.vy;

      ctx.save();
      ctx.globalAlpha = p.alpha * fade;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    rafId = requestAnimationFrame(tick);
  }

  // Pausa a animação quando a aba não está visível (economia de CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      tick();
    }
  });

  tick();

})();
