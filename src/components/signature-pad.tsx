"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  onChange: (dataUrl: string) => void;
};

function canvasColors() {
  const styles = getComputedStyle(document.documentElement);
  const surface = styles.getPropertyValue("--surface-2").trim() || "#f5f8f7";
  const ink = styles.getPropertyValue("--ink").trim() || "#0b1f1c";
  return { surface, ink };
}

export function SignaturePad({ name, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { surface, ink } = canvasColors();
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasStroke(true);
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasStroke(true);
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { surface, ink } = canvasColors();
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = ink;
    setHasStroke(false);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">Signature on glass</label>
        <button type="button" onClick={clear} className="btn btn-ghost min-h-9 px-3 text-xs">
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={200}
        className="h-40 w-full touch-none rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] sm:h-44"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      {!hasStroke && (
        <p className="text-xs text-[var(--muted)]">
          Student or guardian must sign before the issue can be saved.
        </p>
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}
