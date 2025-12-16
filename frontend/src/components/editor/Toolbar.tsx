import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setScale, setTool, setSidebarLeftOpen, setSidebarRightOpen } from '../../store/slices/canvasSlice';
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
    FileSignature
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
        sidebarRightOpen
    } = useSelector((state: RootState) => state.canvas);

    const activeTool = tool;

    return (
        <div className="flex flex-col z-50 shadow-xl">
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
                        <button className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
                            <Undo className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
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

                    <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium whitespace-nowrap">
                        <Download className="w-4 h-4" />
                        <span>Save</span>
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
                        <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 disabled:opacity-50">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-slate-300 px-2 min-w-[5rem] text-center">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 disabled:opacity-50">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
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
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg border border-emerald-400/20 transition-colors">
                        <AppWindow className="w-4 h-4" />
                        <span className="hidden sm:inline">Extract Content</span>
                    </button>

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

