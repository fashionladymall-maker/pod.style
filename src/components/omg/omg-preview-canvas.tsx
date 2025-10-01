'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CanvasStat {
  label: string;
  value: string;
}

interface OmgPreviewCanvasProps {
  baseImage: string;
  overlayImage?: string | null;
  title?: string | null;
  subtitle?: string | null;
  stats?: CanvasStat[];
  accentColor?: string;
  shouldRender?: boolean;
  className?: string;
  onReady?: () => void;
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 960;

const createImage = (src: string) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.src = src;
  return image;
};

const fitCover = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
) => {
  const imageRatio = image.width / image.height;
  const canvasRatio = canvasWidth / canvasHeight;
  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;

  if (imageRatio < canvasRatio) {
    drawHeight = canvasWidth / imageRatio;
  } else {
    drawWidth = canvasHeight * imageRatio;
  }

  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

const drawRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
};

const fillRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  shadow = false,
) => {
  ctx.save();
  ctx.beginPath();
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.closePath();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
  }
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
};

export const OmgPreviewCanvas = ({
  baseImage,
  overlayImage,
  title,
  subtitle,
  stats = [],
  accentColor = '#ec4899',
  shouldRender = true,
  className,
  onReady,
}: OmgPreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tainted, setTainted] = useState(false);

  const safeStats = useMemo(() => stats.slice(0, 3), [stats]);

  useEffect(() => {
    if (!shouldRender) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    let overlayLoaded = false;
    let baseLoaded = false;

    const draw = (base: HTMLImageElement, overlay?: HTMLImageElement | null) => {
      if (!ctx || !canvas || cancelled) return;
      try {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        fitCover(ctx, base, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(6,6,6,0)');
        gradient.addColorStop(1, 'rgba(6,6,6,0.92)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 42px "Inter", "PingFang SC", sans-serif';
        ctx.textBaseline = 'alphabetic';
        if (title) {
          const titleY = canvas.height - 140;
          const maxWidth = canvas.width - 160;
          const words = title.split(/\s+/);
          let line = '';
          let y = titleY;
          for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line) {
              ctx.fillText(line, 80, y, maxWidth);
              line = word;
              y += 48;
            } else {
              line = testLine;
            }
          }
          if (line) {
            ctx.fillText(line, 80, y, maxWidth);
          }
        }

        if (subtitle) {
          ctx.fillStyle = '#cbd5f5';
          ctx.font = '400 24px "Inter", "PingFang SC", sans-serif';
          ctx.fillText(subtitle, 80, canvas.height - 80);
        }

        if (safeStats.length > 0) {
          let offset = 0;
          ctx.font = '400 22px "Inter", "PingFang SC", sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.72)';
          for (const stat of safeStats) {
            const text = `${stat.label}: ${stat.value}`;
            ctx.fillText(text, 80, canvas.height - 32 - offset);
            offset += 30;
          }
        }

        if (overlay) {
          const previewSize = canvas.width * 0.28;
          const previewX = canvas.width - previewSize - 72;
          const previewY = canvas.height - previewSize - 92;
          fillRoundedRect(ctx, previewX, previewY, previewSize, previewSize, 28, 'rgba(8,8,8,0.85)', true);
          const padding = 18;
          const innerX = previewX + padding;
          const innerY = previewY + padding;
          const innerSize = previewSize - padding * 2;

          ctx.save();
          ctx.beginPath();
          drawRoundedRectPath(ctx, innerX, innerY, innerSize, innerSize, 20);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fill();
          ctx.clip();

          ctx.save();
          ctx.translate(innerX, innerY);
          const ratio = Math.max(innerSize / overlay.width, innerSize / overlay.height);
          const drawWidth = overlay.width * ratio;
          const drawHeight = overlay.height * ratio;
          const dx = (innerSize - drawWidth) / 2;
          const dy = (innerSize - drawHeight) / 2;
          ctx.drawImage(overlay, dx, dy, drawWidth, drawHeight);
          ctx.restore();

          ctx.restore();

          ctx.save();
          ctx.beginPath();
          drawRoundedRectPath(ctx, innerX, innerY, innerSize, innerSize, 20);
          ctx.closePath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = accentColor;
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(80, canvas.height - 200);
        ctx.rotate(-0.12);
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, 240, 36);
        ctx.restore();

        if (onReady) {
          onReady();
        }
      } catch (error) {
        console.warn('omg-preview-canvas draw failed', error);
        setTainted(true);
      }
    };

    const baseImg = createImage(baseImage);
    baseImg.onload = () => {
      if (cancelled) return;
      baseLoaded = true;
      if (!overlayImage) {
        draw(baseImg);
        return;
      }
      if (overlayLoaded) {
        draw(baseImg, overlayImg);
      }
    };
    baseImg.onerror = () => {
      if (!cancelled) {
        setTainted(true);
      }
    };

    let overlayImg: HTMLImageElement | null = null;
    if (overlayImage) {
      overlayImg = createImage(overlayImage);
      overlayImg.onload = () => {
        if (cancelled) return;
        overlayLoaded = true;
        if (baseLoaded) {
          draw(baseImg, overlayImg);
        }
      };
      overlayImg.onerror = () => {
        overlayLoaded = false;
        if (baseLoaded) {
          draw(baseImg, null);
        }
      };
    }

    return () => {
      cancelled = true;
    };
  }, [baseImage, overlayImage, title, subtitle, safeStats, accentColor, shouldRender, onReady]);

  if (!shouldRender || tainted) {
    return (
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-[40px] border border-white/5 bg-[radial-gradient(circle_at_top,_#1f1f1f,_#050505)]',
          className,
        )}
        style={{ aspectRatio: '3 / 4' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-8">
          {title ? <p className="text-3xl font-semibold text-white">{title}</p> : null}
          {subtitle ? <p className="text-sm text-neutral-300">{subtitle}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full overflow-hidden rounded-[40px] border border-white/5 shadow-2xl', className)}
      style={{ aspectRatio: '3 / 4' }}
    />
  );
};

export default OmgPreviewCanvas;
