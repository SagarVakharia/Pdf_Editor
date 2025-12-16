"use client";

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setTotalPages, setPage } from '../../store/slices/canvasSlice';
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, Image as ImageIcon, PenTool } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { TextLayer } from '@/components/editor/tools/TextLayer';
import { DrawLayer } from '@/components/editor/tools/DrawLayer';
import { HandLayer } from '@/components/editor/tools/HandLayer';
import { ImageLayer } from '@/components/editor/tools/ImageLayer';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PDFViewerProps {
    file: File | string | null;
    scale: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, scale }) => {
    const dispatch = useDispatch();
    const [numPages, setNumPages] = useState<number>(0);
    const { pages } = useSelector((state: RootState) => state.canvas);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        dispatch(setTotalPages(numPages));
    }

    // Scroll synchronization
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageId = entry.target.getAttribute('data-page-index');
                        if (pageId) {
                            dispatch(setPage(parseInt(pageId, 10)));
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: '-50% 0px -50% 0px', // Trigger when page is in middle of viewport
                threshold: 0
            }
        );

        const pageElements = document.querySelectorAll('.pdf-page-wrapper');
        pageElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [pages, dispatch]); // Re-run when pages change (reordering/add/delete)

    if (!file) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="bg-[var(--sidebar)] p-8 rounded-2xl border border-white/5 shadow-2xl mb-8 flex flex-col items-center">
                    <div className="w-24 h-24 bg-[var(--surface)] rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                        <FileText className="w-12 h-12 text-[var(--primary)] opacity-90 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No PDF Loaded</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8 font-medium">
                            Click or drag a PDF document here to start editing
                        </p>

                        <div className="flex items-center gap-3 justify-center">
                            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] hover:bg-white/5 border border-white/10 rounded-lg text-sm font-medium transition-colors hover:border-indigo-500/50 hover:text-white group">
                                <FileText className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                Edit Text
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] hover:bg-white/5 border border-white/10 rounded-lg text-sm font-medium transition-colors hover:border-purple-500/50 hover:text-white group">
                                <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                                Add Images
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] hover:bg-white/5 border border-white/10 rounded-lg text-sm font-medium transition-colors hover:border-emerald-500/50 hover:text-white group">
                                <PenTool className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                Sign Documents
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="flex justify-center p-8 min-h-full bg-slate-950/50">
            <div className="shadow-2xl">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col gap-4"
                >
                    {/* Render pages in virtual order */}
                    {pages.map((page, index) => (
                        <div
                            key={page.id}
                            className="relative transition-all duration-300 pdf-page-wrapper"
                            data-page-index={index + 1}
                            id={`page-${index + 1}`}
                        >
                            <div style={{ transform: `rotate(${page.rotation}deg)` }} className="transition-transform origin-center">
                                <Page
                                    pageNumber={page.originalIndex}
                                    scale={scale}
                                    className="bg-white shadow-lg"
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                />
                            </div>
                            {/* Layers overlay */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    transform: `rotate(${page.rotation}deg)`,
                                    pointerEvents: 'none'
                                }}
                                className="origin-center"
                            >
                                <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
                                    <TextLayer pageNumber={page.originalIndex} scale={scale} />
                                    <DrawLayer pageNumber={page.originalIndex} scale={scale} />
                                    <ImageLayer pageNumber={page.originalIndex} scale={scale} />
                                    <HandLayer scale={scale} />
                                </div>
                            </div>
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
};
