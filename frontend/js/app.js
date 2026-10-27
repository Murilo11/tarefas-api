import * as api from "./api.js";
import * as ui from "./ui.js";
import { iniciarTema } from "./theme.js";

const estado = {
  tarefas: [],
};

function mensagemDeErro(erro) {
  if (erro?.tipo === "rede") {
    return "A API não respondeu. Ela pode estar acordando — tente de novo em instantes.";
  }
  if (erro?.tipo === "invalida") {
    return "O título não passou na validação. Use pelo menos um caractere.";
  }
  if (erro?.tipo === "nao_encontrada") {
    return "Essa tarefa não existe mais.";
  }
  return "A API respondeu com um erro inesperado. Tente de novo em instantes.";
}

async function carregarTarefas() {
  ui.limparAviso();
  ui.mostrarCarregando();

  try {
    estado.tarefas = await api.listarTarefas();
    ui.renderizarTarefas(estado.tarefas);
  } catch (erro) {
    ui.mostrarErroFatal(erro);
  }
}

async function criar(titulo) {
  ui.limparErroCampo();
  ui.limparAviso();
  ui.definirCriando(true);

  try {
    const tarefa = await api.criarTarefa(titulo);
    estado.tarefas.push(tarefa);
    ui.adicionarTarefa(tarefa, estado.tarefas);
    ui.limparCampo();
  } catch (erro) {
    ui.mostrarErroCampo(mensagemDeErro(erro));
  } finally {
    ui.definirCriando(false);
    ui.focarCampo();
  }
}

async function concluir(id, campo) {
  campo.disabled = true;
  ui.limparAviso();

  try {
    const atualizada = await api.concluirTarefa(id);
    const indice = estado.tarefas.findIndex((tarefa) => tarefa.id === id);
    if (indice !== -1) estado.tarefas[indice] = atualizada;

    ui.aplicarConclusao(atualizada);
    ui.atualizarResumo(estado.tarefas);
  } catch (erro) {
    campo.setAttribute("aria-checked", "false");
    campo.disabled = false;

    if (erro?.tipo === "nao_encontrada") {
      await carregarTarefas();
      ui.mostrarAviso("Essa tarefa não está mais aqui. Atualizei a lista.");
    } else {
      ui.mostrarAviso(mensagemDeErro(erro));
    }
  }
}

async function excluir(id, botao) {
  botao.disabled = true;
  botao.textContent = "Excluindo…";
  ui.limparAviso();

  try {
    await api.excluirTarefa(id);
    estado.tarefas = estado.tarefas.filter((tarefa) => tarefa.id !== id);

    await ui.animarSaida(id);

    if (estado.tarefas.length === 0) {
      ui.mostrarVazio();
    } else {
      ui.atualizarResumo(estado.tarefas);
    }
    ui.anunciar("Tarefa excluída.");
  } catch (erro) {
    ui.restaurarExcluir(botao);

    if (erro?.tipo === "nao_encontrada") {
      await carregarTarefas();
      ui.mostrarAviso("Essa tarefa não está mais aqui. Atualizei a lista.");
    } else {
      ui.mostrarAviso(mensagemDeErro(erro));
    }
  }
}

ui.definirData();
ui.iniciarInterface({
  aoCriar: criar,
  aoConcluir: concluir,
  aoExcluir: excluir,
  aoTentarNovamente: carregarTarefas,
});
iniciarTema();
carregarTarefas();
