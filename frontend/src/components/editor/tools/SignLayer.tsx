"use client";

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setSelectedAnnotationId, deleteAnnotation, updateAnnotationProperties } from '../../../store/slices/canvasSlice';

interface SignLayerProps {
    pageNumber: number;
    scale: number;
}

export const SignLayer: React.FC<SignLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations, selectedAnnotationId } = useSelector((state: RootState) => state.canvas);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const pageAnnotations = annotations.filter(
        (a) => a.page === pageNumber && a.type === 'sign' && !a.isDeleted
    );

    const handleMouseDown = (e: React.MouseEvent, ann: typeof annotations[0]) => {
        const target = e.target as HTMLElement;
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
            dispatch(
                updateAnnotationProperties({
                    id: ann.id,
                    updates: {
                        x: initialX + dx,
                        y: initialY + dy
                    }
                })
            );
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
            {pageAnnotations.map((ann) => {
                const width = (ann.minWidth || 100) * scale;
                const height = (ann.minHeight || 50) * scale;
                const isSelected = selectedAnnotationId === ann.id;
                const isHovered = hoveredId === ann.id;
                const showControls = isSelected || isHovered;

                return (
                    <div
                        key={ann.id}
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
                        className={`absolute flex items-center justify-center cursor-move transition-all ${
                            isSelected
                                ? 'border border-dashed border-indigo-500 ring-2 ring-indigo-500/20'
                                : 'hover:border hover:border-dashed hover:border-gray-400'
                        } pointer-events-auto`}
                        style={{
                            left: ann.x * scale,
                            top: ann.y * scale,
                            width: width,
                            height: height
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

                        {ann.path ? (
                            <svg
                                width="100%"
                                height="100%"
                                viewBox={`0 0 ${ann.minWidth} ${ann.minHeight}`}
                                style={{ pointerEvents: 'none' }}
                            >
                                <path
                                    d={`M ${ann.path[0]?.x} ${ann.path[0]?.y} ` + ann.path.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
                                    stroke={ann.color || '#000000'}
                                    strokeWidth={ann.size || 2}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ) : (
                            <span style={{ fontFamily: 'Dancing Script, cursive', fontSize: height * 0.8, color: ann.color || '#000000' }}>
                                {ann.content}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
