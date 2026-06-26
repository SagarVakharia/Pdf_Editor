"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { addAnnotation, updateAnnotation, setSelectedAnnotationId, deleteAnnotation, updateAnnotationProperties } from '../../../store/slices/canvasSlice';
import { nanoid } from '@reduxjs/toolkit';

interface TextLayerProps {
    pageNumber: number;
    scale: number;
}

export const TextLayer: React.FC<TextLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations, selectedAnnotationId } = useSelector((state: RootState) => state.canvas);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageWidth, setPageWidth] = useState(595);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Keep page width updated
    useEffect(() => {
        const parent = containerRef.current?.parentElement;
        if (parent) {
            setPageWidth(parent.offsetWidth / scale);
        }
    }, [scale, annotations]);

    const pageAnnotations = annotations.filter(a => a.page === pageNumber && a.type === 'text');

    const handleMouseDown = (e: React.MouseEvent, ann: typeof annotations[0]) => {
        // Allow dragging regardless of tool (but not when clicking delete or typing)
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        if (target.closest('[data-delete-btn]')) return;

        e.stopPropagation();
        e.preventDefault();
        dispatch(setSelectedAnnotationId(ann.id));

        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = ann.x;
        const initialY = ann.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startX) / scale;
            const dy = (moveEvent.clientY - startY) / scale;
            dispatch(updateAnnotationProperties({
                id: ann.id,
                updates: {
                    x: initialX + dx,
                    y: initialY + dy
                }
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-10 pointer-events-none"
        >
            {/* 1. Render White Mask at original coordinates (if defined), regardless of whether annotation is deleted or empty */}
            {pageAnnotations.map((ann) => {
                if (ann.maskX === undefined || ann.maskY === undefined) return null;
                return (
                    <div
                        key={`mask-${ann.id}`}
                        className="absolute bg-white pointer-events-none"
                        style={{
                            left: ann.maskX * scale,
                            top: ann.maskY * scale,
                            width: (ann.maskWidth || 0) * scale,
                            height: (ann.maskHeight || 0) * scale,
                            zIndex: 1
                        }}
                    />
                );
            })}

            {/* 2. Render actual text overlay (only if not deleted) */}
            {pageAnnotations.filter(ann => !ann.isDeleted).map((ann) => {
                const maxW = Math.max(100, pageWidth - ann.x);
                const isSelected = selectedAnnotationId === ann.id;
                const isHovered = hoveredId === ann.id;
                const showControls = isSelected || isHovered;

                return (
                    <div
                        key={ann.id}
                        className={`absolute group ${
                            isSelected
                                ? 'border border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/20'
                                : 'border border-transparent hover:border-indigo-300/60 hover:bg-blue-50/30 dark:hover:bg-indigo-900/10'
                        } cursor-move rounded-sm transition-colors`}
                        style={{
                            left: ann.x * scale,
                            top: ann.y * scale,
                            fontSize: (ann.size || 16) * scale,
                            color: ann.color && ann.color !== 'transparent' ? ann.color : '#000000',
                            backgroundColor: isSelected
                                ? undefined  // let className handle selected bg
                                : (ann.backgroundColor && ann.backgroundColor !== 'transparent' ? ann.backgroundColor : 'transparent'),
                            pointerEvents: tool === 'erase' ? 'auto' : 'auto',
                            lineHeight: 1.2,
                            minWidth: ann.minWidth ? ann.minWidth * scale : 'auto',
                            minHeight: ann.minHeight ? ann.minHeight * scale : 'auto',
                            maxWidth: maxW * scale,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: ann.fontFamily,
                            fontWeight: ann.isBold ? 'bold' : 'normal',
                            fontStyle: ann.isItalic ? 'italic' : 'normal',
                            textAlign: ann.textAlign || 'left',
                            padding: '2px',
                            zIndex: 10
                        }}
                        onMouseEnter={() => setHoveredId(ann.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onMouseDown={(e) => handleMouseDown(e, ann)}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (tool === 'erase') {
                                dispatch(deleteAnnotation(ann.id));
                                return;
                            }
                            dispatch(setSelectedAnnotationId(ann.id));
                        }}
                    >
                        {/* Delete Button */}
                        {showControls && (
                            <button
                                data-delete-btn
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    dispatch(deleteAnnotation(ann.id));
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                                className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-150 z-50 text-xs leading-none"
                                style={{ fontSize: '10px', lineHeight: '1', pointerEvents: 'auto' }}
                                title="Delete"
                            >
                                ✕
                            </button>
                        )}

                        {isSelected ? (
                            <textarea
                                className="bg-transparent outline-none w-full border-0 p-0 m-0 resize-none overflow-hidden"
                                value={ann.content || ''}
                                onChange={(e) => dispatch(updateAnnotation({ ...ann, content: e.target.value }))}
                                autoFocus
                                style={{
                                    fontFamily: 'inherit',
                                    fontSize: 'inherit',
                                    fontWeight: 'inherit',
                                    fontStyle: 'inherit',
                                    color: 'inherit',
                                    lineHeight: 'inherit',
                                    textAlign: 'inherit',
                                    minHeight: '1.2em'
                                }}
                            />
                        ) : (
                            <span style={{ display: 'block', width: '100%' }}>{ann.content || 'Empty'}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
