"use client";

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setActiveRightTab, deleteAnnotation, updateAnnotationProperties } from '../../store/slices/canvasSlice';
import {
    Sliders, Layers, Trash2, FileText,
    AlignLeft, AlignCenter, AlignRight,
    Bold, Italic, Type, ChevronDown
} from 'lucide-react';

export const RightSidebar: React.FC = () => {
    const dispatch = useDispatch();
    const {
        sidebarRightOpen,
        activeRightTab,
        selectedAnnotationId,
        annotations
    } = useSelector((state: RootState) => state.canvas);

    const selectedAnnotation = selectedAnnotationId
        ? annotations.find(a => a.id === selectedAnnotationId && !a.isDeleted)
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
        <div className="absolute right-0 md:relative w-80 h-full bg-[#0F172A] border-l border-white/10 flex flex-col z-20 transition-all shadow-2xl md:shadow-none">
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-[#1E293B]/50">
                <button
                    onClick={() => dispatch(setActiveRightTab('properties'))}
                    className={`flex-1 py-4 text-sm font-semibold transition-all relative ${activeRightTab === 'properties'
                        ? 'text-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Properties
                    {activeRightTab === 'properties' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    )}
                </button>
                <button
                    onClick={() => dispatch(setActiveRightTab('layers'))}
                    className={`flex-1 py-4 text-sm font-semibold transition-all relative ${activeRightTab === 'layers'
                        ? 'text-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    Layers
                    {activeRightTab === 'layers' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                {activeRightTab === 'properties' ? (
                    !selectedAnnotation ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5">
                                <Sliders className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-base font-medium text-slate-300">No Selection</p>
                            <p className="text-xs mt-2 opacity-50 max-w-[200px]">
                                Select an element on the canvas to edit its properties
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {selectedAnnotation.type.toUpperCase()} PROFPERTIES
                                </h3>
                            </div>

                            {/* Extracted Alert */}
                            {selectedAnnotation.isExtracted && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-semibold text-blue-400">Extracted from PDF</h4>
                                            <p className="text-xs text-blue-300/80 leading-relaxed">
                                                This element was extracted from the original PDF. Editing it will replace the original content.
                                            </p>
                                            <button
                                                className="text-xs text-blue-400 underline decoration-blue-400/30 hover:text-blue-300 mt-1 block"
                                                onClick={() => handleChange('isExtracted', false)}
                                            >
                                                Convert to standard annotation
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Text Content */}
                            {selectedAnnotation.type === 'text' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <textarea
                                            value={selectedAnnotation.content || ''}
                                            onChange={(e) => handleChange('content', e.target.value)}
                                            className="w-full h-24 bg-slate-800/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-slate-600"
                                            placeholder="Enter text content..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs text-slate-400 block">Size</label>
                                            <div className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 flex items-center">
                                                <input
                                                    type="number"
                                                    value={selectedAnnotation.size || 16}
                                                    onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                    className="w-full bg-transparent border-0 text-sm text-white focus:outline-none p-0"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-slate-400 block">Color</label>
                                            <div className="relative h-[38px] bg-slate-800/50 border border-white/10 rounded-lg p-1 flex items-center gap-2 px-2">
                                                <input
                                                    type="color"
                                                    value={selectedAnnotation.color || '#000000'}
                                                    onChange={(e) => handleChange('color', e.target.value)}
                                                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                                />
                                                <div
                                                    className="w-full h-6 rounded bg-current border border-white/20"
                                                    style={{ backgroundColor: selectedAnnotation.color || '#000000' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs text-slate-400">Background</label>
                                                <button
                                                    onClick={() => handleChange('backgroundColor', 'transparent')}
                                                    className="text-[10px] text-indigo-400 hover:text-indigo-300"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            <div className="relative h-[38px] bg-slate-800/50 border border-white/10 rounded-lg p-1 flex items-center gap-2 px-2">
                                                <div className="absolute inset-x-2 inset-y-2 checkerboard-bg -z-10 rounded opacity-20"></div>
                                                <input
                                                    type="color"
                                                    value={selectedAnnotation.backgroundColor && selectedAnnotation.backgroundColor !== 'transparent' ? selectedAnnotation.backgroundColor : '#ffffff'}
                                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                                />
                                                <div
                                                    className="w-full h-6 rounded border border-white/20"
                                                    style={{ backgroundColor: selectedAnnotation.backgroundColor || 'transparent' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="relative">
                                            <select
                                                value={selectedAnnotation.fontFamily || 'Arial'}
                                                onChange={(e) => handleChange('fontFamily', e.target.value)}
                                                className="w-full appearance-none bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            >
                                                <option value="Arial">Arial</option>
                                                <option value="Times New Roman">Times New Roman</option>
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Courier New">Courier New</option>
                                                <option value="Georgia">Georgia</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex bg-slate-800/50 rounded-lg border border-white/10 p-1 divide-x divide-white/5">
                                            <button
                                                onClick={() => handleChange('textAlign', 'left')}
                                                className={`flex-1 p-2 flex items-center justify-center rounded-l hover:bg-white/5 transition-colors ${selectedAnnotation.textAlign === 'left' ? 'text-indigo-400' : 'text-slate-400'}`}
                                            >
                                                <AlignLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChange('textAlign', 'center')}
                                                className={`flex-1 p-2 flex items-center justify-center hover:bg-white/5 transition-colors ${selectedAnnotation.textAlign === 'center' ? 'text-indigo-400' : 'text-slate-400'}`}
                                            >
                                                <AlignCenter className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChange('textAlign', 'right')}
                                                className={`flex-1 p-2 flex items-center justify-center hover:bg-white/5 transition-colors ${selectedAnnotation.textAlign === 'right' ? 'text-indigo-400' : 'text-slate-400'}`}
                                            >
                                                <AlignRight className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-full bg-white/10 mx-1" />
                                            <button
                                                onClick={() => handleChange('isBold', !selectedAnnotation.isBold)}
                                                className={`flex-1 p-2 flex items-center justify-center hover:bg-white/5 transition-colors ${selectedAnnotation.isBold ? 'text-indigo-400 bg-white/5' : 'text-slate-400'}`}
                                            >
                                                <Bold className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChange('isItalic', !selectedAnnotation.isItalic)}
                                                className={`flex-1 p-2 flex items-center justify-center rounded-r hover:bg-white/5 transition-colors ${selectedAnnotation.isItalic ? 'text-indigo-400 bg-white/5' : 'text-slate-400'}`}
                                            >
                                                <Italic className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Content */}
                            {selectedAnnotation.type === 'image' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 block">Width (px)</label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="range"
                                                min="20"
                                                max="600"
                                                value={selectedAnnotation.size || 100}
                                                onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                className="flex-1 accent-indigo-500"
                                            />
                                            <input
                                                type="number"
                                                value={selectedAnnotation.size || 100}
                                                onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                className="w-16 bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 block">Opacity</label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={selectedAnnotation.opacity ?? 1.0}
                                                onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                                                className="flex-1 accent-indigo-500"
                                            />
                                            <span className="text-xs font-semibold text-slate-300 w-10 text-center">
                                                {Math.round((selectedAnnotation.opacity ?? 1.0) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Drawing / Signing Content */}
                            {(selectedAnnotation.type === 'draw' || selectedAnnotation.type === 'sign') && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 block">Line Thickness</label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={selectedAnnotation.size || 2}
                                                onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                className="flex-1 accent-indigo-500"
                                            />
                                            <input
                                                type="number"
                                                value={selectedAnnotation.size || 2}
                                                onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                className="w-12 bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 block">Stroke Color</label>
                                        <div className="relative h-[38px] bg-slate-800/50 border border-white/10 rounded-lg p-1 flex items-center gap-2 px-2">
                                            <input
                                                type="color"
                                                value={selectedAnnotation.color || '#000000'}
                                                onChange={(e) => handleChange('color', e.target.value)}
                                                className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                            />
                                            <div
                                                className="w-full h-6 rounded bg-current border border-white/20"
                                                style={{ backgroundColor: selectedAnnotation.color || '#000000' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 block">Opacity</label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={selectedAnnotation.opacity ?? 1.0}
                                                onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                                                className="flex-1 accent-indigo-500"
                                            />
                                            <span className="text-xs font-semibold text-slate-300 w-10 text-center">
                                                {Math.round((selectedAnnotation.opacity ?? 1.0) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Delete Button */}
                            <div className="pt-8 mt-auto">
                                <button
                                    onClick={() => dispatch(deleteAnnotation(selectedAnnotation.id))}
                                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl flex items-center justify-center gap-2 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Element
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    (() => {
                        const visibleAnnotations = annotations.filter(a => !a.isDeleted);
                        return (
                            <div className="space-y-4">
                                {visibleAnnotations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 mt-10">
                                        <Layers className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-sm font-medium">No Layers</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {visibleAnnotations.map((ann, i) => (
                                            <div
                                                key={ann.id}
                                                onClick={() => {
                                                    if (selectedAnnotationId !== ann.id) {
                                                        dispatch(setActiveRightTab('properties'));
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer group ${selectedAnnotationId === ann.id
                                                    ? 'bg-indigo-600/20 border-indigo-500/50'
                                                    : 'bg-[#1E293B]/50 border-white/5 hover:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-slate-500 h-5 w-5 flex items-center justify-center rounded bg-slate-800/50">
                                                        {i + 1}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-slate-300 capitalize">
                                                                {ann.type}
                                                            </span>
                                                            {ann.isExtracted && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">Extracted</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 truncated max-w-[120px]">
                                                            {ann.content || 'No content'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dispatch(deleteAnnotation(ann.id));
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
};
