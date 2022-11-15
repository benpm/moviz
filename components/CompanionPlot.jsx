import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";
import useGlobalState from "../hooks/useGlobalState";
import copyScales from "../scripts/copyScales";


export default function CCompanionPlot({ data }) {
    const margin = { top: 20, right: 35, bottom: 20, left: 25 };
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);
    const [legendImage, setLegendImage] = useState("");


    let [setHoverItem, xAxis, yAxis, gScales] = useGlobalState(state => [
        state.setHoverItem,
        state.scatterXAxis,
        state.scatterYAxis,
        state.scales
    ]);
    let scales = null;
    var xAxisObj = null;
    var yAxisObj = null;

    //draw a hexagonal heatmap of the data
    useEffect(() => {
        const w = size ? size.width : bounds.width;
        const h = size ? size.height : bounds.height;
        setBounds({
            width: w, height: h,
            innerWidth: w - margin.left - margin.right,
            innerHeight: h - margin.top - margin.bottom
        });
    }, [size]);

    // Render chart function
    const ref = useD3(svg => {
        if (!gScales) {
            return;
        } else if (!scales) {
            scales = copyScales(gScales);
        }

        //filter movies with oscar wins
        let oscarData = data.filter(d => d.oscar.includes("nominee") != 0 || d.oscar.includes("winner") != 0);
        //bin the data by year and genre and count the number of movies in each bin
        let oscarDataByYear = d3.group(oscarData, d=>d.year, d=>d.genre);


        // Initialize zoom and scales
        const xScale = scales.x["released"].rangeRound([0, bounds.innerWidth]);
        const countScale = d3.scaleLinear().domain([0, 9]).range([0, 1]);
        const yScale = countScale.rangeRound([bounds.innerHeight, 0]).nice();
        xAxisObj = d3.axisBottom(xScale).tickFormat(scales.xFormat[xAxis]);
        yAxisObj = d3.axisLeft(yScale).tickFormat(scales.yFormat[yAxis]);
        
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
            .classed("plot-axis", true);
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .classed("plot-axis", true);

        // draw stacked bar chart
        let stack = d3.select

        
    }, [bounds, scales, yAxis, xAxis, data]);

    return (
        <div id="companion-plot" className="relative w-full h-full bg-slate-900" ref={target}>
            <svg ref={ref} className="w-full h-full">
                <defs>
                    <clipPath id="plot-clip">
                        <rect fill="white" x={margin.left} y={margin.top} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                <g style={{ clipPath: "url(#plot-clip)" }}>
                    <g className="bars"></g>
                </g>
            </svg>
        </div>
    );
}