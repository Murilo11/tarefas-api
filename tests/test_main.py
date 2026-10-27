import pytest
from fastapi.testclient import TestClient

from app import main
from app.main import app


@pytest.fixture(autouse=True)
def limpar_estado(monkeypatch):
    """Zera a lista e o contador antes de cada teste, para isolar os cenários."""
    main.tarefas.clear()
    monkeypatch.setattr(main, "proximo_id", 1)


@pytest.fixture
def client():
    return TestClient(app)


def test_listar_tarefas_quando_vazio_retorna_lista_vazia(client):
    resposta = client.get("/tarefas")

    assert resposta.status_code == 200
    assert resposta.json() == []


def test_criar_tarefa_retorna_201_com_id_um_e_nao_concluida(client):
    resposta = client.post("/tarefas", json={"titulo": "estudar pytest"})

    assert resposta.status_code == 201
    assert resposta.json() == {"id": 1, "titulo": "estudar pytest", "concluida": False}


def test_listar_apos_criar_duas_tarefas_retorna_dois_itens(client):
    client.post("/tarefas", json={"titulo": "primeira"})
    client.post("/tarefas", json={"titulo": "segunda"})

    resposta = client.get("/tarefas")

    assert resposta.status_code == 200
    assert len(resposta.json()) == 2
    assert [tarefa["id"] for tarefa in resposta.json()] == [1, 2]


def test_criar_tarefa_com_titulo_vazio_retorna_422(client):
    resposta = client.post("/tarefas", json={"titulo": ""})

    assert resposta.status_code == 422


def test_concluir_tarefa_existente_retorna_concluida(client):
    client.post("/tarefas", json={"titulo": "estudar pytest"})

    resposta = client.patch("/tarefas/1/concluir")

    assert resposta.status_code == 200
    assert resposta.json()["concluida"] is True


def test_concluir_tarefa_inexistente_retorna_404(client):
    resposta = client.patch("/tarefas/999/concluir")

    assert resposta.status_code == 404


def test_deletar_tarefa_existente_remove_da_listagem(client):
    client.post("/tarefas", json={"titulo": "estudar pytest"})

    resposta = client.delete("/tarefas/1")

    assert resposta.status_code == 204
    assert resposta.content == b""
    assert client.get("/tarefas").json() == []


def test_deletar_tarefa_inexistente_retorna_404(client):
    resposta = client.delete("/tarefas/999")

    assert resposta.status_code == 404


# --- Testes de CORS ---


def test_cors_origem_permitida_retorna_cabecalho(client):
    resposta = client.get("/tarefas", headers={"Origin": "http://localhost:5500"})

    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == "http://localhost:5500"


def test_cors_preflight_com_origem_permitida_retorna_200(client):
    resposta = client.options(
        "/tarefas",
        headers={
            "Origin": "http://localhost:5500",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == "http://localhost:5500"
    assert "POST" in resposta.headers["access-control-allow-methods"]
    cabecalhos_permitidos = resposta.headers["access-control-allow-headers"].lower()
    assert "content-type" in cabecalhos_permitidos


def test_cors_origem_nao_permitida_nao_retorna_cabecalho(client):
    resposta = client.get(
        "/tarefas", headers={"Origin": "https://site-qualquer.com"}
    )

    assert resposta.status_code == 200
    assert "access-control-allow-origin" not in resposta.headers
