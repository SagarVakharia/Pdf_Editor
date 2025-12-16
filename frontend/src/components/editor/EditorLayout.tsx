"use client";

import React from 'react';
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
    const { scale, pdfUrl } = useSelector((state: RootState) => state.canvas);

    const handleUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const url = URL.createObjectURL(file);
                dispatch(setPdfUrl(url));
            }
        };
        input.click();
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-background text-white overflow-hidden">
            {/* Top Toolbar Region */}
            <Toolbar onUpload={handleUpload} />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Center Canvas */}
                <div className="flex-1 overflow-auto bg-[var(--background)] relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent p-8 flex justify-center">
                    <div className="w-full h-full max-w-6xl">
                        <PDFViewer file={pdfUrl} scale={scale} />
                    </div>
                </div>

                {/* Right Sidebar */}
                <RightSidebar />
            </div>
        </div>
    );
};
