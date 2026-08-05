"use client";

const PREFIX = "kasa_";

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + key);
}

export const AUTH_KEY = "auth";
export const DATA_KEY = "app_data";
