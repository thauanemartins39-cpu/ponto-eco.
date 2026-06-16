# ponto-eco

Site institucional para o projeto Ponto Eco com controle de comentários via backend FastAPI.

## Como executar

1. Instale as dependências:

```bash
python -m pip install -r requirements.txt
```

2. Inicie o servidor backend:

```bash
uvicorn server:app --reload
```

3. Abra os arquivos HTML no navegador a partir do servidor ou diretamente como arquivo local:

- `index.html`
- `acoes.html`
- `diretrizes.html`

> Para que os comentários funcionem corretamente, o servidor FastAPI deve estar rodando em `http://localhost:8000`.

## Observações

- O banco de dados `comments.db` é criado automaticamente na mesma pasta quando o backend for iniciado.
- No ambiente de produção, é recomendável ajustar a configuração de CORS e hospedar o frontend e o backend de forma segura.
