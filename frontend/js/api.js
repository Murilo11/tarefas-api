import { API_URL } from "./config.js";

const LIMITE_MS = 90_000;

export class ApiError extends Error {
  constructor(mensagem, { status = 0, tipo = "servidor" } = {}) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.tipo = tipo;
  }
}

function mensagemDoStatus(status) {
  if (status === 404) return "Essa tarefa não existe mais.";
  if (status === 422) return "O título não passou na validação.";
  if (status >= 500) return "A API teve um problema interno.";
  return "A API respondeu com um erro inesperado.";
}

async function erroDaResposta(resposta) {
  let tipo = "servidor";
  if (resposta.status === 404) tipo = "nao_encontrada";
  if (resposta.status === 422) tipo = "invalida";

  // O corpo de erro não vai para a tela; serve só para depuração.
  let detalhe = null;
  try {
    detalhe = (await resposta.json()).detail ?? null;
  } catch (erro) {
    detalhe = null;
  }

  const apiError = new ApiError(mensagemDoStatus(resposta.status), {
    status: resposta.status,
    tipo,
  });
  apiError.detalhe = detalhe;
  return apiError;
}

async function requisitar(caminho, { metodo = "GET", corpo } = {}) {
  const controle = new AbortController();
  const cronometro = setTimeout(() => controle.abort(), LIMITE_MS);

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: corpo === undefined ? {} : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
    });
  } catch (erro) {
    const demorou = erro?.name === "AbortError";
    throw new ApiError(demorou ? "A API demorou para responder." : "A API não respondeu.", {
      tipo: "rede",
    });
  } finally {
    clearTimeout(cronometro);
  }

  if (resposta.status === 204) return null;
  if (!resposta.ok) throw await erroDaResposta(resposta);

  try {
    return await resposta.json();
  } catch (erro) {
    throw new ApiError("A resposta da API veio em formato inesperado.", {
      status: resposta.status,
      tipo: "resposta_invalida",
    });
  }
}

export async function listarTarefas() {
  const tarefas = await requisitar("/tarefas");
  if (!Array.isArray(tarefas)) {
    throw new ApiError("A resposta da API veio em formato inesperado.", {
      tipo: "resposta_invalida",
    });
  }
  return tarefas;
}

export function criarTarefa(titulo) {
  return requisitar("/tarefas", { metodo: "POST", corpo: { titulo } });
}

export function concluirTarefa(id) {
  return requisitar(`/tarefas/${encodeURIComponent(id)}/concluir`, { metodo: "PATCH" });
}

export async function excluirTarefa(id) {
  await requisitar(`/tarefas/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}
