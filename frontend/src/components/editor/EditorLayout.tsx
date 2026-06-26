"use client";

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setPdfUrl } from '../../store/slices/canvasSlice';
import { Toolbar } from './Toolbar';
// import { PDFViewer } from './PDFViewer';
import { Settings, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./PDFViewer').then(mod => mod.PDFViewer), {
    ssr: false,
    loading: () => <div className="text-slate-500">Loading PDF engine...</div>
});

const LeftSidebar = dynamic(() => import('./LeftSidebar').then(mod => mod.LeftSidebar), {
    ssr: false,
    loading: () => <div className="w-64 bg-sidebar border-r border-white/10" />
});

import { RightSidebar } from './RightSidebar';

export const EditorLayout: React.FC = () => {
    const dispatch = useDispatch();
    const { scale, pdfUrl, theme } = useSelector((state: RootState) => state.canvas);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    }, [theme]);

    const handleUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                if (pdfUrl && pdfUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(pdfUrl);
                }
                const url = URL.createObjectURL(file);
                dispatch(setPdfUrl(url));
            }
        };
        input.click();
    };

    return (
        <div className={`flex flex-col h-[100dvh] bg-background text-text-main overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
            {/* Top Toolbar Region */}
            <Toolbar onUpload={handleUpload} />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Center Canvas */}
                <div className="flex-1 overflow-auto bg-[var(--background)] relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent p-8 flex justify-center">
                    {/* Watermark Overlay */}
                    <div className="pointer-events-none fixed inset-0 flex flex-wrap content-center justify-center gap-16 overflow-hidden z-0 opacity-[0.03] select-none">
                         {Array.from({ length: 30 }).map((_, i) => (
                             <span key={i} className="text-5xl font-black uppercase tracking-widest text-text-main transform -rotate-45">
                                 © Modern PDF Editor
                             </span>
                         ))}
                    </div>
                    <div className="w-full h-full max-w-6xl relative z-10">
                        <PDFViewer file={pdfUrl} scale={scale} onUpload={handleUpload} />
                    </div>
                </div>

                {/* Right Sidebar */}
                <RightSidebar />
            </div>
        </div>
    );
};
