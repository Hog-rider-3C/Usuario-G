const botoes = document.querySelectorAll(".botao");
const secoes = document.querySelectorAll(".secao");
const themeToggle = document.getElementById("themeToggle");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// Oculta a home de carregamento (igual comportamento do site original)
const homeEl = document.getElementById("home");
const painelEl = document.querySelector(".painel");
if (painelEl) painelEl.style.display = "none";

botoes.forEach((botao) => {
  botao.addEventListener("click", () => {
    botoes.forEach((b) => b.classList.remove("ativo"));
    secoes.forEach((s) => s.classList.remove("ativa"));

    botao.classList.add("ativo");

    const alvo = document.getElementById(botao.dataset.target);
    if (alvo) alvo.classList.add("ativa");

    sidebar.classList.remove("abrir");
    overlay.classList.remove("ativo");
  });
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("abrir");
  overlay.classList.toggle("ativo");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("abrir");
  overlay.classList.remove("ativo");
});

function abrirPainel() {
  setTimeout(() => {
    if (homeEl) homeEl.style.display = "none";
    if (painelEl) painelEl.style.display = "block";
  }, 3000);
}

setTimeout(abrirPainel, 3000);

