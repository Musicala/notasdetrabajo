// ======================================
// BITÁCORA MUSICALA
// js/notes.js
// Gestión de notas locales
// ======================================

import {
  getNotesStorage,
  saveNotesStorage
} from "./storage.js";

/* ======================================
   HELPERS
====================================== */

function sanitizeText(value) {
  return String(value || "").trim();
}

function sanitizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeText(item))
    .filter(Boolean);
}

function normalizeType(type) {
  const allowed = ["quick", "pending", "idea", "log"];
  return allowed.includes(type) ? type : "quick";
}

function normalizePriority(priority) {
  const allowed = ["alta", "media", "baja"];
  return allowed.includes(priority) ? priority : "media";
}

function createId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function dedupeStrings(list = []) {
  return [...new Set(list.map((item) => sanitizeText(item)).filter(Boolean))];
}

function normalizeChecklist(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item))
      .filter(Boolean);
  }
  
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => sanitizeText(line))
      .filter(Boolean);
  }
  
  return [];
}

function buildNote(raw = {}, existing = null) {
  const now = new Date().toISOString();
  
  return {
    id: existing?.id || raw.id || createId(),
    title: sanitizeText(raw.title) || "Sin título",
    type: normalizeType(raw.type),
    priority: normalizePriority(raw.priority),
    category: sanitizeText(raw.category),
    tags: dedupeStrings(Array.isArray(raw.tags) ? raw.tags : []),
    content: sanitizeText(raw.content),
    checklist: normalizeChecklist(raw.checklist),
    dueDate: sanitizeText(raw.dueDate),
    reminderAt: sanitizeText(raw.reminderAt),
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    createdAt: existing?.createdAt || raw.createdAt || now,
    updatedAt: now
  };
}

function sortNotesByRecent(notes = []) {
  return [...notes].sort((a, b) => {
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
}

function ensureNotesArray(notes) {
  return Array.isArray(notes) ? notes : [];
}

function persistNotes(notes) {
  return saveNotesStorage(sortNotesByRecent(notes));
}

/* ======================================
   GETTERS
====================================== */

export function getAllNotes() {
  const rawNotes = ensureNotesArray(getNotesStorage());
  
  const normalized = rawNotes
    .filter((note) => note && typeof note === "object")
    .map((note) => buildNote(note, note));
  
  return sortNotesByRecent(normalized);
}

export function getNoteById(noteId) {
  const id = sanitizeText(noteId);
  if (!id) return null;
  
  return getAllNotes().find((note) => note.id === id) || null;
}

export function hasNotes() {
  return getAllNotes().length > 0;
}

/* ======================================
   CREATE
====================================== */

export function createNote(noteData = {}) {
  const note = buildNote(noteData);
  
  const notes = getAllNotes();
  const updatedNotes = [note, ...notes];
  
  persistNotes(updatedNotes);
  return note;
}

/* ======================================
   UPDATE
====================================== */

export function updateNote(noteId, partialData = {}) {
  const id = sanitizeText(noteId);
  if (!id) return null;
  
  const notes = getAllNotes();
  const current = notes.find((note) => note.id === id);
  
  if (!current) {
    console.warn("No se encontró la nota para actualizar:", noteId);
    return null;
  }
  
  const updatedNote = buildNote(
    {
      ...current,
      ...partialData
    },
    current
  );
  
  const updatedNotes = notes.map((note) => {
    return note.id === id ? updatedNote : note;
  });
  
  persistNotes(updatedNotes);
  return updatedNote;
}

/* ======================================
   DELETE
====================================== */

export function deleteNote(noteId) {
  const id = sanitizeText(noteId);
  if (!id) return false;
  
  const notes = getAllNotes();
  const filteredNotes = notes.filter((note) => note.id !== id);
  
  if (filteredNotes.length === notes.length) {
    return false;
  }
  
  persistNotes(filteredNotes);
  return true;
}

/* ======================================
   DUPLICATE
====================================== */

export function duplicateNote(noteId) {
  const original = getNoteById(noteId);
  if (!original) return null;
  
  const duplicated = createNote({
    ...original,
    id: undefined,
    title: `${original.title} (copia)`,
    pinned: false,
    archived: false,
    createdAt: undefined,
    updatedAt: undefined
  });
  
  return duplicated;
}

/* ======================================
   ARCHIVE / PIN
====================================== */

export function archiveNote(noteId) {
  return updateNote(noteId, { archived: true });
}

export function unarchiveNote(noteId) {
  return updateNote(noteId, { archived: false });
}

export function togglePinned(noteId) {
  const note = getNoteById(noteId);
  if (!note) return null;
  
  return updateNote(noteId, {
    pinned: !note.pinned
  });
}

/* ======================================
   BULK / RESET
====================================== */

export function replaceAllNotes(notesList = []) {
  const normalized = ensureNotesArray(notesList)
    .filter((note) => note && typeof note === "object")
    .map((note) => buildNote(note, note));
  
  persistNotes(normalized);
  return getAllNotes();
}

export function clearAllNotes() {
  persistNotes([]);
  return true;
}

/* ======================================
   STATS / FILTER HELPERS
====================================== */

export function getNotesStats() {
  const notes = getAllNotes();
  
  return {
    total: notes.length,
    archived: notes.filter((note) => note.archived).length,
    pinned: notes.filter((note) => note.pinned).length,
    pending: notes.filter((note) => note.type === "pending" && !note.archived).length,
    ideas: notes.filter((note) => note.type === "idea" && !note.archived).length,
    quick: notes.filter((note) => note.type === "quick" && !note.archived).length,
    log: notes.filter((note) => note.type === "log" && !note.archived).length
  };
}

/* ======================================
   SEARCH
====================================== */

export function searchNotes(term = "") {
  const query = sanitizeText(term).toLowerCase();
  if (!query) return getAllNotes();
  
  return getAllNotes().filter((note) => {
    const haystack = [
        note.title,
        note.content,
        note.category,
        ...(note.tags || []),
        ...(note.checklist || [])
      ]
      .join(" ")
      .toLowerCase();
    
    return haystack.includes(query);
  });
}
