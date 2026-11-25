// All app data lives in one reducer. Every change goes through dispatch(action),
// and the whole state is saved to localStorage after each change.
import { useReducer, useEffect } from "react";
import { uid, addDays } from "./utils.js";

const KEY = "taskflow.v1";

const CATEGORIES = [
  { id: "work", name: "Work", color: "#6366f1" },
  { id: "personal", name: "Personal", color: "#ec4899" },
  { id: "study", name: "Study", color: "#14b8a6" },
  { id: "health", name: "Health", color: "#f59e0b" },
];

function sample() {
  const mk = (title, category, priority, due, status = "todo", notes = "", subtasks = []) => ({
    id: uid(), title, notes, status, priority, category, due, createdAt: Date.now() - Math.random() * 1e7,
    subtasks: subtasks.map((text, i) => ({ id: uid(), text, done: i === 0 && status !== "todo" })),
    completedAt: status === "done" ? Date.now() : null,
  });
  return [
    mk("Finish portfolio homepage", "work", "high", addDays(0), "doing", "Hero section, projects grid and contact form.", ["Design hero", "Projects grid", "Contact form"]),
    mk("Send CV to three companies", "work", "high", addDays(1), "todo", "Tailor the summary for each role."),
    mk("Review React hooks (useEffect, useReducer)", "study", "medium", addDays(2), "todo", "", ["useState recap", "useEffect cleanup", "useReducer"]),
    mk("Fix mobile menu bug", "work", "medium", addDays(-1), "doing"),
    mk("Go to the gym", "health", "low", addDays(0), "todo"),
    mk("Buy a birthday gift", "personal", "medium", addDays(4), "todo"),
    mk("Practice interview questions", "study", "high", addDays(3), "todo", "JavaScript basics, closures, promises, React state."),
    mk("Set up GitHub profile README", "work", "low", addDays(-3), "done"),
    mk("Pay internet bill", "personal", "medium", addDays(-2), "done"),
  ];
}

const fresh = () => ({ tasks: sample(), categories: CATEGORIES });

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.tasks) && Array.isArray(saved.categories)) return saved;
  } catch { /* corrupted data: start fresh */ }
  return fresh();
}

function reducer(state, action) {
  const mapTask = (id, fn) => ({ ...state, tasks: state.tasks.map((t) => (t.id === id ? fn(t) : t)) });
  switch (action.type) {
    case "add":
      return { ...state, tasks: [{ ...action.task, id: uid(), createdAt: Date.now(), completedAt: action.task.status === "done" ? Date.now() : null }, ...state.tasks] };
    case "update":
      return mapTask(action.task.id, (t) => ({ ...t, ...action.task, completedAt: action.task.status === "done" ? t.completedAt || Date.now() : null }));
    case "toggle": // checkbox: todo/doing <-> done
      return mapTask(action.id, (t) => (t.status === "done" ? { ...t, status: "todo", completedAt: null } : { ...t, status: "done", completedAt: Date.now() }));
    case "move":
      return mapTask(action.id, (t) => ({ ...t, status: action.status, completedAt: action.status === "done" ? t.completedAt || Date.now() : null }));
    case "toggleSub":
      return mapTask(action.id, (t) => ({ ...t, subtasks: t.subtasks.map((s) => (s.id === action.subId ? { ...s, done: !s.done } : s)) }));
    case "delete":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "restore": { // undo a delete: put the task back at its old position
      const tasks = [...state.tasks];
      tasks.splice(Math.min(action.index, tasks.length), 0, action.task);
      return { ...state, tasks };
    }
    case "clearCompleted":
      return { ...state, tasks: state.tasks.filter((t) => t.status !== "done") };
    case "addCategory":
      return { ...state, categories: [...state.categories, { id: action.id || uid(), name: action.name, color: action.color }] };
    case "import":
      return action.data;
    case "reset":
      return fresh();
    case "clearAll":
      return { ...state, tasks: [] };
    default:
      return state;
  }
}

export function useTaskStore() {
  const [state, dispatch] = useReducer(reducer, null, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }, [state]);
  return [state, dispatch];
}

export function isValidBackup(data) {
  return data && Array.isArray(data.tasks) && Array.isArray(data.categories) &&
    data.tasks.every((t) => t && typeof t.id === "string" && typeof t.title === "string" && ["todo", "doing", "done"].includes(t.status));
}
