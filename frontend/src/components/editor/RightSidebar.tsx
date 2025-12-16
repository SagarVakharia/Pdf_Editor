"use client";

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setActiveRightTab, removeAnnotation, updateAnnotationProperties } from '../../store/slices/canvasSlice';
import { Sliders, Layers, Trash2 } from 'lucide-react';

export const RightSidebar: React.FC = () => {
    const dispatch = useDispatch();
    const {
        sidebarRightOpen,
        activeRightTab,
        selectedAnnotationId,
        annotations
    } = useSelector((state: RootState) => state.canvas);

    const selectedAnnotation = selectedAnnotationId
        ? annotations.find(a => a.id === selectedAnnotationId)
        : null;

    if (!sidebarRightOpen) return null;

    const handleChange = (key: string, value: any) => {
        if (!selectedAnnotationId) return;
        dispatch(updateAnnotationProperties({
            id: selectedAnnotationId,
            updates: { [key]: value }
        }));
    };

    return (
        <div className="absolute right-0 md:relative w-72 h-full bg-sidebar border-l border-white/10 flex flex-col z-20 transition-all shadow-2xl md:shadow-none">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => dispatch(setActiveRightTab('properties'))}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeRightTab === 'properties'
                        ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Properties
                </button>
                <button
                    onClick={() => dispatch(setActiveRightTab('layers'))}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeRightTab === 'layers'
                        ? 'text-white border-b-2 border-indigo-500 bg-white/5'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Layers
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeRightTab === 'properties' ? (
                    !selectedAnnotation ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                            <Sliders className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No Selection</p>
                            <p className="text-xs mt-2 opacity-60">
                                Select an element to edit its properties
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white capitalize">
                                    {selectedAnnotation.type} Properties
                                </h3>
                                <button
                                    onClick={() => dispatch(removeAnnotation(selectedAnnotation.id))}
                                    className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Common Properties */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                                    Appearance
                                </label>

                                <div className="space-y-4">
                                    {/* Color */}
                                    <div className="bg-[var(--surface)] p-3 rounded-lg border border-white/5">
                                        <div className="text-sm text-slate-300 mb-2">Color</div>
                                        <div className="flex gap-2 flex-wrap">
                                            {['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => handleChange('color', color)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${selectedAnnotation.color === color ? 'border-white ring-2 ring-indigo-500/50' : 'border-transparent'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <input
                                                type="color"
                                                value={selectedAnnotation.color || '#000000'}
                                                onChange={(e) => handleChange('color', e.target.value)}
                                                className="w-6 h-6 rounded-full overflow-hidden p-0 border-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Opacity */}
                                    <div className="bg-[var(--surface)] p-3 rounded-lg border border-white/5">
                                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                                            <span>Opacity</span>
                                            <span>{Math.round((selectedAnnotation.opacity ?? 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={selectedAnnotation.opacity ?? 1}
                                            onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                                            className="w-full accent-indigo-500"
                                        />
                                    </div>

                                    {/* Size / Thickness */}
                                    {(selectedAnnotation.type === 'draw' || selectedAnnotation.type === 'text') && (
                                        <div className="bg-[var(--surface)] p-3 rounded-lg border border-white/5">
                                            <div className="flex justify-between text-sm text-slate-300 mb-1">
                                                <span>{selectedAnnotation.type === 'text' ? 'Font Size' : 'Thickness'}</span>
                                                <span>{selectedAnnotation.size || 16}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={selectedAnnotation.type === 'text' ? "8" : "1"}
                                                max={selectedAnnotation.type === 'text' ? "72" : "20"}
                                                step="1"
                                                value={selectedAnnotation.size || (selectedAnnotation.type === 'text' ? 16 : 2)}
                                                onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                className="w-full accent-indigo-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    // Layers Tab Content
                    <div className="space-y-4">
                        {annotations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 mt-10">
                                <Layers className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm font-medium">No Layers</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {annotations.map((ann, i) => (
                                    <div
                                        key={ann.id}
                                        onClick={() => dispatch(setActiveRightTab('properties'))} // Optional: switch to properties on select? Or just select.
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${selectedAnnotationId === ann.id
                                                ? 'bg-indigo-600/20 border-indigo-600/50'
                                                : 'bg-[var(--surface)] border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-slate-500">#{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-medium text-white capitalize">{ann.type}</p>
                                                <p className="text-xs text-slate-400">
                                                    Page {ann.page}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dispatch(removeAnnotation(ann.id));
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
