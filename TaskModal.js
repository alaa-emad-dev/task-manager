// Add / edit dialog. It keeps its own draft state and only calls onSave when the form is valid.
import { useState, useEffect, useRef } from "react";
import { html } from "./html.js";
import { Icon } from "./ui.js";
import { PRIORITIES, STATUSES, uid } from "./utils.js";

export function TaskModal({ task, categories, onSave, onDelete, onClose, onAddCategory }) {
  const editing = Boolean(task.id);
  const [draft, setDraft] = useState({ ...task, subtasks: task.subtasks.map((s) => ({ ...s })) });
  const [error, setError] = useState("");
  const [subText, setSubText] = useState("");
  const [newCat, setNewCat] = useState(null); // null = hidden, string = name being typed
  const titleRef = useRef(null);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("modal-open"); };
  }, []);

  const addSub = () => {
    const text = subText.trim();
    if (!text) return;
    set({ subtasks: [...draft.subtasks, { id: uid(), text, done: false }] });
    setSubText("");
  };

  const submit = (e) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) { setError("Please enter a task title."); titleRef.current?.focus(); return; }
    // Add a subtask that was typed but not yet added with Enter.
    const subtasks = subText.trim() ? [...draft.subtasks, { id: uid(), text: subText.trim(), done: false }] : draft.subtasks;
    onSave({ ...draft, title, notes: draft.notes.trim(), subtasks });
  };

  const saveCategory = () => {
    const name = (newCat || "").trim();
    if (name) set({ category: onAddCategory(name) });
    setNewCat(null);
  };

  return html`<div className="backdrop" onMouseDown=${(e) => e.target === e.currentTarget && onClose()}>
    <form className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onSubmit=${submit} noValidate>
      <div className="modal-head"><h2 id="modal-title">${editing ? "Edit task" : "New task"}</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick=${onClose}><${Icon} name="x" /></button></div>

      <label className="field"><span>Title</span>
        <input ref=${titleRef} value=${draft.title} onInput=${(e) => { set({ title: e.target.value }); setError(""); }} placeholder="What needs to be done?" maxLength="120" aria-invalid=${Boolean(error)} /></label>
      ${error ? html`<p className="form-error" role="alert">${error}</p>` : null}

      <label className="field"><span>Notes <em>(optional)</em></span>
        <textarea rows="3" value=${draft.notes} onInput=${(e) => set({ notes: e.target.value })} placeholder="Add details…"></textarea></label>

      <div className="field-row">
        <label className="field"><span>Due date</span><input type="date" value=${draft.due} onChange=${(e) => set({ due: e.target.value })} /></label>
        <label className="field"><span>Status</span>
          <select value=${draft.status} onChange=${(e) => set({ status: e.target.value })}>${STATUSES.map((s) => html`<option key=${s.id} value=${s.id}>${s.label}</option>`)}</select></label>
      </div>

      <div className="field"><span>Priority</span>
        <div className="segmented full" role="group" aria-label="Priority">
          ${Object.entries(PRIORITIES).map(([id, p]) => html`<button key=${id} type="button" className=${(draft.priority === id ? "on " : "") + "p-" + id} aria-pressed=${draft.priority === id} onClick=${() => set({ priority: id })}>${p.label}</button>`)}
        </div></div>

      <div className="field"><span>Category</span>
        <div className="cat-pick">
          ${categories.map((c) => html`<button key=${c.id} type="button" className=${"cat-chip" + (draft.category === c.id ? " on" : "")} aria-pressed=${draft.category === c.id} onClick=${() => set({ category: c.id })}><i style=${{ background: c.color }}></i>${c.name}</button>`)}
          ${newCat === null
            ? html`<button type="button" className="cat-chip add" onClick=${() => setNewCat("")}><${Icon} name="plus" size=${14} /> New</button>`
            : html`<span className="cat-new"><input autoFocus value=${newCat} onInput=${(e) => setNewCat(e.target.value)} onKeyDown=${(e) => { if (e.key === "Enter") { e.preventDefault(); saveCategory(); } }} placeholder="Category name" maxLength="20" aria-label="New category name" /><button type="button" className="btn small" onClick=${saveCategory}>Add</button></span>`}
        </div></div>

      <div className="field"><span>Subtasks</span>
        <ul className="sub-list">${draft.subtasks.map((s) => html`<li key=${s.id}>
          <input type="checkbox" checked=${s.done} onChange=${() => set({ subtasks: draft.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })} aria-label=${"Done: " + s.text} />
          <span className=${s.done ? "struck" : ""}>${s.text}</span>
          <button type="button" className="icon-btn sm" aria-label=${"Remove subtask " + s.text} onClick=${() => set({ subtasks: draft.subtasks.filter((x) => x.id !== s.id) })}><${Icon} name="x" size=${14} /></button></li>`)}</ul>
        <div className="sub-add"><input value=${subText} onInput=${(e) => setSubText(e.target.value)} onKeyDown=${(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }} placeholder="Add a subtask and press Enter" aria-label="New subtask" maxLength="100" />
          <button type="button" className="btn small" onClick=${addSub}>Add</button></div></div>

      <div className="modal-foot">
        ${editing ? html`<button type="button" className="btn danger-text" onClick=${() => onDelete(task)}><${Icon} name="trash" size=${17} /> Delete</button>` : html`<span></span>`}
        <div className="foot-right"><button type="button" className="btn" onClick=${onClose}>Cancel</button><button type="submit" className="btn primary">${editing ? "Save changes" : "Add task"}</button></div>
      </div>
    </form>
  </div>`;
}
