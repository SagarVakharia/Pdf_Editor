import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './slices/canvasSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        canvas: canvasReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // For non-serializable PDF objects if needed
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
