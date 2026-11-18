from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Tarefa


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)

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
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    concluida: bool = False


@app.get("/tarefas")
def listar(db:Annotated [Session,Depends(get_db)]) -> list[TarefaSaida]:
    return db.query(Tarefa).all()


@app.post("/tarefas", status_code=201)
def criar(dados: TarefaEntrada, db: Annotated [Session, Depends(get_db)]) -> TarefaSaida:
    tarefa = Tarefa(titulo=dados.titulo)
    db.add(tarefa)
    db.commit()
    db.refresh(tarefa)
    return tarefa


@app.patch("/tarefas/{tarefa_id}/concluir")
def concluir(tarefa_id: int, db: Annotated [Session, Depends(get_db)]) -> TarefaSaida:
    tarefa = db.get(Tarefa, tarefa_id)
    if tarefa is None:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")

    tarefa.concluida = True
    db.commit()
    db.refresh(tarefa)
    return tarefa


@app.delete("/tarefas/{tarefa_id}", status_code=204)
def deletar(tarefa_id: int, db: Annotated [Session, Depends(get_db)]) -> None:
    tarefa = db.get(Tarefa, tarefa_id)
    if tarefa is None:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")

    db.delete(tarefa)
    db.commit()
