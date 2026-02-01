const state = {
  programs: [],
  isLoaded: false,
  formMode: "create",
  currentId: null,
};

const el = {
  toast: document.getElementById("toast"),

  dashboard: document.getElementById("screenDashboard"),
  form: document.getElementById("screenForm"),
  detail: document.getElementById("screenDetail"),

  createBtn: document.getElementById("createBtn"),
  programTableBody: document.getElementById("programTableBody"),
  emptyState: document.getElementById("emptyState"),

  formTitle: document.getElementById("formTitle"),
  formBackBtn: document.getElementById("formBackBtn"),
  programForm: document.getElementById("programForm"),

  fieldIdRow: document.getElementById("fieldIdRow"),
  programId: document.getElementById("programId"),
  programName: document.getElementById("programName"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  maxParticipants: document.getElementById("maxParticipants"),
  currentEnrollments: document.getElementById("currentEnrollments"),
  assignedMentors: document.getElementById("assignedMentors"),
  status: document.getElementById("status"),

  saveBtn: document.getElementById("saveBtn"),
  updateBtn: document.getElementById("updateBtn"),
  deleteBtn: document.getElementById("deleteBtn"),

  detailTitle: document.getElementById("detailTitle"),
  detailBackBtn: document.getElementById("detailBackBtn"),
  detailEditBtn: document.getElementById("detailEditBtn"),
  detailStatus: document.getElementById("detailStatus"),
  detailDuration: document.getElementById("detailDuration"),
  detailEnrollment: document.getElementById("detailEnrollment"),
  detailMentors: document.getElementById("detailMentors"),
  detailCapacityPct: document.getElementById("detailCapacityPct"),
  capacityBarFill: document.getElementById("capacityBarFill"),
  detailMentorLoad: document.getElementById("detailMentorLoad"),
  detailReadiness: document.getElementById("detailReadiness"),
  detailAiMeta: document.getElementById("detailAiMeta"),
  detailAiText: document.getElementById("detailAiText"),
};

function showToast(message) {
  if (!message) {
    el.toast.classList.remove("isVisible");
    el.toast.textContent = "";
    return;
  }

  el.toast.textContent = message;
  el.toast.classList.add("isVisible");

  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    el.toast.classList.remove("isVisible");
  }, 3500);
}

async function apiRequest(path, options = {}) {
  const baseHeaders = { accept: "application/json" };
  if (options.body != null) {
    baseHeaders["content-type"] = "application/json";
  }

  const resp = await fetch(path, {
    ...options,
    headers: { ...baseHeaders, ...(options.headers || {}) },
  });

  if (resp.status === 204) {
    return null;
  }

  const contentType = resp.headers.get("content-type") || "";
  const isJson = contentType.includes("json");

  if (!resp.ok) {
    let message = `Request failed (${resp.status})`;

    try {
      if (isJson) {
        const err = await resp.json();
        if (err && err.message) message = err.message;
        if (err && err.detail) message = err.detail;
      } else {
        const text = await resp.text();
        if (text) message = text;
      }
    } catch (e) {
    }

    throw new Error(message);
  }

  if (isJson) {
    return await resp.json();
  }

  return await resp.text();
}

const api = {
  listPrograms() {
    return apiRequest("/programs");
  },
  getProgram(id) {
    return apiRequest(`/programs/${id}`);
  },
  createProgram(body) {
    return apiRequest("/programs", { method: "POST", body: JSON.stringify(body) });
  },
  updateProgram(id, body) {
    return apiRequest(`/programs/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteProgram(id) {
    return apiRequest(`/programs/${id}`, { method: "DELETE" });
  },
};

function formatDate(value) {
  if (!value) return "—";
  const [y, m, d] = String(value).split("-").map((x) => Number(x));
  if (!y || !m || !d) return String(value);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDuration(startDate, endDate) {
  if (!startDate && !endDate) return "—";
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function readinessBadge(statusLabel) {
  const normalized = String(statusLabel || "").toLowerCase();

  if (normalized === "ready") {
    return { className: "badge badgeReady", text: "Ready" };
  }

  if (normalized === "at risk") {
    return { className: "badge badgeRisk", text: "At Risk" };
  }

  if (normalized === "overloaded") {
    return { className: "badge badgeOver", text: "Overloaded" };
  }

  return { className: "badge", text: statusLabel || "—" };
}

function showScreen(name) {
  const screens = [el.dashboard, el.form, el.detail];
  for (const s of screens) {
    s.hidden = true;
  }

  if (name === "dashboard") el.dashboard.hidden = false;
  if (name === "form") el.form.hidden = false;
  if (name === "detail") el.detail.hidden = false;
}

function renderDashboard() {
  el.programTableBody.innerHTML = "";

  if (!state.programs || state.programs.length === 0) {
    el.emptyState.classList.add("isVisible");
    return;
  }

  el.emptyState.classList.remove("isVisible");

  for (const p of state.programs) {
    const tr = document.createElement("tr");

    const badge = readinessBadge(p.readinessStatus);

    tr.innerHTML = `
      <td>${escapeHtml(p.programName)}</td>
      <td>${escapeHtml(formatDuration(p.startDate, p.endDate))}</td>
      <td>${escapeHtml(`${p.currentEnrollments} / ${p.maxParticipants}`)}</td>
      <td>${escapeHtml(String(p.assignedMentors))}</td>
      <td><span class="${badge.className}">${escapeHtml(badge.text)}</span></td>
      <td>
        <div class="actionRow">
          <button type="button" class="secondaryBtn" data-action="view" data-id="${p.id}">View</button>
          <button type="button" class="secondaryBtn" data-action="edit" data-id="${p.id}">Edit</button>
          <button type="button" class="dangerBtn" data-action="delete" data-id="${p.id}">Delete</button>
        </div>
      </td>
    `;

    el.programTableBody.appendChild(tr);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadPrograms() {
  try {
    const list = await api.listPrograms();
    state.programs = Array.isArray(list) ? list : [];
    state.isLoaded = true;
    if (currentRoute().name === "dashboard") {
      renderDashboard();
    }
  } catch (e) {
    showToast(e && e.message ? e.message : "Failed to load programs");
  }
}

function setFormMode(mode, program) {
  state.formMode = mode;
  state.currentId = program && program.id ? program.id : null;

  const isEdit = mode === "edit";

  el.formTitle.textContent = isEdit ? "Edit Program" : "Create Program";
  el.fieldIdRow.hidden = !isEdit;

  el.saveBtn.style.display = isEdit ? "none" : "inline-flex";
  el.updateBtn.style.display = isEdit ? "inline-flex" : "none";
  el.deleteBtn.style.display = isEdit ? "inline-flex" : "none";

  el.programId.value = isEdit ? String(program.id) : "";
  el.programName.value = program && program.programName ? program.programName : "";
  el.startDate.value = program && program.startDate ? program.startDate : "";
  el.endDate.value = program && program.endDate ? program.endDate : "";
  el.maxParticipants.value = program && program.maxParticipants != null ? String(program.maxParticipants) : "";
  el.currentEnrollments.value = program && program.currentEnrollments != null ? String(program.currentEnrollments) : "";
  el.assignedMentors.value = program && program.assignedMentors != null ? String(program.assignedMentors) : "";
  el.status.value = program && program.status ? program.status : "Planned";
}

function buildProgramPayload() {
  return {
    programName: el.programName.value.trim(),
    startDate: el.startDate.value || null,
    endDate: el.endDate.value || null,
    maxParticipants: Number(el.maxParticipants.value),
    currentEnrollments: Number(el.currentEnrollments.value),
    assignedMentors: Number(el.assignedMentors.value),
    status: el.status.value,
  };
}

async function handleCreate() {
  const payload = buildProgramPayload();
  const created = await api.createProgram(payload);
  showToast(`Created: ${created.programName}`);
  await loadPrograms();
  window.location.hash = "#dashboard";
}

async function handleUpdate() {
  if (!state.currentId) {
    showToast("Missing program id");
    return;
  }

  const payload = buildProgramPayload();
  const updated = await api.updateProgram(state.currentId, payload);
  showToast(`Updated: ${updated.programName}`);
  await loadPrograms();
  window.location.hash = "#dashboard";
}

async function handleDelete(id) {
  const targetId = id || state.currentId;
  if (!targetId) {
    showToast("Missing program id");
    return;
  }

  const program = state.programs.find((p) => String(p.id) === String(targetId));
  const name = program ? program.programName : "this program";

  const ok = window.confirm(`Delete ${name}?`);
  if (!ok) return;

  await api.deleteProgram(targetId);
  showToast("Program deleted");
  await loadPrograms();
  window.location.hash = "#dashboard";
}

function renderDetail(program) {
  el.detailTitle.textContent = program.programName || "Program Details";
  el.detailStatus.textContent = program.status || "—";
  el.detailDuration.textContent = formatDuration(program.startDate, program.endDate);
  el.detailEnrollment.textContent = `${program.currentEnrollments} / ${program.maxParticipants}`;
  el.detailMentors.textContent = String(program.assignedMentors);

  const pct = typeof program.enrollmentPercentage === "number" ? program.enrollmentPercentage : 0;
  const pctClamped = Math.max(0, Math.min(100, pct));

  el.detailCapacityPct.textContent = `${pct.toFixed(1)}% utilized`;
  el.capacityBarFill.style.width = `${pctClamped}%`;

  el.detailMentorLoad.textContent = `Mentor load ratio: ${program.mentorLoadRatio}`;

  const badge = readinessBadge(program.readinessStatus);
  el.detailReadiness.innerHTML = `<span class="${badge.className}">${escapeHtml(badge.text)}</span>`;

  el.detailAiMeta.textContent = program.aiExplanation ? "" : "";
  el.detailAiText.textContent = program.aiExplanation || "—";

  state.currentId = program.id;
}

async function openDetail(id) {
  showScreen("detail");
  el.detailTitle.textContent = "Loading...";
  el.detailAiText.textContent = "Loading explanation...";
  el.capacityBarFill.style.width = "0%";

  try {
    const program = await api.getProgram(id);
    renderDetail(program);
  } catch (e) {
    showToast(e && e.message ? e.message : "Failed to load program");
    window.location.hash = "#dashboard";
  }
}

function currentRoute() {
  const hash = (window.location.hash || "").replace(/^#/, "");
  const trimmed = hash.trim();

  if (!trimmed || trimmed === "dashboard") {
    return { name: "dashboard" };
  }

  if (trimmed === "create") {
    return { name: "create" };
  }

  const parts = trimmed.split("/").filter(Boolean);
  if (parts[0] === "edit" && parts[1]) {
    return { name: "edit", id: parts[1] };
  }

  if (parts[0] === "view" && parts[1]) {
    return { name: "view", id: parts[1] };
  }

  return { name: "dashboard" };
}

function handleRoute() {
  const route = currentRoute();

  if (route.name === "dashboard") {
    showScreen("dashboard");
    renderDashboard();
    return;
  }

  if (route.name === "create") {
    showScreen("form");
    setFormMode("create");
    return;
  }

  if (route.name === "edit") {
    showScreen("form");
    const found = state.programs.find((p) => String(p.id) === String(route.id));
    if (found) {
      setFormMode("edit", found);
      return;
    }

    showToast("Program not found in list. Reloading...");
    window.location.hash = "#dashboard";
    return;
  }

  if (route.name === "view") {
    openDetail(route.id);
    return;
  }

  window.location.hash = "#dashboard";
}

el.createBtn.addEventListener("click", () => {
  window.location.hash = "#create";
});

el.formBackBtn.addEventListener("click", () => {
  window.location.hash = "#dashboard";
});

el.detailBackBtn.addEventListener("click", () => {
  window.location.hash = "#dashboard";
});

el.detailEditBtn.addEventListener("click", () => {
  if (!state.currentId) {
    showToast("Missing program id");
    return;
  }
  window.location.hash = `#edit/${state.currentId}`;
});

el.programForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    showToast("");

    if (state.formMode === "edit") {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  } catch (err) {
    showToast(err && err.message ? err.message : "Request failed");
  }
});

el.updateBtn.addEventListener("click", async () => {
  try {
    await handleUpdate();
  } catch (err) {
    showToast(err && err.message ? err.message : "Update failed");
  }
});

el.deleteBtn.addEventListener("click", async () => {
  try {
    await handleDelete();
  } catch (err) {
    showToast(err && err.message ? err.message : "Delete failed");
  }
});

el.programTableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");

  if (action === "view") {
    window.location.hash = `#view/${id}`;
    return;
  }

  if (action === "edit") {
    window.location.hash = `#edit/${id}`;
    return;
  }

  if (action === "delete") {
    try {
      await handleDelete(id);
    } catch (err) {
      showToast(err && err.message ? err.message : "Delete failed");
    }
  }
});

window.addEventListener("hashchange", handleRoute);

loadPrograms().finally(() => {
  if (!window.location.hash) {
    window.location.hash = "#dashboard";
  }
  handleRoute();
});
