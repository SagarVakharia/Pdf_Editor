import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
    setScale,
    setTool,
    setSidebarLeftOpen,
    setSidebarRightOpen,
    undo,
    redo,
    navigateToPage,
    togglePageExtraction,
    setAnnotations,
    removeAnnotations,
    toggleTheme,
    setActiveStamp,
    setActiveSignature,
    setActiveShapeType,
    deleteAnnotation
} from '../../store/slices/canvasSlice';
import { generatePDF } from '../../utils/pdfGenerator';
import { SignatureModal } from './SignatureModal';
import {
    ZoomIn,
    ZoomOut,
    Undo,
    Redo,
    X,
    FolderOpen,
    Save,
    Moon,
    Sun,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { nanoid } from '@reduxjs/toolkit';

interface ToolbarProps {
    onUpload: () => void;
}

const DEFAULT_STAMPS = [
    { text: 'Draft', color: '#64748b' },
    { text: 'Approved', color: '#22c55e' },
    { text: 'Confidential', color: '#eab308' },
    { text: 'Final', color: '#3b82f6' },
    { text: 'Void', color: '#ef4444' }
];

export const Toolbar: React.FC<ToolbarProps> = ({ onUpload }) => {
    const dispatch = useDispatch();
    const {
        scale, tool, currentPage, totalPages, sidebarLeftOpen, sidebarRightOpen,
        history, pdfUrl, pages, annotations, theme, activeStamp, activeShapeType, selectedAnnotationId
    } = useSelector((state: RootState) => state.canvas);

    const [
        showDownloadDialog, setShowDownloadDialog
    ] = useState(false);
    const [fileName, setFileName] = useState('edited_document');
    const [stampDropdownOpen, setStampDropdownOpen] = useState(false);
    const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const shapeDropdownRef = useRef<HTMLDivElement>(null);
    const stampDropdownRef = useRef<HTMLDivElement>(null);

    const activeTool = tool;
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    // ── Global keyboard shortcuts ──────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault(); dispatch(undo()); return;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault(); dispatch(redo()); return;
            }

            if (isInput) return; // Don't intercept text editing

            // Delete selected annotation
            if ((e.key === 'Delete' || e.key === 'Backspace')) {
                const state = (window as any).__REDUX_STATE__;
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('delete-selected'));
                return;
            }

            // Tool shortcuts
            const shortcuts: Record<string, string> = {
                'v': 'select', 'h': 'hand', 't': 'text', 'p': 'draw',
                'e': 'erase', 'i': 'image', 'Escape': 'select'
            };
            if (shortcuts[e.key]) {
                e.preventDefault();
                dispatch(setTool(shortcuts[e.key] as any));
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (shapeDropdownRef.current && !shapeDropdownRef.current.contains(e.target as Node)) {
                setShapeDropdownOpen(false);
            }
            if (stampDropdownRef.current && !stampDropdownRef.current.contains(e.target as Node)) {
                setStampDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const handleDownload = async () => {
        if (!pdfUrl) return;
        try {
            const pdfBytes = await generatePDF(pdfUrl, pages, annotations);
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName.endsWith('.pdf') ? fileName : fileName + '.pdf'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setShowDownloadDialog(false);
        } catch (error) {
            console.error('Failed to download PDF:', error);
            alert('Failed to generate PDF. Check console for details.');
        }
    };

    const handleStampSelect = (stamp: { text: string, color: string }) => {
        dispatch(setActiveStamp(stamp));
        dispatch(setTool('stamp'));
        setStampDropdownOpen(false);
    };

    const renderToolButton = (toolName: typeof tool, title: string, svgIcon: React.ReactNode, isDropdown: boolean = false) => {
        const isActive = activeTool === toolName;
        return (
            <div className="relative group shrink-0">
                <button
                    onClick={() => {
                        if (toolName === 'sign') {
                            setIsSignatureModalOpen(true);
                        } else if (toolName === 'stamp' && activeTool === 'stamp') {
                            setStampDropdownOpen(!stampDropdownOpen);
                        } else {
                            dispatch(setTool(toolName));
                            if (toolName !== 'stamp') setStampDropdownOpen(false);
                        }
                    }}
                    className={`p-2 lg:p-2.5 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${
                        isActive
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-text-main shadow-lg shadow-indigo-500/50 scale-105'
                            : 'text-text-muted hover:text-text-main hover:bg-surface'
                    }`}
                    title={title}
                >
                    <div className="flex items-center gap-0.5">
                        {svgIcon}
                        {isDropdown && <ChevronDown className="w-3 h-3 lg:w-3.5 lg:h-3.5 opacity-70" />}
                    </div>
                </button>
            </div>
        );
    };

    // Tools rendering extracted for cleaner JSX
    const renderAllTools = () => (
        <>
            {renderToolButton('select', 'Select (V)', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m4 4 7.07 16.97 2.51-7.39 7.39-2.51L4 4z"></path><path d="m13 13 6 6"></path></svg>
            ))}
            {renderToolButton('hand', 'Pan (H)', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4.5"></path><path d="M18 8a2 2 0 0 1 2 2v6a6 6 0 0 1-6 6h-2c-2.11 0-4.13-.84-5.66-2.34l-2.67-2.67a1.5 1.5 0 0 1 .45-2.43 1.5 1.5 0 0 1 1.83.44l2.05 2.05a.5.5 0 0 0 .86-.35V4a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v7"></path></svg>
            ))}
            {renderToolButton('text', 'Text (T)', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 7V4h16v3"></path><path d="M9 20h6"></path><path d="M12 4v16"></path></svg>
            ))}
            {renderToolButton('draw', 'Draw (P)', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            ))}
            <div className="relative shrink-0" ref={shapeDropdownRef}>
                <button
                    onClick={() => setShapeDropdownOpen(!shapeDropdownOpen)}
                    className={`p-2 lg:p-2.5 rounded-lg flex items-center justify-center gap-0.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${
                        ['line','arrow','rectangle','circle','triangle','star','diamond','shape'].includes(activeTool)
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-text-main shadow-lg shadow-indigo-500/50 scale-105'
                            : 'text-text-muted hover:text-text-main hover:bg-surface'
                    }`}
                    title="Shapes"
                >
                    {activeShapeType === 'circle' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="9"/></svg>}
                    {activeShapeType === 'triangle' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="12,3 22,21 2,21"/></svg>}
                    {activeShapeType === 'star' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>}
                    {activeShapeType === 'diamond' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="12,2 22,12 12,22 2,12"/></svg>}
                    {activeShapeType === 'line' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="5" y1="19" x2="19" y2="5"/></svg>}
                    {activeShapeType === 'arrow' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg>}
                    {(!activeShapeType || activeShapeType === 'rectangle') && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>}
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {shapeDropdownOpen && (
                    <div className="absolute top-12 left-0 z-50 rounded-xl shadow-2xl py-2 w-52 animate-in fade-in slide-in-from-top-2 duration-150" style={{ background: 'var(--color-sidebar, #fff)', border: '1px solid var(--color-border, #e5e7eb)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 pb-1 pt-1">Shapes</p>
                        {[
                            { type: 'rectangle', label: 'Rectangle', icon: <rect width="14" height="10" x="5" y="7" rx="1"/> },
                            { type: 'circle', label: 'Circle / Ellipse', icon: <circle cx="12" cy="12" r="7"/> },
                            { type: 'triangle', label: 'Triangle', icon: <polygon points="12,5 20,19 4,19"/> },
                            { type: 'star', label: 'Star', icon: <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/> },
                            { type: 'diamond', label: 'Diamond', icon: <polygon points="12,2 22,12 12,22 2,12"/> },
                        ].map(({ type, label, icon }) => (
                            <button key={type} onClick={() => { dispatch(setActiveShapeType(type as any)); dispatch(setTool('shape')); setShapeDropdownOpen(false); }} className={`w-full px-3 py-2 text-left text-sm font-medium flex items-center gap-3 hover:bg-surface transition-colors ${activeShapeType === type && ['shape','rectangle','circle','triangle','star','diamond'].includes(activeTool) ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-main'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                                {label}
                            </button>
                        ))}
                        <div className="border-t border-border my-1"/>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 pb-1">Lines</p>
                        {[
                            { type: 'line', label: 'Straight Line', icon: <line x1="4" y1="20" x2="20" y2="4"/> },
                            { type: 'arrow', label: 'Arrow', icon: <><line x1="4" y1="20" x2="20" y2="4"/><polyline points="14 4 20 4 20 10"/></> },
                        ].map(({ type, label, icon }) => (
                            <button key={type} onClick={() => { dispatch(setActiveShapeType(type as any)); dispatch(setTool('shape')); setShapeDropdownOpen(false); }} className={`w-full px-3 py-2 text-left text-sm font-medium flex items-center gap-3 hover:bg-surface transition-colors ${activeShapeType === type && ['shape','line','arrow'].includes(activeTool) ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-main'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {renderToolButton('highlight', 'Highlight', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m9 11-6 6v3h3l6-6"></path><path d="m22 2-3 3-8.5 8.5-1.5-1.5L17.5 3.5 20.5.5ZM19 5l-1.5-1.5"></path></svg>
            ))}
            <div className="relative shrink-0" ref={stampDropdownRef}>
                {renderToolButton('stamp', `Stamp (${activeStamp ? activeStamp.text : 'Approved'})`, (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M5 22h14"></path><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13H6.5a2.5 2.5 0 0 0-1.77.73l-1.3 1.3a1 1 0 0 0-.27.81c.06.58.55.98 1.14.98h15.4c.59 0 1.08-.4 1.14-.98a1 1 0 0 0-.27-.81Z"></path><path d="M12 13V3a1 1 0 0 0-1-1H7.5a1.5 1.5 0 0 0 0 3H9v8"></path></svg>
                ), true)}
                {stampDropdownOpen && (
                    <div className="absolute top-12 left-0 bg-sidebar border border-border rounded-xl shadow-2xl py-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        {DEFAULT_STAMPS.map((stamp, idx) => (
                            <button key={idx} onClick={() => handleStampSelect(stamp)} className="w-full px-4 py-2 text-left text-sm font-semibold hover:bg-surface transition-colors flex items-center gap-2" style={{ color: stamp.color }}>
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stamp.color }} />
                                {stamp.text}
                            </button>
                        ))}
                        <div className="border-t border-border my-1" />
                        <button onClick={() => { const text = window.prompt("Enter custom stamp text:"); if (text && text.trim()) { handleStampSelect({ text: text.trim().toUpperCase(), color: '#8b5cf6' }); } else { setStampDropdownOpen(false); } }} className="w-full px-4 py-2 text-left text-sm font-semibold hover:bg-surface transition-colors flex items-center gap-2 text-indigo-500">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Custom...
                        </button>
                    </div>
                )}
            </div>
            {renderToolButton('image', 'Image (I)', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
            ))}
            {renderToolButton('sign', 'Sign', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"></path><path d="m15 9-6 6"></path></svg>
            ))}
            {renderToolButton('erase', 'Erase (E)', (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L11.7 22.3c-.9.9-2.3.9-3.2 0Z"></path><path d="M18.8 19.7 17 18"></path><path d="m14 5 6 6"></path></svg>
            ))}
        </>
    );

    return (
        <div className="flex flex-col z-50 shadow-xl relative bg-sidebar border-b border-border transition-colors duration-200">
            <SignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSave={(sig) => {
                    const adapted: any = sig.imageUrl
                        ? { type: 'draw', content: sig.imageUrl, width: sig.width, height: sig.height }
                        : { type: sig.type, path: sig.path, content: sig.content, width: sig.width, height: sig.height };
                    dispatch(setActiveSignature(adapted));
                    dispatch(setTool('sign'));
                    setIsSignatureModalOpen(false);
                }}
            />

            {/* Full-screen overlay for Download Dialog on mobile */}
            {showDownloadDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-sidebar border border-border p-5 rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 relative">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-text-main">Download PDF</h3>
                            <button onClick={() => setShowDownloadDialog(false)} className="text-text-muted hover:text-text-main transition-colors p-1 rounded-md hover:bg-surface">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-text-muted mb-1.5 block">File Name</label>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="Enter file name"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-text-main rounded-lg font-medium transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                            >
                                <Save className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                ROW 1: Logo | Actions
                Mobile: logo left, scrollable actions right
                Desktop: logo left, tools center, actions right
            ═══════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between h-12 lg:h-14 px-2 lg:px-3 bg-sidebar border-b border-border/50 lg:border-b-0 w-full overflow-hidden">
                {/* Left: Panel toggle + Logo */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => dispatch(setSidebarLeftOpen(!sidebarLeftOpen))}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface transition-all active:scale-95"
                    >
                        {sidebarLeftOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                    </button>
                    <span className="font-bold text-base lg:text-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent select-none whitespace-nowrap">
                        PDF <span className="hidden sm:inline">Editor</span>
                    </span>
                </div>

                {/* Center: Tools — DESKTOP ONLY */}
                <div className="hidden lg:flex items-center gap-1 flex-1 justify-center px-4 overflow-x-auto no-scrollbar">
                    {renderAllTools()}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar justify-end flex-1 lg:flex-none ml-2 lg:ml-0">
                    {/* Undo/Redo */}
                    <div className="flex bg-surface rounded-lg p-0.5 border border-border shrink-0">
                        <button
                            onClick={() => dispatch(undo())}
                            disabled={!canUndo}
                            className={`p-1.5 rounded-md transition-colors ${canUndo ? 'text-text-muted hover:text-text-main hover:bg-sidebar' : 'text-text-muted opacity-50'}`}
                        >
                            <Undo className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => dispatch(redo())}
                            disabled={!canRedo}
                            className={`p-1.5 rounded-md transition-colors ${canRedo ? 'text-text-muted hover:text-text-main hover:bg-sidebar' : 'text-text-muted opacity-50'}`}
                        >
                            <Redo className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Open Button */}
                    <button
                        onClick={onUpload}
                        className="flex items-center gap-1.5 px-2 py-1.5 bg-sidebar rounded-lg text-sm font-semibold hover:bg-surface border border-border text-text-main shrink-0"
                        title="Open PDF"
                    >
                        <FolderOpen className="w-4 h-4 text-indigo-500" />
                        <span className="hidden sm:inline">Open</span>
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={() => pdfUrl && setShowDownloadDialog(true)}
                        disabled={!pdfUrl}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-semibold shrink-0 ${pdfUrl ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-text-main' : 'bg-surface opacity-50 text-text-muted border border-border'}`}
                        title="Save PDF"
                    >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Save</span>
                    </button>

                    {/* Theme Switcher */}
                    <button
                        onClick={() => dispatch(toggleTheme())}
                        className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-surface shrink-0"
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                    </button>

                    {/* Right Panel Toggle */}
                    <button
                        onClick={() => dispatch(setSidebarRightOpen(!sidebarRightOpen))}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface shrink-0"
                    >
                        {sidebarRightOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                ROW 2: Tools — MOBILE ONLY
            ═══════════════════════════════════════════════════ */}
            <div className="flex lg:hidden items-center gap-1 overflow-x-auto no-scrollbar px-2 py-1.5 bg-sidebar border-b border-border/50 w-full">
                {renderAllTools()}
            </div>

            {/* ═══════════════════════════════════════════════════
                ROW 3: Controls bar — page nav, zoom, actions
            ═══════════════════════════════════════════════════ */}
            <div className="flex items-center h-10 bg-sidebar border-t border-border px-2 lg:px-4 gap-2 overflow-x-auto no-scrollbar w-full">
                {/* Left: Page Navigation */}
                <div className="flex items-center gap-1 bg-surface rounded-md p-0.5 border border-border shrink-0">
                    <button
                        onClick={() => dispatch(navigateToPage(Math.max(1, currentPage - 1)))}
                        disabled={currentPage <= 1}
                        className="p-1 hover:bg-sidebar rounded text-text-muted disabled:opacity-30"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium text-text-main px-1 min-w-[4rem] text-center select-none">
                        {currentPage} / {Math.max(1, totalPages)}
                    </span>
                    <button
                        onClick={() => dispatch(navigateToPage(Math.min(totalPages, currentPage + 1)))}
                        disabled={currentPage >= totalPages}
                        className="p-1 hover:bg-sidebar rounded text-text-muted disabled:opacity-30"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Center: Zoom */}
                <div className="flex items-center gap-1 bg-surface rounded-md p-0.5 border border-border shrink-0">
                    <button
                        onClick={() => dispatch(setScale(Math.max(0.2, scale - 0.1)))}
                        className="p-1 hover:bg-sidebar rounded text-text-muted"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium text-text-main w-10 text-center select-none">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => dispatch(setScale(Math.min(3.0, scale + 0.1)))}
                        className="p-1 hover:bg-sidebar rounded text-text-muted"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="flex-1 min-w-[1rem]"></div>

                {/* Right: Extract Content & Download */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={async () => {
                            const pageConfig = pages[currentPage - 1];
                            if (!pageConfig || !pdfUrl) return;

                            if (pageConfig.isExtracted) {
                                const extractedIds = annotations
                                    .filter(a => a.page === pageConfig.originalIndex && a.isExtracted)
                                    .map(a => a.id);
                                if (extractedIds.length > 0) {
                                    dispatch(removeAnnotations(extractedIds));
                                }
                                dispatch(togglePageExtraction(pageConfig.id));
                                return;
                            }

                            try {
                                const { pdfjs } = await import('react-pdf');
                                pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                                const loadingTask = pdfjs.getDocument(pdfUrl);
                                const doc = await loadingTask.promise;
                                const page = await doc.getPage(pageConfig.originalIndex);
                                const textContent = await page.getTextContent();
                                const viewport = page.getViewport({ scale: 1 });

                                const items = textContent.items as any[];
                                const lines: any[][] = [];
                                const tolerance = 5;

                                const sortedItems = [...items].sort((a, b) => {
                                    const dy = b.transform[5] - a.transform[5];
                                    if (Math.abs(dy) > tolerance) return dy;
                                    return a.transform[4] - b.transform[4];
                                });

                                for (const item of sortedItems) {
                                    const itemY = item.transform[5];
                                    const line = lines.find(l => Math.abs(l[0].transform[5] - itemY) < tolerance);
                                    if (line) {
                                        line.push(item);
                                    } else {
                                        lines.push([item]);
                                    }
                                }

                                const newAnnotations: any[] = lines.map(lineItems => {
                                    lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
                                    const first = lineItems[0];
                                    const last = lineItems[lineItems.length - 1];

                                    let content = "";
                                    let lastX = first.transform[4];
                                    let lastWidth = first.width || 0;

                                    lineItems.forEach((item, idx) => {
                                        if (idx > 0) {
                                            const gap = item.transform[4] - (lastX + lastWidth);
                                            if (gap > 2) content += " ";
                                        }
                                        content += item.str;
                                        lastX = item.transform[4];
                                        lastWidth = item.width || 0;
                                    });

                                    const tx = first.transform;
                                    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
                                    const x = first.transform[4];
                                    const pdfY = first.transform[5];
                                    const y = viewport.height - pdfY - fontSize;

                                    const width = (last.transform[4] + (last.width || 0)) - first.transform[4];
                                    const height = fontSize * 1.25;

                                    return {
                                        id: nanoid(),
                                        type: 'text',
                                        x: x,
                                        y: y,
                                        page: pageConfig.originalIndex,
                                        content: content,
                                        color: '#000000',
                                        backgroundColor: 'transparent',
                                        size: Math.round(fontSize),
                                        minWidth: width,
                                        isExtracted: true,
                                        fontFamily: 'Arial',
                                        textAlign: 'left',
                                        maskX: x,
                                        maskY: y,
                                        maskWidth: width,
                                        maskHeight: height
                                    };
                                }).filter(a => a.content.trim().length > 0);

                                const existingExtractedIds = annotations
                                    .filter(a => a.page === pageConfig.originalIndex && a.isExtracted)
                                    .map(a => a.id);
                                if (existingExtractedIds.length > 0) {
                                    dispatch(removeAnnotations(existingExtractedIds));
                                }

                                dispatch(setAnnotations(newAnnotations));
                                dispatch(togglePageExtraction(pageConfig.id));

                            } catch (error) {
                                console.error("Failed to extract text:", error);
                                alert("Failed to extract text from this page. See console for details.");
                            }
                        }}
                        disabled={!pdfUrl || pages.length === 0}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all text-[10px] font-semibold uppercase tracking-wider ${
                            pages[currentPage - 1]?.isExtracted
                                ? 'bg-green-500/10 border-green-500/50 text-green-600'
                                : 'bg-sidebar border-border text-text-muted'
                        } ${!pdfUrl ? 'opacity-40' : ''}`}
                    >
                        <span>{pages[currentPage - 1]?.isExtracted ? 'Extracted' : 'Extract Text'}</span>
                    </button>

                    <button
                        onClick={() => pdfUrl && setShowDownloadDialog(true)}
                        disabled={!pdfUrl}
                        className={`p-1.5 rounded border border-border bg-surface text-text-muted ${!pdfUrl ? 'opacity-40 cursor-not-allowed' : 'hover:bg-sidebar hover:text-text-main'}`}
                        title="Download File"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
