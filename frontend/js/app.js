(() => {
  const root = document.documentElement;
  const form = document.querySelector("#task-form");
  const titleInput = document.querySelector("#task-title");
  const formMessage = document.querySelector("#form-message");
  const taskList = document.querySelector("#task-list");
  const taskCount = document.querySelector("#task-count");
  const listStatus = document.querySelector("#list-status");
  const emptyState = document.querySelector("#empty-state");
  const themeToggle = document.querySelector("#theme-toggle");
  const themeLabel = document.querySelector("#theme-label");
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  let tasks = [];
  let pending = false;

  const icons = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"></path></svg>',
  };

  function setFormMessage(message = "", isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("error", isError);
  }

  function setStatus(message = "") {
    listStatus.textContent = message;
  }

  function setPending(value) {
    pending = value;
    form.querySelector("button[type=submit]").disabled = value;
    titleInput.disabled = value;
    taskList.querySelectorAll("button").forEach((button) => {
      button.disabled = value;
    });
  }

  function applyTheme(theme) {
    const chosen = theme === "dark" ? "dark" : "light";
    root.dataset.theme = chosen;
    const dark = chosen === "dark";
    themeLabel.textContent = dark ? "Tema claro" : "Tema escuro";
    themeToggle.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
    themeToggle.setAttribute("aria-pressed", String(dark));
    metaTheme.setAttribute("content", dark ? "#20231d" : "#f5f4ec");
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("tarefas-theme"); } catch { /* Storage can be unavailable. */ }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  }

  function saveTheme(theme) {
    try { localStorage.setItem("tarefas-theme", theme); } catch { /* Theme still changes for this page view. */ }
  }

  function render() {
    taskList.replaceChildren();
    const completeCount = tasks.filter((task) => task.concluida).length;
    const openCount = tasks.length - completeCount;
    taskCount.textContent = tasks.length === 0
      ? "0 tarefas"
      : `${openCount} pendente${openCount === 1 ? "" : "s"} · ${completeCount} concluída${completeCount === 1 ? "" : "s"}`;

    emptyState.hidden = tasks.length !== 0;
    taskList.hidden = tasks.length === 0;

    tasks.forEach((task) => {
      const item = document.createElement("li");
      item.className = `task-item${task.concluida ? " is-complete" : ""}`;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "task-check";
      check.setAttribute("aria-label", task.concluida
        ? `Tarefa concluída: ${task.titulo}`
        : `Concluir tarefa: ${task.titulo}`);
      check.title = task.concluida ? "Tarefa concluída" : "Marcar como concluída";
      if (task.concluida) check.innerHTML = icons.check;
      check.addEventListener("click", () => completeTask(task.id));

      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.titulo;

      const actions = document.createElement("div");
      actions.className = "task-actions";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-button";
      remove.setAttribute("aria-label", `Excluir tarefa: ${task.titulo}`);
      remove.title = "Excluir tarefa";
      remove.innerHTML = icons.trash;
      remove.addEventListener("click", () => deleteTask(task.id));

      actions.append(remove);
      item.append(check, title, actions);
      taskList.append(item);
    });
  }

  async function loadTasks() {
    setStatus("Buscando suas tarefas…");
    try {
      tasks = await window.TarefasAPI.listar();
      setStatus("");
      render();
    } catch (error) {
      setStatus(error.message);
      taskCount.textContent = "API indisponível";
      emptyState.hidden = true;
      taskList.hidden = true;
    }
  }

  async function createTask(event) {
    event.preventDefault();
    const titulo = titleInput.value.trim();
    if (!titulo) {
      setFormMessage("Escreva um título antes de adicionar.", true);
      titleInput.focus();
      return;
    }

    setPending(true);
    setFormMessage("");
    try {
      const created = await window.TarefasAPI.criar(titulo);
      tasks.push(created);
      titleInput.value = "";
      setFormMessage("Anotado. Um passo de cada vez.");
      setStatus("");
      render();
      titleInput.focus();
    } catch (error) {
      setFormMessage(error.message, true);
    } finally {
      setPending(false);
    }
  }

  async function completeTask(id) {
    if (pending) return;
    setPending(true);
    setStatus("");
    try {
      const updated = await window.TarefasAPI.concluir(id);
      tasks = tasks.map((task) => task.id === updated.id ? updated : task);
      render();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPending(false);
    }
  }

  async function deleteTask(id) {
    if (pending) return;
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    setPending(true);
    setStatus("");
    try {
      await window.TarefasAPI.deletar(id);
      tasks = tasks.filter((item) => item.id !== id);
      render();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPending(false);
    }
  }

  form.addEventListener("submit", createTask);
  themeToggle.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  });

  initTheme();
  loadTasks();
})();
