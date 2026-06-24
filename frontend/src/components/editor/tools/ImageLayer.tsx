"use client";

import React, { useRef } from 'react';
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

    // Filter image annotations
    const pageAnnotations = annotations.filter(a => a.page === pageNumber && a.type === 'image');

    const handleMouseDown = (e: React.MouseEvent, ann: typeof annotations[0]) => {
        if (tool !== 'select') return;
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

                // We'd ideally get image dimensions here, but defaulting for now
                dispatch(addAnnotation({
                    id,
                    type: 'image',
                    page: pageNumber,
                    x,
                    y,
                    content: url, // Using content field for URL
                    opacity: 1,
                    size: 100 // Using size for width
                }));

                dispatch(setSelectedAnnotationId(id));
                // Optional: switch back to select tool after placement?
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
            {/* Interaction Layer */}
            {tool === 'image' && (
                <div
                    className="absolute inset-0"
                    onClick={handleClick}
                />
            )}

            {/* Rendered Images */}
            {pageAnnotations.map(ann => (
                <div
                    key={ann.id}
                    className={`absolute border ${selectedAnnotationId === ann.id ? 'border-indigo-500' : 'border-transparent'} ${tool === 'select' ? 'cursor-move' : ''}`}
                    style={{
                        left: ann.x * scale,
                        top: ann.y * scale,
                        width: (ann.size || 100) * scale,
                        opacity: ann.opacity ?? 1,
                        pointerEvents: (tool === 'select' || tool === 'image' || tool === 'erase') ? 'auto' : 'none'
                    }}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={ann.content}
                        alt="annotation"
                        className="w-full h-auto pointer-events-none select-none"
                        draggable={false}
                    />
                </div>
            ))}
        </div>
    );
};
