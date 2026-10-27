const el = {
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

  el.resumo.textContent = `${concluidas} de ${total} concluídas`;
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
}

function criarItem(tarefa) {
  const item = el.modelo.content.firstElementChild.cloneNode(true);
  item.dataset.id = String(tarefa.id);

  const titulo = item.querySelector(".tarefa__titulo");
  titulo.textContent = tarefa.titulo;

  const campo = item.querySelector(".tarefa__campo");
  campo.checked = Boolean(tarefa.concluida);
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

export function iniciarInterface({ aoTentarNovamente }) {
  if (aoTentarNovamente) {
    el.botaoTentar.addEventListener("click", () => aoTentarNovamente());
  }
}
