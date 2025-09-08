const app = document.getElementById('app')!;

app.innerHTML = `
  <main style="font-family: system-ui, sans-serif; padding: 24px;">
    <h1>Task Master Editor</h1>
    <p>Renderer is running.</p>
    <p style="font-size: 12px; color: #666;">Secure defaults: nodeIntegration=false, contextIsolation=true, sandbox=true.</p>
    <div id="result" style="margin-top: 8px; color: #0a0;">&nbsp;</div>
  </main>
`;

const el = document.getElementById('result');
if (el) el.textContent = window.api ? 'Preload API OK' : 'No API available';
