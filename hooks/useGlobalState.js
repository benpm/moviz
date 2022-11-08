import create from "zustand";

// Global state storing information shared among all charts
const useGlobalState = create((set) => ({
    // Currently hovered data item
    //  {datum, x, y}
    hoverItem: {datum: null, x: 0, y: 0},

    setHoverItem: x => set({ hoverItem: x }),
}));

export default useGlobalState;