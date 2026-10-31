import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

const sanitizeText = (text: string) => {
    return (text || '').replace(/[^\x00-\xFF]/g, (char) => {
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

const parseColor = (colorHex?: string, fallback = { r: 0, g: 0, b: 0 }) => {
    if (!colorHex || colorHex === 'transparent') return rgb(fallback.r, fallback.g, fallback.b);
    let hex = colorHex.trim();
    if (!hex.startsWith('#')) return rgb(fallback.r, fallback.g, fallback.b);
    if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    if (hex.length !== 7) return rgb(fallback.r, fallback.g, fallback.b);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return rgb(fallback.r, fallback.g, fallback.b);
    return rgb(r / 255, g / 255, b / 255);
};

// Wrap text to stay within the max allowed width, preserving paragraph newlines (\n)
const wrapText = (text: string, maxWidth: number, fontSize: number, font: any) => {
    const paragraphs = (text || '').split('\n');
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
            lines.push('');
            continue;
        }
        const words = paragraph.split(' ');
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(sanitizeText(testLine), fontSize);

            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
    }
    return lines;
};

interface PageConfig {
    id: string;
    originalIndex: number;
    rotation: number;
}

interface Annotation {
    id: string;
    type: 'text' | 'draw' | 'image' | 'sign' | 'line' | 'arrow' | 'rectangle' | 'highlight' | 'stamp' | 'circle' | 'triangle' | 'star' | 'diamond';
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
    isDeleted?: boolean;
    maskX?: number;
    maskY?: number;
    maskWidth?: number;
    maskHeight?: number;
    endX?: number;
    endY?: number;
    fillColor?: string;
}

// Convert top-left based editor coordinate space to bottom-left based PDF coordinate space,
// correctly translating positions on pages rotated by 0, 90, 180, or 270 degrees.
const getRotatedCoordinates = (
    x: number,
    y: number,
    w: number, // original page width
    h: number, // original page height
    rotation: number, // pageConfig.rotation (0, 90, 180, 270)
    boxWidth: number = 0,
    boxHeight: number = 0
) => {
    switch (rotation) {
        case 90:
            return {
                x: y,
                y: x
            };
        case 180:
            return {
                x: w - x - boxWidth,
                y: y
            };
        case 270:
            return {
                x: w - y - boxWidth,
                y: h - x - boxHeight
            };
        case 0:
        default:
            return {
                x: x,
                y: h - y - boxHeight
            };
    }
};

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
        let existingPdfBytes: ArrayBuffer;
        try {
            const res = await fetch(pdfUrl);
            if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.statusText}`);
            existingPdfBytes = await res.arrayBuffer();
        } catch (e) {
            throw new Error(`Error fetching PDF from URL: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Load into pdf-lib
        let pdfDoc: PDFDocument;
        try {
            pdfDoc = await PDFDocument.load(existingPdfBytes);
        } catch (e) {
            throw new Error(`Error loading PDF document: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Create a new document to assemble pages
        const newPdfDoc = await PDFDocument.create();

        // 1. Process Pages (Reordering & Rotation)
        try {
            const pageIndices = pages.map(p => p.originalIndex - 1);
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
            const pageConfig = pages[i];
            const originalIndex = pageConfig.originalIndex;
            const pageAnnotations = annotationsByPage[originalIndex] || [];
            const page = newPages[i];
            const { width, height } = page.getSize();
            const pageRot = pageConfig.rotation;
            const annotationRot = (360 - pageRot) % 360;

            for (const annotation of pageAnnotations) {
                // Parse color safely
                const pdfColor = parseColor(annotation.color, { r: 0, g: 0, b: 0 });
                const opacity = annotation.opacity ?? 1;

                if (annotation.type === 'text') {
                    // 1. Draw Mask (Masking original text position) if defined, regardless of deletion/empty state
                    if (annotation.maskX !== undefined && annotation.maskY !== undefined) {
                        const maskW = annotation.maskWidth || 0;
                        const maskH = annotation.maskHeight || 0;
                        const maskCoords = getRotatedCoordinates(annotation.maskX, annotation.maskY, width, height, pageRot, maskW, maskH);

                        page.drawRectangle({
                            x: maskCoords.x,
                            y: maskCoords.y,
                            width: maskW,
                            height: maskH,
                            color: rgb(1, 1, 1), // White
                            opacity: 1,
                            rotate: degrees(annotationRot)
                        });
                    }

                    // 2. Render actual text if not deleted and has content
                    if (!annotation.isDeleted && annotation.content) {
                        const fontSize = annotation.size || 16;

                        // Select Font
                        let font = helveticaFont;
                        if (annotation.isBold && annotation.isItalic) font = await newPdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
                        else if (annotation.isBold) font = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
                        else if (annotation.isItalic) font = await newPdfDoc.embedFont(StandardFonts.HelveticaOblique);

                        // Compute maximum available width to prevent text from overflowing off the page
                        const availableWidth = Math.max(100, annotation.minWidth || (width - annotation.x));

                        // Wrap text into multiple lines
                        const lines = wrapText(annotation.content, availableWidth, fontSize, font);
                        const lineHeight = fontSize * 1.2;
                        const totalBoxHeight = Math.max(lines.length * lineHeight, annotation.minHeight || 0);

                        // Draw Background (Opaque background if customized by user)
                        if (annotation.backgroundColor && annotation.backgroundColor !== 'transparent') {
                            const bgPdfColor = parseColor(annotation.backgroundColor, { r: 1, g: 1, b: 1 });
                            const boxCoords = getRotatedCoordinates(annotation.x, annotation.y, width, height, pageRot, availableWidth, totalBoxHeight);

                            page.drawRectangle({
                                x: boxCoords.x,
                                y: boxCoords.y,
                                width: availableWidth,
                                height: totalBoxHeight,
                                color: bgPdfColor,
                                opacity: 1,
                                rotate: degrees(annotationRot)
                            });
                        }

                        // Draw each line of text
                        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                            const lineText = lines[lineIndex];
                            if (lineText === undefined) continue;

                            const lineSpacing = lineIndex * lineHeight;
                            const lineCoords = getRotatedCoordinates(annotation.x, annotation.y + lineSpacing, width, height, pageRot, availableWidth, fontSize);

                            page.drawText(sanitizeText(lineText), {
                                x: lineCoords.x,
                                y: lineCoords.y + (fontSize * 0.15), // Offset slightly to align with baseline
                                size: fontSize,
                                font: font,
                                color: pdfColor,
                                opacity: opacity,
                                rotate: degrees(annotationRot)
                            });
                        }
                    }
                }
                else if (annotation.type === 'sign' && annotation.content && !annotation.path) {
                    if (annotation.content.startsWith('data:') || annotation.content.startsWith('blob:') || annotation.content.startsWith('http')) {
                        // Embed image signature
                        try {
                            let imageBytes: ArrayBuffer;
                            if (annotation.content.startsWith('data:')) {
                                const base64Data = annotation.content.split(',')[1];
                                const binaryString = atob(base64Data);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let k = 0; k < binaryString.length; k++) bytes[k] = binaryString.charCodeAt(k);
                                imageBytes = bytes.buffer;
                            } else {
                                imageBytes = await fetch(annotation.content).then(res => res.arrayBuffer());
                            }

                            let image;
                            if (annotation.content.startsWith('data:image/png') || annotation.content.endsWith('.png')) {
                                image = await newPdfDoc.embedPng(imageBytes).catch(() => null);
                            } else {
                                image = await newPdfDoc.embedJpg(imageBytes).catch(() => newPdfDoc.embedPng(imageBytes).catch(() => null));
                            }

                            if (image) {
                                const imgWidth = annotation.minWidth || 150;
                                const imgHeight = annotation.minHeight || 60;
                                const coords = getRotatedCoordinates(annotation.x, annotation.y, width, height, pageRot, imgWidth, imgHeight);

                                page.drawImage(image, {
                                    x: coords.x,
                                    y: coords.y,
                                    width: imgWidth,
                                    height: imgHeight,
                                    opacity: opacity,
                                    rotate: degrees(annotationRot)
                                });
                            }
                        } catch (e) {
                            console.error("Failed to embed image signature", e);
                        }
                    } else {
                        // Text typed signature
                        const fontSize = (annotation.minHeight || 50) * 0.8;
                        const font = await newPdfDoc.embedFont(StandardFonts.TimesRomanItalic);

                        const textWidth = font.widthOfTextAtSize(sanitizeText(annotation.content), fontSize);
                        const lineCoords = getRotatedCoordinates(annotation.x, annotation.y, width, height, pageRot, textWidth, fontSize);

                        page.drawText(sanitizeText(annotation.content), {
                            x: lineCoords.x,
                            y: lineCoords.y,
                            size: fontSize,
                            font: font,
                            color: pdfColor,
                            opacity: opacity,
                            rotate: degrees(annotationRot)
                        });
                    }
                }
                else if ((annotation.type === 'draw' || annotation.type === 'sign') && annotation.path && annotation.path.length > 1) {
                    const thickness = annotation.size || 2;
                    const pathData = annotation.path;

                    const offsetX = annotation.type === 'sign' ? annotation.x : 0;
                    const offsetY = annotation.type === 'sign' ? annotation.y : 0;

                    const firstPt = getRotatedCoordinates(pathData[0].x + offsetX, pathData[0].y + offsetY, width, height, pageRot);
                    let svgPath = `M ${firstPt.x} ${firstPt.y}`;
                    for (let k = 1; k < pathData.length; k++) {
                        const pt = getRotatedCoordinates(pathData[k].x + offsetX, pathData[k].y + offsetY, width, height, pageRot);
                        svgPath += ` L ${pt.x} ${pt.y}`;
                    }

                    page.drawSvgPath(svgPath, {
                        borderColor: pdfColor,
                        borderWidth: thickness,
                        borderOpacity: opacity
                    });
                }
                else if (annotation.type === 'line' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const thickness = annotation.size || 2;
                    const pt1 = getRotatedCoordinates(annotation.x, annotation.y, width, height, pageRot);
                    const pt2 = getRotatedCoordinates(annotation.endX, annotation.endY, width, height, pageRot);

                    page.drawLine({
                        start: { x: pt1.x, y: pt1.y },
                        end: { x: pt2.x, y: pt2.y },
                        color: pdfColor,
                        thickness: thickness,
                        opacity: opacity
                    });
                }
                else if (annotation.type === 'arrow' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const thickness = annotation.size || 2;
                    const pt1 = getRotatedCoordinates(annotation.x, annotation.y, width, height, pageRot);
                    const pt2 = getRotatedCoordinates(annotation.endX, annotation.endY, width, height, pageRot);

                    page.drawLine({
                        start: { x: pt1.x, y: pt1.y },
                        end: { x: pt2.x, y: pt2.y },
                        color: pdfColor,
                        thickness: thickness,
                        opacity: opacity
                    });

                    const angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
                    const headLength = 12;
                    const arrowPt1 = {
                        x: pt2.x - headLength * Math.cos(angle - Math.PI / 6),
                        y: pt2.y - headLength * Math.sin(angle - Math.PI / 6)
                    };
                    const arrowPt2 = {
                        x: pt2.x - headLength * Math.cos(angle + Math.PI / 6),
                        y: pt2.y - headLength * Math.sin(angle + Math.PI / 6)
                    };

                    page.drawLine({
                        start: { x: pt2.x, y: pt2.y },
                        end: { x: arrowPt1.x, y: arrowPt1.y },
                        color: pdfColor,
                        thickness: thickness,
                        opacity: opacity
                    });
                    page.drawLine({
                        start: { x: pt2.x, y: pt2.y },
                        end: { x: arrowPt2.x, y: arrowPt2.y },
                        color: pdfColor,
                        thickness: thickness,
                        opacity: opacity
                    });
                }
                else if (annotation.type === 'rectangle' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const thickness = annotation.size || 2;
                    const rx = Math.min(annotation.x, annotation.endX);
                    const ry = Math.min(annotation.y, annotation.endY);
                    const rw = Math.abs(annotation.endX - annotation.x);
                    const rh = Math.abs(annotation.endY - annotation.y);

                    const boxCoords = getRotatedCoordinates(rx, ry, width, height, pageRot, rw, rh);

                    let fillPdfColor;
                    if (annotation.fillColor && annotation.fillColor !== 'transparent') {
                        fillPdfColor = parseColor(annotation.fillColor);
                    }

                    page.drawRectangle({
                        x: boxCoords.x,
                        y: boxCoords.y,
                        width: rw,
                        height: rh,
                        borderColor: pdfColor,
                        borderWidth: thickness,
                        color: fillPdfColor,
                        opacity: opacity,
                        rotate: degrees(annotationRot)
                    });
                }
                else if (annotation.type === 'circle' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const thickness = annotation.size || 2;
                    const rx = Math.min(annotation.x, annotation.endX);
                    const ry = Math.min(annotation.y, annotation.endY);
                    const rw = Math.abs(annotation.endX - annotation.x);
                    const rh = Math.abs(annotation.endY - annotation.y);
                    const cx = rx + rw / 2;
                    const cy = ry + rh / 2;
                    const centerCoords = getRotatedCoordinates(cx, cy, width, height, pageRot);

                    let fillPdfColor;
                    if (annotation.fillColor && annotation.fillColor !== 'transparent') {
                        fillPdfColor = parseColor(annotation.fillColor);
                    }

                    page.drawEllipse({
                        x: centerCoords.x,
                        y: centerCoords.y,
                        xScale: rw / 2,
                        yScale: rh / 2,
                        borderColor: pdfColor,
                        borderWidth: thickness,
                        color: fillPdfColor,
                        opacity: opacity,
                        rotate: degrees(annotationRot)
                    });
                }
                else if (annotation.type === 'triangle' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const thickness = annotation.size || 2;
                    const x1 = annotation.x, y1 = annotation.y;
                    const x2 = annotation.endX, y2 = annotation.endY;
                    const cx = (x1 + x2) / 2;

                    const p1 = getRotatedCoordinates(cx, y1, width, height, pageRot);
                    const p2 = getRotatedCoordinates(x2, y2, width, height, pageRot);
                    const p3 = getRotatedCoordinates(x1, y2, width, height, pageRot);

                    const svgPath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;
                    let fillPdfColor;
                    if (annotation.fillColor && annotation.fillColor !== 'transparent') {
                        fillPdfColor = parseColor(annotation.fillColor);
                    }

                    page.drawSvgPath(svgPath, {
                        borderColor: pdfColor,
                        borderWidth: thickness,
                        color: fillPdfColor,
                        borderOpacity: opacity,
                        opacity: opacity
                    });
                }
                else if (annotation.type === 'diamond' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const thickness = annotation.size || 2;
                    const x1 = annotation.x, y1 = annotation.y;
                    const x2 = annotation.endX, y2 = annotation.endY;
                    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
                    const hw = Math.abs(x2 - x1) / 2, hh = Math.abs(y2 - y1) / 2;

                    const pTop = getRotatedCoordinates(cx, cy - hh, width, height, pageRot);
                    const pRight = getRotatedCoordinates(cx + hw, cy, width, height, pageRot);
                    const pBottom = getRotatedCoordinates(cx, cy + hh, width, height, pageRot);
                    const pLeft = getRotatedCoordinates(cx - hw, cy, width, height, pageRot);

                    const svgPath = `M ${pTop.x} ${pTop.y} L ${pRight.x} ${pRight.y} L ${pBottom.x} ${pBottom.y} L ${pLeft.x} ${pLeft.y} Z`;
                    let fillPdfColor;
                    if (annotation.fillColor && annotation.fillColor !== 'transparent') {
                        fillPdfColor = parseColor(annotation.fillColor);
                    }

                    page.drawSvgPath(svgPath, {
                        borderColor: pdfColor,
                        borderWidth: thickness,
                        color: fillPdfColor,
                        borderOpacity: opacity,
                        opacity: opacity
                    });
                }
                else if (annotation.type === 'star' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const thickness = annotation.size || 2;
                    const x1 = annotation.x, y1 = annotation.y;
                    const x2 = annotation.endX, y2 = annotation.endY;
                    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
                    const outerR = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
                    const innerR = outerR * 0.4;
                    const points = 5;

                    const pts: { x: number; y: number }[] = [];
                    for (let pIdx = 0; pIdx < points * 2; pIdx++) {
                        const angle = (pIdx * Math.PI) / points - Math.PI / 2;
                        const r = pIdx % 2 === 0 ? outerR : innerR;
                        const px = cx + r * Math.cos(angle);
                        const py = cy + r * Math.sin(angle);
                        pts.push(getRotatedCoordinates(px, py, width, height, pageRot));
                    }

                    let svgPath = `M ${pts[0].x} ${pts[0].y}`;
                    for (let pIdx = 1; pIdx < pts.length; pIdx++) {
                        svgPath += ` L ${pts[pIdx].x} ${pts[pIdx].y}`;
                    }
                    svgPath += ' Z';

                    let fillPdfColor;
                    if (annotation.fillColor && annotation.fillColor !== 'transparent') {
                        fillPdfColor = parseColor(annotation.fillColor);
                    }

                    page.drawSvgPath(svgPath, {
                        borderColor: pdfColor,
                        borderWidth: thickness,
                        color: fillPdfColor,
                        borderOpacity: opacity,
                        opacity: opacity
                    });
                }
                else if (annotation.type === 'highlight' && annotation.endX !== undefined && annotation.endY !== undefined) {
                    const rx = Math.min(annotation.x, annotation.endX);
                    const ry = Math.min(annotation.y, annotation.endY);
                    const rw = Math.abs(annotation.endX - annotation.x);
                    const rh = Math.abs(annotation.endY - annotation.y);

                    const boxCoords = getRotatedCoordinates(rx, ry, width, height, pageRot, rw, rh);

                    page.drawRectangle({
                        x: boxCoords.x,
                        y: boxCoords.y,
                        width: rw,
                        height: rh,
                        color: pdfColor,
                        opacity: 0.35, // Translucent highlight
                        rotate: degrees(annotationRot)
                    });
                }
                else if (annotation.type === 'stamp') {
                    const stampW = annotation.minWidth || annotation.size || 130;
                    const stampH = annotation.minHeight || 48;
                    const stampCoords = getRotatedCoordinates(annotation.x, annotation.y, width, height, pageRot, stampW, stampH);

                    // Light tinted background for stamp
                    const fillBgColor = parseColor(annotation.color, { r: 0.95, g: 0.98, b: 0.95 });

                    page.drawRectangle({
                        x: stampCoords.x,
                        y: stampCoords.y,
                        width: stampW,
                        height: stampH,
                        borderColor: pdfColor,
                        borderWidth: 2,
                        color: fillBgColor,
                        opacity: 0.12,
                        rotate: degrees(annotationRot - 4) // slight tilt
                    });

                    page.drawRectangle({
                        x: stampCoords.x,
                        y: stampCoords.y,
                        width: stampW,
                        height: stampH,
                        borderColor: pdfColor,
                        borderWidth: 2,
                        opacity: opacity,
                        rotate: degrees(annotationRot - 4)
                    });

                    // Draw stamp text inside
                    const boldFont = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
                    const stampText = (annotation.content || 'APPROVED').toUpperCase();
                    const stampFontSize = Math.max(8, Math.min(stampW * 0.13, stampH * 0.5));
                    const textW = boldFont.widthOfTextAtSize(stampText, stampFontSize);
                    const textH = stampFontSize * 0.8;
                    const textX = annotation.x + (stampW - textW) / 2;
                    const textY = annotation.y + (stampH - textH) / 2;
                    const textCoords = getRotatedCoordinates(textX, textY, width, height, pageRot, textW, textH);

                    page.drawText(stampText, {
                        x: textCoords.x,
                        y: textCoords.y + 1,
                        size: stampFontSize,
                        font: boldFont,
                        color: pdfColor,
                        opacity: opacity,
                        rotate: degrees(annotationRot - 4)
                    });
                }
                else if (annotation.type === 'image' && annotation.content) {
                    try {
                        let imageBytes: ArrayBuffer;
                        if (annotation.content.startsWith('data:')) {
                            // Decode base64 data URLs directly
                            const base64Data = annotation.content.split(',')[1];
                            const binaryString = atob(base64Data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let k = 0; k < binaryString.length; k++) {
                                bytes[k] = binaryString.charCodeAt(k);
                            }
                            imageBytes = bytes.buffer;
                        } else {
                            imageBytes = await fetch(annotation.content).then(res => res.arrayBuffer());
                        }

                        let image;
                        if (annotation.content.startsWith('data:image/png') || annotation.content.endsWith('.png')) {
                            image = await newPdfDoc.embedPng(imageBytes).catch(() => null);
                        } else {
                            image = await newPdfDoc.embedJpg(imageBytes).catch(() => newPdfDoc.embedPng(imageBytes).catch(() => null));
                        }

                        if (image) {
                            const dims = image.scale(1);
                            const imgWidth = annotation.size ? annotation.size : dims.width;
                            const imgHeight = (imgWidth / dims.width) * dims.height;

                            const coords = getRotatedCoordinates(annotation.x, annotation.y, width, height, pageRot, imgWidth, imgHeight);

                            page.drawImage(image, {
                                x: coords.x,
                                y: coords.y,
                                width: imgWidth,
                                height: imgHeight,
                                opacity: opacity,
                                rotate: degrees(annotationRot)
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
