import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";
import * as hb from "d3-hexbin";

export default function CHeatMap({ data }) {
    const margin = { top: 20, right: 20, bottom: 20, left: 30 };
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);

    const [xAxis, setXAxis] = useState("released");
    const [yAxis, setYAxis] = useState("audience_rating");
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
        const yScale = yScales[yAxis].rangeRound([bounds.innerHeight, 0]).nice();
        xAxisObj = d3.axisBottom(xScale);
        yAxisObj = d3.axisLeft(yScale);
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
            .attr("stroke", "white")
            .attr("color", "white");
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr("color", "white")
            .attr("stroke", "white");

        //draw a hexagonal heatmap of the data draw empty hexagons
        const RADIUS = 15;
        const hexbin = hb.hexbin()
            .x(d => xScale(d.released))
            .y(d => yScale(d.audience_rating))
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
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .append("title")
            .text(d => `${d.length} movies released in ${d.x} and scored ${d.y}`);

        //draw empty hexagons from hb.hexbin().centers()
        svg.select(".hexagons")
            .selectAll(".hexagon-empty")
            .data(hexbin.centers())
            .join("path")
            .attr("class", "hexagon-empty")
            .attr("d", hexbin.hexagon())
            .attr("transform", d => `translate(${d[0] + margin.left}, ${d[1] + margin.top})`)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .append("title")
            .text(d => `center of hexagon at ${d.x}, ${d.y}`);

    }, [bounds, data, yAxis, xAxis]);

    return (
        <div id="heatmap" className="relative w-full h-full bg-black" ref={target}>
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