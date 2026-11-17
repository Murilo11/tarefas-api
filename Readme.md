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
| API | Python, FastAPI, Pydantic, Uvicorn, SQLAlchemy, SQLite |
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

Os dados ficam salvos em `tarefas.db`, na raiz do projeto.

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

O job `front` verifica a sintaxe dos arquivos JavaScript, e os jobs `sast` e `dast` fazem as verificações de segurança descritas abaixo.

## Segurança da esteira CI/CD

A pipeline tem duas verificações de segurança obrigatórias. Elas rodam em paralelo com os jobs `test` e `front`, e o deploy do frontend só acontece se todas forem aprovadas.

### SAST — Semgrep

SAST (Static Application Security Testing) é a análise estática do código, feita sem executar a aplicação. O job `sast` roda o Semgrep Community Edition em um container Docker com a versão da imagem fixada por digest e analisa o código Python em busca de padrões inseguros.

A configuração de regras usada é a `p/default`, que reúne regras da comunidade para diversas linguagens e frameworks. Apenas achados de severidade `ERROR` bloqueiam a pipeline: o comando roda com `--severity ERROR` e `--error`, então qualquer achado dessa severidade faz o job falhar.

O relatório é gerado em formato SARIF e enviado ao GitHub Code Scanning. Para consultá-lo, acesse a aba **Security** do repositório e depois **Code scanning alerts**. A publicação do relatório usa `continue-on-error: true`, para que uma falha no upload não esconda o resultado do scanner.

### DAST — OWASP ZAP

DAST (Dynamic Application Security Testing) é a análise dinâmica: a aplicação é executada e testada como um cliente faria. O job `dast` instala as dependências de produção, inicia a API com Uvicorn em `127.0.0.1:8000` e aguarda o endpoint `/openapi.json` responder antes de começar.

O OWASP ZAP API Scan usa a especificação OpenAPI gerada pelo FastAPI para descobrir as rotas e os métodos disponíveis (GET, POST, PATCH e DELETE) e testar cada operação. A opção `fail_action: true` faz o job falhar quando o scanner encontra alertas conforme a política configurada.

Os testes rodam apenas contra a API iniciada no runner do GitHub Actions, em ambiente isolado e descartável, sem apontar para a API de produção nem usar dados reais. O relatório do ZAP fica disponível como artefato da execução, com o nome `zap-api-scan`, na página da execução em **Actions**.

Para atender aos alertas de cabeçalhos do ZAP, a API envia `X-Content-Type-Options: nosniff` e `Cross-Origin-Resource-Policy: cross-origin` em todas as respostas.

### Integração com o deploy

O job `deploy-front` depende de `test`, `front`, `sast` e `dast`. Assim, o deploy no Cloudflare Pages só ocorre em push para a branch `main` e somente se todas essas verificações forem aprovadas. Pull Requests e pushes em `develop` executam as verificações, mas não publicam o frontend.

O fluxo de branches segue o gitflow simplificado:

```
feature/*  ->  develop  ->  main
```

- `main`: versão estável
- `develop`: integração das features
- `feature/*`: uma branch por mudança, sempre integrada por pull request

## Limitações conhecidas

- A API não permite desmarcar nem editar uma tarefa, então a interface também não oferece isso.
- Não há autenticação nem usuários.

## Próximos passos

- Permitir editar e desmarcar tarefas

## Autor

Murilo Lopes Rodrigues — [github.com/Murilo11](https://github.com/Murilo11)