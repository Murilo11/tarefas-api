const el = {
  formulario: document.querySelector("#formulario"),
  campo: document.querySelector("#campo-titulo"),
  botaoAnotar: document.querySelector("#botao-anotar"),
  avisoCampo: document.querySelector("#aviso-campo"),
  lista: document.querySelector("#lista"),
  esqueleto: document.querySelector("#esqueleto"),
  vazio: document.querySelector("#vazio"),
  erro: document.querySelector("#erro"),
  erroTexto: document.querySelector("#erro-texto"),
  botaoTentar: document.querySelector("#botao-tentar"),
  resumo: document.querySelector("#resumo"),
  anuncio: document.querySelector("#anuncio"),
  avisoLista: document.querySelector("#aviso-lista"),
  data: document.querySelector("#data-hoje"),
  modelo: document.querySelector("#modelo-tarefa"),
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const temporizadores = new WeakMap();

export function definirData() {
  const texto = formatadorData.format(new Date());
  el.data.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function anunciar(mensagem) {
  el.anuncio.textContent = mensagem;
}

export function atualizarResumo(tarefas) {
  const total = tarefas.length;
  const concluidas = tarefas.filter((tarefa) => tarefa.concluida).length;

  if (total === 0) {
    el.resumo.textContent = "Nenhuma tarefa ainda";
    return;
  }

  if (concluidas === total) {
    el.resumo.textContent = `${total} de ${total} — página em dia`;
    return;
  }

  el.resumo.textContent = `${concluidas} de ${total} ${total === 1 ? "concluída" : "concluídas"}`;
}

export function mostrarCarregando() {
  el.esqueleto.hidden = false;
  el.vazio.hidden = true;
  el.erro.hidden = true;
  el.lista.hidden = true;
  el.avisoLista.hidden = true;
  el.resumo.textContent = "…";
  anunciar("Carregando tarefas.");
}

export function mostrarErroFatal(erro) {
  const semRede = erro?.tipo === "rede";
  el.erroTexto.textContent = semRede
    ? "A API não respondeu. Ela hiberna no plano gratuito e pode levar cerca de um minuto para acordar."
    : "A API respondeu com um erro inesperado. Tente de novo em instantes.";

  el.esqueleto.hidden = true;
  el.vazio.hidden = true;
  el.lista.hidden = true;
  el.avisoLista.hidden = true;
  el.erro.hidden = false;
  el.resumo.textContent = "—";
}

export function renderizarTarefas(tarefas) {
  el.lista.replaceChildren();
  el.esqueleto.hidden = true;
  el.erro.hidden = true;

  if (tarefas.length === 0) {
    el.lista.hidden = true;
    el.vazio.hidden = false;
    atualizarResumo(tarefas);
    anunciar("Nenhuma tarefa anotada.");
    return;
  }

  const fragmento = document.createDocumentFragment();
  for (const tarefa of tarefas) {
    fragmento.append(criarItem(tarefa));
  }

  el.lista.append(fragmento);
  el.lista.hidden = false;
  el.vazio.hidden = true;
  atualizarResumo(tarefas);
  anunciar(tarefas.length === 1 ? "1 tarefa carregada." : `${tarefas.length} tarefas carregadas.`);
}

export function adicionarTarefa(tarefa, tarefas) {
  el.vazio.hidden = true;
  el.erro.hidden = true;
  el.lista.hidden = false;
  el.lista.append(criarItem(tarefa));
  atualizarResumo(tarefas);
  anunciar("Tarefa anotada.");
}

export function mostrarVazio() {
  el.lista.replaceChildren();
  el.lista.hidden = true;
  el.esqueleto.hidden = true;
  el.erro.hidden = true;
  el.vazio.hidden = false;
  atualizarResumo([]);
  anunciar("Nenhuma tarefa anotada.");
}

export function mostrarAviso(mensagem) {
  el.avisoLista.textContent = mensagem;
  el.avisoLista.hidden = false;
}

export function limparAviso() {
  el.avisoLista.textContent = "";
  el.avisoLista.hidden = true;
}

export function mostrarErroCampo(mensagem) {
  el.avisoCampo.textContent = mensagem;
  el.avisoCampo.classList.add("aviso-campo--erro");
  el.campo.setAttribute("aria-invalid", "true");
}

export function limparErroCampo() {
  el.avisoCampo.textContent = "";
  el.avisoCampo.classList.remove("aviso-campo--erro");
  el.campo.removeAttribute("aria-invalid");
}

export function limparCampo() {
  el.campo.value = "";
}

export function lerTitulo() {
  return el.campo.value.trim();
}

export function focarCampo() {
  el.campo.focus();
}

export function definirCriando(ativo) {
  el.botaoAnotar.disabled = ativo;
  el.botaoAnotar.textContent = ativo ? "Anotando…" : "Anotar";
  el.formulario.setAttribute("aria-busy", String(ativo));
}

export function aplicarConclusao(tarefa) {
  const item = itemPorId(tarefa.id);
  if (!item) return;

  const campo = item.querySelector(".tarefa__campo");
  campo.setAttribute("aria-checked", "true");
  campo.disabled = true;
  campo.setAttribute("aria-label", `Tarefa concluída: ${tarefa.titulo}`);
  item.classList.add("tarefa--concluida");
  anunciar("Tarefa concluída.");
}

export async function animarSaida(id) {
  const item = itemPorId(id);
  if (!item) return;

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    item.classList.add("tarefa--saindo");
    await new Promise((resolver) => setTimeout(resolver, 170));
  }

  item.remove();
}

export function restaurarExcluir(botao) {
  botao.disabled = false;
  botao.textContent = "Excluir";
  cancelarConfirmacao(botao);
  botao.setAttribute("aria-label", `Excluir tarefa: ${tituloDoItem(botao)}`);
}

export function iniciarInterface({ aoCriar, aoConcluir, aoExcluir, aoTentarNovamente }) {
  el.formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const titulo = el.campo.value.trim();

    if (!titulo) {
      mostrarErroCampo("Escreva algo antes de anotar.");
      el.campo.focus();
      return;
    }

    aoCriar(titulo);
  });

  el.campo.addEventListener("input", limparErroCampo);

  el.lista.addEventListener("click", (evento) => {
    const campo = evento.target.closest(".tarefa__campo");
    if (campo && campo.getAttribute("aria-checked") !== "true") {
      aoConcluir(Number(campo.closest(".tarefa").dataset.id), campo);
      return;
    }

    const botao = evento.target.closest(".tarefa__excluir");
    if (!botao) return;

    if (botao.dataset.confirmando === "true") {
      cancelarConfirmacao(botao);
      botao.disabled = true;
      aoExcluir(Number(botao.closest(".tarefa").dataset.id), botao);
      return;
    }

    pedirConfirmacao(botao);
  });

  el.botaoTentar.addEventListener("click", () => aoTentarNovamente?.());
}

function criarItem(tarefa) {
  const item = el.modelo.content.firstElementChild.cloneNode(true);
  item.dataset.id = String(tarefa.id);

  item.querySelector(".tarefa__titulo").textContent = tarefa.titulo;

  const campo = item.querySelector(".tarefa__campo");
  campo.setAttribute("aria-checked", String(Boolean(tarefa.concluida)));
  campo.disabled = Boolean(tarefa.concluida);
  campo.setAttribute(
    "aria-label",
    tarefa.concluida ? `Tarefa concluída: ${tarefa.titulo}` : `Concluir tarefa: ${tarefa.titulo}`,
  );

  if (tarefa.concluida) item.classList.add("tarefa--concluida");

  const excluir = item.querySelector(".tarefa__excluir");
  excluir.setAttribute("aria-label", `Excluir tarefa: ${tarefa.titulo}`);

  return item;
}

function itemPorId(id) {
  return el.lista.querySelector(`.tarefa[data-id="${CSS.escape(String(id))}"]`);
}

function tituloDoItem(botao) {
  return botao.closest(".tarefa")?.querySelector(".tarefa__titulo")?.textContent ?? "";
}

function pedirConfirmacao(botao) {
  botao.dataset.confirmando = "true";
  botao.textContent = "Confirmar?";
  botao.setAttribute("aria-label", "Confirmar exclusão da tarefa");

  const anterior = temporizadores.get(botao);
  if (anterior) clearTimeout(anterior);
  temporizadores.set(botao, setTimeout(() => cancelarConfirmacao(botao), 3000));

  botao.addEventListener("blur", () => cancelarConfirmacao(botao), { once: true });
  botao.addEventListener(
    "keydown",
    (evento) => {
      if (evento.key === "Escape") cancelarConfirmacao(botao);
    },
    { once: true },
  );
}

function cancelarConfirmacao(botao) {
  const timer = temporizadores.get(botao);
  if (timer) clearTimeout(timer);
  temporizadores.delete(botao);

  if (botao.dataset.confirmando !== "true") return;

  delete botao.dataset.confirmando;
  botao.textContent = "Excluir";
  botao.setAttribute("aria-label", `Excluir tarefa: ${tituloDoItem(botao)}`);
}
