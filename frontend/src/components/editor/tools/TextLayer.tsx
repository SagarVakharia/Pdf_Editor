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

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-10 pointer-events-none"
        >
            {pageAnnotations.map((ann) => (
                <div
                    key={ann.id}
                    className={`absolute border ${selectedAnnotationId === ann.id ? 'border-indigo-500' : 'border-transparent hover:border-indigo-300'}`}
                    style={{
                        left: ann.x * scale,
                        top: ann.y * scale,
                        fontSize: (ann.size || 16) * scale,
                        color: ann.color,
                        backgroundColor: ann.backgroundColor || 'transparent',
                        pointerEvents: 'auto',
                        lineHeight: 1,
                        minWidth: ann.minWidth ? ann.minWidth * scale : 'auto',
                        minHeight: ann.minHeight ? ann.minHeight * scale : 'auto',
                        whiteSpace: 'nowrap',
                        fontFamily: ann.fontFamily,
                        fontWeight: ann.isBold ? 'bold' : 'normal',
                        fontStyle: ann.isItalic ? 'italic' : 'normal',
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
                            className="bg-transparent outline-none w-full min-w-[50px]"
                            value={ann.content || ''}
                            onChange={(e) => dispatch(updateAnnotation({ ...ann, content: e.target.value }))}
                        />
                    ) : (
                        <span>{ann.content || 'Empty'}</span>
                    )}
                </div>
            ))}
        </div>
    );
};
