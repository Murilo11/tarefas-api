const CHAVE = "rascunho:tema";
const CORES = { light: "#f4f0e6", dark: "#1b1c17" };

function temaAtual() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function temaSalvo() {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "dark" || valor === "light" ? valor : null;
  } catch (erro) {
    return null;
  }
}

function aplicarTema(tema, persistir = false) {
  document.documentElement.dataset.theme = tema;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", CORES[tema]);

  const botao = document.querySelector("#botao-tema");
  if (botao) {
    const escuro = tema === "dark";
    botao.setAttribute("aria-pressed", String(escuro));
    botao.setAttribute("aria-label", escuro ? "Ativar tema claro" : "Ativar tema escuro");
  }

  if (persistir) {
    try {
      localStorage.setItem(CHAVE, tema);
    } catch (erro) {
      // Sem localStorage: a escolha vale só para esta visita.
    }
  }
}

export function iniciarTema() {
  aplicarTema(temaAtual());

  const botao = document.querySelector("#botao-tema");
  if (botao) {
    botao.addEventListener("click", () => {
      const novo = temaAtual() === "dark" ? "light" : "dark";
      aplicarTema(novo, true);
    });
  }

  // Enquanto o usuário não escolher, acompanha o tema do sistema.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (evento) => {
    if (temaSalvo() === null) aplicarTema(evento.matches ? "dark" : "light");
  });
}
