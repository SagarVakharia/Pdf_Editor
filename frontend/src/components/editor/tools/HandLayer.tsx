"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

interface HandLayerProps {
    scale: number;
}

export const HandLayer: React.FC<HandLayerProps> = ({ scale }) => {
    const { tool } = useSelector((state: RootState) => state.canvas);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

    useEffect(() => {
        if (tool !== 'hand') {
            setIsDragging(false);
        }
    }, [tool]);

    // We can't easily scroll the parent from here without a ref to it.
    // However, the PDFViewer renders this layer inside the scrollable container's child.
    // We need to attach listeners to the scrollable container really.
    // For now, let's assume we can traverse up to find the scrollable container.

    const getScrollContainer = () => {
        // The PDFViewer is inside: div.flex-1.overflow-auto...
        // This layer is: div.relative (page wrapper) -> div.flex.flex-col (Document) -> div (shadow) -> div (center) -> div.flex-1.overflow-auto
        // This is fragile. Stronger way: Pass a ref or Context.
        // For this task, I'll attempt to find the closest overflow-auto parent.
        let el = containerRef.current?.parentElement;
        while (el) {
            const style = window.getComputedStyle(el);
            if (style.overflowY === 'auto' || style.overflow === 'auto') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (tool !== 'hand') return;
        const scrollContainer = getScrollContainer();
        if (!scrollContainer) return;

        setIsDragging(true);
        setStartPos({ x: e.clientX, y: e.clientY });
        setScrollStart({ left: scrollContainer.scrollLeft, top: scrollContainer.scrollTop });
        document.body.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || tool !== 'hand') return;
        const scrollContainer = getScrollContainer();
        if (!scrollContainer) return;

        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;

        scrollContainer.scrollLeft = scrollStart.left - dx;
        scrollContainer.scrollTop = scrollStart.top - dy;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.body.style.cursor = '';
    };

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 z-30 ${tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};
