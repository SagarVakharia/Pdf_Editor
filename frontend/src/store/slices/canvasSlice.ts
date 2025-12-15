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
}

interface CanvasState {
    pdfUrl: string | null;
    currentPage: number;
    totalPages: number;
    scale: number;
    tool: 'select' | 'text' | 'draw' | 'erase' | 'pan' | 'image' | 'sign';
    annotations: Annotation[];
    selectedAnnotationId: string | null;
}

const initialState: CanvasState = {
    pdfUrl: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1,
    tool: 'select',
    annotations: [],
    selectedAnnotationId: null,
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
    },
});

export const {
    setPdfUrl, setPage, setTotalPages, setScale, setTool,
    addAnnotation, updateAnnotation, removeAnnotation, setSelectedAnnotationId
} = canvasSlice.actions;

export default canvasSlice.reducer;
