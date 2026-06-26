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

export const DrawLayer: React.FC<DrawLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations } = useSelector((state: RootState) => state.canvas);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
    const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
    const [currentPt, setCurrentPt] = useState<{ x: number; y: number } | null>(null);

    // Active stroke settings from local UI defaults (we can make color customizable or use standard properties)
    const drawColor = tool === 'highlight' ? '#eab308' : '#000000';
    const drawSize = tool === 'highlight' ? 12 : 2;

    // Filter drawing and shape annotations for this page
    const pageAnnotations = annotations.filter(
        (a) =>
            a.page === pageNumber &&
            !a.isDeleted &&
            (a.type === 'draw' ||
                a.type === 'line' ||
                a.type === 'arrow' ||
                a.type === 'rectangle' ||
                a.type === 'highlight')
    );

    const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size: number) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = size * scale;
        ctx.stroke();

        // Draw arrowhead at end coordinate
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 12 * scale;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    };

    const drawRectangle = (
        ctx: CanvasRenderingContext2D,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        size: number,
        fillColor?: string
    ) => {
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);

        ctx.strokeStyle = color;
        ctx.lineWidth = size * scale;
        ctx.strokeRect(rx, ry, rw, rh);

        if (fillColor && fillColor !== 'transparent') {
            ctx.fillStyle = fillColor;
            ctx.fillRect(rx, ry, rw, rh);
        }
    };

    const drawHighlight = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35; // Translucent
        ctx.fillRect(rx, ry, rw, rh);
        ctx.globalAlpha = 1.0; // Reset
    };

    // Redraw all annotations on the canvas when annotations or scale change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        pageAnnotations.forEach((ann) => {
            const strokeColor = ann.color || '#000000';
            const thickness = ann.size || 2;

            if (ann.type === 'draw' && ann.path && ann.path.length >= 2) {
                ctx.beginPath();
                ctx.moveTo(ann.path[0].x * scale, ann.path[0].y * scale);
                for (let i = 1; i < ann.path.length; i++) {
                    ctx.lineTo(ann.path[i].x * scale, ann.path[i].y * scale);
                }
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = thickness * scale;
                ctx.globalAlpha = ann.opacity ?? 1;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else if (ann.type === 'line' && ann.endX !== undefined && ann.endY !== undefined) {
                ctx.beginPath();
                ctx.moveTo(ann.x * scale, ann.y * scale);
                ctx.lineTo(ann.endX * scale, ann.endY * scale);
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = thickness * scale;
                ctx.globalAlpha = ann.opacity ?? 1;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else if (ann.type === 'arrow' && ann.endX !== undefined && ann.endY !== undefined) {
                ctx.globalAlpha = ann.opacity ?? 1;
                drawArrow(ctx, ann.x * scale, ann.y * scale, ann.endX * scale, ann.endY * scale, strokeColor, thickness);
                ctx.globalAlpha = 1.0;
            } else if (ann.type === 'rectangle' && ann.endX !== undefined && ann.endY !== undefined) {
                ctx.globalAlpha = ann.opacity ?? 1;
                drawRectangle(
                    ctx,
                    ann.x * scale,
                    ann.y * scale,
                    ann.endX * scale,
                    ann.endY * scale,
                    strokeColor,
                    thickness,
                    ann.fillColor
                );
                ctx.globalAlpha = 1.0;
            } else if (ann.type === 'highlight' && ann.endX !== undefined && ann.endY !== undefined) {
                drawHighlight(ctx, ann.x * scale, ann.y * scale, ann.endX * scale, ann.endY * scale, strokeColor);
            }
        });
    }, [pageAnnotations, scale]);

    const getCoords = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    const startDrawing = (e: React.MouseEvent) => {
        const isShapeOrDraw =
            tool === 'draw' ||
            tool === 'line' ||
            tool === 'arrow' ||
            tool === 'rectangle' ||
            tool === 'highlight';

        if (tool === 'erase') {
            handleEraserClick(e);
            return;
        }

        if (!isShapeOrDraw) return;

        setIsDrawing(true);
        const coords = getCoords(e);
        setStartPt(coords);
        setCurrentPt(coords);
        if (tool === 'draw') {
            setCurrentPath([coords]);
        }
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const coords = getCoords(e);
        setCurrentPt(coords);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !startPt) return;

        if (tool === 'draw') {
            setCurrentPath((prev) => [...prev, coords]);
            // Draw live pen stroke segments
            if (currentPath.length > 0) {
                const last = currentPath[currentPath.length - 1];
                ctx.beginPath();
                ctx.moveTo(last.x * scale, last.y * scale);
                ctx.lineTo(coords.x * scale, coords.y * scale);
                ctx.strokeStyle = drawColor;
                ctx.lineWidth = drawSize * scale;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }
        } else {
            // For straight lines and boxes, redraw previous elements, then draw current preview
            ctx.clearRect(0, 0, canvas!.width, canvas!.height);

            // Re-render permanent page annotations
            pageAnnotations.forEach((ann) => {
                const strokeColor = ann.color || '#000000';
                const thickness = ann.size || 2;

                if (ann.type === 'draw' && ann.path && ann.path.length >= 2) {
                    ctx.beginPath();
                    ctx.moveTo(ann.path[0].x * scale, ann.path[0].y * scale);
                    for (let i = 1; i < ann.path.length; i++) {
                        ctx.lineTo(ann.path[i].x * scale, ann.path[i].y * scale);
                    }
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = thickness * scale;
                    ctx.stroke();
                } else if (ann.type === 'line' && ann.endX !== undefined && ann.endY !== undefined) {
                    ctx.beginPath();
                    ctx.moveTo(ann.x * scale, ann.y * scale);
                    ctx.lineTo(ann.endX * scale, ann.endY * scale);
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = thickness * scale;
                    ctx.stroke();
                } else if (ann.type === 'arrow' && ann.endX !== undefined && ann.endY !== undefined) {
                    drawArrow(ctx, ann.x * scale, ann.y * scale, ann.endX * scale, ann.endY * scale, strokeColor, thickness);
                } else if (ann.type === 'rectangle' && ann.endX !== undefined && ann.endY !== undefined) {
                    drawRectangle(
                        ctx,
                        ann.x * scale,
                        ann.y * scale,
                        ann.endX * scale,
                        ann.endY * scale,
                        strokeColor,
                        thickness,
                        ann.fillColor
                    );
                } else if (ann.type === 'highlight' && ann.endX !== undefined && ann.endY !== undefined) {
                    drawHighlight(ctx, ann.x * scale, ann.y * scale, ann.endX * scale, ann.endY * scale, strokeColor);
                }
            });

            // Draw current active preview shape
            if (tool === 'line') {
                ctx.beginPath();
                ctx.moveTo(startPt.x * scale, startPt.y * scale);
                ctx.lineTo(coords.x * scale, coords.y * scale);
                ctx.strokeStyle = drawColor;
                ctx.lineWidth = drawSize * scale;
                ctx.stroke();
            } else if (tool === 'arrow') {
                drawArrow(ctx, startPt.x * scale, startPt.y * scale, coords.x * scale, coords.y * scale, drawColor, drawSize);
            } else if (tool === 'rectangle') {
                drawRectangle(ctx, startPt.x * scale, startPt.y * scale, coords.x * scale, coords.y * scale, drawColor, drawSize);
            } else if (tool === 'highlight') {
                drawHighlight(ctx, startPt.x * scale, startPt.y * scale, coords.x * scale, coords.y * scale, drawColor);
            }
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (startPt && currentPt) {
            const hasMoved = dist(startPt.x, startPt.y, currentPt.x, currentPt.y) > 2;

            if (tool === 'draw') {
                if (currentPath.length > 1) {
                    dispatch(
                        addAnnotation({
                            id: nanoid(),
                            type: 'draw',
                            page: pageNumber,
                            x: 0,
                            y: 0,
                            path: currentPath,
                            color: drawColor,
                            size: drawSize,
                            opacity: 1
                        })
                    );
                }
            } else if (hasMoved) {
                // Add straight line, arrow, rectangle, or highlight annotation
                dispatch(
                    addAnnotation({
                        id: nanoid(),
                        type: tool as 'line' | 'arrow' | 'rectangle' | 'highlight',
                        page: pageNumber,
                        x: startPt.x,
                        y: startPt.y,
                        endX: currentPt.x,
                        endY: currentPt.y,
                        color: drawColor,
                        size: drawSize,
                        opacity: 1,
                        fillColor: tool === 'rectangle' ? 'transparent' : undefined
                    })
                );
                // Return tool back to select
                dispatch(setTool('select'));
            }
        }

        setCurrentPath([]);
        setStartPt(null);
        setCurrentPt(null);
    };

    const handleEraserClick = (e: React.MouseEvent) => {
        const clickCoords = getCoords(e);
        const hitTolerance = 10; // Hit test radius in pixels

        // Find the topmost clicked annotation on this page
        for (let idx = pageAnnotations.length - 1; idx >= 0; idx--) {
            const ann = pageAnnotations[idx];

            if (ann.type === 'draw' && ann.path) {
                // Check if close to any path point
                const isHit = ann.path.some((pt) => dist(clickCoords.x, clickCoords.y, pt.x, pt.y) < hitTolerance);
                if (isHit) {
                    dispatch(deleteAnnotation(ann.id));
                    return;
                }
            } else if ((ann.type === 'line' || ann.type === 'arrow') && ann.endX !== undefined && ann.endY !== undefined) {
                // Check if close to line segment
                const d = distToSegment(clickCoords.x, clickCoords.y, ann.x, ann.y, ann.endX, ann.endY);
                if (d < hitTolerance) {
                    dispatch(deleteAnnotation(ann.id));
                    return;
                }
            } else if ((ann.type === 'rectangle' || ann.type === 'highlight') && ann.endX !== undefined && ann.endY !== undefined) {
                // Check if click is inside bounding box
                const isInside = inRect(clickCoords.x, clickCoords.y, ann.x, ann.y, ann.endX, ann.endY);
                if (isInside) {
                    dispatch(deleteAnnotation(ann.id));
                    return;
                }
            }
        }
    };

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-20 ${
                tool === 'draw' ||
                tool === 'line' ||
                tool === 'arrow' ||
                tool === 'rectangle' ||
                tool === 'highlight'
                    ? 'cursor-crosshair'
                    : tool === 'erase'
                    ? 'cursor-pointer'
                    : 'pointer-events-none'
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
        />
    );
};
