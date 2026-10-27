    # Rascunho

Lista de tarefas com cara de página de caderno: uma API em FastAPI e um front-end em HTML, CSS e JavaScript puros, sem frameworks.

O projeto também serve de exercício de fluxo de trabalho: todo o código passou por branches de feature, pull requests e uma pipeline de CI no GitHub Actions.

<!-- Para adicionar uma captura de tela: salve a imagem em docs/captura.png e use ![Rascunho](docs/captura.png) -->

## Funcionalidades

- Listar, criar, concluir e excluir tarefas
- Tarefas concluídas permanecem na lista, com o texto riscado
- Tema claro e escuro, com a escolha salva no navegador
- Estados de carregamento, lista vazia e erro (inclusive quando a API está fora do ar)
- Interface responsiva e navegável por teclado

## Tecnologias

| Parte | Tecnologias |
|---|---|
| API | Python, FastAPI, Pydantic, Uvicorn |
| Testes e qualidade | pytest, httpx, ruff |
| Front-end | HTML, CSS e JavaScript (ES Modules), sem dependências |
| Integração contínua | GitHub Actions |

## Como rodar

### Pré-requisitos

- Python 3.13 (versão usada no desenvolvimento e na pipeline)
- Git

### Instalação

```bash
git clone https://github.com/Murilo11/tarefas-api.git
cd tarefas-api

python -m venv .venv
source .venv/bin/activate        # Linux e macOS
# .venv\Scripts\activate         # Windows

pip install -r requirements-dev.txt
```

### Executar a API

Na raiz do projeto:

```bash
uvicorn app.main:app --reload
```

A API fica em `http://127.0.0.1:8000`. A documentação interativa gerada pelo FastAPI está em `http://127.0.0.1:8000/docs`.

### Executar o front-end

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
python -m http.server 5500 --bind 127.0.0.1
```

Abra `http://localhost:5500` no navegador.

> **Atenção:** acesse pelo `localhost:5500` ou pelo `127.0.0.1:5500`. A API só libera o CORS para esses dois endereços, então abrir a página por `0.0.0.0` ou direto do arquivo (`file://`) faz o navegador bloquear as chamadas.

A URL da API usada pelo front-end fica em um único lugar: `frontend/js/config.js`.

## Testes e qualidade

```bash
pytest -v
ruff check .
```

Os 11 testes cobrem as quatro rotas (casos de sucesso e os erros 404 e 422) e o comportamento do CORS.

## API

| Método | Rota | Descrição | Resposta de sucesso | Erros |
|---|---|---|---|---|
| GET | `/tarefas` | Lista as tarefas | 200 | n/a |
| POST | `/tarefas` | Cria uma tarefa | 201 | 422 (título vazio) |
| PATCH | `/tarefas/{tarefa_id}/concluir` | Marca como concluída | 200 | 404 |
| DELETE | `/tarefas/{tarefa_id}` | Exclui a tarefa | 204 | 404 |

Formato de uma tarefa:

```json
{ "id": 1, "titulo": "Estudar", "concluida": false }
```

Para criar uma tarefa, envie `{ "titulo": "Estudar" }`. O `id` e o campo `concluida` são definidos pela API.

## Estrutura do projeto

```
tarefas-api/
├── app/                    # API FastAPI
│   └── main.py             # modelos, rotas e configuração de CORS
├── tests/
│   └── test_main.py        # testes das rotas e do CORS
├── frontend/               # interface (HTML, CSS e JS puros)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── config.js       # endereço da API
│       ├── api.js          # comunicação HTTP com a API
│       ├── ui.js           # manipulação da interface
│       ├── app.js          # estado e ações da aplicação
│       └── theme.js        # tema claro e escuro
├── .github/workflows/
│   └── ci.yml              # pipeline de CI
├── pytest.ini
├── requirements.txt        # dependências da API
└── requirements-dev.txt    # dependências de desenvolvimento e testes
```

A comunicação com a API (`api.js`) fica separada da lógica da interface (`ui.js` e `app.js`).

## Pipeline e fluxo de trabalho

A pipeline (`.github/workflows/ci.yml`) roda no GitHub Actions a cada push e a cada pull request para as branches `main` e `develop`. O job `test` faz:

1. Baixa o código
2. Configura o Python 3.13, com cache do pip
3. Instala as dependências de `requirements-dev.txt`
4. Roda o linter (`ruff check .`)
5. Roda os testes (`pytest -v`)

O fluxo de branches segue o gitflow simplificado:

```
feature/*  ->  develop  ->  main
```

- `main`: versão estável
- `develop`: integração das features
- `feature/*`: uma branch por mudança, sempre integrada por pull request

## Limitações conhecidas

- As tarefas ficam guardadas em memória: ao reiniciar a API, todas são perdidas.
- A API não permite desmarcar nem editar uma tarefa, então a interface também não oferece isso.
- Não há autenticação nem usuários.

## Próximos passos

- Persistir os dados em um banco
- Permitir editar e desmarcar tarefas

## Autor

Murilo Lopes Rodrigues — [github.com/Murilo11](https://github.com/Murilo11)