"use client";

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setSelectedAnnotationId, deleteAnnotation, updateAnnotationProperties } from '../../../store/slices/canvasSlice';

interface StampLayerProps {
    pageNumber: number;
    scale: number;
}

export const StampLayer: React.FC<StampLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations, selectedAnnotationId } = useSelector((state: RootState) => state.canvas);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const pageAnnotations = annotations.filter(
        (a) => a.page === pageNumber && a.type === 'stamp' && !a.isDeleted
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
                const width = (ann.size || 120) * scale;
                const borderHex = ann.color || '#e2e8f0';

                // Light opacity background for the stamp body
                const bgR = parseInt(borderHex.slice(1, 3), 16);
                const bgG = parseInt(borderHex.slice(3, 5), 16);
                const bgB = parseInt(borderHex.slice(5, 7), 16);
                const rgbaBg = `rgba(${bgR}, ${bgG}, ${bgB}, 0.08)`;

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
                        className={`absolute flex items-center justify-center p-2 text-center rounded-lg select-none border-2 font-black tracking-widest uppercase text-xs md:text-sm transition-all cursor-move ${
                            isSelected
                                ? 'border-dashed border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                                : 'hover:scale-[1.02] shadow-sm hover:shadow-md'
                        } pointer-events-auto`}
                        style={{
                            left: ann.x * scale,
                            top: ann.y * scale,
                            width: width,
                            borderColor: borderHex,
                            color: borderHex,
                            backgroundColor: rgbaBg,
                            transform: 'rotate(-4deg)',
                            transformOrigin: 'center center'
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
                                style={{ fontSize: '10px', lineHeight: '1', pointerEvents: 'auto', transform: 'rotate(4deg)' }}
                                title="Delete"
                            >
                                ✕
                            </button>
                        )}

                        <span>{ann.content || 'APPROVED'}</span>
                    </div>
                );
            })}
        </div>
    );
};
