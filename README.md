# TaskFlow – Task Manager (React)

A task manager built with **React 18** and **no build step**: the browser loads React from a CDN
(import map) and the code uses ES modules. Tasks are saved in your browser with `localStorage`.

**Live demo:** https://alaa-emad-dev.github.io/task-manager/

## Features
- **Dashboard:** greeting, stats (total, completed, due today, overdue), progress ring, tasks by category, open tasks by priority, "Up next" list
- **Tasks list:** add, edit, delete, complete (checkbox), search, filter (status, priority, category) and sort (due date, priority, newest, A–Z)
- **Kanban board:** To do / In progress / Done with drag and drop (and arrow buttons for touch screens)
- **Calendar:** month view with tasks on their due dates, click a day to see or add tasks
- Add/edit dialog with title validation, notes, due date, priority, status, categories (create your own) and **subtasks**
- Undo after deleting a task
- Light and dark theme (remembers your choice, respects the system setting)
- Export / import a JSON backup, "Delete all", "Load sample data"
- Keyboard shortcut: press **N** to add a task, **Esc** to close the dialog
- Responsive: sidebar on desktop, bottom navigation and "+" button on mobile
- Accessible: labelled buttons, `role="dialog"`, focus styles, keyboard support

## Tech
- React 18 (hooks: `useState`, `useReducer`, `useEffect`, `useMemo`, `useRef`, `useCallback`)
- [htm](https://github.com/developit/htm) = JSX-like templates that run in the browser without Babel
- ES modules + import map (React from esm.sh), plain CSS with custom properties
- `localStorage` for saving, HTML5 drag and drop, URL-hash routing

## Project structure
```
index.html        loads fonts, the import map and main.js
style.css         all styles (light + dark theme variables)
main.js          mounts <App /> into #root
App.js         routing, theme, filters, modal, toast, export/import
store.js       useReducer store + localStorage + sample data
views.js       Dashboard, ListView, BoardView, CalendarView, FilterBar
TaskModal.js   add / edit form
ui.js          icons, task row, badges, checkbox
utils.js       pure helpers: dates, filtering, sorting
html.js        binds htm to React.createElement
```

## Run locally
```
python3 -m http.server 8000
# open http://localhost:8000
```
(An internet connection is needed to load React from the CDN.)

## Deploy
Static files only: GitHub Pages → Settings → Pages → Deploy from branch → `main` / root.

## Notes
- All state changes go through one reducer, so the logic is in one place and easy to follow.
- Your data stays in your browser. Clearing site data removes it, so use Export for backups.

Built with AI assistance (code reviewed and understood by the author).
