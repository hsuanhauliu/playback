import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { DrawTool, Point, Shape } from "../types";

export interface DrawingCanvasHandle {
  clear: () => void;
  undo: () => void;
}

interface Props {
  tool: DrawTool;
  color: string;
  lineWidth: number;
  className?: string;
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  const { points, tool, color, lineWidth } = shape;
  if (points.length === 0) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "pen") {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    return;
  }

  const [start, end] = [points[0], points[points.length - 1]];
  if (!end) return;

  if (tool === "line") {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (tool === "arrow") {
    drawArrow(ctx, start, end);
  } else if (tool === "rect") {
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (tool === "ellipse") {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === "angle" && points.length >= 2) {
    drawAngle(ctx, points, lineWidth);
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLen = 12;
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle - Math.PI / 6),
    end.y - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle + Math.PI / 6),
    end.y - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
}

function drawAngle(ctx: CanvasRenderingContext2D, points: Point[], lineWidth: number) {
  const [a, vertex, b] = points;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(vertex.x, vertex.y);
  if (b) ctx.lineTo(b.x, b.y);
  ctx.stroke();

  [a, vertex, b].filter(Boolean).forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, lineWidth * 0.8 + 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  if (b) {
    const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
    const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
    const mag1 = Math.hypot(v1.x, v1.y) || 1;
    const mag2 = Math.hypot(v2.x, v2.y) || 1;
    const dot = v1.x * v2.x + v1.y * v2.y;
    const angleDeg =
      (Math.acos(Math.min(Math.max(dot / (mag1 * mag2), -1), 1)) * 180) / Math.PI;

    // Sweep arc between the two rays.
    const radius = Math.min(mag1, mag2, 44) * 0.55;
    const a1 = Math.atan2(v1.y, v1.x);
    const a2 = Math.atan2(v2.y, v2.x);
    let delta = a2 - a1;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(lineWidth - 1, 1);
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, radius, a1, a1 + delta, delta < 0);
    ctx.stroke();
    ctx.restore();

    // Place the label outside the sweep, along the bisector.
    const bisect = a1 + delta / 2;
    const lx = vertex.x + Math.cos(bisect) * (radius + 20);
    const ly = vertex.y + Math.sin(bisect) * (radius + 20);

    const label = `${angleDeg.toFixed(1)}°`;
    ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Dark halo keeps the readout legible over bright footage.
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.lineJoin = "round";
    ctx.strokeText(label, lx, ly);
    ctx.fillText(label, lx, ly);
  }
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(
  ({ tool, color, lineWidth, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const shapesRef = useRef<Shape[]>([]);
    const [, forceRender] = useState(0);
    const activeShape = useRef<Shape | null>(null);
    const anglePointCount = useRef(0);

    const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const shape of shapesRef.current) drawShape(ctx, shape);
      if (activeShape.current) drawShape(ctx, activeShape.current);
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        shapesRef.current = [];
        activeShape.current = null;
        redraw();
      },
      undo: () => {
        shapesRef.current = shapesRef.current.slice(0, -1);
        redraw();
      },
    }));

    useEffect(() => {
      const resize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redraw();
      };
      resize();
      const observer = new ResizeObserver(resize);
      if (canvasRef.current?.parentElement) {
        observer.observe(canvasRef.current.parentElement);
      }
      return () => observer.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (tool === "none") return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const point = getPoint(e);

      if (tool === "erase") {
        shapesRef.current = shapesRef.current.filter((s) => {
          return !s.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 16);
        });
        redraw();
        return;
      }

      if (tool === "angle") {
        if (!activeShape.current) {
          activeShape.current = {
            id: crypto.randomUUID(),
            tool,
            points: [point],
            color,
            lineWidth,
          };
          anglePointCount.current = 1;
        } else {
          activeShape.current.points.push(point);
          anglePointCount.current += 1;
          if (anglePointCount.current >= 3) {
            shapesRef.current.push(activeShape.current);
            activeShape.current = null;
            anglePointCount.current = 0;
          }
        }
        redraw();
        return;
      }

      activeShape.current = {
        id: crypto.randomUUID(),
        tool,
        points: [point],
        color,
        lineWidth,
      };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!activeShape.current || tool === "angle" || tool === "erase") return;
      const point = getPoint(e);
      if (tool === "pen") {
        activeShape.current.points.push(point);
      } else {
        activeShape.current.points = [activeShape.current.points[0], point];
      }
      redraw();
    };

    const onPointerUp = () => {
      if (activeShape.current && tool !== "angle") {
        shapesRef.current.push(activeShape.current);
        activeShape.current = null;
        redraw();
        forceRender((n) => n + 1);
      }
    };

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ touchAction: tool === "none" ? "auto" : "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    );
  },
);

DrawingCanvas.displayName = "DrawingCanvas";
