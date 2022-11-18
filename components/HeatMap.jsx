import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";
import * as hb from "d3-hexbin";
import useGlobalState from "../hooks/useGlobalState";
import copyScales from "../scripts/copyScales";

function ramp(scale, n = 256) {
    const color = scale.copy().domain(d3.quantize(d3.interpolate(0, n), n));
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
}

//https://stackoverflow.com/questions/63842169/i-have-min-and-max-number-how-can-i-generate-n-number-of-array
function generateArrayMinMax(min, max, n) {
    let list = [min],
        interval = (max - min) / (n - 1);
 
    for (let i = 1; i < n - 1; i++) {
       list.push(Number.parseInt(min + interval * i));
    }
    list.push(Number.parseInt(max));                        // prevent floating point arithmetic errors
    return list;
 }

export default function CHeatMap({ data }) {
    const margin = { top: 20, right: 35, bottom: 20, left: 25 };
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);
    const [legendImage, setLegendImage] = useState("");


    let [setHoverItem, setHoverPos, xAxis, yAxis, gScales] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
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
        xAxisObj = d3.axisBottom(xScale).tickFormat(scales.xFormat[xAxis]);
        yAxisObj = d3.axisLeft(yScale).tickFormat(scales.yFormat[yAxis]);
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
            .on("mousemove", (event, d) => {
                setHoverPos({ x: event.pageX - 5, y: event.pageY - 5 });
            })
            .on("mouseover", (event, d) => {
                setHoverItem({ datum: d, caller: "heatmap" });
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
                setHoverItem({ datum: null, caller: null });
            })
            .attr("class", "hexagon").transition().duration(1000)
            .attr("d", hexbin.hexagon())
            .attr("transform", d => `translate(${d.x + margin.left}, ${d.y + margin.top})`)
            .attr("fill", d => colorScale(d.length))
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("bin-value", d => d.length)

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
            .attr("stroke-width", 1);

        setLegendImage(ramp(colorScale).toDataURL());

        //access legend-ticks group under legend group and select all text elements
        svg.select(".legend-ticks")
            .selectAll("text")
            .data(generateArrayMinMax(0, d3.max(bins, d => d.length), 4))
            .join("text")
            .text(d => d)
            .attr("fill", "white")

    }, [bounds, scales, yAxis, xAxis, data]);

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
                <g className="legend" transform={`translate(${bounds.width - margin.right/3},${bounds.height-margin.bottom}) rotate(-90 0,0)`}>
                    <image width={bounds.height-margin.bottom-margin.top} height={margin.right/3} preserveAspectRatio="none" xlinkHref={legendImage}></image>
                    <g className="legend-ticks">
                        <text x={margin.bottom-margin.top} y={-margin.right/2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={0} y1={0} x2={0} y2={margin.right/3} stroke="white" strokeWidth={2} />

                        <text x={(bounds.height-margin.bottom-margin.top)/3} y={-margin.right/2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={(bounds.height-margin.bottom-margin.top)/3} y1={0} x2={(bounds.height-margin.bottom-margin.top)/3} y2={margin.right/3} stroke="white" strokeWidth={2} />

                        <text x={(bounds.height-margin.bottom-margin.top)*2/3} y={-margin.right/2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={(bounds.height-margin.bottom-margin.top)*2/3} y1={0} x2={(bounds.height-margin.bottom-margin.top)*2/3} y2={margin.right/3} stroke="white" strokeWidth={2} />

                        <text x={(bounds.height-margin.bottom-margin.top)} y={-margin.right/2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={(bounds.height-margin.bottom-margin.top)} y1={0} x2={(bounds.height-margin.bottom-margin.top)} y2={margin.right/3} stroke="white" strokeWidth={2} />
                    </g>
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
}