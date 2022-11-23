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

export default function CCollapsedScatterplot({movieData}) {
    const [data, setData] = useState(null);
    const margin = {top: 20, right: 20, bottom: 20, left: 30};
    const [bounds, setBounds] = useState({width: 800, height: 800, innerWidth: 800, innerHeight: 800});
    const target = useRef(null);
    const size = useSize(target);
    let [setHoverItem, setHoverPos, xAxis, yAxis, setXAxis, setYAxis, gScales, viewMode] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
        state.scatterXAxis,
        state.scatterYAxis,
        state.setScatterXAxis,
        state.setScatterYAxis,
        state.scales,
        state.viewMode
    ]);
    let scales = null;
    // Valid X axis labels
    // const xAxes = ["released", "budget", "gross"];
    // Valid Y axis labels
    // const yAxes = ["score", "audience_rating", "tomatometer_rating"];

    const axisTitles = {
        "released": "Release Date",
        "budget": "Budget",
        "gross": "Revenue",
        "score": "IMDb Score",
        "audience_rating": "RT Audience Rating",
        "tomatometer_rating": "RT Tomatometer Rating",
    };

    const [xAxisList, setXAxisList] = useState([]);
    const [yAxisList, setYAxisList] = useState([]);
    
    var xAxisObj = null;
    var yAxisObj = null;

    // Make sure these parameters match the parameters in data_processing/simulate.py
    const simBounds = {x:[-1000, 1000], y:[-300, 300]};
    const maxZoomLevel = 2;

    const [dotStroke, setDotStroke] = useState(1);
    const initTransform = d3.zoomIdentity.scale(0.98).translate(50, 50);
    const [plotTransform, setPlotTransform] = useState(initTransform);
    const [intZoomLevel, setIntZoomLevel] = useState(maxZoomLevel);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        switch (viewMode) {
            case "ratings_oscars":
                setXAxisList(null);
                setXAxis("released");
                setYAxisList(["score", "audience_rating", "tomatometer_rating"]);
                setYAxis("score");
                break;
            case "movie_economy":
                setXAxisList(null);
                setXAxis("released");
                setYAxisList(["budget", "gross"]);
                setYAxis("budget");
                break;
            case "cost_quality":
                setXAxisList(["score", "audience_rating", "tomatometer_rating"]);
                setXAxis("score");
                setYAxisList(["budget", "gross"]);
                setYAxis("budget");
                break;
        }
    }, [viewMode]);

    useEffect(() => {
        if (data == null) {
            loadScatterPlotData().then(setData);
        }
    }, []);

    useDelayWait(() => {
        const k = plotTransform.k;
        // Update circle radius
        setDotStroke(1/k);
        // Update zoom level
        setIntZoomLevel(zoomScale(k));
    }, 150, [plotTransform]);

    const onZoom = ({transform}) => {
        if (xAxisObj && yAxisObj) {
            setPlotTransform(transform);
            const plotArea = d3.select(ref.current).select(".plot-area");
            plotArea.attr("transform", transform);
    
            // Update axes
            d3.select(ref.current).select(".x-axis")
                .call(xAxisObj.scale(transform.rescaleX(scales.f[xAxis])));
            d3.select(ref.current).select(".y-axis")
                .call(yAxisObj.scale(transform.rescaleY(scales.f[yAxis])));
        }
    };
    const zoomBounds = [0.9, 10];
    const zoomScale = d3.scaleLinear()
        .domain([0.5, zoomBounds[1] * 0.5])
        .rangeRound([maxZoomLevel, 0])
        .clamp(true);

    // Set bounds on resize
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
        if (!gScales || !data || !movieData) {
            return;
        }
        const dataSubset = data.get(intZoomLevel);
        let vxAxis, vyAxis, vw, vh;
        if (dataSubset.has(xAxis) && dataSubset.get(xAxis).has(yAxis)) {
            [vxAxis, vyAxis, vw, vh] = [xAxis, yAxis, simBounds.x, simBounds.y];
        } else {
            [vxAxis, vyAxis, vw, vh] = [yAxis, xAxis, simBounds.y, simBounds.x];
        }
        dataSubset = dataSubset.get(vxAxis).get(vyAxis);
        console.log(data, intZoomLevel, xAxis, yAxis)
        scales = copyScales(gScales);

        // Initialize zoom and scales
        const xScale = scales.f[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = scales.f[yAxis].rangeRound([bounds.innerHeight, 0]);
        xAxisObj = d3.axisBottom(xScale).tickFormat(scales.format[xAxis]);
        yAxisObj = d3.axisLeft(yScale).tickFormat(scales.format[yAxis]);
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
            .classed("plot-axis", true);
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .classed("plot-axis", true);

        // Inverse scales that transform simulation coordinates to plot coordinates
        const iXScale = xScale.copy().domain(vw);
        const iYScale = yScale.copy().domain(vh);

        // Draw points
        svg.select(".plot-area")
            .selectAll("circle")
            .data(dataSubset)
            .join("circle")
            .attr("cx", d => iXScale(d.x))
            .attr("cy", d => iYScale(d.y))
            .attr("r", d => Math.max(2, d.r * 0.85))
            .classed("dot", true)
            .attr("fill", d => {
                if (d.movies.length == 1) {
                    return OSCAR_COLORS[movieData[d.movies[0]].oscar];
                } else {
                    return OSCAR_COLORS["none"];
                }
            })
            .on("mouseover", (e, d) => {
                if (d.movies.length == 1) {
                    setHoverItem({datum: movieData[d.movies[0]], x: e.pageX, y: e.pageY, caller: "scatterplot"});
                } else {
                    setHoverItem({datum: d, x: e.pageX, y: e.pageY, caller: "scatterplot_group"});
                }
            })
            .on("mousemove", (e, d) => {
                setHoverPos({x: e.pageX, y: e.pageY});
            })
            .on("mouseout", (e, d) => {
                setHoverItem({datum: null, x: 0, y: 0, caller: null});
            });
        
        const zoom = d3.zoom()
            .on("zoom", onZoom)
            .scaleExtent(zoomBounds)
            .translateExtent([[-100, -100], [bounds.innerWidth + 100, bounds.innerHeight + 100]]);
        svg.call(zoom);

        // Set zoom
        if (!initialized) {
            svg.call(zoom.transform, initTransform);
            onZoom({transform: initTransform});
        }
        
        setInitialized(true);
    }, [bounds, gScales, yAxis, xAxis, data, movieData, intZoomLevel]);

    return (
        <div id="scatterplot" className="relative w-full h-full" ref={target}>
            <div className="absolute top-0 right-0">
                <CDropdown label="Y Axis" options={yAxisList} optionTitles={axisTitles} value={yAxis} onChange={setYAxis} />
                {xAxisList != null &&
                    <CDropdown label="X Axis" options={xAxisList} optionTitles={axisTitles} value={xAxis} onChange={setXAxis} />
                }
            </div>
            <svg ref={ref} className="w-full h-full">
                <style>
                    circle.dot {'{'}
                        stroke-width: {dotStroke};
                        stroke: #202020;
                    {'}'}
                    circle.dot:hover {'{'}
                        fill: white;
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