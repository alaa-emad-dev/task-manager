// Root component: routing (URL hash), filters, theme, modal and toasts.
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { html } from "./html.js";
import { useTaskStore, isValidBackup } from "./store.js";
import { filterTasks, todayStr, uid } from "./utils.js";
import { Icon } from "./ui.js";
import { Dashboard, ListView, BoardView, CalendarView } from "./views.js";
import { TaskModal } from "./TaskModal.js";

const ROUTES = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "tasks", label: "Tasks", icon: "list" },
  { id: "board", label: "Board", icon: "board" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
];

const blankTask = (categories, extra = {}) => ({ title: "", notes: "", status: "todo", priority: "medium", category: categories[0]?.id || "", due: "", subtasks: [], ...extra });

function useHashRoute() {
  const read = () => (ROUTES.some((r) => r.id === location.hash.slice(2)) ? location.hash.slice(2) : "dashboard");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return [route, (r) => { location.hash = "#/" + r; }];
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("taskflow.theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("taskflow.theme", theme);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#0b1020" : "#6366f1");
  }, [theme]);
  return [theme, () => setTheme(theme === "dark" ? "light" : "dark")];
}

export function App() {
  const [state, dispatch] = useTaskStore();
  const [route, goto] = useHashRoute();
  const [theme, toggleTheme] = useTheme();
  const [filters, setFilters] = useState({ q: "", status: "all", priority: "all", category: "all", sort: "due" });
  const [modal, setModal] = useState(null); // null or a task draft
  const [toast, setToast] = useState(null);
  const [menu, setMenu] = useState(false);
  const toastTimer = useRef();
  const fileRef = useRef();

  const showToast = useCallback((message, undo) => {
    clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const filtered = useMemo(() => filterTasks(state.tasks, filters), [state.tasks, filters]);

  const openNew = (extra) => setModal(blankTask(state.categories, extra));
  const openEdit = (task) => setModal(task);
  const close = () => setModal(null);

  const save = (task) => {
    if (task.id) { dispatch({ type: "update", task }); showToast("Task updated"); }
    else { dispatch({ type: "add", task }); showToast("Task added"); }
    close();
  };
  const remove = (task) => {
    const index = state.tasks.findIndex((t) => t.id === task.id);
    dispatch({ type: "delete", id: task.id });
    close();
    showToast(`Deleted "${task.title}"`, () => { dispatch({ type: "restore", task, index }); setToast(null); });
  };

  // Keyboard shortcut: press "n" to add a task (when not typing).
  useEffect(() => {
    const on = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !["input", "textarea", "select"].includes(tag) && !modal) { e.preventDefault(); openNew(); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [modal, state.categories]);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `taskflow-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMenu(false); showToast("Backup downloaded");
  };
  const importData = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isValidBackup(data)) throw new Error("bad shape");
      const tasks = data.tasks.map((t) => ({ notes: "", priority: "medium", category: "", due: "", subtasks: [], createdAt: Date.now(), completedAt: null, ...t }));
      dispatch({ type: "import", data: { tasks, categories: data.categories } });
      showToast(`Imported ${tasks.length} tasks`);
    } catch { showToast("That file isn't a valid TaskFlow backup."); }
    setMenu(false);
  };

  const openCount = state.tasks.filter((t) => t.status !== "done").length;
  const common = { categories: state.categories, dispatch, onEdit: openEdit, onDelete: remove, onNew: openNew };
  const screens = {
    dashboard: () => html`<${Dashboard} tasks=${state.tasks} ...${common} goto=${goto} />`,
    tasks: () => html`<${ListView} tasks=${filtered} allCount=${state.tasks.length} filters=${filters} setFilters=${setFilters} ...${common} />`,
    board: () => html`<${BoardView} tasks=${filtered} filters=${filters} setFilters=${setFilters} ...${common} />`,
    calendar: () => html`<${CalendarView} tasks=${filtered} ...${common} />`,
  };
  const current = ROUTES.find((r) => r.id === route);

  return html`<div className="shell">
    <aside className="sidebar">
      <div className="logo"><span className="logo-mark"><${Icon} name="check" size=${20} /></span> TaskFlow</div>
      <nav aria-label="Main">${ROUTES.map((r) => html`<a key=${r.id} href=${"#/" + r.id} className=${route === r.id ? "active" : ""} aria-current=${route === r.id ? "page" : undefined}>
        <${Icon} name=${r.icon} /> ${r.label}${r.id === "tasks" && openCount ? html`<span className="pill">${openCount}</span>` : null}</a>`)}</nav>
      <div className="sidebar-foot">
        <button className="btn primary block" onClick=${() => openNew()}><${Icon} name="plus" size=${18} /> New task</button>
        <p className="hint">Tip: press <kbd>N</kbd> to add a task</p>
        <a className="made-by" href="https://github.com/alaa-emad-dev" target="_blank" rel="noopener"><span className="ae-badge" aria-hidden="true">AE</span> Made by <strong>Alaa Emad</strong></a>
      </div>
    </aside>

    <div className="main">
      <header className="topbar">
        <h1>${current.label}</h1>
        <div className="top-actions">
          <button className="icon-btn" onClick=${toggleTheme} aria-label=${theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title="Toggle theme"><${Icon} name=${theme === "dark" ? "sun" : "moon"} /></button>
          <div className="menu-wrap">
            <button className="icon-btn" aria-haspopup="menu" aria-expanded=${menu} aria-label="Data menu" onClick=${() => setMenu(!menu)}><${Icon} name="more" /></button>
            ${menu ? html`<div className="menu" role="menu" onMouseLeave=${() => setMenu(false)}>
              <button role="menuitem" onClick=${exportData}><${Icon} name="download" size=${17} /> Export backup (JSON)</button>
              <button role="menuitem" onClick=${() => fileRef.current.click()}><${Icon} name="upload" size=${17} /> Import backup</button>
              <button role="menuitem" onClick=${() => { if (confirm("Delete ALL tasks? This can't be undone.")) { dispatch({ type: "clearAll" }); setMenu(false); showToast("All tasks deleted"); } }}><${Icon} name="trash" size=${17} /> Delete all tasks</button>
              <button role="menuitem" onClick=${() => { dispatch({ type: "reset" }); setMenu(false); showToast("Sample data restored"); }}><${Icon} name="sparkle" size=${17} /> Load sample data</button>
            </div>` : null}
          </div>
          <input ref=${fileRef} type="file" accept="application/json" hidden onChange=${importData} />
        </div>
      </header>
      <main className="content" key=${route}>${screens[route]()}
        <p className="credit"><span className="ae-badge" aria-hidden="true">AE</span> Made by <strong>Alaa Emad</strong></p></main>
    </div>

    <nav className="bottom-nav" aria-label="Main">${ROUTES.map((r) => html`<a key=${r.id} href=${"#/" + r.id} className=${route === r.id ? "active" : ""}><${Icon} name=${r.icon} /><span>${r.label}</span></a>`)}</nav>
    <button className="fab" aria-label="New task" onClick=${() => openNew()}><${Icon} name="plus" size=${26} /></button>

    ${modal ? html`<${TaskModal} task=${modal} categories=${state.categories} onSave=${save} onDelete=${remove} onClose=${close}
      onAddCategory=${(name) => { const colors = ["#8b5cf6", "#0ea5e9", "#ef4444", "#22c55e", "#f97316"]; const id = uid(); dispatch({ type: "addCategory", id, name, color: colors[state.categories.length % colors.length] }); return id; }} />` : null}
    ${toast ? html`<div className="toast" role="status"><span>${toast.message}</span>${toast.undo ? html`<button onClick=${toast.undo}>Undo</button>` : null}</div>` : null}
  </div>`;
}
