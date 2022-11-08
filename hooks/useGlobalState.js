import create from "zustand";

// Global state storing information shared among all charts
const useGlobalState = create((set) => ({
    // Currently hovered data item
    //  {datum, x, y}
    hoverItem: {datum: null, x: 0, y: 0},
    viewSize: {w: 1920, h: 1080},

    setHoverItem: x => set({ hoverItem: x }),
    setViewSize: x => set({ viewSize: x }),
}));

export default useGlobalState;