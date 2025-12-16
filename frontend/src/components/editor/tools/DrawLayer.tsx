"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { addAnnotation } from '../../../store/slices/canvasSlice';
import { nanoid } from '@reduxjs/toolkit';

interface DrawLayerProps {
    pageNumber: number;
    scale: number;
}

export const DrawLayer: React.FC<DrawLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations } = useSelector((state: RootState) => state.canvas);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);

    // Filter drawing annotations for this page
    const pageAnnotations = annotations.filter(a => a.page === pageNumber && (a.type === 'draw' || a.type === 'sign'));

    // Redraw all paths when annotations or scale change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions to match scaled page
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        pageAnnotations.forEach(ann => {
            if (!ann.path || ann.path.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(ann.path[0].x * scale, ann.path[0].y * scale);

            for (let i = 1; i < ann.path.length; i++) {
                ctx.lineTo(ann.path[i].x * scale, ann.path[i].y * scale);
            }

            ctx.strokeStyle = ann.color || '#000000';
            ctx.lineWidth = (ann.size || 2) * scale;
            ctx.globalAlpha = ann.opacity ?? 1;
            ctx.stroke();
            ctx.globalAlpha = 1; // Reset
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
        if (tool !== 'draw' && tool !== 'sign') return;
        setIsDrawing(true);
        const coords = getCoords(e);
        setCurrentPath([coords]);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || (tool !== 'draw' && tool !== 'sign')) return;
        const coords = getCoords(e);
        setCurrentPath(prev => [...prev, coords]);

        // Live render current path
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && currentPath.length > 0) {
            const last = currentPath[currentPath.length - 1];
            ctx.beginPath();
            ctx.moveTo(last.x * scale, last.y * scale);
            ctx.lineTo(coords.x * scale, coords.y * scale);
            ctx.strokeStyle = tool === 'sign' ? '#0000ff' : '#000000';
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentPath.length > 1) {
            dispatch(addAnnotation({
                id: nanoid(),
                type: tool === 'sign' ? 'sign' : 'draw',
                page: pageNumber,
                x: 0,
                y: 0,
                path: currentPath,
                color: tool === 'sign' ? '#0000ff' : '#000000',
                size: 2,
                opacity: 1
            }));
        }
        setCurrentPath([]);
    };

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-20 ${tool === 'draw' || tool === 'sign' ? 'cursor-crosshair' : 'pointer-events-none'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
        />
    );
};
