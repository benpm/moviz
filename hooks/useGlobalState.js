import create from "zustand";

// Global state storing information shared among all charts
const useGlobalState = create((set) => ({
    // Currently hovered data item
    hoverItem: {datum: null, caller: null},
    hoverPos: {x: 0, y: 0},
    hoveredExpandedGroup: false,

    viewSize: {w: 1920, h: 1080},
    viewMode: "ratings_oscars",

    brushMode: false,
    brushFilter: [],
    brushRange: null,
    searchFilter: new Set(),

    //State of the scatterplot
    scatterXAxis: "released",
    scatterYAxis: "score",
    showTrendLine: false,

    scales: null,

    //state for the stacked line chart
    companionPlotShowOtherStudios: true,

    hoverDetailTimeout: null,

    // Consumer price index data for inflation adjustment
    cpiData: [],
    adjustInflation: false,

    setHoverPos: x => set({ hoverPos: x }),
    setHoverItem: x => set({ hoverItem: x }),
    setHoveredExpandedGroup: x => set({ hoveredExpandedGroup: x }),
    setViewSize: x => set({ viewSize: x }),
    setScatterXAxis: x => set({ scatterXAxis: x }),
    setScatterYAxis: x => set({ scatterYAxis: x }),
    setScales: x => set({ scales: x }),
    setViewMode: x => set({ viewMode: x }),
    setBrushMode: x => set({ brushMode: x }),
    setBrushFilter: x => set({ brushFilter: x }),
    setCompanionPlotShowOtherStudios: x => set({ companionPlotShowOtherStudios: x }),
    setBrushRange: x => set({ brushRange: x }),
    setShowTrendLine: x => set({ showTrendLine: x }),
    setHoverDetailTimeout: x => set({ hoverDetailTimeout: x }),
    setCpiData: x => set({ cpiData: x }),
    setAdjustInflation: x => set({ adjustInflation: x }),
    setSearchFilter: x => set({ searchFilter: x }),
}));

export default useGlobalState;