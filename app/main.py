from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()


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
