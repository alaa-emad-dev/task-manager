// The four screens: Dashboard, Tasks (list), Board (kanban) and Calendar.
import { useState } from "react";
import { html } from "./html.js";
import { Icon, TaskRow, PriorityBadge, CategoryDot, DueBadge, SubtaskProgress, Checkbox } from "./ui.js";
import { STATUSES, PRIORITIES, sortTasks, todayStr, toDateStr, daysBetween } from "./utils.js";

/* ---------------- Filter bar (shared by list and board) ---------------- */
export function FilterBar({ filters, setFilters, categories, showStatus }) {
  const set = (patch) => setFilters({ ...filters, ...patch });
  return html`<div className="filters">
    <label className="search-box"><${Icon} name="search" size=${18} />
      <input type="search" placeholder="Search tasks…" value=${filters.q} onInput=${(e) => set({ q: e.target.value })} aria-label="Search tasks" /></label>
    ${showStatus ? html`<div className="segmented" role="group" aria-label="Status filter">
      ${[["all", "All"], ["active", "Active"], ["done", "Completed"]].map(([id, label]) => html`
        <button key=${id} type="button" className=${filters.status === id ? "on" : ""} aria-pressed=${filters.status === id} onClick=${() => set({ status: id })}>${label}</button>`)}
    </div>` : null}
    <div className="selects">
      <select value=${filters.priority} onChange=${(e) => set({ priority: e.target.value })} aria-label="Filter by priority">
        <option value="all">Any priority</option>
        ${Object.entries(PRIORITIES).map(([id, p]) => html`<option key=${id} value=${id}>${p.label}</option>`)}
      </select>
      <select value=${filters.category} onChange=${(e) => set({ category: e.target.value })} aria-label="Filter by category">
        <option value="all">All categories</option>
        ${categories.map((c) => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
      </select>
      ${showStatus ? html`<select value=${filters.sort} onChange=${(e) => set({ sort: e.target.value })} aria-label="Sort tasks">
        <option value="due">Sort: Due date</option><option value="priority">Sort: Priority</option>
        <option value="newest">Sort: Newest</option><option value="alpha">Sort: A–Z</option>
      </select>` : null}
    </div>
  </div>`;
}

const Empty = ({ title, text, action }) => html`<div className="empty">
  <div className="empty-art"><${Icon} name="sparkle" size=${30} /></div><h3>${title}</h3><p>${text}</p>${action}</div>`;

/* ---------------- Tasks list ---------------- */
export function ListView({ tasks, allCount, filters, setFilters, categories, dispatch, onEdit, onDelete, onNew }) {
  const list = sortTasks(tasks, filters.sort);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  return html`<section>
    <${FilterBar} filters=${filters} setFilters=${setFilters} categories=${categories} showStatus=${true} />
    <div className="list-head">
      <span>${list.length} ${list.length === 1 ? "task" : "tasks"}</span>
      ${doneCount > 0 ? html`<button type="button" className="link-btn" onClick=${() => dispatch({ type: "clearCompleted" })}>Clear ${doneCount} completed</button>` : null}
    </div>
    ${list.length === 0
      ? (allCount === 0
        ? html`<${Empty} title="No tasks yet" text="Add your first task to get started." action=${html`<button className="btn primary" onClick=${() => onNew()}>Add task</button>`} />`
        : html`<${Empty} title="Nothing matches" text="Try a different search or clear the filters." action=${html`<button className="btn" onClick=${() => setFilters({ ...filters, q: "", status: "all", priority: "all", category: "all" })}>Clear filters</button>`} />`)
      : html`<ul className="task-list">${list.map((t) => html`<${TaskRow} key=${t.id} task=${t} categories=${categories} dispatch=${dispatch} onEdit=${onEdit} onDelete=${onDelete} />`)}</ul>`}
  </section>`;
}

/* ---------------- Kanban board ---------------- */
export function BoardView({ tasks, filters, setFilters, categories, dispatch, onEdit, onNew }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const drop = (status) => { if (dragId) dispatch({ type: "move", id: dragId, status }); setDragId(null); setOverCol(null); };
  return html`<section>
    <${FilterBar} filters=${filters} setFilters=${setFilters} categories=${categories} showStatus=${false} />
    <div className="board">
      ${STATUSES.map((col, ci) => {
        const items = sortTasks(tasks.filter((t) => t.status === col.id), "priority");
        return html`<div key=${col.id} className=${"column" + (overCol === col.id ? " over" : "")}
            onDragOver=${(e) => { e.preventDefault(); setOverCol(col.id); }} onDragLeave=${() => setOverCol(null)} onDrop=${(e) => { e.preventDefault(); drop(col.id); }}>
          <div className="column-head"><h3>${col.label}</h3><span className="count">${items.length}</span>
            ${col.id === "todo" ? html`<button type="button" className="icon-btn" aria-label="Add task" onClick=${() => onNew()}><${Icon} name="plus" size=${18} /></button>` : null}</div>
          <div className="column-body">
            ${items.length === 0 ? html`<p className="column-empty">Drop tasks here</p>` : null}
            ${items.map((t) => html`<article key=${t.id} className=${"card-task" + (dragId === t.id ? " dragging" : "") + (t.status === "done" ? " done" : "")} draggable="true"
                onDragStart=${(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", t.id); }} onDragEnd=${() => { setDragId(null); setOverCol(null); }}>
              <button type="button" className="card-title" onClick=${() => onEdit(t)}>${t.title}</button>
              ${t.notes ? html`<p className="card-notes">${t.notes}</p>` : null}
              <div className="task-meta"><${PriorityBadge} priority=${t.priority} /><${CategoryDot} category=${t.category} categories=${categories} /></div>
              <div className="card-foot"><${DueBadge} task=${t} /><${SubtaskProgress} task=${t} />
                <span className="move-btns">
                  ${ci > 0 ? html`<button type="button" className="icon-btn sm" aria-label=${"Move to " + STATUSES[ci - 1].label} title=${"Move to " + STATUSES[ci - 1].label} onClick=${() => dispatch({ type: "move", id: t.id, status: STATUSES[ci - 1].id })}><${Icon} name="left" size=${15} /></button>` : null}
                  ${ci < 2 ? html`<button type="button" className="icon-btn sm" aria-label=${"Move to " + STATUSES[ci + 1].label} title=${"Move to " + STATUSES[ci + 1].label} onClick=${() => dispatch({ type: "move", id: t.id, status: STATUSES[ci + 1].id })}><${Icon} name="right" size=${15} /></button>` : null}
                </span></div>
            </article>`)}
          </div>
        </div>`;
      })}
    </div>
  </section>`;
}

/* ---------------- Calendar ---------------- */
export function CalendarView({ tasks, categories, onEdit, onNew, dispatch }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayStr());
  const first = new Date(cursor.y, cursor.m, 1);
  const start = new Date(cursor.y, cursor.m, 1 - first.getDay()); // Sunday before (or on) the 1st
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const byDay = {};
  tasks.forEach((t) => { if (t.due) (byDay[t.due] = byDay[t.due] || []).push(t); });
  const shift = (n) => setCursor(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const title = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dayTasks = byDay[selected] || [];
  const today = todayStr();
  const color = (t) => categories.find((c) => c.id === t.category)?.color || "#6366f1";
  return html`<section>
    <div className="cal-head">
      <h2>${title}</h2>
      <div className="cal-nav">
        <button type="button" className="btn" onClick=${() => { setCursor({ y: now.getFullYear(), m: now.getMonth() }); setSelected(today); }}>Today</button>
        <button type="button" className="icon-btn" aria-label="Previous month" onClick=${() => shift(-1)}><${Icon} name="left" /></button>
        <button type="button" className="icon-btn" aria-label="Next month" onClick=${() => shift(1)}><${Icon} name="right" /></button>
      </div>
    </div>
    <div className="cal-grid" role="grid" aria-label=${title}>
      ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => html`<div key=${d} className="cal-dow">${d}</div>`)}
      ${cells.map((d) => {
        const key = toDateStr(d);
        const items = byDay[key] || [];
        const cls = "cal-cell" + (d.getMonth() !== cursor.m ? " other" : "") + (key === today ? " today" : "") + (key === selected ? " selected" : "");
        return html`<button type="button" key=${key} className=${cls} onClick=${() => setSelected(key)} aria-label=${d.toDateString() + ", " + items.length + " tasks"}>
          <span className="cal-num">${d.getDate()}</span>
          <span className="cal-chips">${items.slice(0, 2).map((t) => html`<span key=${t.id} className=${"chip" + (t.status === "done" ? " done" : "")} style=${{ "--c": color(t) }}>${t.title}</span>`)}
            ${items.length > 2 ? html`<span className="chip-more">+${items.length - 2} more</span>` : null}</span>
          <span className="cal-dots">${items.slice(0, 4).map((t) => html`<i key=${t.id} style=${{ background: color(t) }}></i>`)}</span>
        </button>`;
      })}
    </div>
    <div className="day-panel">
      <div className="list-head"><strong>${new Date(selected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</strong>
        <button type="button" className="btn small" onClick=${() => onNew({ due: selected })}><${Icon} name="plus" size=${16} /> Add task</button></div>
      ${dayTasks.length === 0 ? html`<p className="muted-text">No tasks due on this day.</p>` : html`<ul className="task-list">${dayTasks.map((t) => html`<li key=${t.id} className=${"task-row" + (t.status === "done" ? " done" : "")}>
        <${Checkbox} checked=${t.status === "done"} label=${"Toggle " + t.title} onChange=${() => dispatch({ type: "toggle", id: t.id })} />
        <button type="button" className="task-main" onClick=${() => onEdit(t)}><span className="task-title">${t.title}</span>
          <span className="task-meta"><${PriorityBadge} priority=${t.priority} /><${CategoryDot} category=${t.category} categories=${categories} /></span></button></li>`)}</ul>`}
    </div>
  </section>`;
}

/* ---------------- Dashboard ---------------- */
function Ring({ value }) {
  const r = 52, c = 2 * Math.PI * r;
  return html`<svg viewBox="0 0 120 120" className="ring" role="img" aria-label=${value + "% complete"}>
    <circle cx="60" cy="60" r=${r} fill="none" strokeWidth="12" className="ring-bg" />
    <circle cx="60" cy="60" r=${r} fill="none" strokeWidth="12" strokeLinecap="round" className="ring-fg" strokeDasharray=${c} strokeDashoffset=${c * (1 - value / 100)} transform="rotate(-90 60 60)" />
    <text x="60" y="66" textAnchor="middle" className="ring-text">${value}%</text></svg>`;
}

export function Dashboard({ tasks, categories, onEdit, onNew, goto }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const active = tasks.filter((t) => t.status !== "done");
  const today = todayStr();
  const dueToday = active.filter((t) => t.due === today).length;
  const overdue = active.filter((t) => t.due && t.due < today).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const upcoming = sortTasks(active, "due").slice(0, 5);
  const byCat = categories.map((c) => ({ ...c, n: tasks.filter((t) => t.category === c.id).length })).filter((c) => c.n > 0);
  const maxCat = Math.max(1, ...byCat.map((c) => c.n));
  const pri = Object.keys(PRIORITIES).map((p) => ({ id: p, n: active.filter((t) => t.priority === p).length }));
  return html`<section className="dash">
    <div className="welcome"><div><h2>${greet}!</h2>
      <p>${active.length === 0 ? "You're all caught up. Nice work!" : `You have ${active.length} open ${active.length === 1 ? "task" : "tasks"}${dueToday ? `, ${dueToday} due today` : ""}.`}</p></div>
      <button className="btn primary" onClick=${() => onNew()}><${Icon} name="plus" size=${18} /> New task</button></div>

    <div className="stats">
      <div className="stat"><span>Total tasks</span><strong>${total}</strong></div>
      <div className="stat"><span>Completed</span><strong className="good">${done}</strong></div>
      <div className="stat"><span>Due today</span><strong className="warn">${dueToday}</strong></div>
      <div className="stat"><span>Overdue</span><strong className="bad">${overdue}</strong></div>
    </div>

    <div className="dash-grid">
      <div className="panel progress"><h3>Progress</h3><${Ring} value=${pct} /><p className="muted-text">${done} of ${total} tasks done</p></div>
      <div className="panel"><h3>By category</h3>
        ${byCat.length === 0 ? html`<p className="muted-text">No tasks yet.</p>` : byCat.map((c) => html`<div key=${c.id} className="bar-row"><span>${c.name}</span>
          <div className="bar"><i style=${{ width: (c.n / maxCat) * 100 + "%", background: c.color }}></i></div><b>${c.n}</b></div>`)}
        <h3 className="sub-h">Open by priority</h3>
        <div className="pri-row">${pri.map((p) => html`<span key=${p.id} className=${"badge pri-" + p.id}>${PRIORITIES[p.id].label}: ${p.n}</span>`)}</div></div>
      <div className="panel wide"><div className="panel-head"><h3>Up next</h3><button type="button" className="link-btn" onClick=${() => goto("tasks")}>View all</button></div>
        ${upcoming.length === 0 ? html`<p className="muted-text">Nothing coming up.</p>` : html`<ul className="mini-list">${upcoming.map((t) => html`<li key=${t.id}><button type="button" onClick=${() => onEdit(t)}>
          <span className="mini-title">${t.title}</span><span className="task-meta"><${PriorityBadge} priority=${t.priority} /><${DueBadge} task=${t} /></span></button></li>`)}</ul>`}</div>
    </div>
  </section>`;
                                                                                                             }
