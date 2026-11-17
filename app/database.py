import sqlalchemy
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./tarefas.db"

engine = sqlalchemy.create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
