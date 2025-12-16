"use client";

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setActiveSidebarTab } from '../../store/slices/canvasSlice';
import { Layers, Grid } from 'lucide-react';

export const LeftSidebar: React.FC = () => {
    const dispatch = useDispatch();
    const {
        sidebarLeftOpen,
        activeSidebarTab,
        currentPage,
        totalPages,
        pdfUrl
    } = useSelector((state: RootState) => state.canvas);

    if (!sidebarLeftOpen) return null;

    return (
        <div className="absolute md:relative w-64 h-full bg-sidebar border-r border-white/10 flex flex-col z-20 transition-all shadow-2xl md:shadow-none">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => dispatch(setActiveSidebarTab('pages'))}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeSidebarTab === 'pages'
                        ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Pages
                </button>
                <button
                    onClick={() => dispatch(setActiveSidebarTab('layers'))}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeSidebarTab === 'layers'
                        ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Layers
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {activeSidebarTab === 'pages' ? (
                    <div className="space-y-4">
                        {!pdfUrl ? (
                            <div className="text-center text-slate-500 mt-10 text-sm">
                                <Grid className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                No document
                            </div>
                        ) : (
                            // Placeholder for page thumbnails
                            Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`aspect-[3/4] bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer ${currentPage === i + 1
                                        ? 'border-indigo-500 ring-4 ring-indigo-500/20'
                                        : 'border-transparent hover:border-white/20'
                                        }`}
                                >
                                    <div className="h-full w-full flex items-center justify-center text-slate-300 text-xs">
                                        Page {i + 1}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 mt-10 text-sm">
                        <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        No layers
                    </div>
                )}
            </div>
        </div>
    );
};
