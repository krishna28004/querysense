"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, MousePointer2, Sun, Type } from "lucide-react";
import { useTheme } from "next-themes";
import Nav from "@/components/workbench/Nav";
import {
  CURSOR_SIZE_STORAGE_KEY,
  DEFAULT_CURSOR_SIZE,
  MAX_CURSOR_SIZE,
  MIN_CURSOR_SIZE,
  getStoredCursorSize,
} from "@/components/workbench/VelocityCursor";

const EDITOR_SIZE_KEY = "querysense-editor-font-size";
const EDITOR_SIZE_EVENT = "querysense-editor-font-size-change";
const CURSOR_SIZE_EVENT = "querysense-cursor-size-change";
const DEFAULT_EDITOR_SIZE = 14;

function getEditorSize() {
  if (typeof window === "undefined") return DEFAULT_EDITOR_SIZE;
  try {
    const value = Number(window.localStorage.getItem(EDITOR_SIZE_KEY));
    return Number.isFinite(value) && value >= 12 && value <= 20 ? value : DEFAULT_EDITOR_SIZE;
  } catch {
    return DEFAULT_EDITOR_SIZE;
  }
}

function subscribe(eventName: string, key: string, onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) onChange();
  };
  window.addEventListener(eventName, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventName, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setSavedSize(key: string, eventName: string, value: number, cssVariable: string) {
  document.documentElement.style.setProperty(cssVariable, `${value}px`);
  if (key === CURSOR_SIZE_STORAGE_KEY) {
    document.querySelector<HTMLElement>(".velocity-cursor")?.style.setProperty(cssVariable, `${value}px`);
  }
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // The value still applies for this session when persistent storage is unavailable.
  }
  window.dispatchEvent(new Event(eventName));
}

export default function SettingsPage() {
  const pointerSize = useSyncExternalStore(
    (onChange) => subscribe(CURSOR_SIZE_EVENT, CURSOR_SIZE_STORAGE_KEY, onChange),
    getStoredCursorSize,
    () => DEFAULT_CURSOR_SIZE,
  );
  const editorSize = useSyncExternalStore(
    (onChange) => subscribe(EDITOR_SIZE_EVENT, EDITOR_SIZE_KEY, onChange),
    getEditorSize,
    () => DEFAULT_EDITOR_SIZE,
  );
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.documentElement.style.setProperty("--query-editor-font-size", `${getEditorSize()}px`);
  }, []);

  return <div className="app-shell">
    <Nav />
    <main className="simple-page settings-page">
      <span className="eyebrow accent-line">SETTINGS / LOCAL PREFERENCES</span>
      <h1>Make the lab yours.</h1>
      <p className="lede">A few controls for a more comfortable query workflow.</p>

      <div className="settings-grid">
        <section className="preference-card pointer-setting" aria-labelledby="pointer-title">
          <div className="preference-card-top">
            <span className="preference-icon"><MousePointer2 size={19} /></span>
            <span className="preference-index">01 / POINTER</span>
            <output className="preference-value" htmlFor="pointer-size">{pointerSize}<small>px</small></output>
          </div>
          <label className="preference-title" id="pointer-title" htmlFor="pointer-size">Cursor size</label>
          <input
            id="pointer-size"
            className="preference-slider"
            type="range"
            min={MIN_CURSOR_SIZE}
            max={MAX_CURSOR_SIZE}
            step={1}
            value={pointerSize}
            onChange={(event) => setSavedSize(CURSOR_SIZE_STORAGE_KEY, CURSOR_SIZE_EVENT, Number(event.currentTarget.value), "--cursor-size")}
            aria-label="Cursor size"
          />
          <div className="preference-range"><span>SMALL</span><span>LARGE</span></div>
          <div className="pointer-size-steps" aria-hidden="true">
            {[24, 31, 38, 45, 52].map((size) => <span key={size} style={{ width: size / 3, height: size / 3 }} />)}
          </div>
        </section>

        <section className="preference-card theme-setting" aria-labelledby="theme-title">
          <div className="preference-card-top">
            <span className="preference-icon"><Sun size={19} /></span>
            <span className="preference-index">02 / APPEARANCE</span>
          </div>
          <h2 className="preference-title" id="theme-title">Color theme</h2>
          <div className="theme-options" role="group" aria-label="Color theme">
            {[{ id: "light", label: "Light", Icon: Sun }, { id: "dark", label: "Dark", Icon: Moon }, { id: "system", label: "System", Icon: Monitor }].map(({ id, label, Icon }) =>
              <button key={id} type="button" className={`theme-option${theme === id ? " is-selected" : ""}`} aria-pressed={theme === id} onClick={() => setTheme(id)}>
                <Icon size={16} /><span>{label}</span>
              </button>,
            )}
          </div>
        </section>

        <section className="preference-card editor-setting" aria-labelledby="editor-size-title">
          <div className="preference-card-top">
            <span className="preference-icon"><Type size={19} /></span>
            <span className="preference-index">03 / EDITOR</span>
            <output className="preference-value" htmlFor="editor-size">{editorSize}<small>px</small></output>
          </div>
          <label className="preference-title" id="editor-size-title" htmlFor="editor-size">SQL text size</label>
          <input
            id="editor-size"
            className="preference-slider"
            type="range"
            min={12}
            max={20}
            step={1}
            value={editorSize}
            onChange={(event) => setSavedSize(EDITOR_SIZE_KEY, EDITOR_SIZE_EVENT, Number(event.currentTarget.value), "--query-editor-font-size")}
            aria-label="SQL editor text size"
          />
          <div className="preference-range"><span>COMPACT</span><span>COMFORTABLE</span></div>
          <div className="editor-size-sample" aria-hidden="true"><span>SELECT</span> id, created_at <i>FROM</i> orders;</div>
        </section>
      </div>

      <p className="settings-local-note"><span /> Preferences stay in this browser.</p>
    </main>
    <footer className="site-footer"><span>QUERY<span>SENSE</span> / LAB</span><p>Local workspace preferences</p><span>© {new Date().getFullYear()}</span></footer>
  </div>;
}
