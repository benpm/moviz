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
    const brushContainerRef = useRef(null);
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
    
    const [axes, setAxes] = useState({x: null, y: null});

    // Make sure these parameters match the parameters in data_processing/simulate.py
    const simBounds = {x:[-1000, 1000], y:[-300, 300]};

    const [dotStroke, setDotStroke] = useState(1);
    const [initialized, setInitialized] = useState(false);
    const [quadtrees, setQuadtrees] = useState(null);

    // Mapping from data idx to circle element node in the svg plot
    const [nodeMap, setNodeMap] = useState(null);

    // Handler for mode switch buttons (ViewSelector.jsx)
    useEffect(() => {
        switch (viewMode) {
            case "ratings_oscars":
                setXAxisList(null);
                setXAxis("released");
                setYAxisList(["score", "audience_rating", "tomatometer_rating"]);
                setYAxis("score");
                setBrushHandler({handler: onXBrush, gen: d3.brushX});
                break;
            case "movie_economy":
                setXAxisList(null);
                setXAxis("released");
                setYAxisList(["budget", "gross"]);
                setYAxis("budget");
                setBrushHandler({handler: onXBrush, gen: d3.brushX});
                break;
            case "cost_quality":
                setXAxisList(["budget", "gross"]);
                setXAxis("budget");
                setYAxisList(["score", "audience_rating", "tomatometer_rating"]);
                setYAxis("score");
                setBrushHandler({handler: onXYBrush, gen: d3.brush});
                break;
        }
        clearBrush();
    }, [viewMode, scales, nodeMap]);

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
        if (!brushMode && axes.x && axes.y && scales) {
            setPlotTransform(transform);
            const plotArea = d3.select(ref.current).select(".plot-area");
            plotArea.attr("transform", transform);
    
            // Update axes
            d3.select(ref.current).select(".x-axis")
                .call(axes.x.scale(transform.rescaleX(scales.f[xAxis])));
            d3.select(ref.current).select(".y-axis")
                .call(axes.y.scale(transform.rescaleY(scales.f[yAxis])));
        } else {
            console.warn(`onZoom() ignored: brushMode=${brushMode}, axes.x=${axes.x}, axes.y=${axes.y}, scales=${scales}`);
        }
    };
    useEffect(() => {
        if (zoomObj.zoom && axes.x && axes.y && scales) {
            zoomObj.zoom
                .on("zoom", onZoom)
                .scaleExtent(zoomBounds)
                .translateExtent([[-100, -100], [bounds.innerWidth + 100, bounds.innerHeight + 100]]);
            d3.select(ref.current)
                .call(zoomObj.zoom)
                .call(zoomObj.zoom.transform, plotTransform);
        }
    }, [axes, scales, brushMode, zoomObj, bounds]);

    // Brush interaction handler - sets which circles are excluded
    const onXBrush = (e) => {
        if (scales && nodeMap) {
            if (e.selection && e.selection[0] != e.selection[1]) {
                const t = new d3.ZoomTransform(
                    plotTransform.k,
                    plotTransform.x + margin.left,
                    plotTransform.y + margin.top);
                console.log("onXBrush");
                // local plot coords -> transformed plot coords -> data coords
                const [selx0, selx1] = [
                    scales.iXScale.invert(t.invertX(e.selection[0])),
                    scales.iXScale.invert(t.invertX(e.selection[1]))];
                let included = new Set();
                quadtrees[intZoomLevel][xAxis][yAxis].visit((node, x0, y0, x1, y1) => {
                    if (node.data) {
                        if (node.data.x >= selx0 && node.data.x <= selx1) {
                            included.add(node.data.idx);
                        }
                    }
                    return x0 >= selx1 || x1 < selx0;
                });
                d3.select(ref.current).selectAll(".dot").classed("excluded", d => !included.has(d.idx));
            } else {
                d3.select(ref.current).selectAll(".dot").classed("excluded", false);
            }
        }
    };
    const onXYBrush = (e) => {
        if (scales && nodeMap) {
            if (e.selection) {
                // local plot coords -> transformed plot coords -> data coords
                const t = new d3.ZoomTransform(
                    plotTransform.k,
                    plotTransform.x + margin.left,
                    plotTransform.y + margin.top);
                const [selx0, selx1] = [
                    scales.iXScale.invert(t.invertX(e.selection[0][0])),
                    scales.iXScale.invert(t.invertX(e.selection[1][0]))];
                const [sely1, sely0] = [
                    scales.iYScale.invert(t.invertY(e.selection[0][1])),
                    scales.iYScale.invert(t.invertY(e.selection[1][1]))];
                // Add all dots inside the rectangular region to the included set
                let included = new Set();
                quadtrees[intZoomLevel][xAxis][yAxis].visit((node, x0, y0, x1, y1) => {
                    if (node.data) {
                        if (node.data.x >= selx0 && node.data.x <= selx1 &&
                            node.data.y >= sely0 && node.data.y <= sely1) {
                            included.add(node.data.idx);
                        }
                    }
                    return x0 >= selx1 || x1 < selx0 || y0 >= sely1 || y1 < sely0;
                });
                d3.select(ref.current).selectAll(".dot").classed("excluded", d => !included.has(d.idx));
            } else {
                d3.select(ref.current).selectAll(".dot").classed("excluded", false);
            }
        }
    };

    // Brush behavior object
    const [brushObj, setBrushObj] = useState({brush: null});
    // Current handler for brush selection
    const [brushHandler, setBrushHandler] = useState({handler: null, gen: null});

    // Clear brushing
    const clearBrush = () => {
        if (brushObj.brush) {
            d3.select(brushContainerRef.current).call(brushObj.brush.clear);
            d3.select(ref.current).selectAll(".dot").classed("excluded", false);
        }
    };

    // Re-brush on change in int zoom level
    useEffect(clearBrush, [plotTransform]);
    
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

    // Associate brush handler
    useEffect(() => {
        if (scales && nodeMap && brushObj.brush && brushHandler.handler) {
            brushObj.brush
                .on("start brush end", brushHandler.handler)
                .extent([[0, 0], [bounds.width, bounds.height]]);
        }
    }, [scales, nodeMap, plotTransform, brushMode, brushHandler, brushObj, bounds]);

    // Brushing enable / disable handler
    useEffect(() => {
        if (!scales || !brushHandler.handler) return;
        if (brushMode) {
            d3.select(ref.current).on(".zoom", null);

            // Set up brushing
            const brush = (brushHandler.gen)()
                .on("start brush end", brushHandler.handler)
                .extent([[0, 0], [bounds.width, bounds.height]]);
            d3.select(brushContainerRef.current)
                .call(brush).call(brush.clear);
            setBrushObj({brush: brush});
        } else {
            clearBrush(); //TODO: remove if fix brush transformation
        }
    }, [brushMode, brushHandler, scales]);
    
    // Render chart function
    const ref = useD3(svg => {
        if (!gScales || !data || movieData.length == 0) {
            return;
        }

        let _scales = scales || copyScales(gScales);

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
        const xScale = _scales.f[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = _scales.f[yAxis].rangeRound([bounds.innerHeight, 0]);
        const xAxisObj = d3.axisBottom(xScale).tickFormat(
            intZoomLevel != 0 ? _scales.format[xAxis] : _scales.format[`${xAxis}_zoomed`]);
        const yAxisObj = d3.axisLeft(yScale).tickFormat(_scales.format[yAxis]);
        setAxes({x: xAxisObj, y: yAxisObj});
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
            .classed("plot-axis", true).transition().duration(1000);
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .classed("plot-axis", true).transition().duration(1000);

        // Inverse scales that transforms data coords -> plot coordinates
        _scales.iXScale = d3.scaleLinear().domain(vw).range(xScale.range());
        _scales.iYScale = d3.scaleLinear().domain(vh).range(yScale.range());

        // Draw points
        let _nodeMap = new Map();
        svg.select(".plot-area")
            .selectAll("circle")
            .data(dataSubset)
            .join("circle")
            .attr("cx", d => _scales.iXScale(d.x))
            .attr("cy", d => _scales.iYScale(d.y))
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
            })
            .datum((d, _, g) => {
                _nodeMap.set(d.idx, g[0]);
                return d;
            });
        if (_nodeMap.size > 0) {
            setNodeMap(_nodeMap);
        }

        if (!initialized) {
            // Initialize quadtree for every zoom level and every pair of axes
            let qtrees = {};
            for (let [zoomLvl, xAxisMap] of data.entries()) {
                qtrees[zoomLvl] = {};
                for (let [xAxis, yAxisMap] of xAxisMap.entries()) {
                    qtrees[zoomLvl][xAxis] = {};
                    for (let [yAxis, dots] of yAxisMap.entries()) {
                        qtrees[zoomLvl][xAxis][yAxis] = d3.quadtree()
                            .x(d => d.x).y(d => d.y).addAll(dots);
                    }
                }
            }
            setQuadtrees(qtrees);
            setInitialized(true);
            setZoomObj({zoom: d3.zoom()});
        }
        setScales(_scales);
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
                {brushMode && <g ref={brushContainerRef}></g>}
                <g className="plot-area-container" style={{clipPath: "url(#plot-area-clip)"}}
                    transform={`translate(${margin.left},${margin.top})`}>
                    <g className="plot-area"></g>
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
};