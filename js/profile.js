// ======================================
// BITÁCORA MUSICALA
// js/profile.js
// Gestión de perfil local del usuario
// ======================================

import {
  getProfileStorage,
  saveProfileStorage,
  clearProfileStorage,
  clearAllStorage
} from "./storage.js";

/* ======================================
   HELPERS
====================================== */

function sanitizeText(value) {
  return String(value || "").trim();
}

function isValidName(name) {
  return typeof name === "string" && name.trim().length >= 2;
}

function normalizeTheme(theme) {
  const allowed = ["violeta", "azul", "magenta", "verde"];
  return allowed.includes(theme) ? theme : "violeta";
}

function buildProfile(raw = {}) {
  const now = new Date().toISOString();
  
  return {
    name: sanitizeText(raw.name),
    role: sanitizeText(raw.role),
    theme: normalizeTheme(raw.theme),
    createdAt: raw.createdAt || now,
    updatedAt: now
  };
}

/* ======================================
   GETTERS
====================================== */

export function getProfile() {
  const profile = getProfileStorage();
  
  if (!profile) return null;
  
  // Validación mínima para evitar datos corruptos
  if (!isValidName(profile.name)) {
    console.warn("Perfil inválido detectado, limpiando...");
    clearProfileStorage();
    return null;
  }
  
  return profile;
}

export function hasProfile() {
  return !!getProfile();
}

/* ======================================
   SETTERS
====================================== */

export function saveProfile(profileData) {
  if (!profileData || !isValidName(profileData.name)) {
    console.warn("Intento de guardar perfil inválido:", profileData);
    return false;
  }
  
  const existing = getProfileStorage();
  
  const profile = buildProfile({
    ...existing,
    ...profileData
  });
  
  return saveProfileStorage(profile);
}

export function updateProfile(partialData = {}) {
  const current = getProfile();
  
  if (!current) return false;
  
  return saveProfile({
    ...current,
    ...partialData
  });
}

/* ======================================
   CLEAR
====================================== */

export function clearProfile() {
  clearProfileStorage();
}

export function clearAllAppData() {
  clearAllStorage();
}

/* ======================================
   EXTRA UTILS
====================================== */

export function getProfileDisplayName() {
  const profile = getProfile();
  if (!profile) return "Usuario";
  
  return profile.name;
}

export function getProfileInitials() {
  const profile = getProfile();
  if (!profile || !profile.name) return "U";
  
  const parts = profile.name.split(" ").filter(Boolean);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (
    parts[0].charAt(0) +
    parts[1].charAt(0)
  ).toUpperCase();
}

export function getProfileTheme() {
  const profile = getProfile();
  return profile?.theme || "violeta";
}