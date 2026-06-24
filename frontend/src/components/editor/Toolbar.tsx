import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setScale, setTool, setSidebarLeftOpen, setSidebarRightOpen, undo, redo, navigateToPage, togglePageExtraction, setAnnotations, removeAnnotations } from '../../store/slices/canvasSlice';
import { generatePDF } from '../../utils/pdfGenerator';
// import { pdfjs } from 'react-pdf'; // Dynamically imported to avoid SSR issues
import { nanoid } from '@reduxjs/toolkit';
import {
    ZoomIn,
    ZoomOut,
    MousePointer2,
    Hand,
    Type,
    PenTool,
    Image as ImageIcon,
    Download,
    Undo,
    Redo,
    Upload,
    ChevronLeft,
    ChevronRight,
    LayoutTemplate,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    Eraser,
    AppWindow, // For "Extract Content" placeholder or similar
    Settings,
    FileSignature,
    X
} from 'lucide-react';

interface ToolbarProps {
    onUpload: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onUpload }) => {
    const dispatch = useDispatch();
    const {
        scale,
        tool,
        currentPage,
        totalPages,
        sidebarLeftOpen,
        sidebarRightOpen,
        history,
        pdfUrl,
        pages,
        annotations
    } = useSelector((state: RootState) => state.canvas);

    const [showDownloadDialog, setShowDownloadDialog] = React.useState(false);
    const [fileName, setFileName] = React.useState('edited_document');

    const activeTool = tool;
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

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
            alert('Failed to generate PDF. check console for details.');
        }
    };

    return (
        <div className="flex flex-col z-50 shadow-xl relative">
            {showDownloadDialog && (
                <div className="absolute top-16 right-4 bg-[var(--surface)] border border-white/10 p-4 rounded-xl shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-200 z-[60]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">Download PDF</h3>
                        <button
                            onClick={() => setShowDownloadDialog(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-400 mb-1.5 block">File Name</label>
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Enter file name"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
            )}

            {/* Top Main Toolbar */}
            <div className="h-14 bg-sidebar border-b border-white/10 flex items-center justify-between px-4 overflow-x-auto no-scrollbar gap-4">
                {/* Logo / Home */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <LayoutTemplate className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg hidden md:block">PDF Editor</span>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-2 flex-shrink-0" />

                    {/* Main Tools */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => dispatch(setTool('select'))}
                            className={`p-2 rounded-lg transition-all ${activeTool === 'select'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            title="Select (V)"
                        >
                            <MousePointer2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => dispatch(setTool('hand'))}
                            className={`p-2 rounded-lg transition-all ${activeTool === 'hand'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            title="Pan (H)"
                        >
                            <Hand className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => dispatch(setTool('text'))}
                            className={`p-2 rounded-lg transition-all ${activeTool === 'text'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            title="Text (T)"
                        >
                            <Type className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => dispatch(setTool('draw'))}
                            className={`p-2 rounded-lg transition-all ${activeTool === 'draw'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            title="Draw (P)"
                        >
                            <PenTool className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => dispatch(setTool('erase'))}
                            className={`p-2 rounded-lg transition-all ${activeTool === 'erase'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            title="Erase (E)"
                        >
                            <Eraser className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => dispatch(setTool('image'))}
                            className={`p-2 rounded-lg transition-all ${activeTool === 'image'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            title="Image (I)"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => dispatch(setTool('sign'))}
                            className={`p-2 rounded-lg transition-all ${activeTool === 'sign'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            title="Sign"
                        >
                            <FileSignature className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => dispatch(undo())}
                            disabled={!canUndo}
                            className={`p-1.5 rounded-md transition-colors ${canUndo ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'}`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => dispatch(redo())}
                            disabled={!canRedo}
                            className={`p-1.5 rounded-md transition-colors ${canRedo ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'}`}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={onUpload}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-white/10 transition-colors text-sm font-medium"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Open</span>
                    </button>

                    <button
                        onClick={() => setShowDownloadDialog(true)}
                        disabled={!pdfUrl}
                        className={`flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium whitespace-nowrap active:scale-95 ${!pdfUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            {/* Sub-header / Controls Bar */}
            <div className="h-12 bg-[var(--sidebar)] border-b border-white/10 flex items-center justify-between px-4 backdrop-blur-sm">
                {/* Left: Sidebar Toggle & Page Nav */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => dispatch(setSidebarLeftOpen(!sidebarLeftOpen))}
                        className={`p-2 rounded-lg transition-colors ${sidebarLeftOpen ? 'text-indigo-400 bg-white/5' : 'text-slate-400 hover:text-white'}`}
                        title="Toggle Pages"
                    >
                        {sidebarLeftOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                    </button>

                    <div className="h-6 w-px bg-white/10" />

                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => dispatch(navigateToPage(Math.max(1, currentPage - 1)))}
                            disabled={currentPage <= 1}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-slate-300 px-2 min-w-[5rem] text-center">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => dispatch(navigateToPage(Math.min(totalPages, currentPage + 1)))}
                            disabled={currentPage >= totalPages}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    {/* Extract Content Button */}
                    <button
                        onClick={async () => {
                            const pageConfig = pages[currentPage - 1];
                            if (!pageConfig || !pdfUrl) return;

                            if (pageConfig.isExtracted) {
                                // Toggle off: Remove extracted annotations and flip flag
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

                                // Group items by line (Y position)
                                const items = textContent.items as any[];
                                const lines: any[][] = [];
                                const tolerance = 5;

                                // Sort by Y (descending) then X (ascending) to help clustering
                                const sortedItems = [...items].sort((a, b) => {
                                    const dy = b.transform[5] - a.transform[5];
                                    if (Math.abs(dy) > tolerance) return dy;
                                    return a.transform[4] - b.transform[4];
                                });

                                for (const item of sortedItems) {
                                    const itemY = item.transform[5];
                                    // Find a matching line
                                    const line = lines.find(l => Math.abs(l[0].transform[5] - itemY) < tolerance);
                                    if (line) {
                                        line.push(item);
                                    } else {
                                        lines.push([item]);
                                    }
                                }

                                const newAnnotations: any[] = lines.map(lineItems => {
                                    // Sort by X inside the line
                                    lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

                                    const first = lineItems[0];
                                    const last = lineItems[lineItems.length - 1];

                                    // Aggregate text. 
                                    let content = "";
                                    let lastX = first.transform[4];
                                    let lastWidth = first.width || 0;

                                    lineItems.forEach((item, idx) => {
                                        if (idx > 0) {
                                            const gap = item.transform[4] - (lastX + lastWidth);
                                            // Add space if appreciable gap
                                            if (gap > 2) content += " ";
                                        }
                                        content += item.str;
                                        lastX = item.transform[4];
                                        lastWidth = item.width || 0;
                                    });

                                    // Calc bounding box
                                    const tx = first.transform;
                                    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
                                    const x = first.transform[4];
                                    const pdfY = first.transform[5];
                                    // Adjust Y to top-left
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
                                        backgroundColor: '#ffffff', // Mask text
                                        size: Math.round(fontSize),
                                        minWidth: width,
                                        isExtracted: true,
                                        fontFamily: 'Arial', // Default font
                                        textAlign: 'left',
                                        maskX: x,
                                        maskY: y,
                                        maskWidth: width,
                                        maskHeight: height
                                    };
                                }).filter(a => a.content.trim().length > 0);

                                // Clean up existing extracted annotations for this page first to avoid duplicates
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium uppercase tracking-wider ${pages[currentPage - 1]?.isExtracted
                            ? 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20'
                            : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                            } ${!pdfUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        {pages[currentPage - 1]?.isExtracted ? 'Extracted' : 'Extract Content'}
                    </button>
                </div>

                {/* Center: Zoom */}
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-white/5">
                    <button
                        onClick={() => dispatch(setScale(Math.max(0.2, scale - 0.1)))}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-slate-300 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => dispatch(setScale(Math.min(3.0, scale + 0.1)))}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                {/* Right: Extra & Sidebar Toggle */}
                <div className="flex items-center gap-4">
                    {/* <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg border border-emerald-400/20 transition-colors">
                        <AppWindow className="w-4 h-4" />
                        <span className="hidden sm:inline">Extract Content</span>
                    </button> */}

                    <div className="h-6 w-px bg-white/10" />

                    <button
                        onClick={() => dispatch(setSidebarRightOpen(!sidebarRightOpen))}
                        className={`p-2 rounded-lg transition-colors ${sidebarRightOpen ? 'text-indigo-400 bg-white/5' : 'text-slate-400 hover:text-white'}`}
                        title="Properties"
                    >
                        {sidebarRightOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

