const COLORS = [
  { code: 'r', name: 'Rouge',            hex: '#ff4c4c' },
  { code: 'g', name: 'Vert',             hex: '#3ddc55' },
  { code: 'b', name: 'Bleu',             hex: '#4b9bff' },
  { code: 'y', name: 'Jaune',            hex: '#ffe24c' },
  { code: 'p', name: 'Violet',    hex: '#b36bff' },
  { code: 'q', name: 'Rose',             hex: '#ff6bcf' },
  { code: 'o', name: 'Orange',           hex: '#ff9a3d' },
  { code: 'c', name: 'Gris clair',       hex: '#cfd2da' },
  { code: 'm', name: 'Gris foncé',       hex: '#5a5d68' },
  { code: 'u', name: 'Noir',             hex: '#000000' },
  { code: 's', name: 'Couleur normale',  hex: null },
  { code: 'l', name: 'Noir', hex: '#1c1d22' },
  { code: 'd', name: 'Gris',             hex: '#8a8d99' },
];

const DEFAULT_COLOR = '#e8e8ec';
const colorMap = Object.fromEntries(COLORS.map(c => [c.code, c.hex]));

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const palette = document.getElementById('palette');
const resetColorBtn = document.getElementById('resetColorBtn');
const refTable = document.getElementById('refTable');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const copiedMsg = document.getElementById('copiedMsg');
const openRefBtn = document.getElementById('openRefBtn');
const closeRefBtn = document.getElementById('closeRefBtn');
const refModalOverlay = document.getElementById('refModalOverlay');

// Build palette buttons (grille de 6 couleurs par ligne, voir style.css).
// Le bouton "Réinitialiser" est un sibling flex à côté de la grille (voir index.html /
// .palette-row en CSS) : il s'étire automatiquement sur toute la hauteur des lignes de couleurs.
COLORS.filter(c => c.code !== 's').forEach(c => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'swatch';
  const dotColor = c.hex || DEFAULT_COLOR;
  btn.innerHTML = `
    <span class="dot" style="background:${dotColor}"></span>
    <span class="label">
      <span class="code">~${c.code}~</span>
      <span class="name">${c.name}</span>
    </span>
  `;
  btn.addEventListener('click', () => insertColor(c.code));
  palette.appendChild(btn);
});

resetColorBtn.addEventListener('click', () => insertColor('s'));

// Build reference table
COLORS.forEach(c => {
  const tr = document.createElement('tr');
  const dotColor = c.hex || DEFAULT_COLOR;
  tr.innerHTML = `
    <td><span class="dot" style="background:${dotColor}; display:inline-block;"></span></td>
    <td><code>~${c.code}~</code></td>
    <td>${c.name}</td>
  `;
  refTable.appendChild(tr);
});

function insertColor(code){
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  const selected = value.slice(start, end);
  const tag = `~${code}~`;
  let insertText;

  if (selected.length > 0 && code !== 's') {
    insertText = tag + selected + '~s~';
  } else {
    insertText = tag;
  }

  editor.value = value.slice(0, start) + insertText + value.slice(end);
  const cursorPos = start + insertText.length;
  editor.focus();
  editor.setSelectionRange(cursorPos, cursorPos);
  updatePreview();
}

function escapeHtml(str){
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function updatePreview(){
  const text = editor.value;
  const tokenRegex = /~([a-z])~/g;
  let lastIndex = 0;
  let currentColor = DEFAULT_COLOR;
  let html = '';
  let match;

  const flush = (chunk) => {
    if (!chunk) return;
    html += `<span style="color:${currentColor}">${escapeHtml(chunk)}</span>`;
  };

  while ((match = tokenRegex.exec(text)) !== null) {
    flush(text.slice(lastIndex, match.index));
    const code = match[1];
    if (code in colorMap) {
      currentColor = colorMap[code] || DEFAULT_COLOR;
    } else {
      flush(match[0]);
    }
    lastIndex = tokenRegex.lastIndex;
  }
  flush(text.slice(lastIndex));

  preview.innerHTML = html;
}

editor.addEventListener('input', updatePreview);

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(editor.value);
  } catch (e) {
    editor.select();
    document.execCommand('copy');
  }
  copiedMsg.classList.add('show');
  setTimeout(() => copiedMsg.classList.remove('show'), 1800);
});

clearBtn.addEventListener('click', () => {
  editor.value = '';
  editor.focus();
  updatePreview();
});

function openRefModal(){
  refModalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRefModal(){
  refModalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

openRefBtn.addEventListener('click', openRefModal);
closeRefBtn.addEventListener('click', closeRefModal);

// Ferme la modal en cliquant sur le fond, mais pas sur son contenu.
refModalOverlay.addEventListener('click', (e) => {
  if (e.target === refModalOverlay) closeRefModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && refModalOverlay.classList.contains('open')) closeRefModal();
});

updatePreview();
