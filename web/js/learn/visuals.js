// Original SVG/emoji illustrations for the learning activities. No images to download.

export const COLOURS = {
  red: '#e63946', blue: '#277dff', yellow: '#ffd23f', green: '#2bb24c', orange: '#ff8c1a',
  purple: '#8e44ec', pink: '#ff6fb5', brown: '#8b5a2b', black: '#222222', white: '#ffffff', grey: '#9aa0a6',
};

const svg = (w, h, body, cls = '') => `<svg class="vis ${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

// ---------------------------------------------------------------- Buddy (our mascot)
export function buddy(mood = 'happy') {
  const eyes = mood === 'sleep'
    ? '<path d="M180 232q20 14 40 0M292 232q20 14 40 0" stroke="#24203a" stroke-width="12" fill="none" stroke-linecap="round"/>'
    : '<circle cx="200" cy="230" r="26" fill="#24203a"/><circle cx="312" cy="230" r="26" fill="#24203a"/><circle cx="209" cy="221" r="9" fill="#fff"/><circle cx="321" cy="221" r="9" fill="#fff"/>';
  const mouth = mood === 'sleep'
    ? '<ellipse cx="256" cy="300" rx="16" ry="10" fill="#24203a"/>'
    : mood === 'cheer'
      ? '<path d="M206 286q50 60 100 0z" fill="#24203a"/><path d="M226 300q30 22 60 0" fill="#ff6f91"/>'
      : mood === 'think'
        ? '<path d="M226 298h60" stroke="#24203a" stroke-width="14" stroke-linecap="round"/>'
        : '<path d="M214 290c22 30 62 30 84 0" stroke="#24203a" stroke-width="16" stroke-linecap="round" fill="none"/>';
  const extra = mood === 'sleep'
    ? '<text x="380" y="140" font-size="70" font-weight="800" fill="#9a80ff" font-family="sans-serif">z</text><text x="430" y="90" font-size="48" font-weight="800" fill="#9a80ff" font-family="sans-serif">z</text>'
    : mood === 'cheer'
      ? '<path d="M70 200l-40-60M442 200l40-60" stroke="#ffd23f" stroke-width="16" stroke-linecap="round"/><circle cx="60" cy="120" r="14" fill="#ff6fb5"/><circle cx="455" cy="120" r="14" fill="#4cc9f0"/>'
      : '';
  return svg(512, 512, `
    ${extra}
    <path d="M256 92c-98 0-170 62-170 146 0 47 23 88 60 115l-18 66c-2 8 6 14 13 10l78-42c12 2 24 3 37 3 98 0 170-62 170-152S354 92 256 92z" fill="#fff" stroke="#7c5cff" stroke-width="10"/>
    ${eyes}
    <circle cx="170" cy="282" r="18" fill="#ff8fc4" opacity=".8"/><circle cx="342" cy="282" r="18" fill="#ff8fc4" opacity=".8"/>
    ${mouth}`, `buddy buddy-${mood}`);
}

// ---------------------------------------------------------------- 2D shapes
export const SHAPES_2D = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'oval', 'diamond', 'pentagon', 'hexagon'];

function polygon(n, r = 80, cx = 100, cy = 100, rot = -90) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function shape2d(name, colour = 'blue') {
  const fill = COLOURS[colour] || colour;
  const st = `fill="${fill}" stroke="#24203a" stroke-width="5" stroke-linejoin="round"`;
  const bodies = {
    circle: `<circle cx="100" cy="100" r="78" ${st}/>`,
    square: `<rect x="25" y="25" width="150" height="150" rx="6" ${st}/>`,
    triangle: `<polygon points="100,20 182,170 18,170" ${st}/>`,
    rectangle: `<rect x="10" y="50" width="180" height="100" rx="6" ${st}/>`,
    star: `<polygon points="100,12 124,72 188,76 138,116 156,180 100,144 44,180 62,116 12,76 76,72" ${st}/>`,
    heart: `<path d="M100 178C40 130 14 100 14 66c0-26 20-46 46-46 18 0 32 10 40 24 8-14 22-24 40-24 26 0 46 20 46 46 0 34-26 64-86 112z" ${st}/>`,
    oval: `<ellipse cx="100" cy="100" rx="88" ry="58" ${st}/>`,
    diamond: `<polygon points="100,12 176,100 100,188 24,100" ${st}/>`,
    pentagon: `<polygon points="${polygon(5)}" ${st}/>`,
    hexagon: `<polygon points="${polygon(6, 82, 100, 100, 0)}" ${st}/>`,
  };
  return svg(200, 200, bodies[name] || bodies.circle, 'shape');
}

// ---------------------------------------------------------------- 3D shapes
export const SHAPES_3D = ['cube', 'cuboid', 'sphere', 'cylinder', 'cone', 'pyramid'];

export function shape3d(name, colour = 'orange') {
  const c = COLOURS[colour] || colour;
  const s = 'stroke="#24203a" stroke-width="4" stroke-linejoin="round"';
  const bodies = {
    cube: `<polygon points="50,70 110,40 170,70 110,100" fill="${c}" ${s} opacity=".75"/><polygon points="50,70 110,100 110,170 50,140" fill="${c}" ${s}/><polygon points="110,100 170,70 170,140 110,170" fill="${c}" ${s} opacity=".85"/>`,
    cuboid: `<polygon points="20,80 70,55 190,55 140,80" fill="${c}" ${s} opacity=".75"/><polygon points="20,80 140,80 140,150 20,150" fill="${c}" ${s}/><polygon points="140,80 190,55 190,125 140,150" fill="${c}" ${s} opacity=".85"/>`,
    sphere: `<circle cx="100" cy="100" r="75" fill="${c}" ${s}/><ellipse cx="100" cy="100" rx="75" ry="22" fill="none" stroke="#24203a" stroke-width="3" stroke-dasharray="8 6"/><circle cx="72" cy="70" r="16" fill="#fff" opacity=".5"/>`,
    cylinder: `<path d="M45 50v100a55 18 0 0 0 110 0V50" fill="${c}" ${s}/><ellipse cx="100" cy="50" rx="55" ry="18" fill="${c}" ${s} opacity=".8"/>`,
    cone: `<path d="M100 20L40 150a60 20 0 0 0 120 0z" fill="${c}" ${s}/><ellipse cx="100" cy="150" rx="60" ry="20" fill="none" stroke="#24203a" stroke-width="3" stroke-dasharray="8 6"/>`,
    pyramid: `<polygon points="100,20 30,150 120,175" fill="${c}" ${s}/><polygon points="100,20 120,175 175,140" fill="${c}" ${s} opacity=".8"/>`,
  };
  return svg(200, 200, bodies[name] || bodies.cube, 'shape');
}

// ---------------------------------------------------------------- colour blob
export function blob(colour) {
  const fill = COLOURS[colour] || colour;
  return svg(200, 200, `<path d="M100 18c40 0 78 22 82 66 4 40-20 92-78 98-52 6-86-26-86-76 0-52 34-88 82-88z" fill="${fill}" stroke="#24203a" stroke-width="5"/>`, 'blob');
}

// ---------------------------------------------------------------- groups of things
export function group(emoji, n, { countable = false, size = '' } = {}) {
  const items = Array.from({ length: n }, (_, i) => `<span class="g-item${countable ? ' countable' : ''}" ${countable ? `data-count="${i}"` : ''}>${emoji}</span>`).join('');
  return `<div class="group ${size} ${n > 10 ? 'many' : ''}">${items}</div>`;
}

export function dots(n) {
  return `<div class="dots">${Array.from({ length: n }, () => '<span></span>').join('')}</div>`;
}

export function tenFrame(n) {
  const frames = Math.ceil(Math.max(n, 1) / 10);
  let out = '';
  for (let f = 0; f < frames; f++) {
    const filled = Math.min(10, n - f * 10);
    out += `<div class="ten-frame">${Array.from({ length: 10 }, (_, i) => `<span class="${i < filled ? 'on' : ''}"></span>`).join('')}</div>`;
  }
  return `<div class="ten-frames">${out}</div>`;
}

/** Base-ten blocks: tens as rods, ones as cubes. */
export function baseTen(n) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `<div class="base-ten">${'<span class="rod"></span>'.repeat(tens)}<span class="ones">${'<span class="cube"></span>'.repeat(ones)}</span></div>`;
}

// ---------------------------------------------------------------- clock
export function clock(h, m = 0) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const x = 100 + 72 * Math.sin(a);
    const y = 100 - 72 * Math.cos(a);
    return `<text x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}" text-anchor="middle" font-size="20" font-weight="800" font-family="sans-serif" fill="#24203a">${i === 0 ? 12 : i}</text>`;
  }).join('');
  const minA = m * 6;
  const hourA = (h % 12) * 30 + m * 0.5;
  return svg(200, 200, `
    <circle cx="100" cy="100" r="94" fill="#fff" stroke="#7c5cff" stroke-width="8"/>
    ${ticks}
    <line x1="100" y1="100" x2="100" y2="40" stroke="#277dff" stroke-width="6" stroke-linecap="round" transform="rotate(${minA} 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="58" stroke="#e63946" stroke-width="9" stroke-linecap="round" transform="rotate(${hourA} 100 100)"/>
    <circle cx="100" cy="100" r="7" fill="#24203a"/>`, 'clock');
}

// ---------------------------------------------------------------- UAE money (AED)
// value in fils: 25, 50, 100 (1 dirham coin), 500 / 1000 / 2000 (notes)
export function money(fils) {
  if (fils >= 500) {
    const aed = fils / 100;
    const col = { 5: '#a86b3c', 10: '#2f9e5b', 20: '#2f6fb5', 50: '#6b4ca5' }[aed] || '#2f9e5b';
    return svg(240, 120, `<rect x="4" y="4" width="232" height="112" rx="12" fill="${col}" stroke="#24203a" stroke-width="4"/><rect x="18" y="18" width="204" height="84" rx="8" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/><circle cx="70" cy="60" r="26" fill="#fff" opacity=".35"/><text x="160" y="72" text-anchor="middle" font-size="40" font-weight="900" fill="#fff" font-family="sans-serif">${aed}</text><text x="160" y="98" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="sans-serif">DIRHAMS</text>`, 'note');
  }
  const r = fils === 100 ? 56 : fils === 50 ? 50 : 42;
  const shape = fils === 50
    ? `<polygon points="${polygon(7, r, 60, 60)}" fill="#d9dde3" stroke="#6b7280" stroke-width="4"/>`
    : `<circle cx="60" cy="60" r="${r}" fill="${fils === 100 ? '#e6e9ee' : '#d4c9a8'}" stroke="#6b7280" stroke-width="4"/>`;
  const label = fils === 100 ? '1' : String(fils);
  const unit = fils === 100 ? 'DIRHAM' : 'FILS';
  return svg(120, 120, `${shape}<text x="60" y="66" text-anchor="middle" font-size="${fils === 100 ? 38 : 30}" font-weight="900" fill="#374151" font-family="sans-serif">${label}</text><text x="60" y="88" text-anchor="middle" font-size="12" font-weight="800" fill="#374151" font-family="sans-serif">${unit}</text>`, 'coin');
}

export function moneyRow(list) {
  return `<div class="money-row">${list.map(money).join('')}</div>`;
}

// ---------------------------------------------------------------- fractions
export function fraction(kind, parts, shaded, colour = 'orange') {
  const c = COLOURS[colour] || colour;
  const st = 'stroke="#24203a" stroke-width="5"';
  let body = '';
  if (kind === 'circle') {
    for (let i = 0; i < parts; i++) {
      const a0 = (i * 360) / parts - 90;
      const a1 = ((i + 1) * 360) / parts - 90;
      const p = (a) => `${(100 + 80 * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(100 + 80 * Math.sin((a * Math.PI) / 180)).toFixed(1)}`;
      body += parts === 1
        ? `<circle cx="100" cy="100" r="80" fill="${i < shaded ? c : '#fff'}" ${st}/>`
        : `<path d="M100,100 L${p(a0)} A80,80 0 0 1 ${p(a1)} Z" fill="${i < shaded ? c : '#fff'}" ${st}/>`;
    }
  } else {
    const w = kind === 'rect' ? 180 : 160;
    const h = kind === 'rect' ? 90 : 160;
    const x0 = (200 - w) / 2;
    const y0 = (200 - h) / 2;
    const quarterGrid = kind === 'square' && parts === 4;
    for (let i = 0; i < parts; i++) {
      let x; let y; let pw; let ph;
      if (quarterGrid) { pw = w / 2; ph = h / 2; x = x0 + (i % 2) * pw; y = y0 + Math.floor(i / 2) * ph; } else { pw = w / parts; ph = h; x = x0 + i * pw; y = y0; }
      body += `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${i < shaded ? c : '#fff'}" ${st}/>`;
    }
  }
  return svg(200, 200, body, 'fraction');
}

/** Two unequal "parts" (not a half): used as a distractor. */
export function unequalSplit(colour = 'orange') {
  const c = COLOURS[colour] || colour;
  return svg(200, 200, `<rect x="20" y="20" width="160" height="160" fill="#fff" stroke="#24203a" stroke-width="5"/><rect x="20" y="20" width="110" height="160" fill="${c}" stroke="#24203a" stroke-width="5"/>`, 'fraction');
}

// ---------------------------------------------------------------- measuring
export function lengthBar(len, colour = 'green', emoji = '') {
  const c = COLOURS[colour] || colour;
  const w = 30 + len * 17;
  return `<div class="len-bar" style="width:${w}px;background:${c}">${emoji ? `<span>${emoji}</span>` : ''}</div>`;
}

export function heightBar(h, colour = 'blue') {
  const c = COLOURS[colour] || colour;
  return `<div class="h-bar-wrap"><div class="h-bar" style="height:${20 + h * 14}px;background:${c}"></div></div>`;
}

export function balance(leftEmoji, rightEmoji, heavier) {
  // heavier: 'left' | 'right'
  const tilt = heavier === 'left' ? -12 : 12;
  return `<div class="balance">${svg(300, 180, `<g transform="rotate(${tilt} 150 70)"><line x1="40" y1="70" x2="260" y2="70" stroke="#24203a" stroke-width="8" stroke-linecap="round"/><path d="M20 70h60l-10 28h-40z" fill="#ffd23f" stroke="#24203a" stroke-width="4"/><path d="M220 70h60l-10 28h-40z" fill="#ffd23f" stroke="#24203a" stroke-width="4"/></g><polygon points="150,70 120,170 180,170" fill="#7c5cff" stroke="#24203a" stroke-width="4"/>`)}<span class="b-left" style="transform:translateY(${heavier === 'left' ? 22 : -22}px)">${leftEmoji}</span><span class="b-right" style="transform:translateY(${heavier === 'right' ? 22 : -22}px)">${rightEmoji}</span></div>`;
}

// ---------------------------------------------------------------- plant diagram
export const PLANT_PARTS = ['flower', 'leaf', 'stem', 'roots', 'seed', 'fruit'];
export function plant(highlight) {
  const hl = (part) => (part === highlight ? 'stroke="#e63946" stroke-width="7"' : 'stroke="#24203a" stroke-width="3"');
  return svg(200, 260, `
    <rect x="0" y="190" width="200" height="70" fill="#a8743f" opacity=".5"/>
    <path d="M100 190q-8 30-30 50M100 190q4 34 0 60M100 190q10 30 32 48" fill="none" ${hl('roots')} ${highlight === 'roots' ? '' : 'stroke="#7a4a1d"'}/>
    <path d="M100 190V80" ${hl('stem')} fill="none" stroke-linecap="round" style="stroke-width:${highlight === 'stem' ? 10 : 7}px"/>
    <path d="M100 140q-50-10-58-40 40 0 58 34z" fill="#2bb24c" ${hl('leaf')}/>
    <path d="M100 120q46-12 56-42-40 2-56 36z" fill="#2bb24c" stroke="#24203a" stroke-width="3"/>
    <g ${highlight === 'flower' ? 'stroke="#e63946" stroke-width="6"' : 'stroke="#24203a" stroke-width="3"'}>
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="100" cy="48" rx="14" ry="26" fill="#ff6fb5" transform="rotate(${a} 100 70)"/>`).join('')}
      <circle cx="100" cy="70" r="14" fill="#ffd23f"/>
    </g>
    <circle cx="150" cy="170" r="13" fill="#e63946" ${hl('fruit')}/>
    <path d="M150 157q2-14 12-16" fill="none" stroke="#2bb24c" stroke-width="4"/>
    <ellipse cx="52" cy="225" rx="10" ry="7" fill="#d9a35f" ${hl('seed')}/>`, 'plant');
}
