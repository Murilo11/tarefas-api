from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class Tarefa(Base):
    __tablename__ = "tarefas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String, nullable=False)
    concluida = Column(Boolean, default=False)
