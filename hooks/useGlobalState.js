import create from "zustand";

// Global state storing information shared among all charts
const useGlobalState = create((set) => ({
    // Currently hovered data item
    hoverItem: {datum: null, x: 0, y: 0, caller: null},

    viewSize: {w: 1920, h: 1080},

    //State of the scatterplot
    scatterXAxis: "released",
    scatterYAxis: "score",

    scales: null,

    setHoverItem: x => set({ hoverItem: x }),
    setViewSize: x => set({ viewSize: x }),
    setScatterXAxis: x => set({ scatterXAxis: x }),
    setScatterYAxis: x => set({ scatterYAxis: x }),
    setScales: x => set({ scales: x }),
}));

export default useGlobalState;