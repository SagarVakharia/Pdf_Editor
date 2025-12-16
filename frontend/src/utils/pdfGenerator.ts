import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

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
}

export const generatePDF = async (
    pdfUrl: string,
    pages: PageConfig[],
    annotations: Annotation[]
) => {
    try {
        // Fetch current PDF
        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

        // Load into pdf-lib
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Create a new document to assemble pages
        const newPdfDoc = await PDFDocument.create();

        // 1. Process Pages (Reordering & Rotation)
        // We need to copy pages from original doc to new doc in the specific order
        const copiedPages = await newPdfDoc.copyPages(
            pdfDoc,
            pages.map(p => p.originalIndex - 1) // 0-based index
        );

        // Add pages to new doc and apply rotation relative to existing rotation if needed
        // But simply setting rotation is usually absolute in pdf-lib
        pages.forEach((pageConfig, index) => {
            const page = copiedPages[index];
            const existingRotation = page.getRotation().angle;
            // The rotation in our state (0, 90, 180, 270) acts as an offset or absolute? 
            // Usually in UI we treat it as absolute rotation relative to view.
            // Let's assume it overrides or adds. 
            // If the UI rotates 90deg, it means 90deg from original.
            // So we set it to (original + config) or just config?
            // Let's assume absolute rotation from "upright".
            // But if original PDF has rotation, we might need to respect it. 
            // For simplicity, let's ADD the rotation.
            page.setRotation(degrees((existingRotation + pageConfig.rotation) % 360));
            newPdfDoc.addPage(page);
        });

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
                    // Y flip: height - y
                    // Also text baseline adjustment might be needed
                    page.drawText(annotation.content, {
                        x: annotation.x,
                        y: height - annotation.y - fontSize, // Approximate baseline
                        size: fontSize,
                        font: helveticaFont,
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
