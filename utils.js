// Small pure helper functions (easy to test, no React inside).
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayStr = () => toDateStr(new Date());
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toDateStr(d); };
const parse = (s) => new Date(s + "T12:00:00");
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);

export function dueLabel(due, done) {
  if (!due) return { text: "No date", tone: "none" };
  const diff = daysBetween(todayStr(), due);
  if (done) return { text: parse(due).toLocaleDateString("en-US", { month: "short", day: "numeric" }), tone: "none" };
  if (diff < 0) return { text: diff === -1 ? "Yesterday" : `${-diff} days overdue`, tone: "overdue" };
  if (diff === 0) return { text: "Today", tone: "today" };
  if (diff === 1) return { text: "Tomorrow", tone: "soon" };
  const text = parse(due).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return { text, tone: diff <= 7 ? "soon" : "none" };
}

export const PRIORITIES = { high: { label: "High", rank: 0 }, medium: { label: "Medium", rank: 1 }, low: { label: "Low", rank: 2 } };
export const STATUSES = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
];

export function filterTasks(tasks, f) {
  const q = f.q.trim().toLowerCase();
  return tasks.filter((t) => {
    if (f.status === "active" && t.status === "done") return false;
    if (f.status === "done" && t.status !== "done") return false;
    if (f.priority !== "all" && t.priority !== f.priority) return false;
    if (f.category !== "all" && t.category !== f.category) return false;
    if (q && !(t.title + " " + t.notes).toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortTasks(tasks, sort) {
  const list = [...tasks];
  const byDue = (a, b) => (a.due || "9999").localeCompare(b.due || "9999");
  const byPri = (a, b) => PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank;
  const cmp = {
    due: (a, b) => byDue(a, b) || byPri(a, b),
    priority: (a, b) => byPri(a, b) || byDue(a, b),
    newest: (a, b) => b.createdAt - a.createdAt,
    alpha: (a, b) => a.title.localeCompare(b.title),
  }[sort];
  // Finished tasks always sink to the bottom of the list.
  return list.sort((a, b) => (a.status === "done") - (b.status === "done") || cmp(a, b));
}
