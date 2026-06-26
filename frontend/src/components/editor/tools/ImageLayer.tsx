"use client";

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { addAnnotation, setSelectedAnnotationId, setTool, deleteAnnotation, updateAnnotationProperties } from '../../../store/slices/canvasSlice';
import { nanoid } from '@reduxjs/toolkit';

interface ImageLayerProps {
    pageNumber: number;
    scale: number;
}

export const ImageLayer: React.FC<ImageLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations, selectedAnnotationId } = useSelector((state: RootState) => state.canvas);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Filter image annotations
    const pageAnnotations = annotations.filter(a => a.page === pageNumber && a.type === 'image');

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

    const handleUpload = (x: number, y: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const url = URL.createObjectURL(file);
                const id = nanoid();

                dispatch(addAnnotation({
                    id,
                    type: 'image',
                    page: pageNumber,
                    x,
                    y,
                    content: url,
                    opacity: 1,
                    size: 100
                }));

                dispatch(setSelectedAnnotationId(id));
                dispatch(setTool('select'));
            }
        };
        input.click();
    };

    const handleClick = (e: React.MouseEvent) => {
        if (tool !== 'image') return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        handleUpload(x, y);
    };

    return (
        <div className={`absolute inset-0 z-20 ${tool === 'image' ? 'cursor-copy' : 'pointer-events-none'}`}>
            {/* Interaction Layer for placing new image */}
            {tool === 'image' && (
                <div
                    className="absolute inset-0"
                    onClick={handleClick}
                />
            )}

            {/* Rendered Images */}
            {pageAnnotations.map(ann => {
                const isSelected = selectedAnnotationId === ann.id;
                const isHovered = hoveredId === ann.id;
                const showControls = isSelected || isHovered;

                return (
                    <div
                        key={ann.id}
                        className={`absolute border ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent hover:border-indigo-300'} cursor-move`}
                        style={{
                            left: ann.x * scale,
                            top: ann.y * scale,
                            width: (ann.size || 100) * scale,
                            opacity: ann.opacity ?? 1,
                            pointerEvents: 'auto'
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

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={ann.content}
                            alt="annotation"
                            className="w-full h-auto pointer-events-none select-none"
                            draggable={false}
                        />
                    </div>
                );
            })}
        </div>
    );
};
