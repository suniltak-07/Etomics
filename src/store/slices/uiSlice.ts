import { createSlice, type PayloadAction, nanoid } from "@reduxjs/toolkit";

export type ToastVariant = "default" | "success" | "warning" | "danger";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export interface UiState {
  sidebarOpen: boolean;
  checkoutStep: number;
  toasts: Toast[];
}

const initialState: UiState = {
  sidebarOpen: true,
  checkoutStep: 0,
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setCheckoutStep(state, action: PayloadAction<number>) {
      state.checkoutStep = action.payload;
    },
    addToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare(toast: Omit<Toast, "id"> & { id?: string }) {
        return {
          payload: {
            id: toast.id ?? nanoid(),
            title: toast.title,
            description: toast.description,
            variant: toast.variant ?? "default",
          } satisfies Toast,
        };
      },
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
    },
    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const {
  setSidebarOpen,
  toggleSidebar,
  setCheckoutStep,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
