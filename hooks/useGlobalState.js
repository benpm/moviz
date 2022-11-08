import * as d3 from "d3";
import create from "zustand";

// Global state storing information shared among all charts
const useGlobalState = create((set) => ({
    scatterplot: {
        x: "released",
        y: "score",
        xScales: {
            released: d3.scaleTime(),
        },
        yScales: {
            score: d3.scaleLinear().domain([0, 10]),
            tomatometer_rating: d3.scaleLinear().domain([0, 100]),
            audience_rating: d3.scaleLinear().domain([0, 100]),
            nominations: d3.scaleLinear(),
            gross: d3.scaleLinear(),
            budget: d3.scaleLinear(),
        }
    }
}));