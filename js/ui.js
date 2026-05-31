// ======================================
// BITÁCORA MUSICALA
// js/ui.js
// Helpers de UI, formato y normalización
// ======================================

/* ======================================
   TEXT HELPERS
====================================== */

export function safeText(value) {
  return String(value ?? "").trim();
}

export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function truncateText(value, max = 120) {
  const text = safeText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

/* ======================================
   DATE HELPERS
====================================== */

export function formatLongDate(value = new Date()) {
  try {
    const date = value instanceof Date ? value : new Date(value);
    
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  } catch (error) {
    console.warn("No se pudo formatear la fecha larga:", error);
    return "";
  }
}

export function formatShortDate(value = new Date()) {
  try {
    const date = value instanceof Date ? value : new Date(value);
    
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  } catch (error) {
    console.warn("No se pudo formatear la fecha corta:", error);
    return "";
  }
}

export function formatTime(value = new Date()) {
  try {
    const date = value instanceof Date ? value : new Date(value);
    
    return new Intl.DateTimeFormat("es-CO", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  } catch (error) {
    console.warn("No se pudo formatear la hora:", error);
    return "";
  }
}

export function isToday(value) {
  if (!value) return false;
  
  try {
    const date = value instanceof Date ? value : new Date(value);
    const now = new Date();
    
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

/* ======================================
   PROFILE HELPERS
====================================== */

export function getInitials(name) {
  const cleanName = safeText(name);
  
  if (!cleanName) return "U";
  
  const parts = cleanName
    .split(/\s+/)
    .map((part) => safeText(part))
    .filter(Boolean);
  
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

/* ======================================
   INPUT NORMALIZATION
====================================== */

export function normalizeTagsInput(value) {
  return String(value ?? "")
    .split(",")
    .map((tag) => safeText(tag).toLowerCase())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index);
}

export function normalizeChecklistInput(value) {
  return String(value ?? "")
    .split("\n")
    .map((line) => safeText(line))
    .filter(Boolean);
}

export function normalizeSingleLine(value) {
  return safeText(value).replace(/\s+/g, " ");
}

export function normalizeMultiline(value) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/* ======================================
   UI STATE HELPERS
====================================== */

export function showElement(element) {
  if (!element) return;
  element.hidden = false;
}

export function hideElement(element) {
  if (!element) return;
  element.hidden = true;
}

export function toggleElement(element, shouldShow) {
  if (!element) return;
  element.hidden = !shouldShow;
}

export function setText(element, value) {
  if (!element) return;
  element.textContent = safeText(value);
}

export function setValue(element, value) {
  if (!element) return;
  element.value = value ?? "";
}

export function clearElement(element) {
  if (!element) return;
  element.innerHTML = "";
}

/* ======================================
   NOTE PRESENTATION HELPERS
====================================== */

export function getTypeLabel(type) {
  const labels = {
    quick: "Nota rápida",
    pending: "Pendiente",
    idea: "Idea",
    log: "Bitácora"
  };
  
  return labels[type] || "Nota";
}

export function getPriorityLabel(priority) {
  const labels = {
    alta: "Alta",
    media: "Media",
    baja: "Baja"
  };
  
  return labels[priority] || "Media";
}

export function getPriorityWeight(priority) {
  if (priority === "alta") return 3;
  if (priority === "media") return 2;
  return 1;
}

export function buildTagsHTML(tags = []) {
  if (!Array.isArray(tags) || !tags.length) return "";
  
  return tags
    .map((tag) => `<span class="note-tag">${escapeHTML(tag)}</span>`)
    .join("");
}

/* ======================================
   FORM HELPERS
====================================== */

export function formToObject(form) {
  if (!form) return {};
  
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

export function resetForm(form) {
  if (!form) return;
  form.reset();
}

export function focusElement(element) {
  if (!element || typeof element.focus !== "function") return;
  setTimeout(() => element.focus(), 0);
}

/* ======================================
   SAFE DOM QUERY
====================================== */

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}