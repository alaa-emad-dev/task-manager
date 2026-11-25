// Shared small components: icons, task row/card, badges.
import { html } from "./html.js";
import { dueLabel, PRIORITIES } from "./utils.js";

const PATHS = {
  dashboard: "M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  board: "M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v13h-4z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  plus: "M12 5v14M5 12h14",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19",
  moon: "M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 20h14",
  upload: "M12 16V5m0 0-4 4m4-4 4 4M5 20h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
};

export const Icon = ({ name, size = 20 }) => html`
  <svg viewBox="0 0 24 24" width=${size} height=${size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d=${PATHS[name]} />
  </svg>`;

export const PriorityBadge = ({ priority }) => html`<span className=${"badge pri-" + priority}><${Icon} name="flag" size=${12} /> ${PRIORITIES[priority].label}</span>`;

export const CategoryDot = ({ category, categories, showName = true }) => {
  const c = categories.find((x) => x.id === category);
  if (!c) return null;
  return html`<span className="cat"><i style=${{ background: c.color }}></i>${showName ? c.name : null}</span>`;
};

export const DueBadge = ({ task }) => {
  if (!task.due) return null;
  const { text, tone } = dueLabel(task.due, task.status === "done");
  return html`<span className=${"due due-" + tone}><${Icon} name="clock" size=${13} /> ${text}</span>`;
};

export function SubtaskProgress({ task }) {
  if (!task.subtasks.length) return null;
  const done = task.subtasks.filter((s) => s.done).length;
  return html`<span className="sub-progress" title="Subtasks">${done}/${task.subtasks.length} subtasks</span>`;
}

export function Checkbox({ checked, onChange, label }) {
  return html`<button type="button" className=${"check" + (checked ? " on" : "")} role="checkbox" aria-checked=${checked} aria-label=${label} onClick=${onChange}>
    ${checked ? html`<${Icon} name="check" size=${14} />` : null}</button>`;
}

export function TaskRow({ task, categories, dispatch, onEdit, onDelete }) {
  const done = task.status === "done";
  return html`<li className=${"task-row" + (done ? " done" : "")}>
    <${Checkbox} checked=${done} label=${(done ? "Mark as not done: " : "Mark as done: ") + task.title} onChange=${() => dispatch({ type: "toggle", id: task.id })} />
    <button type="button" className="task-main" onClick=${() => onEdit(task)}>
      <span className="task-title">${task.title}</span>
      <span className="task-meta">
        <${PriorityBadge} priority=${task.priority} />
        <${CategoryDot} category=${task.category} categories=${categories} />
        <${DueBadge} task=${task} />
        ${task.status === "doing" ? html`<span className="badge doing">In progress</span>` : null}
        <${SubtaskProgress} task=${task} />
      </span>
    </button>
    <div className="row-actions">
      <button type="button" className="icon-btn" aria-label=${"Edit " + task.title} title="Edit" onClick=${() => onEdit(task)}><${Icon} name="edit" size=${17} /></button>
      <button type="button" className="icon-btn danger" aria-label=${"Delete " + task.title} title="Delete" onClick=${() => onDelete(task)}><${Icon} name="trash" size=${17} /></button>
    </div>
  </li>`;
}
