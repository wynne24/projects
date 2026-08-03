const key = "organize-tasks-v1";
const today = new Date();
today.setHours(0, 0, 0, 0);
const iso = (d) => d.toISOString().slice(0, 10);
const day = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};
let projects = [
  { id: "work", name: "Work", color: "#7798ee" },
  { id: "personal", name: "Personal", color: "#d8a94d" },
  { id: "health", name: "Health & wellness", color: "#68b69e" },
];
let tasks = [
  {
    id: 1,
    title: "Prepare project update",
    project: "work",
    date: day(0),
    notes: "Share the weekly progress report with the team.",
    done: false,
  },
  {
    id: 2,
    title: "Review design feedback",
    project: "work",
    date: day(0),
    notes: "",
    done: false,
  },
  {
    id: 3,
    title: "Go for a 30-minute walk",
    project: "health",
    date: day(0),
    notes: "Take the riverside route if the weather is nice.",
    done: false,
  },
  {
    id: 4,
    title: "Book dentist appointment",
    project: "personal",
    date: day(0),
    notes: "",
    done: true,
  },
  {
    id: 5,
    title: "Pick up dry cleaning",
    project: "personal",
    date: day(-1),
    notes: "",
    done: false,
  },
  {
    id: 6,
    title: "Plan next sprint",
    project: "work",
    date: day(2),
    notes: "Outline priorities and dependencies.",
    done: false,
  },
];
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved) {
    tasks = saved.tasks || tasks;
    projects = saved.projects || projects;
  }
} catch (e) {}
let filter = "today",
  view = "list",
  editingId = null;
sorting = true;
const $ = (s) => document.querySelector(s),
  area = $("#taskArea");
function save() {
  localStorage.setItem(key, JSON.stringify({ tasks, projects }));
}
function prettyDate(v) {
  const d = new Date(v + "T00:00:00"),
    diff = Math.round((d - today) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function getTasks() {
  let list = [...tasks];
  const q = $("#searchInput").value.trim().toLowerCase();
  if (filter === "today") list = list.filter((t) => t.date === iso(today));
  else if (filter === "upcoming") list = list.filter((t) => t.date >= iso(today));
  else if (filter.startsWith("project:"))
    list = list.filter((t) => t.project === filter.slice(8));
  if (q) list = list.filter((t) => (t.title + t.notes).toLowerCase().includes(q));
  return sorting ? list.sort((a, b) => a.done - b.done || a.date.localeCompare(b.date)) : list;
}
function renderProjects() {
  const counts = Object.fromEntries(
    projects.map((p) => [p.id, tasks.filter((t) => t.project === p.id && !t.done).length]),
  );
  $("#projectList").innerHTML = projects
    .map(
      (p) =>
        `<button class="project ${filter === "project:" + p.id ? "active" : ""}" data-project="${p.id}"><i class="dot" style="background:${p.color}"></i>${p.name}<b>${counts[p.id]}</b></button>`,
    )
    .join("");
}
function render() {
  const list = getTasks(),
    completed = tasks.filter((t) => t.done).length,
    pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  $("#allCount").textContent = tasks.filter((t) => !t.done).length;
  $("#todayCount").textContent = tasks.filter((t) => t.date === iso(today) && !t.done).length;
  $("#upcomingCount").textContent = tasks.filter(
    (t) => t.date >= iso(today) && !t.done,
  ).length;
  $("#progressText").textContent = `${completed} of ${tasks.length} tasks complete`;
  $("#progressPercent").textContent = pct + "%";
  $("#progressBar").style.width = pct + "%";
  const selected = document.querySelector(".nav-item.active");
  document
    .querySelectorAll(".nav-item")
    .forEach((x) => x.classList.toggle("active", x.dataset.filter === filter));
  const proj = projects.find((p) => "project:" + p.id === filter);
  $("#pageTitle").textContent = proj
    ? proj.name
    : { today: "Today", upcoming: "Upcoming", all: "All tasks" }[filter];
  $("#pageSubtitle").textContent =
    filter === "today"
      ? "You have tasks to focus on."
      : `${list.length} task${list.length === 1 ? "" : "s"} in this view.`;
  let groups = {};
  list.forEach((t) => {
    let g =
      filter === "today"
        ? "TODAY"
        : t.done
          ? "COMPLETED"
          : t.date === iso(today)
            ? "TODAY"
            : t.date > iso(today)
              ? "UP NEXT"
              : "OVERDUE";
    (groups[g] ??= []).push(t);
  });
  area.className = "task-area " + (view === "board" ? "board" : "");
  area.innerHTML = Object.keys(groups).length
    ? Object.entries(groups)
        .map(
          ([name, items]) =>
            `<section><div class="section-label">${name}<span>${items.length}</span></div><div class="tasks">${items.map(taskHTML).join("")}</div></section>`,
        )
        .join("")
    : '<div class="empty">No tasks here yet. Enjoy the clear space.</div>';
  renderProjects();
}
function taskHTML(t) {
  const p = projects.find((x) => x.id === t.project) || projects[0];
  const overdue = t.date < iso(today) && !t.done;
  return `<article class="task ${t.done ? "done" : ""}" data-id="${t.id}"><input aria-label="Mark complete" class="check" type="checkbox" ${t.done ? "checked" : ""}><div class="task-main"><div class="task-title">${escapeHtml(t.title)}</div>${t.notes ? `<div class="task-note">${escapeHtml(t.notes)}</div>` : ""}</div><span class="tag ${p.id}">${p.name}</span><time class="task-date ${overdue ? "overdue" : ""}">${prettyDate(t.date)}</time></article>`;
}
function escapeHtml(s) {
  return s.replace(
    /[&<>'"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c],
  );
}
function openDialog(task) {
  editingId = task?.id || null;
  $("#dialogTitle").textContent = task ? "Edit task" : "New task";
  $("#taskName").value = task?.title || "";
  $("#taskProject").innerHTML = projects
    .map((p) => `<option value="${p.id}">${p.name}</option>`)
    .join("");
  $("#taskProject").value = task?.project || projects[0].id;
  $("#taskDate").value = task?.date || iso(today);
  $("#taskNotes").value = task?.notes || "";
  $("#deleteTask").style.visibility = task ? "visible" : "hidden";
  $("#taskDialog").showModal();
  $("#taskName").focus();
}
document.addEventListener("click", (e) => {
  const nav = e.target.closest(".nav-item");
  if (nav) {
    filter = nav.dataset.filter;
    render();
  }
  const proj = e.target.closest(".project");
  if (proj) {
    filter = "project:" + proj.dataset.project;
    render();
  }
  const task = e.target.closest(".task");
  if (task) {
    const t = tasks.find((x) => x.id === +task.dataset.id);
    if (e.target.matches(".check")) {
      t.done = e.target.checked;
      save();
      render();
    } else openDialog(t);
  }
});
$("#newTask").onclick =
  $("#sideNewTask").onclick =
  $("#addTaskInline").onclick =
    () => openDialog();
$("#closeDialog").onclick = $("#cancelDialog").onclick = () => $("#taskDialog").close();
$("#taskForm").onsubmit = (e) => {
  e.preventDefault();
  const entry = {
    id: editingId || Date.now(),
    title: $("#taskName").value.trim(),
    project: $("#taskProject").value,
    date: $("#taskDate").value || iso(today),
    notes: $("#taskNotes").value.trim(),
    done: false,
  };
  if (!entry.title) return;
  if (editingId) {
    const old = tasks.find((t) => t.id === editingId);
    entry.done = old.done;
    Object.assign(old, entry);
  } else tasks.unshift(entry);
  save();
  $("#taskDialog").close();
  render();
};
$("#deleteTask").onclick = () => {
  tasks = tasks.filter((t) => t.id !== editingId);
  save();
  $("#taskDialog").close();
  render();
};
$("#searchInput").oninput = render;
$("#sortButton").onclick = () => {
  sorting = !sorting;
  $("#sortButton").innerHTML = `⇅ Sort by <b>${sorting ? "Due date" : "Custom order"}</b>`;
  render();
};
document.querySelectorAll("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      view = b.dataset.view;
      document
        .querySelectorAll("[data-view]")
        .forEach((x) => x.classList.toggle("selected", x === b));
      render();
    }),
);
$("#themeToggle").onclick = () => document.body.classList.toggle("dark");
$("#addProject").onclick = () => {
  const name = prompt("Project name");
  if (name?.trim()) {
    projects.push({ id: "p" + Date.now(), name: name.trim(), color: "#ae8cdc" });
    save();
    render();
  }
};
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    $("#searchInput").focus();
  }
});
const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});
$("#dateLabel").textContent = dateFormat.format(today).toUpperCase();
render();
