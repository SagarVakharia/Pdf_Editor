import React, { useRef, useState, useEffect } from 'react';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signature: { type: 'draw' | 'text' | 'image', path?: { x: number, y: number }[], content?: string, imageUrl?: string, width: number, height: number }) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
    const [typedSignature, setTypedSignature] = useState('');
    const [typedFont, setTypedFont] = useState('Dancing Script');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [path, setPath] = useState<{ x: number, y: number }[]>([]);
    const [penColor, setPenColor] = useState('#000000');
    const [penSize, setPenSize] = useState(3);

    useEffect(() => {
        if (isOpen && activeTab === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); setPath([]); }
        }
    }, [isOpen, activeTab]);

    if (!isOpen) return null;

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
        else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const coords = getCoords(e);
        setPath([coords]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const coords = getCoords(e);
        setPath((prev) => [...prev, coords]);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && path.length > 0) {
            const last = path[path.length - 1];
            ctx.beginPath();
            ctx.moveTo(last.x, last.y); ctx.lineTo(coords.x, coords.y);
            ctx.strokeStyle = penColor; ctx.lineWidth = penSize;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        }
    };

    const stopDrawing = () => setIsDrawing(false);

    const handleClear = () => {
        if (activeTab === 'draw') {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); setPath([]); }
        } else {
            setTypedSignature('');
        }
    };

    const handleUploadImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                const w = 200, h = w / aspect;
                onSave({ type: 'image', imageUrl: url, width: w, height: h });
            };
            img.src = url;
        };
        input.click();
    };

    const handleSave = () => {
        if (activeTab === 'draw') {
            if (path.length < 2) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            path.forEach(p => {
                if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
            });
            const width = Math.max(maxX - minX, 100), height = Math.max(maxY - minY, 50);
            const normalizedPath = path.map(p => ({ x: p.x - minX, y: p.y - minY }));
            onSave({ type: 'draw', path: normalizedPath, width, height });
        } else {
            if (!typedSignature.trim()) return;
            onSave({ type: 'text', content: typedSignature, width: typedSignature.length * 22 + 40, height: 60 });
        }
    };

    const SIGNATURE_FONTS = [
        { name: 'Dancing Script', label: 'Script' },
        { name: 'Pacifico', label: 'Stylish' },
        { name: 'Caveat', label: 'Casual' },
    ];

    const PEN_COLORS = ['#000000', '#1e40af', '#15803d', '#dc2626'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div
                className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-sidebar border border-border"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <h3 className="text-text-main text-xl font-bold">Draw or Upload Signature</h3>
                </div>

                {/* Tabs */}
                <div className="flex px-6 gap-0 mb-4">
                    {(['draw', 'type'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors capitalize ${
                                activeTab === tab
                                    ? 'border-indigo-500 text-text-main'
                                    : 'border-transparent text-text-muted hover:text-gray-300'
                            }`}
                        >
                            {tab === 'draw' ? 'Draw' : 'Type'}
                        </button>
                    ))}
                </div>

                {/* Canvas / Type area */}
                <div className="px-6">
                    {activeTab === 'draw' ? (
                        <div className="relative rounded-xl overflow-hidden" style={{ background: '#fff', height: '220px' }}>
                            <canvas
                                ref={canvasRef}
                                width={466}
                                height={220}
                                className="w-full h-full cursor-crosshair"
                                style={{ display: 'block' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            {/* Baseline */}
                            <div className="absolute bottom-8 left-4 right-4 border-b border-border pointer-events-none" />
                            <span className="absolute bottom-2 left-4 text-xs text-text-muted select-none pointer-events-none">Sign above</span>
                        </div>
                    ) : (
                        <div className="rounded-xl overflow-hidden" style={{ background: '#fff', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16 }}>
                            {/* Font picker */}
                            <div className="flex gap-2">
                                {SIGNATURE_FONTS.map(f => (
                                    <button
                                        key={f.name}
                                        onClick={() => setTypedFont(f.name)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                            typedFont === f.name
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                                : 'border-border text-text-muted hover:border-gray-400'
                                        }`}
                                        style={{ fontFamily: f.name }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Type your signature..."
                                value={typedSignature}
                                onChange={(e) => setTypedSignature(e.target.value)}
                                className="w-full bg-transparent border-none text-center outline-none text-4xl text-text-main"
                                style={{ fontFamily: typedFont }}
                            />
                        </div>
                    )}
                </div>

                {/* Pen controls (draw mode only) */}
                {activeTab === 'draw' && (
                    <div className="flex items-center gap-4 px-6 pt-3">
                        <div className="flex items-center gap-2">
                            {PEN_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setPenColor(c)}
                                    className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                                    style={{ backgroundColor: c, border: penColor === c ? '2px solid white' : '2px solid transparent', boxShadow: penColor === c ? '0 0 0 1px #6366f1' : 'none' }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {[2, 3, 5].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setPenSize(s)}
                                    className={`rounded-full transition-all ${penSize === s ? 'bg-indigo-500' : 'bg-gray-500'}`}
                                    style={{ width: s * 4 + 4, height: s * 4 + 4 }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Button Row 1: Clear + Upload Image */}
                <div className="flex gap-3 px-6 pt-4">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold text-text-main transition-colors bg-surface border border-border"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleUploadImage}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold text-text-main flex items-center justify-center gap-2 transition-colors hover:opacity-90 bg-surface border border-border"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Upload Image
                    </button>
                </div>

                {/* Button Row 2: Cancel + Save */}
                <div className="flex gap-3 px-6 pt-3 pb-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold text-text-main transition-colors hover:opacity-90 bg-surface border border-border"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-lg text-sm font-bold text-text-main transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
