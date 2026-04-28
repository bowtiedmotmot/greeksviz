import React, { useRef, useEffect } from 'react';

export interface SurfaceCanvas3DProps {
  xs: number[];
  ys: number[];
  zs: number[][];       // zs[yi][xi]
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  colorMode?: 'diverging' | 'sequential';
  height?: number;
  currentX?: number;   // highlight marker in data space
  currentY?: number;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

const VIRIDIS: [number, number, number][] = [
  [68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37],
];

function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function seqColor(t: number): [number, number, number] {
  const n = VIRIDIS.length - 1;
  const idx = Math.min(Math.max(t, 0), 1) * n;
  const lo = Math.min(Math.floor(idx), n - 1);
  return lerp3(VIRIDIS[lo], VIRIDIS[lo + 1], idx - lo);
}

function divColor(t: number): [number, number, number] {
  const c = Math.max(-1, Math.min(1, t));
  return c >= 0
    ? lerp3([255, 255, 255], [220, 50, 50], c)
    : lerp3([255, 255, 255], [50, 100, 220], -c);
}

function getColor(
  z: number, zMin: number, zRange: number, absZMax: number, mode: string,
): [number, number, number] {
  return mode === 'diverging' ? divColor(z / absZMax) : seqColor((z - zMin) / zRange);
}

// ── Lighting ──────────────────────────────────────────────────────────────────

// Light from upper-left-front (world space)
const LIGHT = [0.577, -0.577, 0.577] as const;

function diffuseShade(nz00: number, nz10: number, nz01: number, dx: number, dy: number): number {
  // Face normal via cross product of edge vectors (v1=x-edge, v2=y-edge)
  const nx = -(nz10 - nz00) * dy;
  const ny = -(nz01 - nz00) * dx;
  const nz = dx * dy;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  const dot = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / len;
  return 0.5 + 0.5 * Math.max(0, dot);
}

// ── Hit testing ───────────────────────────────────────────────────────────────

type Pt = [number, number];
type Quad = [Pt, Pt, Pt, Pt];

function pointInTri(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): boolean {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

function hitQuad(px: number, py: number, q: Quad): boolean {
  const [a, b, c, d] = q;
  return (
    pointInTri(px, py, a[0], a[1], b[0], b[1], c[0], c[1]) ||
    pointInTri(px, py, a[0], a[1], c[0], c[1], d[0], d[1])
  );
}

// ── Rounded rect helper (avoids ctx.roundRect compat issues) ──────────────────

function fillRoundRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SurfaceCanvas3D: React.FC<SurfaceCanvas3DProps> = ({
  xs, ys, zs,
  xLabel = 'X', yLabel = 'Y', zLabel = 'Z',
  colorMode = 'sequential',
  height = 450,
  currentX, currentY,
}) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);

  // Camera state (all refs → no re-renders on interaction)
  const spinRef    = useRef(Math.PI / 4);        // azimuth around Z
  const elevRef    = useRef(0.55);               // elevation (rad, 0=horizontal)
  const zoomRef    = useRef(1.0);
  const dragRef    = useRef({ active: false, lastX: 0, lastY: 0 });
  const mouseRef   = useRef<Pt>([0, 0]);
  const hoverRef   = useRef<{ xi: number; yi: number } | null>(null);
  const shownHintRef = useRef(false);

  // Cached projected quads for hit testing (rebuilt each draw)
  const quadCacheRef = useRef<{ xi: number; yi: number; depth: number; corners: Quad }[]>([]);

  // drawFnRef holds the latest closure over all props so event handlers call
  // the current version without stale data.
  const drawFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    drawFnRef.current = () => {
      const canvas = canvasRef.current;
      const wrap   = wrapRef.current;
      if (!canvas || !wrap) return;

      const W   = Math.max(wrap.clientWidth, 200);
      const H   = height;
      const dpr = window.devicePixelRatio || 1;

      if (
        canvas.width  !== Math.round(W * dpr) ||
        canvas.height !== Math.round(H * dpr)
      ) {
        canvas.width  = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width  = `${W}px`;
        canvas.style.height = `${H}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      const NX = xs.length;
      const NY = ys.length;
      if (NX < 2 || NY < 2 || !zs.length) { ctx.restore(); return; }

      // Value range
      let zMin = Infinity, zMax = -Infinity;
      for (let yi = 0; yi < NY; yi++)
        for (let xi = 0; xi < NX; xi++) {
          const z = zs[yi]?.[xi] ?? 0;
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
        }
      const zRange  = Math.abs(zMax - zMin) < 1e-12 ? 1 : zMax - zMin;
      const absZMax = Math.max(Math.abs(zMin), Math.abs(zMax), 1e-12);
      const norm = (z: number) => (z - zMin) / zRange;

      // Orthographic projection from azimuth (spin) + elevation (elev)
      const spin = spinRef.current;
      const elev = elevRef.current;
      const zoom = zoomRef.current;
      const SCALE = Math.min(W, H) * 0.38 * zoom;
      const OX = W * 0.46;
      const OY = H * 0.52;

      // Camera basis vectors
      const rX =  Math.cos(spin),  rY = -Math.sin(spin);                              // right
      const uX = -Math.sin(elev) * Math.sin(spin),
            uY = -Math.sin(elev) * Math.cos(spin),
            uZ =  Math.cos(elev);                                                      // up
      const fX =  Math.cos(elev) * Math.sin(spin),
            fY =  Math.cos(elev) * Math.cos(spin),
            fZ =  Math.sin(elev);                                                      // forward (depth)

      // Project world (wx,wy,wz) ∈ [0,1]³ → CSS pixel
      const proj = (wx: number, wy: number, wz: number): Pt => [
        OX + SCALE * (wx * rX + wy * rY),
        OY - SCALE * (wx * uX + wy * uY + wz * uZ),
      ];
      const depthOf = (wx: number, wy: number, wz: number) =>
        wx * fX + wy * fY + wz * fZ;

      // ── Build + sort quads ─────────────────────────────────────────────────

      const quads: typeof quadCacheRef.current = [];
      const dx = 1 / (NX - 1);
      const dy = 1 / (NY - 1);

      for (let yi = 0; yi < NY - 1; yi++) {
        for (let xi = 0; xi < NX - 1; xi++) {
          const nx0 = xi * dx, nx1 = (xi + 1) * dx;
          const ny0 = yi * dy, ny1 = (yi + 1) * dy;
          const z00 = zs[yi]?.[xi]      ?? 0;
          const z10 = zs[yi]?.[xi + 1]  ?? 0;
          const z11 = zs[yi + 1]?.[xi + 1] ?? 0;
          const z01 = zs[yi + 1]?.[xi]  ?? 0;
          const cz  = (z00 + z10 + z11 + z01) / 4;
          quads.push({
            xi, yi,
            depth: depthOf((nx0 + nx1) / 2, (ny0 + ny1) / 2, norm(cz)),
            corners: [
              proj(nx0, ny0, norm(z00)),
              proj(nx1, ny0, norm(z10)),
              proj(nx1, ny1, norm(z11)),
              proj(nx0, ny1, norm(z01)),
            ],
          });
        }
      }
      // Descending depth → furthest first (painter's algorithm)
      quads.sort((a, b) => b.depth - a.depth);
      quadCacheRef.current = quads;

      const line = (a: Pt, b: Pt) => {
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      };

      // ── Floor shadow ───────────────────────────────────────────────────────

      ctx.save();
      ctx.globalAlpha = 0.22;
      for (const { xi, yi } of quads) {
        const z00 = zs[yi]?.[xi]     ?? 0;
        const z10 = zs[yi]?.[xi + 1] ?? 0;
        const z11 = zs[yi + 1]?.[xi + 1] ?? 0;
        const z01 = zs[yi + 1]?.[xi] ?? 0;
        const [r, g, b] = getColor((z00+z10+z11+z01)/4, zMin, zRange, absZMax, colorMode);
        const nx0 = xi * dx, nx1 = (xi + 1) * dx;
        const ny0 = yi * dy, ny1 = (yi + 1) * dy;
        const [sx0, sy0] = proj(nx0, ny0, 0);
        const [sx1, sy1] = proj(nx1, ny0, 0);
        const [sx2, sy2] = proj(nx1, ny1, 0);
        const [sx3, sy3] = proj(nx0, ny1, 0);
        ctx.beginPath();
        ctx.moveTo(sx0,sy0); ctx.lineTo(sx1,sy1); ctx.lineTo(sx2,sy2); ctx.lineTo(sx3,sy3);
        ctx.closePath();
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
      }
      ctx.restore();

      // ── Surface quads with diffuse shading ────────────────────────────────

      const hov = hoverRef.current;

      for (const { xi, yi, corners } of quads) {
        const z00 = zs[yi]?.[xi]         ?? 0;
        const z10 = zs[yi]?.[xi + 1]     ?? 0;
        const z11 = zs[yi + 1]?.[xi + 1] ?? 0;
        const z01 = zs[yi + 1]?.[xi]     ?? 0;
        const avgZ = (z00 + z10 + z11 + z01) / 4;
        const isHov = hov !== null && hov.xi === xi && hov.yi === yi;

        let [r, g, b] = getColor(avgZ, zMin, zRange, absZMax, colorMode);
        const shade = diffuseShade(norm(z00), norm(z10), norm(z01), dx, dy);
        const shadeF = isHov ? Math.min(shade * 1.35, 1) : shade;
        r = Math.min(255, Math.round(r * shadeF));
        g = Math.min(255, Math.round(g * shadeF));
        b = Math.min(255, Math.round(b * shadeF));

        const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] = corners;
        ctx.beginPath();
        ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3);
        ctx.closePath();
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
        ctx.strokeStyle = isHov ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.14)';
        ctx.lineWidth   = isHov ? 1.5 : 0.5;
        ctx.stroke();
      }

      // ── Box edges ─────────────────────────────────────────────────────────

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.75;
      line(proj(1,0,0), proj(1,1,0));
      line(proj(0,1,0), proj(1,1,0));
      line(proj(1,0,0), proj(1,0,1));
      line(proj(1,1,0), proj(1,1,1));

      // Main axes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      line(proj(0,0,0), proj(1,0,0));
      line(proj(0,0,0), proj(0,1,0));
      line(proj(0,0,0), proj(0,0,1));

      // ── Current-params marker ─────────────────────────────────────────────

      if (currentX !== undefined && currentY !== undefined) {
        const cnx = Math.max(0, Math.min(1, (currentX - xs[0]) / (xs[NX-1] - xs[0])));
        const cny = Math.max(0, Math.min(1, (currentY - ys[0]) / (ys[NY-1] - ys[0])));
        const xi  = Math.min(Math.round(cnx * (NX - 1)), NX - 1);
        const yi  = Math.min(Math.round(cny * (NY - 1)), NY - 1);
        const cnz = norm(zs[yi]?.[xi] ?? 0);

        // Crosshair on floor
        const cs = 0.045;
        ctx.strokeStyle = 'rgba(251,191,36,0.65)';
        ctx.lineWidth = 1;
        line(proj(cnx - cs, cny, 0), proj(cnx + cs, cny, 0));
        line(proj(cnx, cny - cs, 0), proj(cnx, cny + cs, 0));

        // Dashed spike from floor to surface
        ctx.strokeStyle = 'rgba(251,191,36,0.9)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        line(proj(cnx, cny, 0), proj(cnx, cny, cnz));
        ctx.setLineDash([]);

        // Dot on surface
        const [sx, sy] = proj(cnx, cny, cnz);
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FBBF24';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Axis ticks + labels ───────────────────────────────────────────────

      const fs = Math.max(9, Math.min(10, W / 65));
      ctx.font = `${fs}px monospace`;
      ctx.fillStyle = '#94a3b8';

      const N_TICKS = 5;
      ctx.textAlign = 'center';
      for (let i = 0; i < N_TICKS; i++) {
        const f = i / (N_TICKS - 1);
        const [tx, ty] = proj(f, -0.07, 0);
        ctx.fillText(xs[Math.round(f * (NX-1))].toFixed(0), tx, ty + 12);
      }
      ctx.textAlign = 'right';
      for (let i = 0; i < N_TICKS; i++) {
        const f = i / (N_TICKS - 1);
        const [tx, ty] = proj(-0.07, f, 0);
        ctx.fillText(ys[Math.round(f * (NY-1))].toFixed(0), tx - 2, ty + 4);
      }
      for (let i = 0; i <= 4; i++) {
        const f = i / 4;
        const [tx, ty] = proj(-0.07, 0, f);
        ctx.fillText((zMin + f * zRange).toFixed(3), tx - 2, ty + 4);
      }

      const lfs = Math.max(10, Math.min(11, W / 58));
      ctx.font = `bold ${lfs}px sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      { const [lx,ly] = proj(1.14, -0.09, 0); ctx.fillText(xLabel, lx, ly + 4); }
      ctx.textAlign = 'right';
      { const [lx,ly] = proj(-0.09, 1.14, 0); ctx.fillText(yLabel, lx, ly + 4); }
      ctx.textAlign = 'left';
      { const [lx,ly] = proj(0, -0.03, 1.13); ctx.fillText(zLabel, lx + 4, ly); }

      // ── Color bar ─────────────────────────────────────────────────────────

      const barW = 10, barX = W - 52;
      const barTop = H * 0.1, barBot = H * 0.9, barH = barBot - barTop;
      const grad = ctx.createLinearGradient(0, barBot, 0, barTop);
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const [r,g,b] = colorMode === 'sequential' ? seqColor(t) : divColor(t*2-1);
        grad.addColorStop(t, `rgb(${r},${g},${b})`);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barTop, barW, barH);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barTop, barW, barH);
      ctx.font = '9px monospace'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'left';
      for (let i = 0; i <= 4; i++) {
        const f   = i / 4;
        const val = colorMode === 'diverging' ? -absZMax + f*2*absZMax : zMin + f*zRange;
        ctx.fillText(val.toFixed(3), barX + barW + 3, barBot - f*barH + 3);
      }

      // ── Hover tooltip ─────────────────────────────────────────────────────

      if (hov) {
        const xi = hov.xi, yi = hov.yi;
        const avgZ = (
          (zs[yi]?.[xi]         ?? 0) + (zs[yi]?.[xi+1]       ?? 0) +
          (zs[yi+1]?.[xi+1]     ?? 0) + (zs[yi+1]?.[xi]       ?? 0)
        ) / 4;
        const xMid = (xs[xi] + xs[Math.min(xi+1, NX-1)]) / 2;
        const yMid = (ys[yi] + ys[Math.min(yi+1, NY-1)]) / 2;
        const lines = [
          `${xLabel}: ${xMid.toFixed(1)}`,
          `${yLabel}: ${yMid.toFixed(1)}`,
          `${zLabel}: ${avgZ.toFixed(4)}`,
        ];
        const PAD = 7, LH = 15;
        const maxLen = Math.max(...lines.map(l => l.length));
        const ttW = maxLen * 6.4 + PAD * 2;
        const ttH = lines.length * LH + PAD * 2;
        let [mx, my] = mouseRef.current;
        let tx = mx + 14, ty = my - ttH / 2;
        if (tx + ttW > W - 55) tx = mx - ttW - 14;
        ty = Math.max(4, Math.min(H - ttH - 4, ty));

        ctx.fillStyle = 'rgba(15,23,42,0.93)';
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
        fillRoundRect(ctx, tx, ty, ttW, ttH, 5);
        ctx.fill(); ctx.stroke();

        ctx.font = '11px monospace'; ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left';
        lines.forEach((l, i) => ctx.fillText(l, tx + PAD, ty + PAD + (i + 1) * LH - 2));
      }

      // ── Hint (shown until first interaction) ──────────────────────────────

      if (!shownHintRef.current) {
        ctx.font = '10px sans-serif'; ctx.fillStyle = '#334155';
        ctx.textAlign = 'center';
        ctx.fillText('drag to rotate · scroll to zoom', W / 2, H - 8);
      }

      ctx.restore();
    };
  }, [xs, ys, zs, xLabel, yLabel, zLabel, colorMode, height, currentX, currentY]);

  // ── Event listeners (empty dep array — use refs for all state) ────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onCanvasMouseDown = (e: MouseEvent) => {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      shownHintRef.current = true;
      canvas.style.cursor = 'grabbing';
    };

    // Hover + drag-during-move on canvas
    const onCanvasMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = [e.clientX - rect.left, e.clientY - rect.top];

      if (!dragRef.current.active) {
        // Hit test — iterate front-to-back (reverse painter order)
        const cache = quadCacheRef.current;
        let hit: typeof hoverRef.current = null;
        for (let i = cache.length - 1; i >= 0; i--) {
          if (hitQuad(mouseRef.current[0], mouseRef.current[1], cache[i].corners)) {
            hit = { xi: cache[i].xi, yi: cache[i].yi };
            break;
          }
        }
        hoverRef.current = hit;
        canvas.style.cursor = hit ? 'crosshair' : 'grab';
        drawFnRef.current();
      }
    };

    // Drag on window so the cursor can leave the canvas mid-drag
    const onWindowMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      spinRef.current += dx * 0.007;
      elevRef.current = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, elevRef.current + dy * 0.007));
      hoverRef.current = null;
      drawFnRef.current();
    };

    const onWindowMouseUp = () => {
      dragRef.current.active = false;
      canvas.style.cursor = 'grab';
    };

    const onMouseLeave = () => {
      if (!dragRef.current.active) {
        hoverRef.current = null;
        drawFnRef.current();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      shownHintRef.current = true;
      zoomRef.current = Math.max(0.35, Math.min(4, zoomRef.current * (e.deltaY > 0 ? 0.92 : 1.08)));
      drawFnRef.current();
    };

    // Touch: one-finger rotate, two-finger pinch-zoom
    const touch = { lastX: 0, lastY: 0, dist: 0 };
    const onTouchStart = (e: TouchEvent) => {
      shownHintRef.current = true;
      if (e.touches.length === 1) {
        touch.lastX = e.touches[0].clientX;
        touch.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touch.dist = Math.sqrt(dx*dx + dy*dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touch.lastX;
        const dy = e.touches[0].clientY - touch.lastY;
        touch.lastX = e.touches[0].clientX;
        touch.lastY = e.touches[0].clientY;
        spinRef.current += dx * 0.007;
        elevRef.current = Math.max(0.05, Math.min(Math.PI/2 - 0.05, elevRef.current + dy * 0.007));
        hoverRef.current = null;
        drawFnRef.current();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.sqrt(dx*dx + dy*dy);
        if (touch.dist > 0) {
          zoomRef.current = Math.max(0.35, Math.min(4, zoomRef.current * newDist / touch.dist));
          drawFnRef.current();
        }
        touch.dist = newDist;
      }
    };

    canvas.addEventListener('mousedown',  onCanvasMouseDown);
    canvas.addEventListener('mousemove',  onCanvasMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('wheel',      onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    window.addEventListener('mousemove',  onWindowMouseMove);
    window.addEventListener('mouseup',    onWindowMouseUp);

    return () => {
      canvas.removeEventListener('mousedown',  onCanvasMouseDown);
      canvas.removeEventListener('mousemove',  onCanvasMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('mousemove',  onWindowMouseMove);
      window.removeEventListener('mouseup',    onWindowMouseUp);
    };
  }, []); // empty — all mutable state in refs

  // ── Draw on mount + prop changes + resize ─────────────────────────────────

  useEffect(() => {
    drawFnRef.current();
    const obs = new ResizeObserver(() => drawFnRef.current());
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, [xs, ys, zs, colorMode, height, currentX, currentY, xLabel, yLabel, zLabel]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: 'grab', touchAction: 'none' }}
      />
      {/* Reset-view button */}
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={() => {
          spinRef.current = Math.PI / 4;
          elevRef.current = 0.55;
          zoomRef.current = 1.0;
          drawFnRef.current();
        }}
        style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 10, padding: '2px 7px',
          background: 'rgba(15,23,42,0.75)', border: '1px solid #334155',
          color: '#64748b', borderRadius: 4, cursor: 'pointer', lineHeight: 1.6,
        }}
        title="Reset view"
      >
        ↺ reset
      </button>
    </div>
  );
};
