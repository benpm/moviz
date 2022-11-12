import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";
import * as hb from "d3-hexbin";
import useGlobalState from "../hooks/useGlobalState";
import copyScales from "../scripts/copyScales";

export default function CHeatMap({ data }) {
    const margin = { top: 20, right: 20, bottom: 20, left: 30 };
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);

    
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

        // Initialize zoom and scales
        const xScale = scales.x[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = scales.y[yAxis].rangeRound([bounds.innerHeight, 0]).nice();
        xAxisObj = d3.axisBottom(xScale);
        yAxisObj = d3.axisLeft(yScale);
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
            .classed("plot-axis", true);
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .classed("plot-axis", true);

        //draw a hexagonal heatmap of the data draw empty hexagons
        const RADIUS = 15;
        const hexbin = hb.hexbin()
            .x(d => xScale(d[xAxis]))
            .y(d => yScale(d[yAxis]))
            .radius(RADIUS)
            .extent([[0, 0], [bounds.innerWidth + margin.right, bounds.innerHeight + margin.bottom]]);
        const bins = hexbin(data);
        const colorScale = d3.scaleSequential(d3.interpolateInferno)
            .domain([0, d3.max(bins, d => d.length)]);
        svg.select(".hexagons")
            .selectAll(".hexagon")
            .data(bins)
            .join("path")
            .attr("class", "hexagon")
            .attr("d", hexbin.hexagon())
            .attr("transform", d => `translate(${d.x + margin.left}, ${d.y + margin.top})`)
            .attr("fill", d => colorScale(d.length))
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("bin-value", d => d.length)

        //attach mouseover events to the hexagons
        svg.selectAll(".hexagon")
            .on("mousemove", (event, d) => {
                setHoverItem({ datum: d, x: event.pageX-5, y: event.pageY-5, caller: "heatmap" });
            })
            .on("mouseover", (event, d) => {
                //highlight the hexagon by making it brighter
                d3.select(event.target)
                    .transition().duration(10)
                    .attr("fill", d3.color(colorScale(d.length)).brighter(1.5))
                    .attr("stroke", d3.color(colorScale(d.length)).brighter(1))
                    .attr("stroke-width", 2.5);
            })
            .on("mouseout", (event, d) => {
                //make it darker
                d3.select(event.target).transition().duration(1000)
                    .attr("fill", colorScale(d.length))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
                setHoverItem({ datum: null, x: 0, y: 0, caller: null });
            });

        //draw empty hexagons from hb.hexbin().centers()
        svg.select(".hexagons")
            .selectAll(".hexagon-empty")
            .data(hexbin.centers())
            .join("path")
            .attr("class", "hexagon-empty")
            .attr("d", hexbin.hexagon())
            .attr("transform", d => `translate(${d[0] + margin.left}, ${d[1] + margin.top})`)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1)

    }, [bounds, scales, yAxis, xAxis]);

    return (
        <div id="heatmap" className="relative w-full h-full bg-slate-900" ref={target}>
            <svg ref={ref} className="w-full h-full">
                <defs>
                    <clipPath id="plot-clip">
                        <rect fill="white" x={margin.left} y={margin.top} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                <g style={{ clipPath: "url(#plot-clip)" }}>
                    <g className="hexagons"></g>
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
}