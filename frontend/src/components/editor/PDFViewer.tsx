"use client";

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
    const [numPages, setNumPages] = useState<number>(0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

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
                    {/* Render all pages for now, or implement virtualization later */}
                    {Array.from(new Array(numPages), (el, index) => (
                        <div key={`page_wrapper_${index + 1}`} className="relative">
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                scale={scale}
                                className="bg-white"
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />
                            <TextLayer pageNumber={index + 1} scale={scale} />
                            <DrawLayer pageNumber={index + 1} scale={scale} />
                            <ImageLayer pageNumber={index + 1} scale={scale} />
                            <HandLayer scale={scale} />
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
};
