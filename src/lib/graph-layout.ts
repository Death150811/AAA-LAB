/**
 * Раскладка «карты знаний»: детерминированная силовая симуляция.
 * Узлы одного домена притягиваются к его якорю и друг к другу по предпосылкам, чужие отталкиваются.
 * Чистая функция: одинаковый вход даёт одинаковые координаты на сервере и в браузере.
 */
export interface LayoutNode {
  /** Номер домена (индекс якоря). */
  domain: number;
  /** Порядковый номер темы внутри домена — определяет начальную спираль. */
  order: number;
}

export interface LayoutOptions {
  width: number;
  height: number;
  anchors: { x: number; y: number }[];
  /** Пары индексов (предпосылка → тема). */
  edges: [number, number][];
  /** Невидимые связи (соседи по модулю): держат модуль вместе, но не рисуются. */
  bonds?: [number, number][];
  padding?: number;
  iterations?: number;
}

function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x + 0x6d2b79f5) >>> 0;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function layoutGraph(nodes: LayoutNode[], { width, height, anchors, edges, bonds = [], padding = 28, iterations = 360 }: LayoutOptions): { x: number; y: number }[] {
  const rand = rng(20240607);
  const n = nodes.length;
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  nodes.forEach((nd, i) => {
    const a = anchors[nd.domain]!;
    const angle = nd.order * 2.399963 + nd.domain; // золотой угол
    const r = 24 + 21 * Math.sqrt(nd.order);
    px[i] = a.x + Math.cos(angle) * r + (rand() - 0.5) * 2;
    py[i] = a.y + Math.sin(angle) * r + (rand() - 0.5) * 2;
  });

  const REPEL = 44; // радиус отталкивания
  for (let it = 0; it < iterations; it++) {
    const cool = 1 - it / iterations;
    const fx = new Float64Array(n);
    const fy = new Float64Array(n);
    // отталкивание всех от всех на малом расстоянии
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = px[i]! - px[j]!;
        const dy = py[i]! - py[j]!;
        const d2 = dx * dx + dy * dy;
        const same = nodes[i]!.domain === nodes[j]!.domain;
        const reach = same ? REPEL : REPEL * 2.4;
        if (d2 > reach * reach) continue;
        const d = Math.sqrt(d2) || 0.01;
        const f = ((reach - d) / reach) * (same ? 0.9 : 1.5);
        fx[i] = fx[i]! + (dx / d) * f;
        fy[i] = fy[i]! + (dy / d) * f;
        fx[j] = fx[j]! - (dx / d) * f;
        fy[j] = fy[j]! - (dy / d) * f;
      }
    }
    // пружины по предпосылкам
    for (const [a, b] of edges) {
      const dx = px[b]! - px[a]!;
      const dy = py[b]! - py[a]!;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const cross = nodes[a]!.domain !== nodes[b]!.domain;
      const rest = cross ? 150 : 56;
      const k = cross ? 0.004 : 0.02;
      const f = (d - rest) * k;
      fx[a] = fx[a]! + (dx / d) * f;
      fy[a] = fy[a]! + (dy / d) * f;
      fx[b] = fx[b]! - (dx / d) * f;
      fy[b] = fy[b]! - (dy / d) * f;
    }
    // мягкие связи внутри модуля
    for (const [a, b] of bonds) {
      const dx = px[b]! - px[a]!;
      const dy = py[b]! - py[a]!;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - 48) * 0.012;
      fx[a] = fx[a]! + (dx / d) * f;
      fy[a] = fy[a]! + (dy / d) * f;
      fx[b] = fx[b]! - (dx / d) * f;
      fy[b] = fy[b]! - (dy / d) * f;
    }
    // притяжение к якорю домена
    for (let i = 0; i < n; i++) {
      const a = anchors[nodes[i]!.domain]!;
      fx[i] = fx[i]! + (a.x - px[i]!) * 0.004;
      fy[i] = fy[i]! + (a.y - py[i]!) * 0.004;
    }
    const step = 1.6 * cool + 0.15;
    for (let i = 0; i < n; i++) {
      px[i] = Math.min(width - padding, Math.max(padding, px[i]! + fx[i]! * step));
      py[i] = Math.min(height - padding, Math.max(padding, py[i]! + fy[i]! * step));
    }
  }
  return Array.from({ length: n }, (_, i) => ({ x: Math.round(px[i]! * 10) / 10, y: Math.round(py[i]! * 10) / 10 }));
}
