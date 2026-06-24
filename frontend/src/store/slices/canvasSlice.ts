import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Annotation {
    id: string;
    type: 'text' | 'draw' | 'image' | 'sign';
    x: number;
    y: number;
    page: number;
    content?: string; // For text/image url
    path?: { x: number; y: number }[]; // For drawing
    color?: string;
    size?: number;
    opacity?: number;
    isExtracted?: boolean;
    isDeleted?: boolean;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    isBold?: boolean;
    isItalic?: boolean;
    backgroundColor?: string;
    minWidth?: number;
    minHeight?: number;
    maskX?: number;
    maskY?: number;
    maskWidth?: number;
    maskHeight?: number;
}

interface PageConfig {
    id: string;
    originalIndex: number; // 1-based index from the original PDF
    rotation: number;     // 0, 90, 180, 270
    isExtracted?: boolean;
}

interface CanvasState {
    pdfUrl: string | null;
    currentPage: number;
    totalPages: number;
    pages: PageConfig[]; // Virtual pages
    scale: number;
    tool: 'select' | 'hand' | 'text' | 'draw' | 'erase' | 'image' | 'sign' | 'shape';
    annotations: Annotation[];
    selectedAnnotationId: string | null;
    sidebarLeftOpen: boolean;
    sidebarRightOpen: boolean;
    activeSidebarTab: 'pages' | 'layers';
    activeRightTab: 'properties' | 'layers';
    navigationRequest: number | null; // For explicit navigation events
    history: {
        past: { pages: PageConfig[], annotations: Annotation[] }[];
        future: { pages: PageConfig[], annotations: Annotation[] }[];
    };
}
const initialState: CanvasState = {
    pdfUrl: null,
    currentPage: 1,
    totalPages: 0,
    pages: [],
    scale: 1,
    tool: 'select',
    annotations: [],
    selectedAnnotationId: null,
    sidebarLeftOpen: true,
    sidebarRightOpen: true,
    activeSidebarTab: 'pages',
    activeRightTab: 'properties',
    navigationRequest: null,
    history: {
        past: [],
        future: []
    }
};

const saveHistory = (state: CanvasState) => {
    state.history.past.push({
        pages: JSON.parse(JSON.stringify(state.pages)),
        annotations: JSON.parse(JSON.stringify(state.annotations))
    });
    state.history.future = [];
};

export const canvasSlice = createSlice({
    name: 'canvas',
    initialState,
    reducers: {
        setPdfUrl: (state, action: PayloadAction<string | null>) => {
            state.pdfUrl = action.payload;
            state.pages = [];
            state.annotations = [];
            state.totalPages = 0;
            state.currentPage = 1;
            state.selectedAnnotationId = null;
            state.history = { past: [], future: [] }; // Reset history on new file
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        navigateToPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
            state.navigationRequest = action.payload; // Signal viewer to scroll
        },
        setTotalPages: (state, action: PayloadAction<number>) => {
            state.totalPages = action.payload;
            if (state.pages.length === 0 || state.pages.length !== action.payload) {
                state.pages = Array.from({ length: action.payload }, (_, i) => ({
                    id: `page-${i + 1}`,
                    originalIndex: i + 1,
                    rotation: 0,
                    isExtracted: false
                }));
            }
        },
        initPages: (state, action: PayloadAction<number>) => {
            state.pages = Array.from({ length: action.payload }, (_, i) => ({
                id: `page-${i + 1}`,
                originalIndex: i + 1,
                rotation: 0,
                isExtracted: false
            }));
        },
        rotatePage: (state, action: PayloadAction<{ id: string, rotation: number }>) => {
            saveHistory(state);
            const page = state.pages.find(p => p.id === action.payload.id);
            if (page) {
                page.rotation = action.payload.rotation;
            }
        },
        togglePageExtraction: (state, action: PayloadAction<string>) => {
            saveHistory(state);
            const page = state.pages.find(p => p.id === action.payload);
            if (page) {
                page.isExtracted = !page.isExtracted;
            }
        },
        deletePage: (state, action: PayloadAction<string>) => {
            saveHistory(state);
            const pageToDelete = state.pages.find(p => p.id === action.payload);
            if (pageToDelete) {
                state.annotations = state.annotations.filter(a => a.page !== pageToDelete.originalIndex);
            }
            state.pages = state.pages.filter(p => p.id !== action.payload);
            if (state.pages.length > 0) {
                if (state.currentPage > state.pages.length) {
                    state.currentPage = state.pages.length;
                }
            } else {
                state.currentPage = 1;
            }
            state.totalPages = state.pages.length;
        },
        reorderPages: (state, action: PayloadAction<{ activeId: string, overId: string }>) => {
            // Check if actual change
            const oldIndex = state.pages.findIndex(p => p.id === action.payload.activeId);
            const newIndex = state.pages.findIndex(p => p.id === action.payload.overId);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                saveHistory(state);
                const [movedPage] = state.pages.splice(oldIndex, 1);
                state.pages.splice(newIndex, 0, movedPage);
            }
        },
        movePage: (state, action: PayloadAction<{ id: string, direction: 'up' | 'down' }>) => {
            saveHistory(state);
            const index = state.pages.findIndex(p => p.id === action.payload.id);
            if (index === -1) return;
            const newIndex = action.payload.direction === 'up' ? index - 1 : index + 1;
            if (newIndex >= 0 && newIndex < state.pages.length) {
                const [movedPage] = state.pages.splice(index, 1);
                state.pages.splice(newIndex, 0, movedPage);
            }
        },
        setScale: (state, action: PayloadAction<number>) => {
            state.scale = action.payload;
        },
        setTool: (state, action: PayloadAction<CanvasState['tool']>) => {
            state.tool = action.payload;
            state.selectedAnnotationId = null;
        },
        addAnnotation: (state, action: PayloadAction<Annotation>) => {
            saveHistory(state);
            state.annotations.push(action.payload);
        },
        setAnnotations: (state, action: PayloadAction<Annotation[]>) => {
            saveHistory(state);
            state.annotations = [...state.annotations, ...action.payload];
        },
        updateAnnotation: (state, action: PayloadAction<Annotation>) => {
            saveHistory(state);
            const index = state.annotations.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.annotations[index] = action.payload;
            }
        },
        removeAnnotation: (state, action: PayloadAction<string>) => {
            saveHistory(state);
            state.annotations = state.annotations.filter(a => a.id !== action.payload);
        },
        deleteAnnotation: (state, action: PayloadAction<string>) => {
            saveHistory(state);
            const ann = state.annotations.find(a => a.id === action.payload);
            if (ann) {
                if (ann.isExtracted && ann.maskX !== undefined) {
                    ann.isDeleted = true;
                    ann.content = '';
                } else {
                    state.annotations = state.annotations.filter(a => a.id !== action.payload);
                }
                if (state.selectedAnnotationId === action.payload) {
                    state.selectedAnnotationId = null;
                }
            }
        },
        removeAnnotations: (state, action: PayloadAction<string[]>) => {
            saveHistory(state);
            const idsToRemove = new Set(action.payload);
            state.annotations = state.annotations.filter(a => !idsToRemove.has(a.id));
        },
        setSelectedAnnotationId: (state, action: PayloadAction<string | null>) => {
            state.selectedAnnotationId = action.payload;
        },
        updateAnnotationProperties: (state, action: PayloadAction<{ id: string; updates: Partial<Annotation> }>) => {
            saveHistory(state);
            const index = state.annotations.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.annotations[index] = { ...state.annotations[index], ...action.payload.updates };
            }
        },
        undo: (state) => {
            if (state.history.past.length > 0) {
                const previous = state.history.past.pop();
                if (previous) {
                    state.history.future.push({
                        pages: JSON.parse(JSON.stringify(state.pages)),
                        annotations: JSON.parse(JSON.stringify(state.annotations))
                    });
                    state.pages = previous.pages;
                    state.annotations = previous.annotations;

                    // Recalculate derived state if needed
                    state.totalPages = state.pages.length;
                    // Reset selection to avoid ghost selection
                    state.selectedAnnotationId = null;
                }
            }
        },
        redo: (state) => {
            if (state.history.future.length > 0) {
                const next = state.history.future.pop();
                if (next) {
                    state.history.past.push({
                        pages: JSON.parse(JSON.stringify(state.pages)),
                        annotations: JSON.parse(JSON.stringify(state.annotations))
                    });
                    state.pages = next.pages;
                    state.annotations = next.annotations;

                    state.totalPages = state.pages.length;
                    state.selectedAnnotationId = null;
                }
            }
        },
        setSidebarLeftOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarLeftOpen = action.payload;
        },
        setSidebarRightOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarRightOpen = action.payload;
        },
        setActiveSidebarTab: (state, action: PayloadAction<CanvasState['activeSidebarTab']>) => {
            state.activeSidebarTab = action.payload;
        },
        setActiveRightTab: (state, action: PayloadAction<CanvasState['activeRightTab']>) => {
            state.activeRightTab = action.payload;
        },
    },
});

export const {
    setPdfUrl, setPage, setTotalPages, setScale, setTool,
    initPages, rotatePage, deletePage, reorderPages, movePage,
    addAnnotation, updateAnnotation, removeAnnotation, deleteAnnotation, setSelectedAnnotationId,
    setSidebarLeftOpen, setSidebarRightOpen, setActiveSidebarTab, setActiveRightTab,
    updateAnnotationProperties, undo, redo, navigateToPage, togglePageExtraction, setAnnotations, removeAnnotations
} = canvasSlice.actions;

export default canvasSlice.reducer;
