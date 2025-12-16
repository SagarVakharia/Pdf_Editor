import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

const sanitizeText = (text: string) => {
    return text.replace(/[^\x00-\xFF]/g, (char) => {
        switch (char.charCodeAt(0)) {
            case 8216: return "'"; // ‘
            case 8217: return "'"; // ’
            case 8220: return '"'; // “
            case 8221: return '"'; // ”
            case 8211: return '-'; // –
            case 8212: return '--'; // —
            case 8226: return '-'; // •
            case 9679: return '-'; // ●
            default: return '?';
        }
    });
};

interface PageConfig {
    id: string;
    originalIndex: number;
    rotation: number;
}

interface Annotation {
    id: string;
    type: 'text' | 'draw' | 'image' | 'sign';
    x: number;
    y: number;
    page: number;
    content?: string;
    path?: { x: number; y: number }[];
    color?: string;
    size?: number;
    opacity?: number;
    backgroundColor?: string;
    minWidth?: number;
    minHeight?: number;
    isBold?: boolean;
    isItalic?: boolean;
    fontFamily?: string;
}

export const generatePDF = async (
    pdfUrl: string,
    pages: PageConfig[],
    annotations: Annotation[]
) => {
    if (pages.length === 0) {
        throw new Error("Cannot generate PDF with 0 pages.");
    }

    try {
        // Fetch current PDF
        // Fetch current PDF
        let existingPdfBytes;
        try {
            const res = await fetch(pdfUrl);
            if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.statusText}`);
            existingPdfBytes = await res.arrayBuffer();
        } catch (e) {
            throw new Error(`Error fetching PDF from URL: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Load into pdf-lib
        // Load into pdf-lib
        let pdfDoc;
        try {
            pdfDoc = await PDFDocument.load(existingPdfBytes);
        } catch (e) {
            throw new Error(`Error loading PDF document: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Create a new document to assemble pages
        const newPdfDoc = await PDFDocument.create();

        // 1. Process Pages (Reordering & Rotation)
        // We need to copy pages from original doc to new doc in the specific order
        try {
            const pageIndices = pages.map(p => p.originalIndex - 1);
            // newPdfDoc.copyPages expects an array of indices. Ensure they are valid.
            const totalOriginal = pdfDoc.getPageCount();
            if (pageIndices.some(i => i < 0 || i >= totalOriginal)) {
                throw new Error(`Invalid page index found. Document has ${totalOriginal} pages.`);
            }

            const copiedPages = await newPdfDoc.copyPages(
                pdfDoc,
                pageIndices
            );

            // Add pages to new doc
            pages.forEach((pageConfig, index) => {
                const page = copiedPages[index];
                const existingRotation = page.getRotation().angle;
                page.setRotation(degrees((existingRotation + pageConfig.rotation) % 360));
                newPdfDoc.addPage(page);
            });
        } catch (e) {
            throw new Error(`Error copying pages: ${e instanceof Error ? e.message : String(e)}`);
        }

        // 2. Apply Annotations
        // We need to map annotations to the NEW pages in newPdfDoc.
        // The annotation.page property refers to the 1-based index in the VIRTUAL document (our UI).

        // Group annotations by page
        const annotationsByPage: { [key: number]: Annotation[] } = {};
        annotations.forEach(a => {
            if (!annotationsByPage[a.page]) annotationsByPage[a.page] = [];
            annotationsByPage[a.page].push(a);
        });

        // Embed font
        const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);

        // Iterate through new pages
        const newPages = newPdfDoc.getPages();

        for (let i = 0; i < newPages.length; i++) {
            const pageIndex = i + 1; // 1-based index matching annotation.page
            const pageAnnotations = annotationsByPage[pageIndex] || [];
            const page = newPages[i];
            const { width, height } = page.getSize();

            // Note: coordinates in PDF are usually bottom-left origin.
            // But our UI (HTML/CSS) is top-left origin.
            // We need to flip Y.

            for (const annotation of pageAnnotations) {
                // Parse color
                const colorHex = annotation.color || '#000000';
                const r = parseInt(colorHex.slice(1, 3), 16) / 255;
                const g = parseInt(colorHex.slice(3, 5), 16) / 255;
                const b = parseInt(colorHex.slice(5, 7), 16) / 255;
                const pdfColor = rgb(r, g, b);
                const opacity = annotation.opacity ?? 1;

                if (annotation.type === 'text' && annotation.content) {
                    const fontSize = annotation.size || 16;

                    // Select Font
                    let font = helveticaFont;
                    if (annotation.isBold && annotation.isItalic) font = await newPdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
                    else if (annotation.isBold) font = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
                    else if (annotation.isItalic) font = await newPdfDoc.embedFont(StandardFonts.HelveticaOblique);

                    // Calculate Dimensions
                    const textWidth = font.widthOfTextAtSize(sanitizeText(annotation.content), fontSize);
                    const boxWidth = Math.max(textWidth, annotation.minWidth || 0);
                    const boxHeight = Math.max(fontSize, annotation.minHeight || 0);

                    // Draw Background (Masking)
                    if (annotation.backgroundColor) {
                        const bgColorHex = annotation.backgroundColor;
                        const bgR = parseInt(bgColorHex.slice(1, 3), 16) / 255;
                        const bgG = parseInt(bgColorHex.slice(3, 5), 16) / 255;
                        const bgB = parseInt(bgColorHex.slice(5, 7), 16) / 255;

                        page.drawRectangle({
                            x: annotation.x,
                            y: height - annotation.y - boxHeight,
                            width: boxWidth,
                            height: boxHeight,
                            color: rgb(bgR, bgG, bgB),
                            opacity: 1 // Background should be opaque to hide original text
                        });
                    }

                    // Draw Text
                    page.drawText(sanitizeText(annotation.content), {
                        x: annotation.x,
                        y: height - annotation.y - fontSize + (fontSize * 0.15), // Slight vertical adjustment to center in box approx
                        size: fontSize,
                        font: font,
                        color: pdfColor,
                        opacity: opacity
                    });
                }
                else if (annotation.type === 'draw' && annotation.path && annotation.path.length > 1) {
                    const thickness = annotation.size || 2;
                    // Draw path as SVG path or line segments
                    // pdf-lib supports drawSvgPath or move/line
                    // Let's construct a path string or draw lines

                    const pathData = annotation.path;
                    // Optimization: handle as SVG path
                    // M x0 y0 L x1 y1 ...
                    // Remember to flip Y for every point

                    let svgPath = `M ${pathData[0].x} ${height - pathData[0].y}`;
                    for (let k = 1; k < pathData.length; k++) {
                        svgPath += ` L ${pathData[k].x} ${height - pathData[k].y}`;
                    }

                    // To simulate opacity with lines, we might need a separate approach or just accept it.
                    // drawSvgPath doesn't always support opacity in all versions appropriately or standard stroke.
                    // Actually page.drawSvgPath is good.
                    page.drawSvgPath(svgPath, {
                        borderColor: pdfColor,
                        borderWidth: thickness,
                        borderOpacity: opacity
                    });
                }
                else if (annotation.type === 'image' && annotation.content) {
                    try {
                        const imageBytes = await fetch(annotation.content).then(res => res.arrayBuffer());

                        let image;
                        // naive check for png/jpg based on url or header
                        // For data URLs, we can guess
                        if (annotation.content.startsWith('data:image/png')) {
                            image = await newPdfDoc.embedPng(imageBytes);
                        } else {
                            // try jpg fallack
                            image = await newPdfDoc.embedJpg(imageBytes).catch(() => newPdfDoc.embedPng(imageBytes).catch(() => null));
                        }

                        if (image) {
                            const dims = image.scale(1); // or use annotation w/h if we stored it
                            // We need to know the width/height the user resized it to.
                            // The Annotation interface in my previous read didn't show width/height for image explicitly 
                            // other than "size". If "size" is width, we scale proportionally.
                            // Let's assume simple scaling for now or native size if not specified.

                            // If we don't have explicit width/height in annotation, we might have an issue 
                            // replicating exact size. The "size" prop in Interface might be text size or stroke width.
                            // Let's assume for image, we might need to add width/height to annotation model 
                            // or use a fixed scale.
                            // For now, let's draw it native size or limit it.

                            // FIX: The current annotation model in canvasSlice.ts doesn't seem to have width/height for images explicitly.
                            // It has `size`. Let's treat `size` as width (pixels) if present, else 100?
                            // Or maybe the user cannot resize images yet?
                            // Checking Drawing tool... usually just text/draw.

                            // Let's draw it at X,Y
                            const imgWidth = annotation.size ? annotation.size * 10 : dims.width; // rough guess if size is small number
                            const imgHeight = (imgWidth / dims.width) * dims.height;

                            page.drawImage(image, {
                                x: annotation.x,
                                y: height - annotation.y - imgHeight, // Top-left anchor simulation
                                width: imgWidth,
                                height: imgHeight,
                                opacity: opacity
                            });
                        }
                    } catch (e) {
                        console.error("Failed to embed image", e);
                    }
                }
            }
        }

        const pdfBytes = await newPdfDoc.save();
        return pdfBytes;

    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
};
