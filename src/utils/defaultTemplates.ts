import { ProjectFile } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  files: ProjectFile[];
}

export const SAMPLE_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'calculator-converter',
    name: 'Kalkulator & Konverter Satuan',
    description: 'Aplikasi web interaktif dengan tema dark modern, riwayat perhitungan, dan konversi suhu/panjang.',
    badge: 'HTML + CSS + JS',
    files: [
      {
        path: 'index.html',
        name: 'index.html',
        isBinary: false,
        size: 2400,
        mimeType: 'text/html',
        content: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kalkulator Studio Modern</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-card">
    <header class="app-header">
      <div class="brand">
        <span class="icon">⚡</span>
        <h1>Kalkulator Pro</h1>
      </div>
      <div class="tabs">
        <button class="tab active" data-tab="calc">Kalkulator</button>
        <button class="tab" data-tab="conv">Konverter</button>
      </div>
    </header>

    <!-- Panel Kalkulator -->
    <div id="panel-calc" class="tab-panel active">
      <div class="display">
        <div class="history" id="calc-history">0</div>
        <div class="result" id="calc-result">0</div>
      </div>
      <div class="keypad">
        <button class="btn btn-action" data-action="clear">C</button>
        <button class="btn btn-action" data-action="delete">⌫</button>
        <button class="btn btn-action" data-action="%">%</button>
        <button class="btn btn-op" data-action="/">÷</button>

        <button class="btn" data-num="7">7</button>
        <button class="btn" data-num="8">8</button>
        <button class="btn" data-num="9">9</button>
        <button class="btn btn-op" data-action="*">×</button>

        <button class="btn" data-num="4">4</button>
        <button class="btn" data-num="5">5</button>
        <button class="btn" data-num="6">6</button>
        <button class="btn btn-op" data-action="-">−</button>

        <button class="btn" data-num="1">1</button>
        <button class="btn" data-num="2">2</button>
        <button class="btn" data-num="3">3</button>
        <button class="btn btn-op" data-action="+">+</button>

        <button class="btn" data-action="negate">±</button>
        <button class="btn" data-num="0">0</button>
        <button class="btn" data-action=".">.</button>
        <button class="btn btn-equals" data-action="=">=</button>
      </div>
    </div>

    <!-- Panel Konverter -->
    <div id="panel-conv" class="tab-panel">
      <div class="converter-box">
        <label>Konversi Suhu (°C ke °F / K)</label>
        <div class="input-row">
          <input type="number" id="temp-input" value="25" placeholder="Celcius">
          <span>°C</span>
        </div>
        <div class="conv-results">
          <div class="res-item">
            <span class="label">Fahrenheit</span>
            <span class="val" id="temp-f">77.0 °F</span>
          </div>
          <div class="res-item">
            <span class="label">Kelvin</span>
            <span class="val" id="temp-k">298.15 K</span>
          </div>
        </div>
      </div>
    </div>

    <footer class="app-footer">
      <span>Siap diedit langsung di ZipStudio</span>
    </footer>
  </div>

  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        path: 'style.css',
        name: 'style.css',
        isBinary: false,
        size: 3200,
        mimeType: 'text/css',
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

body {
  background: #0f172a;
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.app-card {
  width: 100%;
  max-width: 360px;
  background: #1e293b;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid #334155;
  overflow: hidden;
}

.app-header {
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand h1 {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.tabs {
  display: flex;
  background: #0f172a;
  padding: 2px;
  border-radius: 8px;
}

.tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab.active {
  background: #3b82f6;
  color: #ffffff;
  font-weight: 500;
}

.tab-panel {
  display: none;
  padding: 16px;
}

.tab-panel.active {
  display: block;
}

.display {
  background: #0f172a;
  border-radius: 12px;
  padding: 16px;
  text-align: right;
  margin-bottom: 16px;
  border: 1px solid #334155;
}

.history {
  color: #64748b;
  font-size: 13px;
  min-height: 20px;
  word-break: break-all;
}

.result {
  color: #f8fafc;
  font-size: 32px;
  font-weight: 700;
  margin-top: 4px;
  overflow-x: auto;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.btn {
  background: #334155;
  border: none;
  color: #f1f5f9;
  font-size: 18px;
  padding: 14px 0;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, transform 0.05s;
}

.btn:active {
  transform: scale(0.96);
}

.btn:hover {
  background: #475569;
}

.btn-action {
  background: #475569;
  color: #cbd5e1;
}

.btn-op {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}

.btn-op:hover {
  background: #1d4ed8;
}

.btn-equals {
  background: #10b981;
  color: #fff;
  font-weight: 600;
}

.btn-equals:hover {
  background: #059669;
}

.converter-box label {
  font-size: 12px;
  color: #94a3b8;
  display: block;
  margin-bottom: 8px;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.input-row input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  font-size: 18px;
  padding: 10px 12px;
  border-radius: 8px;
  outline: none;
}

.conv-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.res-item {
  display: flex;
  justify-content: space-between;
  background: #0f172a;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.res-item .label {
  color: #94a3b8;
  font-size: 13px;
}

.res-item .val {
  font-weight: 600;
  color: #38bdf8;
}

.app-footer {
  text-align: center;
  padding: 10px 16px;
  border-top: 1px solid #334155;
  font-size: 11px;
  color: #64748b;
}`,
      },
      {
        path: 'script.js',
        name: 'script.js',
        isBinary: false,
        size: 3400,
        mimeType: 'application/javascript',
        content: `// Inisialisasi Kalkulator
document.addEventListener('DOMContentLoaded', () => {
  console.log('Kalkulator Pro siap dijalankan!');

  const historyEl = document.getElementById('calc-history');
  const resultEl = document.getElementById('calc-result');

  let currentInput = '0';
  let previousInput = '';
  let operation = null;
  let resetNext = false;

  // Tombol angka & operasi
  const buttons = document.querySelectorAll('.keypad .btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.dataset.num;
      const action = btn.dataset.action;

      if (num !== undefined) {
        handleNumber(num);
      } else if (action) {
        handleAction(action);
      }
      updateDisplay();
    });
  });

  function handleNumber(num) {
    if (currentInput === '0' || resetNext) {
      currentInput = num;
      resetNext = false;
    } else {
      currentInput += num;
    }
  }

  function handleAction(act) {
    switch (act) {
      case 'clear':
        currentInput = '0';
        previousInput = '';
        operation = null;
        break;
      case 'delete':
        if (currentInput.length > 1) {
          currentInput = currentInput.slice(0, -1);
        } else {
          currentInput = '0';
        }
        break;
      case '.':
        if (!currentInput.includes('.')) {
          currentInput += '.';
        }
        break;
      case 'negate':
        currentInput = String(-parseFloat(currentInput));
        break;
      case '%':
        currentInput = String(parseFloat(currentInput) / 100);
        break;
      case '+':
      case '-':
      case '*':
      case '/':
        if (operation !== null && !resetNext) {
          compute();
        }
        operation = act;
        previousInput = currentInput;
        resetNext = true;
        break;
      case '=':
        if (operation !== null) {
          compute();
          operation = null;
          previousInput = '';
          resetNext = true;
        }
        break;
    }
  }

  function compute() {
    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput);
    if (isNaN(prev) || isNaN(curr)) return;

    let res = 0;
    switch (operation) {
      case '+': res = prev + curr; break;
      case '-': res = prev - curr; break;
      case '*': res = prev * curr; break;
      case '/': res = curr !== 0 ? prev / curr : 'Error'; break;
    }

    currentInput = typeof res === 'number' ? Math.round(res * 100000000) / 100000000 : res;
    console.log(\`Hasil perhitungan: \${prev} \${operation} \${curr} = \${res}\`);
  }

  function updateDisplay() {
    resultEl.textContent = currentInput;
    if (operation && previousInput) {
      historyEl.textContent = \`\${previousInput} \${operation}\`;
    } else {
      historyEl.textContent = '';
    }
  }

  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + target).classList.add('active');
    });
  });

  // Konverter Suhu
  const tempInput = document.getElementById('temp-input');
  const tempF = document.getElementById('temp-f');
  const tempK = document.getElementById('temp-k');

  function updateConverter() {
    const c = parseFloat(tempInput.value) || 0;
    const f = (c * 9/5) + 32;
    const k = c + 273.15;
    tempF.textContent = f.toFixed(1) + ' °F';
    tempK.textContent = k.toFixed(2) + ' K';
  }

  if (tempInput) {
    tempInput.addEventListener('input', updateConverter);
    updateConverter();
  }
});`,
      },
      {
        path: 'README.md',
        name: 'README.md',
        isBinary: false,
        size: 500,
        mimeType: 'text/markdown',
        content: `# Kalkulator & Konverter Pro

Contoh proyek web siap edit di **ZipStudio**.

## Fitur
- Kalkulator standar (+, -, ×, ÷, %, negate)
- Tab konversi satuan suhu (°C, °F, K)
- Desain dark mode responsif

## Cara Edit
1. Klik berkas di sidebar untuk membuka kode di editor.
2. Lakukan perubahan (misal: ganti warna di \`style.css\` atau tambahkan fitur di \`script.js\`).
3. Tekan **Ctrl + S** (atau tombol Simpan) untuk melihat perubahan seketika di panel Pratinjau.
4. Klik **Unduh ZIP** untuk menyimpan proyek ke komputermu!
`,
      }
    ],
  },
  {
    id: 'interactive-todo',
    name: 'Aplikasi Catatan & Tugas (TaskBoard)',
    description: 'Aplikasi Todo list modern dengan kategori, filter pencarian, dan penyimpanan LocalStorage.',
    badge: 'Vanilla JS App',
    files: [
      {
        path: 'index.html',
        name: 'index.html',
        isBinary: false,
        size: 2600,
        mimeType: 'text/html',
        content: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskBoard Modern</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">
        <span class="icon">📝</span>
        <h1>TaskBoard</h1>
      </div>
      <p class="subtitle">Kelola tugas harianmu dengan rapi</p>
    </header>

    <div class="add-box">
      <input type="text" id="task-input" placeholder="Tambahkan tugas baru..." />
      <select id="priority-select">
        <option value="normal">Normal</option>
        <option value="high">Penting 🔥</option>
        <option value="low">Santai ☕</option>
      </select>
      <button id="add-btn">Tambah</button>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <input type="text" id="search-input" placeholder="Cari tugas..." />
      </div>
      <div class="filter-actions">
        <button class="filter-chip active" data-filter="all">Semua</button>
        <button class="filter-chip" data-filter="active">Belum</button>
        <button class="filter-chip" data-filter="completed">Selesai</button>
      </div>
    </div>

    <ul id="task-list" class="task-list">
      <!-- Item tugas akan dirender via JS -->
    </ul>

    <footer class="footer">
      <span id="counter">0 tugas tersisa</span>
      <button id="clear-done-btn">Hapus yang selesai</button>
    </footer>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        path: 'style.css',
        name: 'style.css',
        isBinary: false,
        size: 2900,
        mimeType: 'text/css',
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
  background: #0f172a;
  color: #f1f5f9;
  min-height: 100vh;
  padding: 30px 16px;
  display: flex;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 520px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.header {
  margin-bottom: 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo h1 {
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 4px;
}

.add-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.add-box input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  outline: none;
}

.add-box select {
  background: #0f172a;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 10px;
  border-radius: 8px;
  outline: none;
}

.add-box button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-box button:hover {
  background: #2563eb;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #334155;
}

.search-box input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.filter-actions {
  display: flex;
  gap: 6px;
}

.filter-chip {
  background: #0f172a;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.filter-chip.active {
  background: #334155;
  color: #fff;
  border-color: #64748b;
}

.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  transition: all 0.2s;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #64748b;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.task-text {
  font-size: 14px;
}

.task-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.tag-high { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.tag-normal { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.tag-low { background: rgba(34, 197, 94, 0.2); color: #4ade80; }

.delete-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
}

.delete-btn:hover {
  color: #ef4444;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  padding-top: 8px;
}

.footer button {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.footer button:hover {
  color: #f1f5f9;
}`,
      },
      {
        path: 'app.js',
        name: 'app.js',
        isBinary: false,
        size: 3200,
        mimeType: 'application/javascript',
        content: `// State Aplikasi
let tasks = [
  { id: 1, text: 'Ekstrak dan tinjau file zip aplikasi', completed: true, priority: 'high' },
  { id: 2, text: 'Edit kode HTML, CSS, dan Javascript', completed: false, priority: 'normal' },
  { id: 3, text: 'Uji tampilan di live preview responsif', completed: false, priority: 'high' },
  { id: 4, text: 'Unduh hasil edit dalam format ZIP', completed: false, priority: 'low' },
];

let currentFilter = 'all';
let searchQuery = '';

const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const addBtn = document.getElementById('add-btn');
const searchInput = document.getElementById('search-input');
const taskList = document.getElementById('task-list');
const counterEl = document.getElementById('counter');
const clearDoneBtn = document.getElementById('clear-done-btn');
const filterChips = document.querySelectorAll('.filter-chip');

function renderTasks() {
  taskList.innerHTML = '';

  const filtered = tasks.filter(t => {
    if (currentFilter === 'active' && t.completed) return false;
    if (currentFilter === 'completed' && !t.completed) return false;
    if (searchQuery && !t.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = \`task-item \${task.completed ? 'completed' : ''}\`;

    li.innerHTML = \`
      <div class="task-left">
        <input type="checkbox" \${task.completed ? 'checked' : ''} data-id="\${task.id}" class="check-box" />
        <span class="task-text">\${escapeHtml(task.text)}</span>
        <span class="task-tag tag-\${task.priority}">\${task.priority}</span>
      </div>
      <button class="delete-btn" data-del="\${task.id}" title="Hapus">✕</button>
    \`;

    taskList.appendChild(li);
  });

  const activeCount = tasks.filter(t => !t.completed).length;
  counterEl.textContent = \`\${activeCount} tugas tersisa\`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Tambah tugas baru
addBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text,
    completed: false,
    priority: prioritySelect.value
  };

  tasks.unshift(newTask);
  taskInput.value = '';
  renderTasks();
  console.log('Tugas baru ditambahkan:', newTask);
});

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// Toggle dan Hapus
taskList.addEventListener('click', (e) => {
  if (e.target.classList.contains('check-box')) {
    const id = Number(e.target.dataset.id);
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = e.target.checked;
      renderTasks();
    }
  }

  if (e.target.dataset.del) {
    const id = Number(e.target.dataset.del);
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
  }
});

// Search & Filter
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTasks();
});

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderTasks();
  });
});

clearDoneBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  renderTasks();
});

renderTasks();`,
      }
    ]
  }
];
