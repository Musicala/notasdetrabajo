// ======================================
// BITÁCORA MUSICALA
// js/storage.js
// Capa base de localStorage
// ======================================

/* ======================================
   CONFIG
====================================== */

const STORAGE_PREFIX = "musicala_notes";
const STORAGE_VERSION = "v1";

const KEYS = {
  profile: `${STORAGE_PREFIX}_profile_${STORAGE_VERSION}`,
  notes: `${STORAGE_PREFIX}_notes_${STORAGE_VERSION}`,
  settings: `${STORAGE_PREFIX}_settings_${STORAGE_VERSION}`
};

/* ======================================
   CORE HELPERS
====================================== */

function isStorageAvailable() {
  try {
    const testKey = "__test_storage__";
    localStorage.setItem(testKey, "ok");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn("localStorage no disponible:", error);
    return false;
  }
}

function safeParse(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (error) {
    console.warn("Error parseando JSON:", error);
    return fallback;
  }
}

function safeStringify(value, fallback = "") {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn("Error serializando JSON:", error);
    return fallback;
  }
}

function read(key, fallback = null) {
  if (!isStorageAvailable()) return fallback;
  
  const raw = localStorage.getItem(key);
  return safeParse(raw, fallback);
}

function write(key, value) {
  if (!isStorageAvailable()) return false;
  
  try {
    localStorage.setItem(key, safeStringify(value));
    return true;
  } catch (error) {
    console.error("Error guardando en localStorage:", error);
    return false;
  }
}

function remove(key) {
  if (!isStorageAvailable()) return;
  localStorage.removeItem(key);
}

/* ======================================
   PROFILE
====================================== */

export function getProfileStorage() {
  return read(KEYS.profile, null);
}

export function saveProfileStorage(profile) {
  return write(KEYS.profile, profile);
}

export function clearProfileStorage() {
  remove(KEYS.profile);
}

/* ======================================
   NOTES
====================================== */

export function getNotesStorage() {
  return read(KEYS.notes, []);
}

export function saveNotesStorage(notes) {
  return write(KEYS.notes, notes);
}

export function clearNotesStorage() {
  remove(KEYS.notes);
}

/* ======================================
   SETTINGS
====================================== */

export function getSettingsStorage() {
  return read(KEYS.settings, {});
}

export function saveSettingsStorage(settings) {
  return write(KEYS.settings, settings);
}

export function clearSettingsStorage() {
  remove(KEYS.settings);
}

/* ======================================
   GLOBAL CONTROL
====================================== */

export function clearAllStorage() {
  Object.values(KEYS).forEach(remove);
}

export function exportAllData() {
  return {
    profile: getProfileStorage(),
    notes: getNotesStorage(),
    settings: getSettingsStorage(),
    exportedAt: new Date().toISOString()
  };
}

export function importAllData(data) {
  if (!data || typeof data !== "object") return false;
  
  try {
    if (data.profile) saveProfileStorage(data.profile);
    if (data.notes) saveNotesStorage(data.notes);
    if (data.settings) saveSettingsStorage(data.settings);
    
    return true;
  } catch (error) {
    console.error("Error importando datos:", error);
    return false;
  }
}

/* ======================================
   DEBUG (opcional)
====================================== */

export function debugStorage() {
  return {
    keys: KEYS,
    profile: getProfileStorage(),
    notes: getNotesStorage(),
    settings: getSettingsStorage()
  };
}