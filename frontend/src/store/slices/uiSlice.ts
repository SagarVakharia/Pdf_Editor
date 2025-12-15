import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    isSidebarOpen: boolean;
    activeSidebarTab: 'pages' | 'layers';
    theme: 'dark' | 'light';
}

const initialState: UiState = {
    isSidebarOpen: true,
    activeSidebarTab: 'pages',
    theme: 'dark',
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        setSidebarTab: (state, action: PayloadAction<UiState['activeSidebarTab']>) => {
            state.activeSidebarTab = action.payload;
        },
        setTheme: (state, action: PayloadAction<UiState['theme']>) => {
            state.theme = action.payload;
        },
    },
});

export const { toggleSidebar, setSidebarTab, setTheme } = uiSlice.actions;

export default uiSlice.reducer;
