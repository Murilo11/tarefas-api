// Único lugar do front onde o endereço da API aparece.
// Em desenvolvimento (localhost) usa a API local; no Pages usa a API do Render.
const API_LOCAL = "http://127.0.0.1:8000";
const API_PRODUCAO = "https://tarefas-api-q59m.onrender.com";

export const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? API_LOCAL
    : API_PRODUCAO;
