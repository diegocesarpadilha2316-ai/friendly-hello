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
