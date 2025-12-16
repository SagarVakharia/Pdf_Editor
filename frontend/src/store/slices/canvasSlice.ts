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
}

interface PageConfig {
    id: string;
    originalIndex: number; // 1-based index from the original PDF
    rotation: number;     // 0, 90, 180, 270
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
};

export const canvasSlice = createSlice({
    name: 'canvas',
    initialState,
    reducers: {
        setPdfUrl: (state, action: PayloadAction<string | null>) => {
            state.pdfUrl = action.payload;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setTotalPages: (state, action: PayloadAction<number>) => {
            state.totalPages = action.payload;
            // Initialize virtual pages if empty or count changed (simple reset for now)
            if (state.pages.length === 0 || state.pages.length !== action.payload) {
                state.pages = Array.from({ length: action.payload }, (_, i) => ({
                    id: `page-${i + 1}`,
                    originalIndex: i + 1,
                    rotation: 0
                }));
            }
        },
        initPages: (state, action: PayloadAction<number>) => {
            state.pages = Array.from({ length: action.payload }, (_, i) => ({
                id: `page-${i + 1}`,
                originalIndex: i + 1,
                rotation: 0
            }));
        },
        rotatePage: (state, action: PayloadAction<{ id: string, rotation: number }>) => {
            const page = state.pages.find(p => p.id === action.payload.id);
            if (page) {
                page.rotation = action.payload.rotation;
            }
        },
        deletePage: (state, action: PayloadAction<string>) => {
            state.pages = state.pages.filter(p => p.id !== action.payload);

            // Adjust current page if needed
            if (state.pages.length > 0) {
                // Determine new index (clamp to valid range)
                const currentIdx = state.pages.findIndex(p => p.id === action.payload);
                // If we deleted the current viewing page, move to the nearest one
                // But wait, we don't know which one user was viewing by ID easily unless we track it differently.
                // For now, ensure currentPage index is within bounds of state.pages.length
                if (state.currentPage > state.pages.length) {
                    state.currentPage = state.pages.length;
                }
            } else {
                state.currentPage = 1;
            }
            state.totalPages = state.pages.length;
        },
        reorderPages: (state, action: PayloadAction<{ activeId: string, overId: string }>) => {
            const oldIndex = state.pages.findIndex(p => p.id === action.payload.activeId);
            const newIndex = state.pages.findIndex(p => p.id === action.payload.overId);

            if (oldIndex !== -1 && newIndex !== -1) {
                const [movedPage] = state.pages.splice(oldIndex, 1);
                state.pages.splice(newIndex, 0, movedPage);
            }
        },
        movePage: (state, action: PayloadAction<{ id: string, direction: 'up' | 'down' }>) => {
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
            state.selectedAnnotationId = null; // Deselect when changing tools
        },
        addAnnotation: (state, action: PayloadAction<Annotation>) => {
            state.annotations.push(action.payload);
        },
        updateAnnotation: (state, action: PayloadAction<Annotation>) => {
            const index = state.annotations.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.annotations[index] = action.payload;
            }
        },
        removeAnnotation: (state, action: PayloadAction<string>) => {
            state.annotations = state.annotations.filter(a => a.id !== action.payload);
        },
        setSelectedAnnotationId: (state, action: PayloadAction<string | null>) => {
            state.selectedAnnotationId = action.payload;
        },
        updateAnnotationProperties: (state, action: PayloadAction<{ id: string; updates: Partial<Annotation> }>) => {
            const index = state.annotations.findIndex(a => a.id === action.payload.id);
            if (index !== -1) {
                state.annotations[index] = { ...state.annotations[index], ...action.payload.updates };
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
    addAnnotation, updateAnnotation, removeAnnotation, setSelectedAnnotationId,
    setSidebarLeftOpen, setSidebarRightOpen, setActiveSidebarTab, setActiveRightTab,
    updateAnnotationProperties
} = canvasSlice.actions;

export default canvasSlice.reducer;
