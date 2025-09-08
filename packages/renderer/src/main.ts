import { store } from './redux/store.js';
import { initSettings, updateMRU } from './redux/settingsSlice.js';
import { loadFromPath } from './redux/dataSlice.js';

const app = document.getElementById('app')!;

app.innerHTML = `
  <main style="font-family: system-ui, sans-serif; padding: 24px;">
    <h1>Task Master Editor</h1>
    <p>Renderer is running.</p>
    <p style="font-size: 12px; color: #666;">Secure defaults: nodeIntegration=false, contextIsolation=true, sandbox=true.</p>
    <div id="result" style="margin-top: 8px; color: #0a0;">&nbsp;</div>
    <div id="state" style="margin-top: 8px; font-size: 12px; color: #555;">Loading…</div>
  </main>
`;

const el = document.getElementById('result');
if (el) el.textContent = window.api ? 'Preload API OK' : 'No API available';

const stateEl = document.getElementById('state');
function renderState() {
  const s = store.getState();
  const tasks = s.data.tasksFile?.master.tasks.length ?? 0;
  const dirty = s.data.dirty.file ? 'yes' : 'no';
  const mru = s.settings.data.recentPaths.length;
  if (stateEl) stateEl.textContent = `tasks: ${tasks}, dirty: ${dirty}, mru: ${mru}`;
}

store.subscribe(renderState);
void store.dispatch(initSettings()).then(() => {
  renderState();
  // Optionally autoload last file if preferences set (default true)
  const st = store.getState();
  const prefs = st.settings.data.preferences as Record<string, unknown> | undefined;
  const mruEnabled = prefs?.mruEnabled ?? true;
  const last = st.settings.data.recentPaths[0];
  if (mruEnabled && typeof last === 'string' && last.length > 0) {
    void store.dispatch(loadFromPath(last)).then(() => {
      renderState();
      if (last) void store.dispatch(updateMRU(last));
    });
  }
});
