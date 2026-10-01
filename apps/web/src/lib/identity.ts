"use client";

import * as React from "react";

export type Identity = { email: string; username: string };

const STORAGE_KEY = "ore.identity";
const listeners = new Set<() => void>();

let cached: Identity | null = null;
let hydrated = false;

function read(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (typeof parsed.email === "string" && typeof parsed.username === "string") {
      return { email: parsed.email, username: parsed.username };
    }
    return null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getIdentity(): Identity | null {
  if (!hydrated) {
    cached = read();
    hydrated = true;
  }
  return cached;
}

export function setIdentity(identity: Identity) {
  cached = identity;
  hydrated = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  }
  emit();
}

export function clearIdentity() {
  cached = null;
  hydrated = true;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIdentity(): Identity | null {
  return React.useSyncExternalStore(subscribe, getIdentity, () => null);
}
