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
    const margin = {top: 20, right: 20, bottom: 20, left: 50};
    const [bounds, setBounds] = useState({width: 800, height: 800, innerWidth: 800, innerHeight: 800});
    const target = useRef(null);
    const size = useSize(target);
    let [setHoverItem, setHoverPos, xAxis, yAxis, setXAxis, setYAxis, gScales, viewMode, brushMode] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
        state.scatterXAxis,
        state.scatterYAxis,
        state.setScatterXAxis,
        state.setScatterYAxis,
        state.scales,
        state.viewMode,
        state.brushMode
    ]);
    const [scales, setScales] = useState(null);

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

    const [dotStroke, setDotStroke] = useState(1);
    const [initialized, setInitialized] = useState(false);
    const [quadtrees, setQuadtrees] = useState(null);

    // Handler for mode switch buttons (ViewSelector.jsx)
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
                setXAxisList(["budget", "gross"]);
                setXAxis("budget");
                setYAxisList(["score", "audience_rating", "tomatometer_rating"]);
                setYAxis("score");
                break;
        }
    }, [viewMode]);

    // Load data on first render 
    useEffect(() => {
        if (data == null) {
            loadScatterPlotData().then(setData);
        }
    }, []);

    // Initialize zoom + scale for transforming plot transform scale to integer zoom level
    const [zoomObj, setZoomObj] = useState({zoom: null});
    const zoomBounds = [0.9, 10];
    const maxZoomLevel = 2; // (must match simulate.py)
    const initTransform = d3.zoomIdentity.scale(0.98).translate(50, 50);
    const [plotTransform, setPlotTransform] = useState(initTransform);
    const [intZoomLevel, setIntZoomLevel] = useState(maxZoomLevel);
    const zoomScale = d3.scaleLinear()
        .domain([0.5, zoomBounds[1] * 0.5])
        .rangeRound([maxZoomLevel, 0])
        .clamp(true);

    // Delay an update to expensive style changes upon zoom
    useDelayWait(() => {
        const k = plotTransform.k;
        // Update circle radius
        setDotStroke(1/k);
        // Update zoom level
        setIntZoomLevel(zoomScale(k));
    }, 150, [plotTransform]);

    // Handler for pan / zoom
    const onZoom = ({transform}) => {
        if (!brushMode && xAxisObj && yAxisObj && scales) {
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
    
    // Brush interaction handler - sets which circles are excluded
    const onBrush = (e) => {
        if (brushMode && e.selection && scales) {
            // local svg coords -> transformed svg coords -> data coords
            const [selx0, selx1] = [
                scales.iXScale.invert(plotTransform.invertX(e.selection[0]- margin.left)),
                scales.iXScale.invert(plotTransform.invertX(e.selection[1]- margin.left))];
            if (selx0 == selx1) {
                ///TODO: Clear selection
            } else {
                const dotSel = d3.select(ref.current).selectAll(".dot").classed("excluded", true);
                const circleArray = dotSel.nodes();
                quadtrees[intZoomLevel][xAxis][yAxis].visit((node, x0, y0, x1, y1) => {
                    if (node.data) {
                        if (node.data.x >= selx0 && node.data.x <= selx1) {
                            console.assert(circleArray[node.data.idx],
                                circleArray, node);
                            circleArray[node.data.idx].classList.remove("excluded");
                        }
                    }
                    return x0 >= selx1 || x1 < selx0;
                });
            }
        }
    };

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

    // Brushing enable / disable handler
    useEffect(() => {
        if (brushMode) {
            d3.select(ref.current).on(".zoom", null);

            // Set up brushing
            const brush = d3.brushX()
                .extent([[0, 0], [bounds.innerWidth, bounds.innerHeight]])
                .on("start brush end", onBrush);
            
            d3.select("#scatterplot #brush-container")
                .call(brush).call(brush.move, [0, 0]);
        } else if (zoomObj.zoom) {
            d3.select(ref.current).on(".zoom", null);
            d3.select(ref.current).call(zoomObj.zoom);
        }
    }, [brushMode]);
    
    // Render chart function
    const ref = useD3(svg => {
        if (!gScales || !data || !movieData) {
            return;
        }

        let scales = scales || copyScales(gScales);

        // Get relevant zoom level, x axis, y axis data subset and swap axes as needed
        let dataSubset = data.get(intZoomLevel);
        let vxAxis, vyAxis, vw, vh;
        if (dataSubset.has(xAxis) && dataSubset.get(xAxis).has(yAxis)) {
            [vxAxis, vyAxis, vw, vh] = [xAxis, yAxis, simBounds.x, simBounds.y];
        } else {
            [vxAxis, vyAxis, vw, vh] = [yAxis, xAxis, simBounds.y, simBounds.x];
        }
        dataSubset = dataSubset.get(vxAxis).get(vyAxis);

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
        scales.iXScale = d3.scaleLinear().domain(vw).range(xScale.range());
        scales.iYScale = d3.scaleLinear().domain(vh).range(yScale.range());

        // Draw points
        svg.select(".plot-area")
            .selectAll("circle")
            .data(dataSubset)
            .join("circle")
            .attr("cx", d => scales.iXScale(d.x))
            .attr("cy", d => scales.iYScale(d.y))
            .attr("r", d => Math.max(2, d.r * 0.85))
            .classed("dot", true)
            .attr("fill", d => {
                if (d.movies.length == 1) {
                    console.assert(movieData[d.movies[0]], d);
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
        
        // Set zoom matching new plot boundaries
        const zoom = (zoomObj.zoom || d3.zoom()).on("zoom", onZoom).scaleExtent(zoomBounds)
            .translateExtent([[-100, -100], [bounds.innerWidth + 100, bounds.innerHeight + 100]]);
        if (!brushMode) {
            svg.call(zoom);
        }

        if (!initialized) {
            // Set initial zoom level
            svg.call(zoom.transform, initTransform);
            onZoom({transform: initTransform});

            // Initialize quadtree for every zoom level and every pair of axes
            let qtrees = {};
            for (let [zoomLvl, xAxisMap] of data.entries()) {
                qtrees[zoomLvl] = {};
                for (let [xAxis, yAxisMap] of xAxisMap.entries()) {
                    qtrees[zoomLvl][xAxis] = {};
                    for (let [yAxis, dots] of yAxisMap.entries()) {
                        qtrees[zoomLvl][xAxis][yAxis] = d3.quadtree()
                            .x(d => d.x)
                            .y(d => d.y)
                            .addAll(dots);
                    }
                }
            }
            setQuadtrees(qtrees);

            setInitialized(true);
        }
        setZoomObj({zoom: zoom});
        setScales(scales);
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
                    circle.dot.excluded {'{'}
                        opacity: 0.35;
                    {'}'}
                </style>
                <defs>
                    <clipPath id="plot-area-clip">
                        <rect fill="white" x={0} y={0} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                {brushMode && <g id="brush-container"></g>}
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