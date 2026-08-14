import * as THREE from "three";

function seededNoise(x: number, y: number, seed = 1) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 34.11) * 43758.5453;
  return value - Math.floor(value);
}

function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function createWoodTexture() {
  const texture = canvasTexture(1024, 1024, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#9b6942");
    gradient.addColorStop(0.28, "#bd8a5e");
    gradient.addColorStop(0.55, "#a8754d");
    gradient.addColorStop(0.82, "#c29165");
    gradient.addColorStop(1, "#8e5d3b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let x = 0; x < width; x += 5) {
      const n = seededNoise(x, 10, 3);
      ctx.strokeStyle = `rgba(65,32,15,${0.04 + n * 0.12})`;
      ctx.lineWidth = 1 + n * 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= height; y += 18) {
        ctx.lineTo(x + Math.sin(y * 0.025 + n * 10) * (3 + n * 8), y);
      }
      ctx.stroke();
    }
  });
  texture.repeat.set(2.4, 1.2);
  return texture;
}

export function createMarbleTexture() {
  const texture = canvasTexture(1024, 1024, (ctx, width, height) => {
    ctx.fillStyle = "#e8e2d8";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 22; i++) {
      const y0 = seededNoise(i, 1, 7) * height;
      const amplitude = 24 + seededNoise(i, 2, 8) * 90;
      ctx.strokeStyle = `rgba(128,107,91,${0.06 + seededNoise(i, 3, 9) * 0.14})`;
      ctx.lineWidth = 1 + seededNoise(i, 4, 10) * 3;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 12) {
        const y = y0 + Math.sin(x * 0.012 + i) * amplitude + Math.sin(x * 0.033) * 13;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  texture.repeat.set(1.4, 1.1);
  return texture;
}

export function createFloorTexture() {
  const texture = canvasTexture(1024, 1024, (ctx, width, height) => {
    ctx.fillStyle = "#a88d72";
    ctx.fillRect(0, 0, width, height);
    const tile = 256;
    ctx.strokeStyle = "rgba(70,50,38,0.28)";
    ctx.lineWidth = 5;
    for (let x = 0; x <= width; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += tile) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let i = 0; i < 1800; i++) {
      const x = seededNoise(i, 4, 5) * width;
      const y = seededNoise(i, 8, 6) * height;
      ctx.fillStyle = `rgba(255,255,255,${seededNoise(i, 2, 2) * 0.025})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });
  texture.repeat.set(3, 2.4);
  return texture;
}


import type { MaterialDefinition } from "../../library/contracts/MaterialDefinition";

const materialTextureCache = new Map<string, string>();

/** Textura procedural leve e determinística para o viewport Realista/Apresentação. */
export function createMaterialTextureUrl(material: MaterialDefinition) {
  const cached = materialTextureCache.get(material.id);
  if (cached) return cached;
  const color = material.baseColor;
  const id = material.id;
  let pattern = `<rect width="100%" height="100%" fill="${color}"/>`;
  if (material.category === "mdf" && material.finish === "textured") {
    pattern += `<path d="M0 24 C90 8 150 38 240 18 S420 30 520 14" stroke="#5a321d" stroke-opacity=".22" stroke-width="3" fill="none"/><path d="M0 56 C100 36 180 78 300 48 S450 62 640 42" stroke="#f5d1a1" stroke-opacity=".2" stroke-width="2" fill="none"/>`;
  } else if (material.category === "stone") {
    pattern += `<path d="M-40 180 C100 90 210 230 350 120 S610 140 760 34" stroke="#8b8178" stroke-opacity=".34" stroke-width="7" fill="none"/><path d="M-20 360 C120 270 260 410 400 300 S650 320 800 230" stroke="#ffffff" stroke-opacity=".36" stroke-width="3" fill="none"/><circle cx="210" cy="180" r="3" fill="#6c625b" fill-opacity=".22"/><circle cx="520" cy="290" r="4" fill="#6c625b" fill-opacity=".2"/>`;
  } else if (material.category === "metal") {
    pattern += `<path d="M0 8 H1000 M0 20 H1000 M0 32 H1000 M0 44 H1000" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>`;
  } else if (material.category === "glass" || material.category === "mirror") {
    pattern += `<path d="M0 120 L420 0 M180 320 L760 0 M520 420 L1000 170" stroke="#ffffff" stroke-opacity=".2" stroke-width="9"/>`;
  } else {
    pattern += `<path d="M0 180 H1000 M0 360 H1000" stroke="#ffffff" stroke-opacity=".06" stroke-width="3"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600"><defs><filter id="soft"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="${id.length}" result="noise"/><feColorMatrix type="saturate" values="0"/></filter></defs>${pattern}<rect width="100%" height="100%" filter="url(#soft)" opacity=".04"/></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  materialTextureCache.set(material.id, url);
  return url;
}
