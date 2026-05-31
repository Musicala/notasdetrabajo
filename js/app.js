import { getProfile, saveProfile, clearAllAppData } from "./profile.js";
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
  duplicateNote,
  togglePinned,
  archiveNote,
  unarchiveNote
} from "./notes.js";
import { exportAllData, importAllData } from "./storage.js";
import { formatLongDate, getInitials, normalizeTagsInput, normalizeChecklistInput, safeText } from "./ui.js";

const state = {
  profile: null,
  notes: [],
  selectedView: "all",
  search: "",
  filterType: "all",
  filterPriority: "all",
  sort: "updated-desc",
  selectedTag: "",
  editingNoteId: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const dom = {
  welcomeScreen: $("#welcomeScreen"),
  mainScreen: $("#mainScreen"),
  profileForm: $("#profileForm"),
  profileName: $("#profileName"),
  profileRole: $("#profileRole"),
  profileTheme: $("#profileTheme"),
  greetingTitle: $("#greetingTitle"),
  currentDateLabel: $("#currentDateLabel"),
  sidebarUserName: $("#sidebarUserName"),
  sidebarUserRole: $("#sidebarUserRole"),
  profileAvatar: $("#profileAvatar"),
  notesSectionTitle: $("#notesSectionTitle"),
  notesList: $("#notesList"),
  emptyState: $("#emptyState"),
  totalNotesCount: $("#totalNotesCount"),
  pendingNotesCount: $("#pendingNotesCount"),
  ideasNotesCount: $("#ideasNotesCount"),
  archivedNotesCount: $("#archivedNotesCount"),
  navAllCount: $("#navAllCount"),
  navTodayCount: $("#navTodayCount"),
  navPendingCount: $("#navPendingCount"),
  navIdeasCount: $("#navIdeasCount"),
  navArchivedCount: $("#navArchivedCount"),
  newNoteBtn: $("#newNoteBtn"),
  topbarNewNoteBtn: $("#topbarNewNoteBtn"),
  quickNoteBtn: $("#quickNoteBtn"),
  emptyStateNewBtn: $("#emptyStateNewBtn"),
  openSettingsBtn: $("#openSettingsBtn"),
  quickCaptureInput: $("#quickCaptureInput"),
  quickCaptureType: $("#quickCaptureType"),
  quickCapturePriority: $("#quickCapturePriority"),
  quickCaptureDueDate: $("#quickCaptureDueDate"),
  quickCaptureSaveBtn: $("#quickCaptureSaveBtn"),
  searchInput: $("#searchInput"),
  filterType: $("#filterType"),
  filterPriority: $("#filterPriority"),
  sortNotes: $("#sortNotes"),
  menuItems: $$(".menu-item"),
  tagChips: $$(".tag-chip"),
  exportDataBtn: $("#exportDataBtn"),
  importDataInput: $("#importDataInput"),
  statusMessage: $("#statusMessage"),
  noteModal: $("#noteModal"),
  noteModalTitle: $("#noteModalTitle"),
  closeNoteModalBtn: $("#closeNoteModalBtn"),
  cancelNoteBtn: $("#cancelNoteBtn"),
  deleteNoteBtn: $("#deleteNoteBtn"),
  noteForm: $("#noteForm"),
  noteId: $("#noteId"),
  noteTitle: $("#noteTitle"),
  noteType: $("#noteType"),
  notePriority: $("#notePriority"),
  noteCategory: $("#noteCategory"),
  noteTags: $("#noteTags"),
  noteDueDate: $("#noteDueDate"),
  noteReminder: $("#noteReminder"),
  noteContent: $("#noteContent"),
  noteChecklist: $("#noteChecklist"),
  notePinned: $("#notePinned"),
  noteArchived: $("#noteArchived"),
  settingsModal: $("#settingsModal"),
  settingsForm: $("#settingsForm"),
  settingsName: $("#settingsName"),
  settingsRole: $("#settingsRole"),
  settingsTheme: $("#settingsTheme"),
  closeSettingsModalBtn: $("#closeSettingsModalBtn"),
  resetAppBtn: $("#resetAppBtn")
};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  bindEvents();
  loadInitialState();
  renderApp();
}

function loadInitialState() {
  state.profile = getProfile();
  state.notes = getAllNotes();
  if (state.profile?.theme) applyTheme(state.profile.theme);
}

function bindEvents() {
  dom.profileForm?.addEventListener("submit", handleProfileSubmit);
  dom.newNoteBtn?.addEventListener("click", () => openNoteModal());
  dom.topbarNewNoteBtn?.addEventListener("click", () => openNoteModal());
  dom.quickNoteBtn?.addEventListener("click", () => openNoteModal({ type: "quick" }));
  dom.emptyStateNewBtn?.addEventListener("click", () => openNoteModal());
  dom.quickCaptureSaveBtn?.addEventListener("click", handleQuickCapture);
  dom.quickCaptureInput?.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleQuickCapture();
    }
  });

  dom.searchInput?.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderNotesSection();
  });
  dom.filterType?.addEventListener("change", (event) => {
    state.filterType = event.target.value;
    renderNotesSection();
  });
  dom.filterPriority?.addEventListener("change", (event) => {
    state.filterPriority = event.target.value;
    renderNotesSection();
  });
  dom.sortNotes?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderNotesSection();
  });

  dom.menuItems.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedView = button.dataset.view || "all";
      state.selectedTag = "";
      dom.menuItems.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderNotesSection();
    });
  });

  dom.tagChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.selectedTag = chip.dataset.tag || "";
      state.selectedView = "all";
      dom.menuItems.forEach((item) => item.classList.remove("is-active"));
      dom.menuItems.find((item) => item.dataset.view === "all")?.classList.add("is-active");
      renderNotesSection();
    });
  });

  dom.noteForm?.addEventListener("submit", handleNoteSubmit);
  dom.deleteNoteBtn?.addEventListener("click", handleDeleteNote);
  dom.closeNoteModalBtn?.addEventListener("click", closeNoteModal);
  dom.cancelNoteBtn?.addEventListener("click", closeNoteModal);
  dom.openSettingsBtn?.addEventListener("click", openSettingsModal);
  dom.closeSettingsModalBtn?.addEventListener("click", closeSettingsModal);
  dom.settingsForm?.addEventListener("submit", handleSettingsSubmit);
  dom.resetAppBtn?.addEventListener("click", handleResetApp);
  dom.exportDataBtn?.addEventListener("click", handleExportData);
  dom.importDataInput?.addEventListener("change", handleImportData);
  document.addEventListener("click", handleGlobalClicks);
}

function handleProfileSubmit(event) {
  event.preventDefault();
  const name = safeText(dom.profileName?.value);
  if (!name) return dom.profileName?.focus();

  const profile = {
    name,
    role: safeText(dom.profileRole?.value),
    theme: dom.profileTheme?.value || "violeta",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveProfile(profile);
  state.profile = profile;
  applyTheme(profile.theme);
  renderApp();
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  if (!state.profile) return;

  const updatedProfile = {
    ...state.profile,
    name: safeText(dom.settingsName?.value),
    role: safeText(dom.settingsRole?.value),
    theme: dom.settingsTheme?.value || "violeta",
    updatedAt: new Date().toISOString()
  };

  if (!updatedProfile.name) return dom.settingsName?.focus();
  saveProfile(updatedProfile);
  state.profile = updatedProfile;
  applyTheme(updatedProfile.theme);
  closeSettingsModal();
  renderProfileUI();
  showStatus("Perfil actualizado.");
}

function openSettingsModal() {
  if (!state.profile) return;
  dom.settingsName.value = state.profile.name || "";
  dom.settingsRole.value = state.profile.role || "";
  dom.settingsTheme.value = state.profile.theme || "violeta";
  dom.settingsModal.hidden = false;
}

function closeSettingsModal() {
  dom.settingsModal.hidden = true;
}

function handleResetApp() {
  const confirmed = window.confirm("Esto borrará el perfil local y todas las notas guardadas en este dispositivo. ¿Continuar?");
  if (!confirmed) return;

  clearAllAppData();
  Object.assign(state, {
    profile: null,
    notes: [],
    selectedView: "all",
    search: "",
    filterType: "all",
    filterPriority: "all",
    sort: "updated-desc",
    selectedTag: "",
    editingNoteId: null
  });
  document.body.className = "";
  closeSettingsModal();
  renderApp();
}

function handleNoteSubmit(event) {
  event.preventDefault();
  const id = safeText(dom.noteId?.value);
  const title = safeText(dom.noteTitle?.value);
  const content = safeText(dom.noteContent?.value);

  if (!title || !content) {
    return (!title ? dom.noteTitle : dom.noteContent)?.focus();
  }

  const payload = {
    title,
    type: dom.noteType?.value || "quick",
    priority: dom.notePriority?.value || "media",
    category: safeText(dom.noteCategory?.value),
    tags: normalizeTagsInput(dom.noteTags?.value || ""),
    dueDate: safeText(dom.noteDueDate?.value),
    reminderAt: safeText(dom.noteReminder?.value),
    content,
    checklist: normalizeChecklistInput(dom.noteChecklist?.value || ""),
    pinned: !!dom.notePinned?.checked,
    archived: !!dom.noteArchived?.checked
  };

  id ? updateNote(id, payload) : createNote(payload);
  refreshNotes();
  closeNoteModal();
  renderSummary();
  renderNotesSection();
  showStatus("Nota guardada.");
}

function handleQuickCapture() {
  const content = safeText(dom.quickCaptureInput?.value);
  if (!content) return dom.quickCaptureInput?.focus();

  const firstLine = content.split("\n").map((line) => line.trim()).find(Boolean) || "Nota rápida";
  const title = firstLine.length > 70 ? `${firstLine.slice(0, 70).trim()}...` : firstLine;

  createNote({
    title,
    content,
    type: dom.quickCaptureType?.value || "quick",
    priority: dom.quickCapturePriority?.value || "media",
    dueDate: safeText(dom.quickCaptureDueDate?.value),
    reminderAt: "",
    category: "",
    tags: [],
    checklist: [],
    pinned: false,
    archived: false
  });

  dom.quickCaptureInput.value = "";
  dom.quickCaptureDueDate.value = "";
  refreshNotes();
  renderSummary();
  renderNotesSection();
  showStatus("Post-it pegado en el tablero.");
}

function handleDeleteNote() {
  const id = safeText(dom.noteId?.value);
  if (!id || !window.confirm("¿Eliminar esta nota?")) return;
  deleteNote(id);
  refreshNotes();
  closeNoteModal();
  renderSummary();
  renderNotesSection();
  showStatus("Nota eliminada.");
}

function refreshNotes() {
  state.notes = getAllNotes();
}

function openNoteModal(defaults = {}) {
  state.editingNoteId = null;
  resetNoteForm();
  dom.noteModalTitle.textContent = defaults.type === "quick" ? "Nueva nota rápida" : "Nueva nota";
  dom.noteType.value = defaults.type || "quick";
  dom.deleteNoteBtn.hidden = true;
  dom.noteModal.hidden = false;
  setTimeout(() => dom.noteTitle?.focus(), 0);
}

function openEditNoteModal(noteId) {
  const note = getNoteById(noteId);
  if (!note) return;

  state.editingNoteId = note.id;
  dom.noteModalTitle.textContent = "Editar nota";
  dom.noteId.value = note.id || "";
  dom.noteTitle.value = note.title || "";
  dom.noteType.value = note.type || "quick";
  dom.notePriority.value = note.priority || "media";
  dom.noteCategory.value = note.category || "";
  dom.noteTags.value = Array.isArray(note.tags) ? note.tags.join(", ") : "";
  dom.noteDueDate.value = note.dueDate || "";
  dom.noteReminder.value = toDatetimeLocalValue(note.reminderAt || "");
  dom.noteContent.value = note.content || "";
  dom.noteChecklist.value = Array.isArray(note.checklist) ? note.checklist.join("\n") : "";
  dom.notePinned.checked = !!note.pinned;
  dom.noteArchived.checked = !!note.archived;
  dom.deleteNoteBtn.hidden = false;
  dom.noteModal.hidden = false;
}

function closeNoteModal() {
  dom.noteModal.hidden = true;
  resetNoteForm();
  state.editingNoteId = null;
}

function resetNoteForm() {
  dom.noteForm?.reset();
  if (dom.noteId) dom.noteId.value = "";
}

function renderApp() {
  if (!state.profile) return showWelcomeScreen();
  showMainScreen();
  renderProfileUI();
  renderSummary();
  renderNotesSection();
}

function showWelcomeScreen() {
  dom.welcomeScreen.hidden = false;
  dom.mainScreen.hidden = true;
  dom.welcomeScreen.classList.add("screen--active");
  dom.mainScreen.classList.remove("screen--active");
}

function showMainScreen() {
  dom.welcomeScreen.hidden = true;
  dom.mainScreen.hidden = false;
  dom.welcomeScreen.classList.remove("screen--active");
  dom.mainScreen.classList.add("screen--active");
}

function renderProfileUI() {
  const name = state.profile?.name || "Usuario";
  const role = state.profile?.role || "Sin rol";
  dom.greetingTitle.textContent = `Hola, ${name}`;
  dom.currentDateLabel.textContent = formatLongDate(new Date());
  dom.sidebarUserName.textContent = name;
  dom.sidebarUserRole.textContent = role;
  dom.profileAvatar.textContent = getInitials(name);
}

function renderSummary() {
  const notes = state.notes;
  dom.totalNotesCount.textContent = String(notes.length);
  dom.pendingNotesCount.textContent = String(notes.filter((note) => note.type === "pending" && !note.archived).length);
  dom.ideasNotesCount.textContent = String(notes.filter((note) => note.type === "idea" && !note.archived).length);
  dom.archivedNotesCount.textContent = String(notes.filter((note) => !!note.archived).length);
  dom.navAllCount.textContent = String(notes.filter((note) => !note.archived).length);
  dom.navTodayCount.textContent = String(notes.filter((note) => isToday(note.createdAt || note.updatedAt) && !note.archived).length);
  dom.navPendingCount.textContent = String(notes.filter((note) => note.type === "pending" && !note.archived).length);
  dom.navIdeasCount.textContent = String(notes.filter((note) => note.type === "idea" && !note.archived).length);
  dom.navArchivedCount.textContent = String(notes.filter((note) => !!note.archived).length);
}

function renderNotesSection() {
  const visibleNotes = getVisibleNotes();
  dom.notesSectionTitle.textContent = getSectionTitle();

  if (!visibleNotes.length) {
    dom.emptyState.hidden = false;
    dom.notesList.hidden = true;
    dom.notesList.innerHTML = "";
    return;
  }

  dom.emptyState.hidden = true;
  dom.notesList.hidden = false;
  dom.notesList.innerHTML = visibleNotes.map(renderNoteCard).join("");
}

function renderNoteCard(note) {
  const tagsHTML = (note.tags || []).slice(0, 4).map((tag) => `<span class="note-tag">${escapeHTML(tag)}</span>`).join("");
  const dueHTML = note.dueDate ? `<span class="note-due ${isOverdue(note) ? "is-overdue" : ""}">${escapeHTML(formatDueLabel(note.dueDate))}</span>` : "";
  const checklistHTML = Array.isArray(note.checklist) && note.checklist.length
    ? `<p class="note-checklist-count">${note.checklist.length} tarea${note.checklist.length === 1 ? "" : "s"} en checklist</p>`
    : "";
  const archivedClass = note.archived ? " is-archived" : "";

  return `
    <article class="note-card note-card--${escapeHTML(note.type || "quick")} note-card--priority-${escapeHTML(note.priority || "media")}${archivedClass}" data-note-id="${escapeHTML(note.id)}" role="button" tabindex="0">
      <div class="note-card__top">
        <div class="note-card__badges">
          <span class="note-badge note-badge--type">${escapeHTML(getTypeLabel(note.type))}</span>
          <span class="note-badge note-badge--priority note-badge--${escapeHTML(note.priority || "media")}">${escapeHTML(note.priority || "media")}</span>
        </div>
        ${note.pinned ? `<span class="note-pin" title="Fijada">📌</span>` : ""}
      </div>
      <h3 class="note-card__title">${escapeHTML(note.title || "Sin título")}</h3>
      ${note.category ? `<p class="note-card__category">${escapeHTML(note.category)}</p>` : ""}
      <p class="note-card__content">${escapeHTML(truncateText(note.content || "", 140))}</p>
      ${checklistHTML}
      ${dueHTML}
      ${tagsHTML ? `<div class="note-card__tags">${tagsHTML}</div>` : ""}
      <div class="note-card__meta">
        <span>${escapeHTML(formatShortDate(note.updatedAt || note.createdAt))}</span>
        <span class="note-card__actions">
          <button type="button" class="mini-btn" data-note-action="pin" data-note-id="${escapeHTML(note.id)}">${note.pinned ? "Soltar" : "Fijar"}</button>
          <button type="button" class="mini-btn" data-note-action="archive" data-note-id="${escapeHTML(note.id)}">${note.archived ? "Restaurar" : "Archivar"}</button>
          <button type="button" class="mini-btn" data-note-action="duplicate" data-note-id="${escapeHTML(note.id)}">Copiar</button>
        </span>
      </div>
    </article>
  `;
}

function getVisibleNotes() {
  return applySorting(
    applyTagFilter(
      applyPriorityFilter(
        applyTypeFilter(
          applySearchFilter(
            applyViewFilter([...state.notes])
          )
        )
      )
    )
  );
}

function applyViewFilter(notes) {
  if (state.selectedView === "today") return notes.filter((note) => isToday(note.createdAt || note.updatedAt) && !note.archived);
  if (state.selectedView === "pending") return notes.filter((note) => note.type === "pending" && !note.archived);
  if (state.selectedView === "ideas") return notes.filter((note) => note.type === "idea" && !note.archived);
  if (state.selectedView === "archived") return notes.filter((note) => !!note.archived);
  return notes.filter((note) => !note.archived);
}

function applySearchFilter(notes) {
  if (!state.search) return notes;
  const term = state.search.toLowerCase();
  return notes.filter((note) => [note.title, note.content, note.category, note.dueDate, ...(note.tags || []), ...(note.checklist || [])].join(" ").toLowerCase().includes(term));
}

function applyTypeFilter(notes) {
  return state.filterType === "all" ? notes : notes.filter((note) => note.type === state.filterType);
}

function applyPriorityFilter(notes) {
  return state.filterPriority === "all" ? notes : notes.filter((note) => note.priority === state.filterPriority);
}

function applyTagFilter(notes) {
  return state.selectedTag ? notes.filter((note) => (note.tags || []).includes(state.selectedTag)) : notes;
}

function applySorting(notes) {
  const pinnedFirst = [...notes].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  if (state.sort === "updated-asc") return pinnedFirst.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
  if (state.sort === "priority-desc") return pinnedFirst.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
  if (state.sort === "due-asc") return pinnedFirst.sort((a, b) => dueWeight(a.dueDate) - dueWeight(b.dueDate));
  if (state.sort === "title-asc") return pinnedFirst.sort((a, b) => String(a.title).localeCompare(String(b.title), "es"));
  return pinnedFirst.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function getSectionTitle() {
  if (state.selectedTag) return `Etiqueta: ${state.selectedTag}`;
  const titles = { today: "Notas de hoy", pending: "Pendientes", ideas: "Ideas", archived: "Archivadas", all: "Todas las notas" };
  return titles[state.selectedView] || titles.all;
}

function handleGlobalClicks(event) {
  const actionButton = event.target.closest("[data-note-action]");
  if (actionButton) {
    event.stopPropagation();
    handleNoteAction(actionButton.dataset.noteAction, actionButton.dataset.noteId);
    return;
  }

  const noteCard = event.target.closest("[data-note-id]");
  if (noteCard) return openEditNoteModal(noteCard.dataset.noteId);
  if (event.target.matches("[data-close-note-modal]")) return closeNoteModal();
  if (event.target.matches("[data-close-settings-modal]")) closeSettingsModal();
}

function handleNoteAction(action, noteId) {
  const note = getNoteById(noteId);
  if (!note) return;

  if (action === "pin") togglePinned(noteId);
  if (action === "archive") note.archived ? unarchiveNote(noteId) : archiveNote(noteId);
  if (action === "duplicate") duplicateNote(noteId);

  refreshNotes();
  renderSummary();
  renderNotesSection();
  showStatus("Listo. Cambios guardados en este dispositivo.");
}

function handleExportData() {
  const blob = new Blob([JSON.stringify(exportAllData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bitacora-musicala-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showStatus("Respaldo exportado.");
}

async function handleImportData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const ok = importAllData(JSON.parse(await file.text()));
    if (!ok) throw new Error("Formato inválido");
    state.profile = getProfile();
    refreshNotes();
    if (state.profile?.theme) applyTheme(state.profile.theme);
    renderApp();
    showStatus("Respaldo importado correctamente.");
  } catch (error) {
    console.error(error);
    showStatus("No se pudo importar el respaldo. Revisa que sea un JSON válido.");
  } finally {
    event.target.value = "";
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!dom.noteModal.hidden) closeNoteModal();
    if (!dom.settingsModal.hidden) closeSettingsModal();
  }
  if (event.key === "Enter") {
    const noteCard = event.target.closest?.("[data-note-id]");
    if (noteCard) openEditNoteModal(noteCard.dataset.noteId);
  }
});

function showStatus(message) {
  if (!dom.statusMessage) return;
  dom.statusMessage.textContent = message;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    dom.statusMessage.textContent = "";
  }, 3500);
}

function applyTheme(theme) {
  document.body.classList.remove("theme-violeta", "theme-azul", "theme-magenta", "theme-verde");
  document.body.classList.add(`theme-${theme || "violeta"}`);
}

function formatShortDate(value) {
  try {
    return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  } catch {
    return "";
  }
}

function formatDueLabel(value) {
  try {
    return `Límite: ${new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`))}`;
  } catch {
    return "";
  }
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isOverdue(note) {
  if (!note?.dueDate || note.archived) return false;
  return new Date(`${note.dueDate}T23:59:59`).getTime() < Date.now();
}

function dueWeight(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  return new Date(`${value}T12:00:00`).getTime();
}

function priorityWeight(priority) {
  if (priority === "alta") return 3;
  if (priority === "media") return 2;
  return 1;
}

function getTypeLabel(type) {
  const map = { quick: "Nota rápida", pending: "Pendiente", idea: "Idea", log: "Bitácora" };
  return map[type] || "Nota";
}

function truncateText(text, max = 120) {
  const clean = String(text || "").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}...`;
}

function toDatetimeLocalValue(value) {
  return value ? String(value).slice(0, 16) : "";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
