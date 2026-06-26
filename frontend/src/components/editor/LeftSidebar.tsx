import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
    rotatePage,
    deletePage,
    reorderPages,
    movePage,
    setPage,
    navigateToPage
} from '../../store/slices/canvasSlice';
import { Grid } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortablePageItem } from './SortablePageItem';
import { Document, pdfjs } from 'react-pdf';

// Ensure worker is configured
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const LeftSidebar: React.FC = () => {
    const dispatch = useDispatch();
    const {
        sidebarLeftOpen,
        currentPage,
        pages,
        pdfUrl
    } = useSelector((state: RootState) => state.canvas);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            dispatch(reorderPages({
                activeId: active.id as string,
                overId: over.id as string
            }));
        }
    };

    if (!sidebarLeftOpen) return null;

    return (
        <div className="absolute md:relative w-64 h-full bg-sidebar border-r border-border flex flex-col z-20 transition-all shadow-lg md:shadow-none">
            {/* Header */}
            <div className="flex border-b border-border py-3 px-4">
                <h3 className="text-sm font-semibold text-text-main">Pages</h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {!pdfUrl ? (
                    <div className="text-center text-text-muted mt-10 text-sm">
                        <Grid className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        No document
                    </div>
                ) : (
                    <Document file={pdfUrl} className="flex flex-col gap-3">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={pages.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {pages.map((page, i) => (
                                        <SortablePageItem
                                            key={page.id}
                                            page={page}
                                            index={i}
                                            isActive={currentPage === i + 1}
                                            onClick={() => dispatch(navigateToPage(i + 1))}
                                            onRotate={(id, rot) => dispatch(rotatePage({ id, rotation: rot }))}
                                            onDelete={(id) => dispatch(deletePage(id))}
                                            onMove={(id, dir) => dispatch(movePage({ id, direction: dir }))}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </Document>
                )}
            </div>
        </div>
    );
};
