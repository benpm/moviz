import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import useD3 from "../hooks/useD3";
import useSize from "../hooks/useSize";
import CDropdown from "./Dropdown";
import useGlobalState from "../hooks/useGlobalState";
import useDelayWait from "../hooks/useDelayWait";
import copyScales from "../scripts/copyScales";
import { loadScatterPlotData } from "../scripts/loadData";

const OSCAR_COLORS = {
    "winner": "#fce603",
    "nominee": "#947b1b",
    "best_picture_winner": "#214ED3",
    "best_picture_nominee": "#90A8EE",
    "none": "#606060",
};

export default function CCollapsedScatterplot() {
    const [data, setData] = useState(null);
    const margin = {top: 20, right: 20, bottom: 20, left: 30};
    const [bounds, setBounds] = useState({width: 800, height: 800, innerWidth: 800, innerHeight: 800});
    const target = useRef(null);
    const size = useSize(target);
    let [setHoverItem, setHoverPos, xAxis, yAxis, setXAxis, setYAxis, gScales] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
        state.scatterXAxis,
        state.scatterYAxis,
        state.setScatterXAxis,
        state.setScatterYAxis,
        state.scales
    ]);
    let scales = null;
    // Valid X axis labels
    const xAxes = ["released", "budget", "gross"];
    const xAxisTitles = ["Release Date", "Budget", "Revenue"];
    // Valid Y axis labels
    const yAxes = ["score", "audience_rating", "tomatometer_rating"];
    const yAxisTitles = ["IMDb Score", "RT Audience Rating", "RT Tomatometer Rating"];
    
    var xAxisObj = null;
    var yAxisObj = null;
    var initialized = false;
    const maxZoomLevel = 4;
    const [dotStroke, setDotStroke] = useState(1);
    const initTransform = d3.zoomIdentity.scale(0.98).translate(50, 50);
    const [plotTransform, setPlotTransform] = useState(initTransform);
    const [intZoomLevel, setIntZoomLevel] = useState(maxZoomLevel);

    useEffect(() => {
        if (data == null) {
            console.debug("loading scatterplot data...");
            loadScatterPlotData().then(setData);
        }
    }, []);

    useDelayWait(() => {
        // Update circle radius
        setDotStroke(1 / plotTransform.k);
        // Update zoom level
        setIntZoomLevel(Math.min(maxZoomLevel, Math.max(0, maxZoomLevel + Math.ceil(Math.log2(1/plotTransform.k)))));
    }, 150, [plotTransform]);

    const onZoom = ({transform}) => {
        if (xAxisObj && yAxisObj) {
            setPlotTransform(transform);
            const plotArea = d3.select(ref.current).select(".plot-area");
            plotArea.attr("transform", transform);
    
            // Update axes
            d3.select(ref.current).select(".x-axis")
                .call(xAxisObj.scale(transform.rescaleX(scales.x[xAxis])));
            d3.select(ref.current).select(".y-axis")
                .call(yAxisObj.scale(transform.rescaleY(scales.y[yAxis])));
        }
    };
    const zoom = d3.zoom()
        .on("zoom", onZoom)
        .scaleExtent([0.9, 10])
        .translateExtent([[-100, -100], [bounds.innerWidth + 100, bounds.innerHeight + 100]]);

    // Set bounds on resize
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
        if (!gScales || !data) {
            return;
        } else if (!scales) {
            scales = copyScales(gScales);
        }

        // Initialize zoom and scales
        const xScale = scales.x[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = scales.y[yAxis].rangeRound([bounds.innerHeight, 0]);
        xAxisObj = d3.axisBottom(xScale).tickFormat(scales.xFormat[xAxis]);
        yAxisObj = d3.axisLeft(yScale).tickFormat(scales.yFormat[yAxis]);
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
            .classed("plot-axis", true);
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .classed("plot-axis", true);

        // Inverse scales that transform simulation coordinates to plot coordinates
        const iXScale = xScale.copy().domain([-1000, 1000]);
        const iYScale = yScale.copy().domain([-1000, 1000]);

        // Draw points
        svg.select(".plot-area")
            .selectAll("circle")
            .data(data.get(intZoomLevel).get(xAxis).get(yAxis))
            .join("circle")
            .attr("cx", d => iXScale(d.x))
            .attr("cy", d => iYScale(d.y))
            .attr("r", d => d.r)
            .classed("dot", true)
            /* .on("mouseover", (e, d) => {
                setHoverItem({datum: d, x: e.pageX, y: e.pageY, caller: "scatterplot"});
                d3.select(e.target).attr("fill", "white");
            })
            .on("mousemove", (e, d) => {
                setHoverPos({x: e.pageX, y: e.pageY});
            })
            .on("mouseout", (e, d) => {
                setHoverItem({datum: null, x: 0, y: 0, caller: null})
                d3.select(e.target).attr("fill", d => OSCAR_COLORS[d.oscar]);
            }); */
        
        // Set zoom
        if (!initialized) {
            svg.call(zoom);
            svg.call(zoom.transform, initTransform);
            onZoom({transform: initTransform});
        }
        
        initialized = true;
    }, [bounds, scales, yAxis, xAxis, data, intZoomLevel]);

    return (
        <div id="scatterplot" className="relative w-full h-full" ref={target}>
            <div className="absolute top-0 right-0">
                <CDropdown label="Y Axis" options={yAxes} optionTitles={yAxisTitles} value={yAxis} onChange={setYAxis} />
                <CDropdown label="X Axis" options={xAxes} optionTitles={xAxisTitles} value={xAxis} onChange={setXAxis} />
            </div>
            <svg ref={ref} className="w-full h-full">
                <style>
                    circle.dot {'{'}
                        stroke-width: {dotStroke};
                        stroke: #202020;
                        fill: #606060;
                    {'}'}
                </style>
                <defs>
                    <clipPath id="plot-area-clip">
                        <rect fill="white" x={0} y={0} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                <g className="plot-area-container" style={{clipPath: "url(#plot-area-clip)"}}
                    transform={`translate(${margin.left},${margin.right})`}>
                    <g className="plot-area"></g>
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
};