import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signature: { type: 'draw' | 'text', path?: { x: number, y: number }[], content?: string, width: number, height: number }) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
    const [typedSignature, setTypedSignature] = useState('');
    const [typedFont, setTypedFont] = useState('Dancing Script');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [path, setPath] = useState<{ x: number, y: number }[]>([]);

    useEffect(() => {
        if (isOpen && activeTab === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setPath([]);
            }
        }
    }, [isOpen, activeTab]);

    if (!isOpen) return null;

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
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleClear = () => {
        if (activeTab === 'draw') {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setPath([]);
            }
        } else {
            setTypedSignature('');
        }
    };

    const handleCreate = () => {
        if (activeTab === 'draw') {
            if (path.length < 2) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            path.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            const width = Math.max(maxX - minX, 100);
            const height = Math.max(maxY - minY, 50);
            const normalizedPath = path.map(p => ({ x: p.x - minX, y: p.y - minY }));
            onSave({ type: 'draw', path: normalizedPath, width, height });
        } else {
            if (!typedSignature.trim()) return;
            onSave({ type: 'text', content: typedSignature, width: typedSignature.length * 22 + 40, height: 60 });
        }
    };

    const SIGNATURE_FONTS = [
        { name: 'Dancing Script', label: 'Cursive' },
        { name: 'Pacifico', label: 'Stylish' },
        { name: 'Caveat', label: 'Handwritten' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Signature</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                        <button
                            className={`flex-1 py-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'draw' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('draw')}
                        >
                            Draw
                        </button>
                        <button
                            className={`flex-1 py-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'type' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('type')}
                        >
                            Type
                        </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex justify-center items-center h-48 relative">
                        {activeTab === 'draw' ? (
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={150}
                                className="w-full h-full cursor-crosshair bg-transparent"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        ) : (
                            <div className="flex flex-col w-full gap-3">
                                <div className="flex gap-2 justify-center">
                                    {SIGNATURE_FONTS.map(f => (
                                        <button
                                            key={f.name}
                                            onClick={() => setTypedFont(f.name)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                                typedFont === f.name
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
                                                    : 'border-border text-gray-500 hover:border-gray-400'
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
                                    className="w-full bg-transparent border-none text-center outline-none text-3xl text-black dark:text-white"
                                    style={{ fontFamily: typedFont }}
                                />
                            </div>
                        )}
                        <span className="absolute bottom-2 left-4 text-xs text-gray-400 select-none">Sign Above</span>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <button onClick={handleClear} className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors px-4 py-2">
                            Clear
                        </button>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleCreate} className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md active:scale-95 transition-all">
                                Create Signature
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
