# Frontend Entrelinhas

Frontend em HTML, CSS e JavaScript puros para a API de tarefas. Não usa framework nem dependências de frontend.

## Executar localmente

Abra dois terminais na raiz do repositório.

**Terminal 1 — API**

```bash
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API ficará em `http://127.0.0.1:8000`.

**Terminal 2 — frontend**

```bash
cd frontend
python -m http.server 5500
```

Abra `http://localhost:5500` no navegador. Não abra o `index.html` diretamente como arquivo, pois servir a página por HTTP evita problemas de origem no navegador.

A API permite CORS para `http://localhost:5500` e `http://127.0.0.1:5500`. Se usar outra porta, ajuste a lista `allow_origins` em `app/main.py`.

## Contrato utilizado

- `GET /tarefas` — lista tarefas.
- `POST /tarefas` com JSON `{"titulo":"..." }` — cria tarefa.
- `PATCH /tarefas/{id}/concluir` — marca tarefa como concluída.
- `DELETE /tarefas/{id}` — remove tarefa.

O frontend não simula persistência nem inventa endpoints. A API atual guarda os dados em memória; ao reiniciar o servidor, as tarefas são apagadas. O endpoint atual de conclusão apenas marca a tarefa como concluída, não oferece ação para desfazê-la.

## Personalização

A URL base padrão é `http://127.0.0.1:8000`. Antes de carregar `js/api.js), é possível definir `window.TAREFAS_API_URL` caso a API esteja em outro endereço.
