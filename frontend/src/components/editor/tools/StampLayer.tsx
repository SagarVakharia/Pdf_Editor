"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setSelectedAnnotationId, deleteAnnotation, updateAnnotationProperties } from '../../../store/slices/canvasSlice';

interface StampLayerProps {
    pageNumber: number;
    scale: number;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLE_SIZE = 8; // px (screen)

const HANDLE_POSITIONS: Record<ResizeHandle, { top: string; left: string; cursor: string }> = {
    nw: { top: '0',   left: '0',   cursor: 'nw-resize' },
    n:  { top: '0',   left: '50%', cursor: 'n-resize'  },
    ne: { top: '0',   left: '100%',cursor: 'ne-resize' },
    e:  { top: '50%', left: '100%',cursor: 'e-resize'  },
    se: { top: '100%',left: '100%',cursor: 'se-resize' },
    s:  { top: '100%',left: '50%', cursor: 's-resize'  },
    sw: { top: '100%',left: '0',   cursor: 'sw-resize' },
    w:  { top: '50%', left: '0',   cursor: 'w-resize'  },
};

const MIN_SIZE = 40; // minimum stamp dimension in PDF-space units

export const StampLayer: React.FC<StampLayerProps> = ({ pageNumber, scale }) => {
    const dispatch = useDispatch();
    const { tool, annotations, selectedAnnotationId } = useSelector((state: RootState) => state.canvas);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const pageAnnotations = annotations.filter(
        (a) => a.page === pageNumber && a.type === 'stamp' && !a.isDeleted
    );

    // ── Drag to move ──────────────────────────────────────────────────────────
    const handleDragStart = useCallback((e: React.MouseEvent, ann: typeof annotations[0]) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-delete-btn]') || target.closest('[data-resize-handle]')) return;

        e.stopPropagation();
        e.preventDefault();
        dispatch(setSelectedAnnotationId(ann.id));

        const startX = e.clientX;
        const startY = e.clientY;
        const initX = ann.x;
        const initY = ann.y;

        const onMove = (me: MouseEvent) => {
            dispatch(updateAnnotationProperties({
                id: ann.id,
                updates: {
                    x: initX + (me.clientX - startX) / scale,
                    y: initY + (me.clientY - startY) / scale,
                }
            }));
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [dispatch, scale]);

    // ── Resize handles ────────────────────────────────────────────────────────
    const handleResizeStart = useCallback((
        e: React.MouseEvent,
        ann: typeof annotations[0],
        handle: ResizeHandle
    ) => {
        e.stopPropagation();
        e.preventDefault();
        dispatch(setSelectedAnnotationId(ann.id));

        const startX = e.clientX;
        const startY = e.clientY;

        // Current stamp box in PDF-space
        const initX  = ann.x;
        const initY  = ann.y;
        const initW  = ann.minWidth  ?? (ann.size ?? 120);
        const initH  = ann.minHeight ?? (ann.size ?? 60);

        const onMove = (me: MouseEvent) => {
            const dx = (me.clientX - startX) / scale;
            const dy = (me.clientY - startY) / scale;

            let newX = initX;
            let newY = initY;
            let newW = initW;
            let newH = initH;

            // West edge
            if (handle === 'nw' || handle === 'w' || handle === 'sw') {
                newX = initX + dx;
                newW = Math.max(MIN_SIZE, initW - dx);
                if (newW === MIN_SIZE) newX = initX + initW - MIN_SIZE;
            }
            // East edge
            if (handle === 'ne' || handle === 'e' || handle === 'se') {
                newW = Math.max(MIN_SIZE, initW + dx);
            }
            // North edge
            if (handle === 'nw' || handle === 'n' || handle === 'ne') {
                newY = initY + dy;
                newH = Math.max(MIN_SIZE, initH - dy);
                if (newH === MIN_SIZE) newY = initY + initH - MIN_SIZE;
            }
            // South edge
            if (handle === 'sw' || handle === 's' || handle === 'se') {
                newH = Math.max(MIN_SIZE, initH + dy);
            }

            dispatch(updateAnnotationProperties({
                id: ann.id,
                updates: { x: newX, y: newY, minWidth: newW, minHeight: newH }
            }));
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [dispatch, scale]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
            {pageAnnotations.map((ann) => {
                const w = (ann.minWidth  ?? (ann.size ?? 120)) * scale;
                const h = (ann.minHeight ?? Math.max(36, (ann.size ?? 120) * 0.45)) * scale;

                const borderHex = ann.color || '#e2e8f0';
                const bgR = parseInt(borderHex.slice(1, 3), 16);
                const bgG = parseInt(borderHex.slice(3, 5), 16);
                const bgB = parseInt(borderHex.slice(5, 7), 16);
                const rgbaBg = `rgba(${bgR}, ${bgG}, ${bgB}, 0.08)`;

                const isSelected = selectedAnnotationId === ann.id;
                const isHovered  = hoveredId === ann.id;
                const showControls = isSelected || isHovered;

                return (
                    <div
                        key={ann.id}
                        onMouseEnter={() => setHoveredId(ann.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onMouseDown={(e) => handleDragStart(e, ann)}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (tool === 'erase') {
                                dispatch(deleteAnnotation(ann.id));
                                return;
                            }
                            dispatch(setSelectedAnnotationId(ann.id));
                        }}
                        className={`absolute flex items-center justify-center text-center select-none border-2 font-black tracking-widest uppercase cursor-move pointer-events-auto transition-shadow ${
                            isSelected
                                ? 'border-dashed ring-2 ring-indigo-500/30 shadow-lg'
                                : 'shadow-sm hover:shadow-md'
                        }`}
                        style={{
                            left:            ann.x * scale,
                            top:             ann.y * scale,
                            width:           w,
                            height:          h,
                            borderColor:     isSelected ? '#6366f1' : borderHex,
                            color:           borderHex,
                            backgroundColor: rgbaBg,
                            borderStyle:     isSelected ? 'dashed' : 'solid',
                            // overflow must stay VISIBLE so the delete button outside the box isn't clipped
                            boxSizing:       'border-box',
                        }}
                    >
                        {/* Text wrapper — clips only the text, not the absolute buttons outside */}
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px 6px',
                                boxSizing: 'border-box',
                            }}
                        >
                            <span
                                className="pointer-events-none leading-none w-full text-center block"
                                style={{
                                    fontSize: Math.max(8, Math.min(w * 0.13, h * 0.55)),
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {ann.content || 'APPROVED'}
                            </span>
                        </div>


                        {/* Delete button */}
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
                                className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-50 transition-all duration-150"
                                style={{ fontSize: 10, lineHeight: 1, pointerEvents: 'auto' }}
                                title="Delete"
                            >
                                ✕
                            </button>
                        )}

                        {/* 8 resize handles — only visible when selected */}
                        {isSelected && (Object.keys(HANDLE_POSITIONS) as ResizeHandle[]).map((handle) => {
                            const pos = HANDLE_POSITIONS[handle];
                            return (
                                <div
                                    key={handle}
                                    data-resize-handle
                                    onMouseDown={(e) => handleResizeStart(e, ann, handle)}
                                    style={{
                                        position:    'absolute',
                                        top:         pos.top,
                                        left:        pos.left,
                                        width:       HANDLE_SIZE,
                                        height:      HANDLE_SIZE,
                                        marginTop:   -(HANDLE_SIZE / 2),
                                        marginLeft:  -(HANDLE_SIZE / 2),
                                        background:  '#6366f1',
                                        border:      '2px solid #fff',
                                        borderRadius: 2,
                                        cursor:      pos.cursor,
                                        pointerEvents: 'auto',
                                        zIndex:      60,
                                        boxShadow:   '0 1px 4px rgba(0,0,0,0.3)',
                                    }}
                                />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
