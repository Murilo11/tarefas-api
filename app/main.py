from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

# Origens do front-end: local e a URL do site no Cloudflare Pages.
ORIGENS_PERMITIDAS = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://rascunho-tarefas.pages.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS_PERMITIDAS,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


class TarefaEntrada(BaseModel):
    titulo: str = Field(min_length=1)


class TarefaSaida(BaseModel):
    id: int
    titulo: str
    concluida: bool = False


tarefas: list[TarefaSaida] = []
proximo_id = 1


@app.get("/tarefas")
def listar() -> list[TarefaSaida]:
    return tarefas


@app.post("/tarefas", status_code=201)
def criar(dados: TarefaEntrada) -> TarefaSaida:
    global proximo_id
    tarefa = TarefaSaida(id=proximo_id, titulo=dados.titulo)
    proximo_id += 1
    tarefas.append(tarefa)
    return tarefa


@app.patch("/tarefas/{tarefa_id}/concluir")
def concluir(tarefa_id: int) -> TarefaSaida:
    for tarefa in tarefas:
        if tarefa.id == tarefa_id:
            tarefa.concluida = True
            return tarefa

    raise HTTPException(status_code=404, detail="Tarefa não encontrada")


@app.delete("/tarefas/{tarefa_id}", status_code=204)
def deletar(tarefa_id: int) -> None:
    for tarefa in tarefas:
        if tarefa.id == tarefa_id:
            tarefas.remove(tarefa)
            return

    raise HTTPException(status_code=404, detail="Tarefa não encontrada")
