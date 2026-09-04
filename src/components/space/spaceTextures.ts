import * as THREE from "three";

/** Soft round glow sprite used for every star point. */
export function makeStarSprite(): THREE.Texture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,255,255,0.85)");
  g.addColorStop(0.5, "rgba(180,205,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Procedural banded gas-giant surface, dark and moody like the reference. */
export function makeGasGiantTexture(): THREE.Texture {
  const w = 1024;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#0a0d18");
  base.addColorStop(0.35, "#1a2036");
  base.addColorStop(0.5, "#252c46");
  base.addColorStop(0.72, "#161c30");
  base.addColorStop(1, "#080b14");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // horizontal cloud bands
  let y = 0;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  while (y < h) {
    const bh = 6 + rnd() * 26;
    const tone = 0.5 + rnd() * 0.5;
    const warm = rnd() > 0.75;
    ctx.fillStyle = warm
      ? `rgba(${120 * tone | 0}, ${96 * tone | 0}, ${88 * tone | 0}, 0.35)`
      : `rgba(${90 * tone | 0}, ${110 * tone | 0}, ${150 * tone | 0}, 0.28)`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) {
      ctx.lineTo(x, y + Math.sin(x * 0.01 + seed) * 3);
    }
    ctx.lineTo(w, y + bh);
    for (let x = w; x >= 0; x -= 32) {
      ctx.lineTo(x, y + bh + Math.cos(x * 0.008 + seed) * 3);
    }
    ctx.closePath();
    ctx.fill();
    y += bh * (0.6 + rnd() * 0.9);
  }

  // a couple of soft storm ovals
  for (let i = 0; i < 3; i++) {
    const ox = rnd() * w;
    const oy = h * (0.3 + rnd() * 0.4);
    const rx = 40 + rnd() * 90;
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, rx);
    g.addColorStop(0, "rgba(160,130,110,0.30)");
    g.addColorStop(1, "rgba(160,130,110,0)");
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(1, 0.42);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** Soft elongated haze used for the Milky Way glow planes. */
export function makeHazeTexture(): THREE.Texture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(214,226,255,0.55)");
  g.addColorStop(0.35, "rgba(150,175,235,0.22)");
  g.addColorStop(1, "rgba(90,110,180,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
