/* API client for the existing FastAPI contract. Override with window.TAREFAS_API_URL if needed. */
(() => {
  const baseUrl = (window.TAREFAS_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(baseUrl + path, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });
    } catch {
      throw new Error("Não foi possível conectar à API. Confira se o servidor está rodando e se o CORS está configurado.");
    }

    if (!response.ok) {
      let message = "A API não conseguiu concluir a operação.";
      try {
        const payload = await response.json();
        if (typeof payload.detail === "string") message = payload.detail;
        else if (Array.isArray(payload.detail)) message = payload.detail.map((item) => item.msg).join(" ");
      } catch {
        // Keep the readable fallback for empty or non-JSON responses.
      }
      throw new Error(message);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  window.TarefasAPI = Object.freeze({
    listar: () => request("/tarefas"),
    criar: (titulo) => request("/tarefas", {
      method: "POST",
      body: JSON.stringify({ titulo }),
    }),
    concluir: (id) => request(`/tarefas/${encodeURIComponent(id)}/concluir`, {
      method: "PATCH",
    }),
    deletar: (id) => request(`/tarefas/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  });
})();
