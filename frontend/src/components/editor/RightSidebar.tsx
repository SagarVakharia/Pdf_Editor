"use client";

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setActiveRightTab, deleteAnnotation, updateAnnotationProperties, setSelectedAnnotationId } from '../../store/slices/canvasSlice';
import {
    Sliders, Layers, Trash2, FileText,
    AlignLeft, AlignCenter, AlignRight,
    Bold, Italic, ChevronDown
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
        <div className="absolute right-0 md:relative w-80 h-full bg-sidebar border-l border-border flex flex-col z-20 transition-all shadow-2xl md:shadow-none bg-sidebar text-text-main">
            {/* Tabs */}
            <div className="flex border-b border-border bg-sidebar/50">
                <button
                    onClick={() => dispatch(setActiveRightTab('properties'))}
                    className={`h-16 flex-1 py-3.5 text-sm font-semibold capitalize border-b-2 transition-all duration-200 ${
                        activeRightTab === 'properties'
                            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
                            : 'border-transparent text-text-muted hover:text-text-main hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                >
                    Properties
                </button>
                <button
                    onClick={() => dispatch(setActiveRightTab('layers'))}
                    className={`h-16 flex-1 py-3.5 text-sm font-semibold capitalize border-b-2 transition-all duration-200 ${
                        activeRightTab === 'layers'
                            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
                            : 'border-transparent text-text-muted hover:text-text-main hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                >
                    Layers
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                {activeRightTab === 'properties' ? (
                    !selectedAnnotation ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center mb-4 border border-border">
                                <Sliders className="w-8 h-8 opacity-40 text-text-muted" />
                            </div>
                            <p className="text-base font-semibold text-text-main">No Selection</p>
                            <p className="text-xs mt-2 opacity-70 max-w-[200px] text-text-muted leading-relaxed">
                                Select an element on the canvas to edit its properties
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-border">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                    {selectedAnnotation.type.toUpperCase()} PROPERTIES
                                </h3>
                            </div>

                            {/* Extracted Alert */}
                            {selectedAnnotation.isExtracted && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Extracted from PDF</h4>
                                            <p className="text-xs text-blue-700 dark:text-blue-300/80 leading-relaxed">
                                                This element was extracted from the original PDF. Editing it will replace the original content.
                                            </p>
                                            <button
                                                className="text-xs text-blue-500 dark:text-blue-400 underline decoration-blue-500/30 hover:text-blue-600 dark:hover:text-blue-300 mt-1 block"
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
                                            className="w-full h-24 bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-text-muted"
                                            placeholder="Enter text content..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs text-text-muted block">Size</label>
                                            <div className="bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg px-3 py-2 flex items-center">
                                                <input
                                                    type="number"
                                                    value={selectedAnnotation.size || 16}
                                                    onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                    className="w-full bg-transparent border-0 text-sm text-text-main focus:outline-none p-0"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-text-muted block">Color</label>
                                            <div className="relative h-[38px] bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg p-1 flex items-center gap-2 px-2">
                                                <input
                                                    type="color"
                                                    value={selectedAnnotation.color || '#000000'}
                                                    onChange={(e) => handleChange('color', e.target.value)}
                                                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                                />
                                                <div
                                                    className="w-full h-6 rounded border border-border"
                                                    style={{ backgroundColor: selectedAnnotation.color || '#000000' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs text-text-muted">Background</label>
                                                <button
                                                    onClick={() => handleChange('backgroundColor', 'transparent')}
                                                    className="text-[10px] text-indigo-500 hover:text-indigo-400 font-semibold"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            <div className="relative h-[38px] bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg p-1 flex items-center gap-2 px-2">
                                                <div className="absolute inset-x-2 inset-y-2 checkerboard-bg -z-10 rounded opacity-20"></div>
                                                <input
                                                    type="color"
                                                    value={selectedAnnotation.backgroundColor && selectedAnnotation.backgroundColor !== 'transparent' ? selectedAnnotation.backgroundColor : '#ffffff'}
                                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                                />
                                                <div
                                                    className="w-full h-6 rounded border border-border"
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
                                                className="w-full appearance-none bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-indigo-500 transition-colors"
                                            >
                                                <option value="Arial">Arial</option>
                                                <option value="Times New Roman">Times New Roman</option>
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Courier New">Courier New</option>
                                                <option value="Georgia">Georgia</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-border p-1 divide-x divide-border">
                                            <button
                                                onClick={() => handleChange('textAlign', 'left')}
                                                className={`flex-1 p-2 flex items-center justify-center rounded-l hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${selectedAnnotation.textAlign === 'left' ? 'text-indigo-500 font-bold' : 'text-text-muted'}`}
                                            >
                                                <AlignLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChange('textAlign', 'center')}
                                                className={`flex-1 p-2 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${selectedAnnotation.textAlign === 'center' ? 'text-indigo-500 font-bold' : 'text-text-muted'}`}
                                            >
                                                <AlignCenter className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChange('textAlign', 'right')}
                                                className={`flex-1 p-2 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${selectedAnnotation.textAlign === 'right' ? 'text-indigo-500 font-bold' : 'text-text-muted'}`}
                                            >
                                                <AlignRight className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-full bg-border mx-1" />
                                            <button
                                                onClick={() => handleChange('isBold', !selectedAnnotation.isBold)}
                                                className={`flex-1 p-2 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${selectedAnnotation.isBold ? 'text-indigo-500 font-bold bg-gray-100 dark:bg-gray-700' : 'text-text-muted'}`}
                                            >
                                                <Bold className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChange('isItalic', !selectedAnnotation.isItalic)}
                                                className={`flex-1 p-2 flex items-center justify-center rounded-r hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${selectedAnnotation.isItalic ? 'text-indigo-500 font-bold bg-gray-100 dark:bg-gray-700' : 'text-text-muted'}`}
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
                                        <label className="text-xs text-text-muted block">Width (px)</label>
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
                                                className="w-16 bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg px-2 py-1 text-xs text-text-main text-center focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-muted block">Opacity</label>
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
                                            <span className="text-xs font-semibold text-text-main w-10 text-center">
                                                {Math.round((selectedAnnotation.opacity ?? 1.0) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Drawing / Signing & Shapes Content */}
                            {(selectedAnnotation.type === 'draw' ||
                                selectedAnnotation.type === 'sign' ||
                                selectedAnnotation.type === 'line' ||
                                selectedAnnotation.type === 'arrow' ||
                                selectedAnnotation.type === 'rectangle' ||
                                selectedAnnotation.type === 'highlight') && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-muted block">Line Thickness</label>
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
                                                className="w-12 bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg px-2 py-1 text-xs text-text-main text-center focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-muted block">Stroke Color</label>
                                        <div className="relative h-[38px] bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg p-1 flex items-center gap-2 px-2">
                                            <input
                                                type="color"
                                                value={selectedAnnotation.color || '#000000'}
                                                onChange={(e) => handleChange('color', e.target.value)}
                                                className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                            />
                                            <div
                                                className="w-full h-6 rounded border border-border"
                                                style={{ backgroundColor: selectedAnnotation.color || '#000000' }}
                                            />
                                        </div>
                                    </div>
                                    {selectedAnnotation.type === 'rectangle' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs text-text-muted">Fill Color</label>
                                                <button
                                                    onClick={() => handleChange('fillColor', 'transparent')}
                                                    className="text-[10px] text-indigo-500 hover:text-indigo-400 font-semibold"
                                                >
                                                    Clear (Transparent)
                                                </button>
                                            </div>
                                            <div className="relative h-[38px] bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg p-1 flex items-center gap-2 px-2">
                                                <input
                                                    type="color"
                                                    value={selectedAnnotation.fillColor && selectedAnnotation.fillColor !== 'transparent' ? selectedAnnotation.fillColor : '#ffffff'}
                                                    onChange={(e) => handleChange('fillColor', e.target.value)}
                                                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                                />
                                                <div
                                                    className="w-full h-6 rounded border border-border"
                                                    style={{ backgroundColor: selectedAnnotation.fillColor || 'transparent' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-muted block">Opacity</label>
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
                                            <span className="text-xs font-semibold text-text-main w-10 text-center">
                                                {Math.round((selectedAnnotation.opacity ?? 1.0) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stamp Content */}
                            {selectedAnnotation.type === 'stamp' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-muted block">Stamp Label</label>
                                        <input
                                            type="text"
                                            value={selectedAnnotation.content || ''}
                                            onChange={(e) => {
                                                handleChange('content', e.target.value);
                                                handleChange('stampText', e.target.value);
                                            }}
                                            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-indigo-500 transition-colors font-bold uppercase tracking-wider"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-muted block">Stamp Color</label>
                                        <div className="relative h-[38px] bg-gray-50 dark:bg-gray-800/50 border border-border rounded-lg p-1 flex items-center gap-2 px-2">
                                            <input
                                                type="color"
                                                value={selectedAnnotation.color || '#22c55e'}
                                                onChange={(e) => handleChange('color', e.target.value)}
                                                className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                                            />
                                            <div
                                                className="w-full h-6 rounded border border-border"
                                                style={{ backgroundColor: selectedAnnotation.color || '#22c55e' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-muted block">Size (Width)</label>
                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="range"
                                                min="50"
                                                max="300"
                                                value={selectedAnnotation.size || 120}
                                                onChange={(e) => handleChange('size', parseInt(e.target.value))}
                                                className="flex-1 accent-indigo-500"
                                            />
                                            <span className="text-xs font-semibold text-text-main w-10 text-center">
                                                {selectedAnnotation.size || 120}px
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Delete Button */}
                            <div className="pt-8 mt-auto">
                                <button
                                    onClick={() => dispatch(deleteAnnotation(selectedAnnotation.id))}
                                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30 rounded-xl flex items-center justify-center gap-2 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                                    <div className="flex flex-col items-center justify-center h-full text-center text-text-muted mt-10">
                                        <Layers className="w-12 h-12 mb-4 opacity-20 text-text-muted" />
                                        <p className="text-sm font-semibold">No Layers</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {visibleAnnotations.map((ann, i) => (
                                            <div
                                                key={ann.id}
                                                onClick={() => {
                                                    if (selectedAnnotationId !== ann.id) {
                                                        dispatch(setSelectedAnnotationId(ann.id));
                                                        dispatch(setActiveRightTab('properties'));
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer group ${
                                                    selectedAnnotationId === ann.id
                                                        ? 'bg-indigo-600/10 dark:bg-indigo-950/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-400'
                                                        : 'bg-surface border-border hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-text-muted h-5 w-5 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                                                        {i + 1}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-text-main capitalize">
                                                                {ann.type}
                                                            </span>
                                                            {ann.isExtracted && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
                                                                    Extracted
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                                                            {ann.content || 'No content'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dispatch(deleteAnnotation(ann.id));
                                                    }}
                                                    className="p-1.5 text-text-muted hover:text-rose-500 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors opacity-0 group-hover:opacity-100"
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
