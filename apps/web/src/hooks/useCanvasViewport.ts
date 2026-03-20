import { useState, useEffect, useRef, useCallback } from "react";
import type { ViewportState } from "@hex/game-core";

const DEFAULT_ZOOM = 28;
const MIN_ZOOM = 8;
const MAX_ZOOM = 80;

export function useCanvasViewport(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [viewport, setViewport] = useState<ViewportState>({
    centerX: 0,
    centerY: 0,
    zoom: DEFAULT_ZOOM,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartCenterX: 0,
    dragStartCenterY: 0,
  });

  const vpRef = useRef(viewport);
  vpRef.current = viewport;

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setViewport((v) => {
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor));
      return { ...v, zoom: newZoom };
    });
  }, []);

  const onMouseDown = useCallback((e: MouseEvent) => {
    setViewport((v) => ({
      ...v,
      isDragging: true,
      dragStartX: e.clientX,
      dragStartY: e.clientY,
      dragStartCenterX: v.centerX,
      dragStartCenterY: v.centerY,
    }));
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const v = vpRef.current;
    if (!v.isDragging) return;
    const dx = (e.clientX - v.dragStartX) / v.zoom;
    const dy = (e.clientY - v.dragStartY) / v.zoom;
    setViewport((vv) => ({
      ...vv,
      centerX: v.dragStartCenterX - dx,
      centerY: v.dragStartCenterY - dy,
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    setViewport((v) => ({ ...v, isDragging: false }));
  }, []);

  // Touch support
  const lastTouchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setViewport((v) => ({
        ...v,
        isDragging: true,
        dragStartX: t.clientX,
        dragStartY: t.clientY,
        dragStartCenterX: v.centerX,
        dragStartCenterY: v.centerY,
      }));
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      lastTouchRef.current = {
        dist: Math.hypot(dx, dy),
        cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const v = vpRef.current;
      if (!v.isDragging) return;
      const t = e.touches[0];
      const dx = (t.clientX - v.dragStartX) / v.zoom;
      const dy = (t.clientY - v.dragStartY) / v.zoom;
      setViewport((vv) => ({
        ...vv,
        centerX: v.dragStartCenterX - dx,
        centerY: v.dragStartCenterY - dy,
      }));
    } else if (e.touches.length === 2 && lastTouchRef.current) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = newDist / lastTouchRef.current.dist;
      lastTouchRef.current.dist = newDist;
      setViewport((v) => ({
        ...v,
        zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor)),
      }));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    setViewport((v) => ({ ...v, isDragging: false }));
    lastTouchRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    canvasRef,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  ]);

  const resetView = useCallback(() => {
    setViewport((v) => ({ ...v, centerX: 0, centerY: 0, zoom: DEFAULT_ZOOM }));
  }, []);

  return { viewport, setViewport, resetView };
}
