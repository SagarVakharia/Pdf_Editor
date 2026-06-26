"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { addAnnotation, deleteAnnotation, setTool, setSelectedAnnotationId } from '../../../store/slices/canvasSlice';
import { nanoid } from '@reduxjs/toolkit';

interface DrawLayerProps {
    pageNumber: number;
    scale: number;
}

// Helper functions for eraser click detection
const dist = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
};

const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const l2 = (ax - bx) ** 2 + (ay - by) ** 2;
    if (l2 === 0) return dist(px, py, ax, ay);
    let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * (bx - ax);
    const projY = ay + t * (by - ay);
    return dist(px, py, projX, projY);
};

const inRect = (px: number, py: number, rx1: number, ry1: number, rx2: number, ry2: number) => {
    const left = Math.min(rx1, rx2);
    const right = Math.max(rx1, rx2);
    const top = Math.min(ry1, ry2);
    const bottom = Math.max(ry1, ry2);
    return px >= left && px <= right && py >= top && py <= bottom;
};

// ─── Canvas shape drawing helpers ───────────────────────────────────────────

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 14;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
};

const drawRectangle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size: number, fillColor?: string) => {
    const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
    if (fillColor && fillColor !== 'transparent') { ctx.fillStyle = fillColor; ctx.fillRect(rx, ry, rw, rh); }
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.strokeRect(rx, ry, rw, rh);
};

const drawCircle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size: number, fillColor?: string) => {
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (fillColor && fillColor !== 'transparent') { ctx.fillStyle = fillColor; ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke();
};

const drawTriangle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size: number, fillColor?: string) => {
    const cx = (x1 + x2) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);
    ctx.closePath();
    if (fillColor && fillColor !== 'transparent') { ctx.fillStyle = fillColor; ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke();
};

const drawStar = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size: number, fillColor?: string) => {
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const outerR = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
    const innerR = outerR * 0.4;
    const points = 5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fillColor && fillColor !== 'transparent') { ctx.fillStyle = fillColor; ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke();
};

const drawDiamond = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size: number, fillColor?: string) => {
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const hw = Math.abs(x2 - x1) / 2, hh = Math.abs(y2 - y1) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    if (fillColor && fillColor !== 'transparent') { ctx.fillStyle = fillColor; ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke();
};

const drawHighlight = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
    const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
    ctx.fillStyle = color; ctx.globalAlpha = 0.35;
    ctx.fillRect(rx, ry, Math.abs(x2 - x1), Math.abs(y2 - y1));
    ctx.globalAlpha = 1.0;
};

// Dispatch a shape annotation to the canvas
const renderShapeOnCtx = (
    ctx: CanvasRenderingContext2D,
    ann: { type: string; x: number; y: number; endX?: number; endY?: number; color?: string; size?: number; fillColor?: string; path?: { x: number; y: number }[]; opacity?: number },
    scale: number
) => {
    const color = ann.color || '#000000';
    const size = (ann.size || 2) * scale;
    const fill = ann.fillColor;
    const x1 = ann.x * scale, y1 = ann.y * scale;
    const x2 = (ann.endX ?? ann.x) * scale, y2 = (ann.endY ?? ann.y) * scale;
    ctx.globalAlpha = ann.opacity ?? 1;

    switch (ann.type) {
        case 'draw':
            if (ann.path && ann.path.length >= 2) {
                ctx.beginPath();
                ctx.moveTo(ann.path[0].x * scale, ann.path[0].y * scale);
                for (let i = 1; i < ann.path.length; i++) ctx.lineTo(ann.path[i].x * scale, ann.path[i].y * scale);
                ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke();
            }
            break;
        case 'line':
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
            ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke();
            break;
        case 'arrow': drawArrow(ctx, x1, y1, x2, y2, color, size); break;
        case 'rectangle': drawRectangle(ctx, x1, y1, x2, y2, color, size, fill); break;
        case 'circle': drawCircle(ctx, x1, y1, x2, y2, color, size, fill); break;
        case 'triangle': drawTriangle(ctx, x1, y1, x2, y2, color, size, fill); break;
        case 'star': drawStar(ctx, x1, y1, x2, y2, color, size, fill); break;
        case 'diamond': drawDiamond(ctx, x1, y1, x2, y2, color, size, fill); break;
        case 'highlight': drawHighlight(ctx, x1, y1, x2, y2, color); break;
    }
    ctx.globalAlpha = 1.0;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DrawLayer: React.FC<DrawLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations, activeShapeType } = useSelector((state: RootState) => state.canvas);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
    const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
    const [currentPt, setCurrentPt] = useState<{ x: number; y: number } | null>(null);

    const isShapeTool = (t: string) => ['draw', 'line', 'arrow', 'rectangle', 'highlight', 'circle', 'triangle', 'star', 'diamond', 'shape'].includes(t);

    const drawColor = tool === 'highlight' ? '#eab308' : '#000000';
    const drawSize = tool === 'highlight' ? 12 : 2;

    // For 'shape' tool, use activeShapeType
    const effectiveTool = tool === 'shape' ? activeShapeType : tool;

    const pageAnnotations = annotations.filter(
        (a) => a.page === pageNumber && !a.isDeleted &&
            (a.type === 'draw' || a.type === 'line' || a.type === 'arrow' || a.type === 'rectangle' || a.type === 'highlight' || a.type === 'circle' || a.type === 'triangle' || a.type === 'star' || a.type === 'diamond')
    );

    // Full canvas redraw
    const redrawAll = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        pageAnnotations.forEach((ann) => renderShapeOnCtx(ctx, ann, scale));
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const parent = canvas.parentElement;
        if (parent) { canvas.width = parent.offsetWidth; canvas.height = parent.offsetHeight; }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        redrawAll(ctx, canvas);
    }, [pageAnnotations, scale]);

    const getCoords = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (tool === 'erase') { handleEraserClick(e); return; }
        if (!isShapeTool(tool)) return;
        setIsDrawing(true);
        const coords = getCoords(e);
        setStartPt(coords); setCurrentPt(coords);
        if (effectiveTool === 'draw') setCurrentPath([coords]);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const coords = getCoords(e);
        setCurrentPt(coords);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !startPt) return;

        if (effectiveTool === 'draw') {
            setCurrentPath((prev) => [...prev, coords]);
            if (currentPath.length > 0) {
                const last = currentPath[currentPath.length - 1];
                ctx.beginPath();
                ctx.moveTo(last.x * scale, last.y * scale);
                ctx.lineTo(coords.x * scale, coords.y * scale);
                ctx.strokeStyle = drawColor; ctx.lineWidth = drawSize * scale;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
            }
        } else {
            // Preview mode: redraw all saved + current preview
            redrawAll(ctx, canvas!);
            renderShapeOnCtx(ctx, {
                type: effectiveTool,
                x: startPt.x, y: startPt.y, endX: coords.x, endY: coords.y,
                color: drawColor, size: drawSize, fillColor: 'transparent', opacity: 1
            }, scale);
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (startPt && currentPt) {
            const hasMoved = dist(startPt.x, startPt.y, currentPt.x, currentPt.y) > 2;
            if (effectiveTool === 'draw') {
                if (currentPath.length > 1) {
                    dispatch(addAnnotation({ id: nanoid(), type: 'draw', page: pageNumber, x: 0, y: 0, path: currentPath, color: drawColor, size: drawSize, opacity: 1 }));
                }
            } else if (hasMoved) {
                dispatch(addAnnotation({
                    id: nanoid(),
                    type: effectiveTool as 'line' | 'arrow' | 'rectangle' | 'highlight' | 'circle' | 'triangle' | 'star' | 'diamond',
                    page: pageNumber, x: startPt.x, y: startPt.y, endX: currentPt.x, endY: currentPt.y,
                    color: drawColor, size: drawSize, opacity: 1, fillColor: 'transparent'
                }));
                if (tool !== 'draw') dispatch(setTool('select'));
            }
        }
        setCurrentPath([]); setStartPt(null); setCurrentPt(null);
    };

    const handleEraserClick = (e: React.MouseEvent) => {
        const clickCoords = getCoords(e);
        const hitTolerance = 10;
        for (let idx = pageAnnotations.length - 1; idx >= 0; idx--) {
            const ann = pageAnnotations[idx];
            if (ann.type === 'draw' && ann.path) {
                const isHit = ann.path.some((pt) => dist(clickCoords.x, clickCoords.y, pt.x, pt.y) < hitTolerance);
                if (isHit) { dispatch(deleteAnnotation(ann.id)); return; }
            } else if ((ann.type === 'line' || ann.type === 'arrow') && ann.endX !== undefined && ann.endY !== undefined) {
                const d = distToSegment(clickCoords.x, clickCoords.y, ann.x, ann.y, ann.endX, ann.endY);
                if (d < hitTolerance) { dispatch(deleteAnnotation(ann.id)); return; }
            } else if (['rectangle', 'highlight', 'circle', 'triangle', 'star', 'diamond'].includes(ann.type) && ann.endX !== undefined && ann.endY !== undefined) {
                if (inRect(clickCoords.x, clickCoords.y, ann.x, ann.y, ann.endX, ann.endY)) { dispatch(deleteAnnotation(ann.id)); return; }
            }
        }
    };

    const isActive = isShapeTool(tool);
    const cursorClass = isActive ? (tool === 'erase' ? 'cursor-pointer' : 'cursor-crosshair') : 'pointer-events-none';

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-20 ${cursorClass}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
        />
    );
};
