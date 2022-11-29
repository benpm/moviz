import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";
import * as hb from "d3-hexbin";
import useGlobalState from "../hooks/useGlobalState";
import copyScales from "../scripts/copyScales";
import CDropdown from "./Dropdown";

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
    const margin = { top: 20, right: 35, bottom: 20, left: 50 };
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);
    const [legendImage, setLegendImage] = useState("");
    const axisTitles = {
        "released": "Release Date",
        "budget": "Budget",
        "gross": "Revenue",
        "score": "IMDb Score",
        "audience_rating": "RT Audience Rating",
        "tomatometer_rating": "RT Tomatometer Rating",
        "nominations": "Oscar Nominations",
        "runtime": "Runtime",
    };
    const axisList = Object.keys(axisTitles);
    const [xAxis, setXAxis] = useState(axisList[0]);
    const [yAxis, setYAxis] = useState(axisList[1]);



    let [setHoverItem, setHoverPos, gScales, viewMode] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
        state.scales,
        state.viewMode,
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

    useEffect(() => {
        switch (viewMode) {
            case "ratings_oscars":
                setXAxis("released");
                setYAxis("score");
                break;
            case "movie_economy":
                setXAxis("released");
                setYAxis("budget");
                break;
            case "cost_quality":
                setXAxis("budget");
                setYAxis("score");
                break;
        }
    }, [viewMode]);

    // Render chart function
    const ref = useD3(svg => {
        if (!gScales) {
            return;
        } else if (!scales) {
            scales = copyScales(gScales);
        }

        // Initialize zoom and scales
        const xScale = scales.f[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = scales.f[yAxis].rangeRound([bounds.innerHeight, 0]).nice();
        xAxisObj = d3.axisBottom(xScale).tickFormat(scales.format[xAxis]);
        yAxisObj = d3.axisLeft(yScale).tickFormat(scales.format[yAxis]);
        svg.select(".x-axis").classed("plot-axis", true)
            .call(xAxisObj)
            .attr("transform", `scale(0,1) translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
            .transition().duration(1000)
            .attr("transform", `scale(1,1) translate(${margin.left}, ${bounds.innerHeight + margin.top})`);
        svg.select(".y-axis").classed("plot-axis", true)
            .call(yAxisObj)
            .attr("transform", `scale(1,0) translate(${margin.left}, ${margin.top})`)
            .transition().duration(1000)
            .attr("transform", `scale(1,1) translate(${margin.left}, ${margin.top})`);

        //draw a hexagonal heatmap of the data draw empty hexagons
        const RADIUS = 15;
        const hexbin = hb.hexbin()
            .x(d => xScale(d[xAxis]))
            .y(d => yScale(d[yAxis]))
            .radius(RADIUS)
            .extent([[0, 0], [bounds.innerWidth + margin.right, bounds.innerHeight + margin.bottom]]);
        const bins = hexbin(data);
        const binMax = d3.max(bins, d => d.length);
        const colorScale = d3.scaleSequential(d3.interpolateInferno)
            .domain([0, binMax]);
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
            .attr("class", "hexagon").transition(
                //disable pointer events until the transition is complete
                d3.select(".hexagons").style("pointer-events", "none")
                //enable pointer events after the transition is complete
            ).on("end", () => d3.select(".hexagons").style("pointer-events", "auto"))
            .duration(1000)
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
            .data(generateArrayMinMax(0, binMax, 4))
            .join("text")
            .text(d => d)
            .attr("fill", "white")

    }, [bounds, scales, yAxis, xAxis, data, viewMode]);

    return (
        <div id="heatmap" className="relative w-full h-full bg-slate-900" ref={target}>
            <div className="absolute bottom-6 right-8 text-sm">
                <CDropdown label="" options={axisList} optionTitles={axisTitles} value={xAxis} onChange={setXAxis} />
            </div>
            <div className="absolute top-4 left-12 text-sm">
                <CDropdown label="" options={axisList} optionTitles={axisTitles} value={yAxis} onChange={setYAxis} />
            </div>
            <svg ref={ref} className="w-full h-full">
                <defs>
                    <clipPath id="plot-clip">
                        <rect fill="white" x={margin.left} y={margin.top} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                <g style={{ clipPath: "url(#plot-clip)" }}>
                    <g className="hexagons"></g>
                </g>
                <g className="legend" transform={`translate(${bounds.width - margin.right / 3},${bounds.height - margin.bottom}) rotate(-90 0,0)`}>
                    <image width={bounds.height - margin.bottom - margin.top} height={margin.right / 3} preserveAspectRatio="none" xlinkHref={legendImage}></image>
                    <g className="legend-ticks">
                        <text x={margin.bottom - margin.top} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={0} y1={0} x2={0} y2={margin.right / 3} stroke="white" strokeWidth={2} />

                        <text x={(bounds.height - margin.bottom - margin.top) / 3} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={(bounds.height - margin.bottom - margin.top) / 3} y1={0} x2={(bounds.height - margin.bottom - margin.top) / 3} y2={margin.right / 3} stroke="white" strokeWidth={2} />

                        <text x={(bounds.height - margin.bottom - margin.top) * 2 / 3} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={(bounds.height - margin.bottom - margin.top) * 2 / 3} y1={0} x2={(bounds.height - margin.bottom - margin.top) * 2 / 3} y2={margin.right / 3} stroke="white" strokeWidth={2} />

                        <text x={(bounds.height - margin.bottom - margin.top)} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                        <line x1={(bounds.height - margin.bottom - margin.top)} y1={0} x2={(bounds.height - margin.bottom - margin.top)} y2={margin.right / 3} stroke="white" strokeWidth={2} />
                    </g>
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
}