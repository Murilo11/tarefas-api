import * as api from "./api.js";
import * as ui from "./ui.js";
import { iniciarTema } from "./theme.js";

const estado = {
  tarefas: [],
};

async function carregarTarefas() {
  ui.mostrarCarregando();
  try {
    estado.tarefas = await api.listarTarefas();
    ui.renderizarTarefas(estado.tarefas);
  } catch (erro) {
    ui.mostrarErroFatal(erro);
  }
}

ui.definirData();
ui.iniciarInterface({ aoTentarNovamente: carregarTarefas });
iniciarTema();
carregarTarefas();
