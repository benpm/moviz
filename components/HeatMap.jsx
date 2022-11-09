import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";

export default function CHeatMap({data}) {
    const margin = {top: 20, right: 20, bottom: 20, left: 30};
    const [bounds, setBounds] = useState({width: 800, height: 800, innerWidth: 800, innerHeight: 800});
    const target = useRef(null);
    const size = useSize(target);

    const [xAxis, setXAxis] = useState("released");
    const [yAxis, setYAxis] = useState("score");
    var xScales = null;
    var yScales = null;
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
        console.debug("resize");
    }, [size]);

    // Render chart function
    const ref = useD3(svg => {
        if (xScale == null) {
            xScales = {
                released: d3.scaleTime().domain(d3.extent(data, d => d.released)),
            };
            yScales = {
                score: d3.scaleLinear().domain([0, 10]),
                tomatometer_rating: d3.scaleLinear().domain([0, 100]),
                audience_rating: d3.scaleLinear().domain([0, 100]),
                nominations: d3.scaleLinear(),
                gross: d3.scaleLinear(),
                budget: d3.scaleLinear(),
            };
        }

        // Initialize zoom and scales
        const xScale = xScales[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = yScales[yAxis].rangeRound([bounds.innerHeight, 0]);
        xAxisObj = d3.axisBottom(xScale);
        yAxisObj = d3.axisLeft(yScale);
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`);
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    }, [bounds, data, yAxis, xAxis]);

    return (
        <div id="heatmap" className="relative w-full h-full bg-violet-200" ref={target}>
            <svg ref={ref} className="w-full h-full">
                <g className="plot-area"></g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
}