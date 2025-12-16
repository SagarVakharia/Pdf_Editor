"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { addAnnotation, updateAnnotation, setSelectedAnnotationId, removeAnnotation } from '../../../store/slices/canvasSlice';
import { nanoid } from '@reduxjs/toolkit';

interface TextLayerProps {
    pageNumber: number;
    scale: number;
}

export const TextLayer: React.FC<TextLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations, selectedAnnotationId } = useSelector((state: RootState) => state.canvas);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter annotations for this page
    const pageAnnotations = annotations.filter(a => a.page === pageNumber && a.type === 'text');

    const handleContainerClick = (e: React.MouseEvent) => {
        if (tool !== 'text') return;

        // Check if clicked exactly on container (not on existing annotation)
        if (e.target !== containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const id = nanoid();
        dispatch(addAnnotation({
            id,
            type: 'text',
            x,
            y,
            page: pageNumber,
            content: 'New Text',
            color: '#000000',
            size: 16
        }));
        dispatch(setSelectedAnnotationId(id));
    };

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 z-10 ${tool === 'text' ? 'cursor-text' : 'pointer-events-none'}`}
            onClick={handleContainerClick}
        >
            {pageAnnotations.map((ann) => (
                <div
                    key={ann.id}
                    className={`absolute p-1 border ${selectedAnnotationId === ann.id ? 'border-indigo-500 bg-white/10' : 'border-transparent hover:border-indigo-300'}`}
                    style={{
                        left: ann.x * scale,
                        top: ann.y * scale,
                        fontSize: (ann.size || 16) * scale,
                        color: ann.color,
                        pointerEvents: 'auto'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (tool === 'erase') {
                            dispatch(removeAnnotation(ann.id));
                            return;
                        }
                        dispatch(setSelectedAnnotationId(ann.id));
                    }}
                >
                    {selectedAnnotationId === ann.id ? (
                        <input
                            autoFocus
                            className="bg-transparent outline-none w-full min-w-[50px]"
                            value={ann.content}
                            onChange={(e) => dispatch(updateAnnotation({ ...ann, content: e.target.value }))}
                            onBlur={() => dispatch(setSelectedAnnotationId(null))}
                        />
                    ) : (
                        <span>{ann.content || 'Empty'}</span>
                    )}
                </div>
            ))}
        </div>
    );
};
