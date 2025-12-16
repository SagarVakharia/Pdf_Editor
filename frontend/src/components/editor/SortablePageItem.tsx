import React from 'react';
import { Page } from 'react-pdf';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, RotateCw, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

interface PageConfig {
    id: string;
    originalIndex: number;
    rotation: number;
    isExtracted?: boolean;
}

interface SortablePageItemProps {
    page: PageConfig;
    index: number;
    isActive: boolean;
    onRotate: (id: string, rotation: number) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    onClick: () => void;
}

export const SortablePageItem: React.FC<SortablePageItemProps> = ({
    page,
    index,
    isActive,
    onRotate,
    onDelete,
    onMove,
    onClick
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: page.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleRotate = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newRotation = (page.rotation + 90) % 360;
        onRotate(page.id, newRotation);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(page.id);
    };

    const handleMoveUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMove(page.id, 'up');
    };

    const handleMoveDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMove(page.id, 'down');
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={`
                group relative bg-surface rounded-lg p-3 border-2 transition-all hover:border-indigo-500/50
                ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent'}
            `}
        >
            {/* Header / Controls */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing text-slate-500 hover:text-white"
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Page {index + 1}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleMoveUp} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Move Up">
                        <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={handleMoveDown} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Move Down">
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    <button onClick={handleRotate} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Rotate">
                        <RotateCw className="w-3 h-3" />
                    </button>
                    <button onClick={handleDelete} className="p-1 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-300" title="Delete">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Thumbnail */}
            <div className="aspect-[3/4] bg-white rounded flex items-center justify-center relative overflow-hidden">
                {page.isExtracted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-10 font-medium pointer-events-none">
                        Extracted
                    </div>
                )}
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-300 text-[10px] select-none pointer-events-none">
                    {/* Render the actual PDF page thumbnail */}
                    <div style={{ transform: `rotate(${page.rotation}deg)`, width: '100%', height: '100%' }} className="transition-transform duration-300 flex items-center justify-center">
                        <Page
                            pageNumber={page.originalIndex}
                            width={120} // Approximate sidebar width
                            scale={0.5} // Scale down further to improve performance? No, width handles CSS size.
                            loading={<div className="text-xs text-slate-400">Loading...</div>}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
