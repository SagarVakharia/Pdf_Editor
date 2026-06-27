"use client";

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setTotalPages, setPage, setPdfUrl, setTool } from '../../store/slices/canvasSlice';
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, Image as ImageIcon, PenTool } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { TextLayer } from '@/components/editor/tools/TextLayer';
import { DrawLayer } from '@/components/editor/tools/DrawLayer';
import { HandLayer } from '@/components/editor/tools/HandLayer';
import { ImageLayer } from '@/components/editor/tools/ImageLayer';
import { StampLayer } from '@/components/editor/tools/StampLayer';
import { SignLayer } from '@/components/editor/tools/SignLayer';
import { nanoid } from '@reduxjs/toolkit';
import { addAnnotation, setSelectedAnnotationId } from '../../store/slices/canvasSlice';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
console.log('PDFViewer initialized workerSrc:', pdfjs.GlobalWorkerOptions.workerSrc);

interface PDFViewerProps {
    file: File | string | null;
    scale: number;
    onUpload?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, scale, onUpload }) => {
    const dispatch = useDispatch();
    const [numPages, setNumPages] = useState<number>(0);
    const [urlInput, setUrlInput] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const { pages, annotations, navigationRequest, tool: currentTool, activeStamp, activeSignature } = useSelector((state: RootState) => state.canvas);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            if (file && typeof file === 'string' && file.startsWith('blob:')) {
                URL.revokeObjectURL(file);
            }
            const url = URL.createObjectURL(droppedFile);
            dispatch(setPdfUrl(url));
        }
    };

    const handleLoadUrl = async () => {
        if (!urlInput.trim()) return;
        setIsLoadingUrl(true);
        try {
            let targetUrl = urlInput.trim();
            // CORS proxy for external URLs
            if (targetUrl.startsWith('http') && !targetUrl.includes(window.location.host)) {
                const isProduction = process.env.NODE_ENV === 'production' || !window.location.hostname.includes('localhost');
                const backendBaseUrl = isProduction ? '' : 'http://localhost:3001';
                targetUrl = `${backendBaseUrl}/api/proxy?url=${encodeURIComponent(targetUrl)}`;
            }
            dispatch(setPdfUrl(targetUrl));
        } catch (error) {
            console.error("Failed to load PDF from URL:", error);
            alert("Failed to load PDF from URL. Ensure it is a valid PDF link.");
        } finally {
            setIsLoadingUrl(false);
        }
    };

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        dispatch(setTotalPages(numPages));
    }

    // Scroll synchronization
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageId = entry.target.getAttribute('data-page-index');
                        if (pageId) {
                            dispatch(setPage(parseInt(pageId, 10)));
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: '-50% 0px -50% 0px', // Trigger when page is in middle of viewport
                threshold: 0
            }
        );

        const pageElements = document.querySelectorAll('.pdf-page-wrapper');
        pageElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [pages, dispatch]); // Re-run when pages change (reordering/add/delete)

    // Explicit navigation handler
    React.useEffect(() => {
        if (navigationRequest) {
            const pageElement = document.getElementById(`page-${navigationRequest}`);
            if (pageElement) {
                pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [navigationRequest]);

    const handlePageClick = (e: React.MouseEvent, pageIndex: number) => {
        const pageElement = e.currentTarget;
        const rect = pageElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        if (currentTool === 'stamp') {
            if (!activeStamp) return;
            const id = nanoid();
            dispatch(addAnnotation({
                id,
                type: 'stamp',
                x,
                y,
                page: pageIndex,
                content: activeStamp.text,
                color: activeStamp.color,
                size: 130, // Default stamp width
                opacity: 1,
                stampText: activeStamp.text
            }));
            dispatch(setSelectedAnnotationId(id));
            dispatch(setTool('select'));
            return;
        }

        if (currentTool === 'sign') {
            if (!activeSignature) return;
            const id = nanoid();
            dispatch(addAnnotation({
                id,
                type: 'sign',
                x,
                y,
                page: pageIndex,
                content: activeSignature.type === 'text' ? activeSignature.content : undefined,
                path: activeSignature.type === 'draw' ? activeSignature.path : undefined,
                color: '#000000', // Default signature color
                size: 2, // line width
                opacity: 1,
                minWidth: activeSignature.width,
                minHeight: activeSignature.height
            }));
            dispatch(setSelectedAnnotationId(id));
            dispatch(setTool('select'));
            return;
        }

        // Only handle click if tool is 'text'
        if (currentTool !== 'text') return;

        // Check if user clicked on existing text (span in textLayer)
        const target = e.target as HTMLElement;
        const isTextSpan = target.tagName === 'SPAN' && target.closest('.react-pdf__Page__textContent');



        // Prevent double extraction by checking if there's already an annotation nearby on the same page
        const isAlreadyExtracted = annotations.some(a => 
            a.page === pageIndex && 
            a.type === 'text' && 
            !a.isDeleted &&
            Math.abs(a.x - x) < 15 && 
            Math.abs(a.y - y) < 15
        );
        if (isAlreadyExtracted) return;

        let content = 'New Text';
        let fontSize = 16;
        let finalX = x;
        let finalY = y;
        let minW: number | undefined;
        let minH: number | undefined;
        let fontFamily = 'Arial';
        let isBold = false;
        let isItalic = false;
        let isExtracted = false;

        // IF clicked on existing text, extract its properties
        if (isTextSpan) {
            isExtracted = true;
            // LINE AGGREGATION LOGIC
            const parent = target.parentElement;
            if (parent) {
                const targetRect = target.getBoundingClientRect();
                const targetTop = targetRect.top;
                const tolerance = 5; // px tolerance for "same line"

                // 1. Find all sibling spans on the same visual line
                const siblings = Array.from(parent.children) as HTMLElement[];
                const lineSpans = siblings.filter(span => {
                    if (span.tagName !== 'SPAN') return false;
                    const r = span.getBoundingClientRect();
                    // Check if top align matches roughly
                    return Math.abs(r.top - targetTop) < tolerance;
                });

                // 2. Sort by Left position (X)
                lineSpans.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

                // 3. Aggregate Content & Dimensions
                content = lineSpans.map(s => s.innerText).join(' ').trim(); // Naive join, simpler than exact spacing

                // Calculate union bounding box
                const firstRect = lineSpans[0].getBoundingClientRect();
                const lastRect = lineSpans[lineSpans.length - 1].getBoundingClientRect();

                const unionLeft = firstRect.left;
                const unionTop = firstRect.top; // Use first element's top

                // Total width is from left of first to right of last
                const unionWidth = lastRect.right - firstRect.left;
                const unionHeight = Math.max(...lineSpans.map(s => s.getBoundingClientRect().height));

                // 4. Hide ALL involved spans
                lineSpans.forEach(span => {
                    span.style.opacity = '0';
                    span.style.pointerEvents = 'none';
                });

                // 5. Set final coordinates based on Union Box
                finalX = (unionLeft - rect.left) / scale;
                finalY = (unionTop - rect.top) / scale;

                minW = (unionWidth / scale) + 5;
                minH = (unionHeight / scale);

                // Extract Style from the clicked element (assume consistent style across line)
                const computedStyle = window.getComputedStyle(target);
                const computedFontSize = parseFloat(computedStyle.fontSize);
                if (!isNaN(computedFontSize)) {
                    fontSize = computedFontSize / scale;
                }

                fontFamily = computedStyle.fontFamily || 'Arial';
                const fontWeight = computedStyle.fontWeight;
                isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 700;
                isItalic = computedStyle.fontStyle === 'italic';

            } else {
                // Fallback
                const spanRect = target.getBoundingClientRect();
                target.style.opacity = '0';
                target.style.pointerEvents = 'none';

                finalX = (spanRect.left - rect.left) / scale;
                finalY = (spanRect.top - rect.top) / scale;
                content = target.innerText;
                minW = (spanRect.width / scale) + 5;
                minH = (spanRect.height / scale);

                const computedStyle = window.getComputedStyle(target);
                const computedFontSize = parseFloat(computedStyle.fontSize);
                if (!isNaN(computedFontSize)) fontSize = computedFontSize / scale;
                fontFamily = computedStyle.fontFamily || 'Arial';
                const fontWeight = computedStyle.fontWeight;
                isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 700;
                isItalic = computedStyle.fontStyle === 'italic';
            }
        }

        const id = nanoid();
        dispatch(addAnnotation({
            id,
            type: 'text',
            x: finalX,
            y: finalY,
            page: pageIndex,
            content: content,
            color: '#000000',
            backgroundColor: 'transparent', // transparent so it layers over the PDF
            size: fontSize,
            minWidth: minW,
            minHeight: minH,
            textAlign: 'left',
            fontFamily: fontFamily.replace(/['"]/g, ''), // Clean quotes from font family
            isBold,
            isItalic,
            isExtracted,
            maskX: isExtracted ? finalX : undefined,
            maskY: isExtracted ? finalY : undefined,
            maskWidth: isExtracted ? minW : undefined,
            maskHeight: isExtracted ? minH : undefined
        }));
        dispatch(setSelectedAnnotationId(id));
    };

    if (!file) {
        return (
            <div 
                className="flex flex-col items-center justify-center h-full text-text-muted py-6 sm:py-12 px-4 w-full"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div 
                    onClick={onUpload}
                    className="bg-sidebar p-5 sm:p-8 rounded-2xl border border-border shadow-2xl mb-6 sm:mb-8 flex flex-col items-center cursor-pointer hover:border-indigo-500/30 hover:bg-surface/50 transition-all max-w-lg w-full group"
                >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-border shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover:border-indigo-500/30 group-hover:scale-105 transition-all">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-primary opacity-90 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    </div>
                    <div className="text-center w-full">
                        <h3 className="text-xl sm:text-2xl font-bold text-text-main mb-2 tracking-tight">No PDF Loaded</h3>
                        <p className="text-xs sm:text-sm text-text-muted max-w-xs mx-auto mb-6 sm:mb-8 font-medium">
                            Click here to browse or drag and drop a PDF file to begin editing.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center">
                            <span className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface border border-border rounded-lg text-xs sm:text-sm font-medium transition-colors hover:text-indigo-500 text-text-main">
                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                                Edit Text
                            </span>
                            <span className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface border border-border rounded-lg text-xs sm:text-sm font-medium transition-colors hover:text-purple-500 text-text-main">
                                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                                Add Images
                            </span>
                            <span className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface border border-border rounded-lg text-xs sm:text-sm font-medium transition-colors hover:text-emerald-500 text-text-main">
                                <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                                Sign PDFs
                            </span>
                        </div>
                    </div>
                </div>

                {/* URL Loader Section */}
                <div className="bg-sidebar p-5 sm:p-6 rounded-2xl border border-border shadow-2xl max-w-lg w-full">
                    <h4 className="text-xs sm:text-sm font-semibold text-text-main mb-2 sm:mb-3">Or load a document from URL</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            placeholder="https://example.com/document.pdf"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-indigo-500 transition-colors w-full"
                        />
                        <button
                            onClick={handleLoadUrl}
                            disabled={isLoadingUrl}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-text-main rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto"
                        >
                            {isLoadingUrl ? 'Loading...' : 'Load'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center p-8 min-h-full bg-background/50">
            <div className="shadow-2xl">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col gap-4"
                >
                    {/* Render pages in virtual order */}
                    {pages.map((page, index) => (
                        <div
                            key={page.id}
                            className={`relative transition-all duration-300 pdf-page-wrapper ${
                                currentTool === 'stamp' ? 'cursor-copy' :
                                currentTool === 'sign' && activeSignature ? 'cursor-copy' :
                                currentTool === 'text' ? 'cursor-text' :
                                ''
                            }`}
                            data-page-index={index + 1}
                            id={`page-${index + 1}`}
                            onClick={(e) => handlePageClick(e, page.originalIndex)}
                        >
                            <Page
                                pageNumber={page.originalIndex}
                                scale={scale}
                                rotate={page.rotation}
                                className="bg-sidebar shadow-lg relative"
                                renderTextLayer={!page.isExtracted}
                                renderAnnotationLayer={true}
                            >
                                {/* Nested overlays to automatically scale and rotate with the page */}
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', position: 'relative' }}>
                                        <TextLayer pageNumber={page.originalIndex} scale={scale} />
                                        <DrawLayer pageNumber={page.originalIndex} scale={scale} />
                                        <ImageLayer pageNumber={page.originalIndex} scale={scale} />
                                        <StampLayer pageNumber={page.originalIndex} scale={scale} />
                                        <SignLayer pageNumber={page.originalIndex} scale={scale} />
                                        <HandLayer scale={scale} />
                                    </div>
                                </div>
                            </Page>
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
};
