import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import useD3 from "../hooks/useD3";
import useSize from "../hooks/useSize";
import CDropdown from "./Dropdown";
import useGlobalState from "../hooks/useGlobalState";
import useDelayWait from "../hooks/useDelayWait";
import copyScales from "../scripts/copyScales";
import { loadScatterPlotData } from "../scripts/loadData";
import { ramp } from "../scripts/createLegendImage";
import tailwindConfig from "../tailwind.config";
import { schemeGnBu } from "d3";
import { GiConsoleController } from "react-icons/gi";

const OSCAR_COLORS = {
    "winner": "#fce603",
    "nominee": "#947b1b",
    "best_picture_winner": "#214ED3",
    "best_picture_nominee": "#90A8EE",
    "none": "#c0c0c0",
};

export default function CCollapsedScatterplot({ movieData }) {
    const [data, setData] = useState(null);
    const margin = { top: 20, right: 20, bottom: 20, left: 50 };
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);
    const brushContainerRef = useRef(null);
    let [setHoverItem,
        setHoverPos,
        xAxis,
        yAxis,
        setXAxis,
        setYAxis,
        gScales,
        viewMode,
        brushMode,
        setBrushRange,
        setBrushFilter,
        brushFilter,
        hoveredExpandedGroup,
        showTrendLine,
        hoverDetailTimeout,
        setHoverDetailTimeout,
        adjustInflation,
        searchFilter,
        setSearchFilter,
        setBrushMode,
        brushRange,
    ] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
        state.scatterXAxis,
        state.scatterYAxis,
        state.setScatterXAxis,
        state.setScatterYAxis,
        state.scales,
        state.viewMode,
        state.brushMode,
        state.setBrushRange,
        state.setBrushFilter,
        state.brushFilter,
        state.hoveredExpandedGroup,
        state.showTrendLine,
        state.hoverDetailTimeout,
        state.setHoverDetailTimeout,
        state.adjustInflation,
        state.searchFilter,
        state.setSearchFilter,
        state.setBrushMode,
        state.brushRange,
    ]);
    const [scales, setScales] = useState(null);

    const axisTitles = {
        "released": "Release Date",
        "budget": "Budget",
        "gross": "Revenue",
        "profit": "Profit",
        "budget_adj": "Budget (Adjusted)",
        "gross_adj": "Revenue (Adjusted)",
        "profit_adj": "Profit (Adjusted)",
        "score": "IMDb Score",
        "audience_rating": "RT Audience Rating",
        "tomatometer_rating": "RT Tomatometer Rating",
    };

    const [xAxisList, setXAxisList] = useState([]);
    const [yAxisList, setYAxisList] = useState([]);

    const [axes, setAxes] = useState({ x: null, y: null });

    // Make sure these parameters match the parameters in data_processing/simulate.py
    const simBounds = { x: [-1000, 1000], y: [-300, 300] };

    const [dotStroke, setDotStroke] = useState(1);
    const [quadtrees, setQuadtrees] = useState(null);
    const [trendDataByYear, setTrendDataByYear] = useState(null);
    const [legendImage, setLegendImage] = useState("");
    const [legendImage2, setLegendImage2] = useState("");

    const [nodeMap, setNodeMap] = useState(new Map());

    // Load data on first render 
    useEffect(() => {
        if (data == null) {
            loadScatterPlotData().then(setData);
        }
    }, []);

    // Initialize zoom + scale for transforming plot transform scale to integer zoom level
    const [zoomObj, setZoomObj] = useState({ zoom: null });
    const zoomBounds = [0.9, 10];
    const maxZoomLevel = 2; // (must match simulate.py)
    const initTransform = d3.zoomIdentity.scale(0.97).translate(50, 100);
    const [plotTransform, setPlotTransform] = useState(initTransform);
    const [intZoomLevel, setIntZoomLevel] = useState(maxZoomLevel);
    const [brushDirty, setBrushDirty] = useState(false);
    const zoomScale = d3.scaleLinear()
        .domain([0.5, zoomBounds[1] * 0.5])
        .rangeRound([maxZoomLevel, 0])
        .clamp(true);

    // Delay an update to expensive style changes upon zoom
    useDelayWait(() => {
        const k = plotTransform.k;
        // Update circle radius
        setDotStroke(1 / k);
        // Update zoom level
        setIntZoomLevel(zoomScale(k));
    }, 150, [plotTransform]);

    // Handler for pan / zoom
    const onZoom = ({ transform }) => {
        if (!brushMode && axes.x && axes.y && scales) {
            setPlotTransform(transform);
            const plotArea = d3.select(ref.current).select(".plot-area");
            plotArea.attr("transform", transform);

            // Update axes
            d3.select(ref.current).select(".x-axis")
                .call(axes.x.scale(transform.rescaleX(scales.f[xAxis])));
            d3.select(ref.current).select(".y-axis")
                .call(axes.y.scale(transform.rescaleY(scales.f[yAxis])));
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

    useEffect(() => {
        d3.select(ref.current).select(".plot-area").classed("searching", (searchFilter.size > 0));
        d3.select(ref.current).selectAll("circle.dot").classed("searched", false);
        searchFilter.forEach(idx => {
            nodeMap.get(idx).classList.add("searched");
        });
    }, [searchFilter, intZoomLevel, xAxis, yAxis, nodeMap]);

    // Handler for mode switch buttons (ViewSelector.jsx)
    useEffect(() => {
        var initBrushed = false;
        const onXBrush = (e) => {
            if (scales) {
                if (e.selection && e.selection[0] != e.selection[1]) {
                    const t = new d3.ZoomTransform(
                        plotTransform.k,
                        plotTransform.x + margin.left,
                        plotTransform.y + margin.top);
                    // local plot coords -> transformed plot coords -> data coords
                    const [selx0, selx1] = [
                        scales.iXScale.invert(t.invertX(e.selection[0])),
                        scales.iXScale.invert(t.invertX(e.selection[1]))];
                    setBrushRange([
                        scales.f[xAxis].invert(t.invertX(e.selection[0])).getFullYear(),
                        scales.f[xAxis].invert(t.invertX(e.selection[1])).getFullYear()]);
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
                    if (e.type == "end") {
                        initBrushed = true;
                    }
                } else {
                    d3.select(ref.current).selectAll(".dot").classed("excluded", false);
                    if (e.type == "end") {
                        if (initBrushed) {
                            setBrushMode(false);
                        }
                    }
                }
            }
            if (e.type == "start") {
                setBrushDirty(true);
            } else if (e.type == "end") {
                setBrushDirty(false);
            }
        };
        const onXYBrush = (e) => {
            if (scales) {
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
                    let movieIDs = [];
                    quadtrees[intZoomLevel][xAxis][yAxis].visit((node, x0, y0, x1, y1) => {
                        if (node.data) {
                            if (node.data.x >= selx0 && node.data.x <= selx1 &&
                                node.data.y >= sely0 && node.data.y <= sely1) {
                                included.add(node.data.idx);
                                movieIDs.push(...node.data.movies);
                            }
                        }
                        return x0 >= selx1 || x1 < selx0 || y0 >= sely1 || y1 < sely0;
                    });
                    setBrushFilter(movieIDs);
                    d3.select(ref.current).selectAll(".dot").classed("excluded", d => !included.has(d.idx));
                } else {
                    d3.select(ref.current).selectAll(".dot").classed("excluded", false);
                    if (e.type == "end" && brushDirty) {
                        setBrushMode(false);
                    }
                }
            }
            if (e.type == "start") {
                setBrushDirty(true);
            } else if (e.type == "end") {
                setBrushDirty(false);
            }
        };
        switch (viewMode) {
            case "ratings_oscars":
                setBrushHandler({ handler: onXBrush, gen: d3.brushX });
                break;
            case "movie_economy":
                setBrushHandler({ handler: onXBrush, gen: d3.brushX });
                break;
            case "cost_quality":
                setBrushHandler({ handler: onXYBrush, gen: d3.brush });
                break;
        }
        clearBrush();
    }, [viewMode, scales, plotTransform, xAxis, yAxis, intZoomLevel]);

    // Set the axes based on current view mode and adjustment for inflation option
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
                if (adjustInflation) {
                    setYAxisList(["budget_adj", "gross_adj", "profit_adj"]);
                    setYAxis("budget_adj");
                } else {
                    setYAxisList(["budget", "gross", "profit"]);
                    setYAxis("budget");
                }
                break;
            case "cost_quality":
                if (adjustInflation) {
                    setXAxisList(["budget_adj", "gross_adj", "profit_adj"]);
                    setXAxis("budget_adj");
                } else {
                    setXAxisList(["budget", "gross", "profit"]);
                    setXAxis("budget");
                }
                setYAxisList(["score", "audience_rating", "tomatometer_rating"]);
                setYAxis("score");
                break;
        }
    }, [viewMode, adjustInflation]);

    // Brush behavior object
    const [brushObj, setBrushObj] = useState({ brush: null });
    // Current handler for brush selection
    const [brushHandler, setBrushHandler] = useState({ handler: null, gen: null });

    // Clear brushing
    const clearBrush = () => {
        if (brushObj.brush) {
            d3.select(brushContainerRef.current).call(brushObj.brush.clear);
            d3.select(ref.current).selectAll(".dot").classed("excluded", false);
        }
        setBrushRange(null);
        setBrushFilter([]);
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
        if (scales && brushObj.brush && brushHandler.handler) {
            brushObj.brush
                .on("start brush end", brushHandler.handler)
                .extent([[0, 0], [bounds.width, bounds.height]]);
            console.debug("associated brush handler", xAxis, yAxis);

        }
    }, [scales, brushObj, brushHandler, bounds]);

    // Brushing enable / disable handler
    useEffect(() => {
        if (!scales || !brushHandler.handler) return;
        if (brushMode) {
            d3.select(ref.current).on(".zoom", null);

            // Set up brushing
            const brush = (brushHandler.gen)()
                .on("start brush end", brushHandler.handler)
                .extent([[0, 0], [bounds.width, bounds.innerHeight + margin.bottom]]);
            d3.select(brushContainerRef.current)
                .call(brush).call(brush.clear);
            setBrushObj({ brush: brush });
        } else {
            clearBrush(); //TODO: remove if fix brush transformation
        }
    }, [brushMode, brushHandler, scales]);

    // Set mouse handlers for scatterplot dots
    useEffect(() => {
        const svg = d3.select(ref.current);
        var timeoutEnterId = null;
        var inGroupDetail = null;
        // Clear the timeout for showing group detail and reset
        const clearHoverDetail = () => {
            if (timeoutEnterId != null) {
                clearTimeout(timeoutEnterId);
                setHoverItem({ datum: null, x: 0, y: 0, caller: null });
                inGroupDetail = null;
                svg.select(".hover-emph").remove();
                if (hoverDetailTimeout != null) {
                    clearTimeout(hoverDetailTimeout);
                    setHoverDetailTimeout(null);
                }
            }
        };
        // Set the handlers
        svg.selectAll(".dot")
            .on("mouseenter", (e, d) => {
                if (brushDirty)
                    return;
                if (d.movies.length > 1) {
                    if (inGroupDetail == null) {
                        // Clear previous group hover detail
                        clearHoverDetail();
                        // Set new group
                        setHoverItem({ datum: d, x: e.pageX, y: e.pageY, caller: "scatterplot_group" });

                        // Set timeout to show group hover detail
                        timeoutEnterId = setTimeout(() => {
                            setHoverItem({
                                datum: d,
                                x: e.pageX,
                                y: e.pageY,
                                caller: "scatterplot_group_expanded",
                                clearHoverDetail
                            });
                            inGroupDetail = d;
                        }, 1000);
                        // Create larger circle in the same position and radius
                        svg.select(".dots")
                            .append("circle")
                            .attr("cx", scales.iXScale(d.x))
                            .attr("cy", scales.iYScale(d.y))
                            .attr("r", d.r * 2)
                            .classed("hover-emph", true)
                            .attr("fill", "none")
                            .attr("stroke", "white")
                            .attr("stroke-width", 0)
                            .transition().duration(1000)
                            .attr("stroke", tailwindConfig.theme.extend.colors.accent)
                            .attr("stroke-width", 4 / plotTransform.k)
                            .attr("r", d.r * 0.9);
                    } else if (inGroupDetail === d) {
                        // Hovering same group we are detailing
                        clearTimeout(hoverDetailTimeout);
                        setHoverDetailTimeout(null);
                    }
                } else if (inGroupDetail == null) {
                    setHoverItem({ datum: movieData[d.movies[0]], x: e.pageX, y: e.pageY, caller: "scatterplot" });
                }
            })
            .on("mousemove", (e, d) => {
                if(brushDirty)
                    return;
                if (inGroupDetail == null)
                    setHoverPos({ x: e.pageX, y: e.pageY });
            })
            .on("mouseleave", (e, d) => {
                if(brushDirty)
                    return;
                if (inGroupDetail != null) {
                    const t = e.relatedTarget;
                    if (inGroupDetail === d && (!t || t.id != "tooltip-container")
                        && !e.relatedTarget.classList.contains("tooltip")) {
                        const id = setTimeout(() => {
                            clearHoverDetail();
                        }, 800);
                        setHoverDetailTimeout(id);
                    }
                } else {
                    clearHoverDetail();
                    setHoverItem({ datum: null });
                }
            });
    }, [brushDirty, scales]);

    // Render chart function
    const ref = useD3(svg => {
        if (!gScales || !data || movieData.length == 0) {
            return;
        }

        let _scales = copyScales(scales || gScales);
        setScales(_scales);

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
        const xAxisObj = _scales.format[xAxis](d3.axisBottom(xScale));
        const yAxisObj = _scales.format[yAxis](d3.axisLeft(yScale));
        setAxes({ x: xAxisObj, y: yAxisObj });
        svg.select(".x-axis").classed("plot-axis", true)
            .call(xAxisObj)
            .attr("transform", `scale(1,1) translate(${margin.left}, ${bounds.innerHeight + margin.top})`);

        svg.select(".y-axis").classed("plot-axis", true)
            .call(yAxisObj)
            .attr("transform", `scale(1,1) translate(${margin.left}, ${margin.top})`);

        // Inverse scales that transforms data coords -> plot coordinates
        _scales.iXScale = d3.scaleLinear().domain(vw).range(xScale.range());
        _scales.iYScale = d3.scaleLinear().domain(vh).range(yScale.range());

        // Draw a line for average budget by year
        const yearScale = _scales.f.year.rangeRound([0, bounds.innerWidth]);
        const trendScale = _scales.f[yAxis].rangeRound([bounds.innerHeight, 0]);

        // Compute (if needed) and draw trend line
        let trendDataByYear = trendDataByYear || new Map();
        if (trendDataByYear.size == 0) {
            for (const axis of ["budget", "gross", "profit", "budget_adj", "gross_adj", "profit_adj"]) {
                trendDataByYear.set(axis,
                    d3.rollups(movieData, d => d3.mean(d, x => x[axis]), d => d.year));
            }
            setTrendDataByYear(trendDataByYear);
        }
        if (trendDataByYear.has(yAxis)) {
            const avgTrendLine = d3.line()
                .x(d => yearScale(d[0]))
                .y(d => trendScale(d[1]));
            svg.selectAll(".trend-line")
                .attr("d", avgTrendLine(trendDataByYear.get(yAxis)));
        }

        // Color scale for profit-colored dots
        const profitColorScales = [
            d3.scaleSequential(v => d3.interpolateRdYlBu((1-v) / 2))
                .domain([0, _scales.f["profit"].domain()[0] / 2]),
            d3.scaleSequential(v => d3.interpolateRdYlBu(0.5 + v / 2))
                .domain([0, Math.log10(_scales.f["profit"].domain()[1])])
        ];

        setLegendImage(ramp(profitColorScales[0], true).toDataURL());
        setLegendImage2(ramp(profitColorScales[1]).toDataURL());

        // Draw points
        svg.select(".dots")
            .selectAll("circle")
            .data(dataSubset)
            .join("circle")
            .datum((d,i,n) => {
                d.movies.forEach(m => nodeMap.set(m, n[i]));
                return d;
            })
            .attr("cx", d => _scales.iXScale(d.x))
            .attr("cy", d => _scales.iYScale(d.y))
            .attr("r", d => Math.max(2, d.r * 0.85))
            .classed("dot", true)
            .attr("fill", d => {
                let v = 0;
                switch (viewMode) {
                    case "ratings_oscars":
                        if (d.movies.length > 1) {
                            return OSCAR_COLORS["none"];
                        } else {
                            return OSCAR_COLORS[movieData[d.movies[0]].oscar];
                        }
                    case "movie_economy":
                    case "cost_quality":
                        d.movies.forEach(mIdx => {
                            v += movieData[mIdx].profit;
                        })
                }
                v /= d.movies.length;

                if (v < 0) {
                    return profitColorScales[0](v);
                } else {
                    return profitColorScales[1](Math.log10(Math.abs(v)));
                }
            });
        setNodeMap(nodeMap);

        if (!quadtrees) {
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
        }

        if (!zoomObj.zoom) {
            setZoomObj({ zoom: d3.zoom() });
        }

        //set legend stuff

        svg.select(".legend-s")
            .attr("transform", `translate(${bounds.innerWidth - margin.left * 2 - 10}, 
                ${bounds.innerHeight - 100 + margin.bottom / 2 -
                (viewMode === "cost_quality" ? 25 : 0)}) scale(1)`)
            .selectAll("rect")
            .attr("width", 160)
            .attr("height", 100)
            .attr("rx", 4)
            .attr("stroke-width", 1);

        svg.select(".legend-s")
            .select("g")
            .selectAll("g")
            .attr("transform", (d, i) => {
                return `translate(${i == 0 ? 10 : 11}, ${(i > 0 ? 12 : 6) + i * 15})`;
            })
            .selectAll("circle")
            .attr("stroke", "black");

        if (viewMode == "movie_economy" || viewMode == "cost_quality") {
            const dollarFormat = d3.format("$,.0s");
            svg.select(".legend-s")
                .select(".minText")
                .text(dollarFormat(_scales.f["profit"].domain()[0]));
            svg.select(".legend-s")
                .select(".maxText")
                .text(dollarFormat(_scales.f["profit"].domain()[1]));
        }

        //set legend opacity to 0 when mouse enters in svg
        svg.on("mouseenter", () => {
            svg.select(".legend-s")
                .transition().duration(200)
                .attr("transform", `translate(${bounds.innerWidth - margin.left * 2 + 150}, 
                    ${bounds.innerHeight + margin.bottom / 2 - (viewMode === "cost_quality" ? 25 : 0)}) scale(0)`);
            svg.select(".title")
                .transition().duration(200)
                .attr("transform", `translate(${bounds.width / 2}, 0) scale(0)`);
        });

        //set legend opacity to 1 when mouse leaves svg
        svg.on("mouseleave", () => {
            svg.select(".legend-s")
                .transition().duration(200)
                .attr("transform", `translate(${bounds.innerWidth - margin.left * 2 - 10}, 
                    ${bounds.innerHeight - 100 + margin.bottom / 2 - (viewMode === "cost_quality" ? 25 : 0)}) scale(1)`);
            svg.select(".title")
                .transition().duration(200)
                .attr("transform", `translate(${bounds.width / 2}, ${margin.top}) scale(1)`);
        });
    }, [bounds, gScales, yAxis, xAxis, data, movieData, intZoomLevel, showTrendLine]);

    return (
        <div id="scatterplot" className="relative w-full h-full" ref={target}>
            <div className="absolute top-4 left-12">
                <CDropdown label="" options={yAxisList} optionTitles={axisTitles} value={yAxis} onChange={setYAxis} />
            </div>
            <div className="absolute bottom-6 right-4">
                {xAxisList != null &&
                    <CDropdown label="" options={xAxisList} optionTitles={axisTitles} value={xAxis} onChange={setXAxis} />
                }
            </div>
            <svg ref={ref} className="w-full h-full">
                <style>
                    circle.dot {'{'}
                        stroke-width: {dotStroke};
                        stroke: #121212;
                    {'}'}
                    circle.dot:hover {'{'}
                        fill: white;
                    {'}'}
                    circle.dot.excluded {'{'}
                        opacity: 0.35;
                    {'}'}
                    g.searching circle {'{'}
                        opacity: 0.35;
                    {'}'}
                    g.searching circle.searched {'{'}
                        opacity: 1;
                        stroke: white;
                        stroke-width: 2;
                        fill: white;
                    {'}'}
                </style>
                <defs>
                    <clipPath id="plot-area-clip">
                        <rect fill="white" x={0} y={0} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                    <clipPath id="y-axis-clip">
                        <rect fill="white" x={-margin.left} y={0} width={margin.left} height={bounds.innerHeight} />
                    </clipPath>
                    <clipPath id="x-axis-clip">
                        <rect fill="white" x={0} y={0} width={bounds.innerWidth} height={margin.bottom} />
                    </clipPath>
                </defs>
                {brushMode && <g ref={brushContainerRef}></g>}
                <g className="plot-area-container" style={{ clipPath: "url(#plot-area-clip)" }}
                    transform={`translate(${margin.left},${margin.top})`}>
                    <g className="plot-area">
                        <g className="dots"></g>
                        {(viewMode === "movie_economy" && showTrendLine) &&
                            <>
                                <path className="trend-line stroke-black fill-none" style={{strokeWidth: 6/plotTransform.k}}></path>
                                <path className="trend-line stroke-white fill-none" style={{strokeWidth: 2/plotTransform.k}}></path>
                            </>}
                    </g>
                </g>
                <g className="legend-s">
                    <rect className="background"></rect>
                    {viewMode === "ratings_oscars" ?
                        <g>
                            <g><circle r='8' fill={OSCAR_COLORS['none']} cx="6" cy="6" strokeWidth={1}></circle>
                                <circle r='6' fill={OSCAR_COLORS['none']} cx="2" cy="6" strokeWidth={1}></circle>
                                <circle r='4' fill={OSCAR_COLORS['none']} cx="-2" cy="6" strokeWidth={1}></circle>
                                <text className="fill-white text-sm" textAnchor="start" x="18" y="12"># of Movies</text></g>
                            <g><circle r='4' fill={OSCAR_COLORS['nominee']}></circle>
                                <text className="fill-white text-sm" textAnchor="start" x="10" y="4">Oscar Nominee</text></g>
                            <g><circle r='4' fill={OSCAR_COLORS['winner']}></circle>
                                <text className="fill-white text-sm" textAnchor="start" x="10" y="4">Oscar Winner</text></g>
                            <g><circle r='4' fill={OSCAR_COLORS['best_picture_nominee']}></circle>
                                <text className="fill-white text-sm" textAnchor="start" x="10" y="4">Best Picture Nominee</text></g>
                            <g><circle r='4' fill={OSCAR_COLORS['best_picture_winner']}></circle>
                                <text className="fill-white text-sm" textAnchor="start" x="10" y="4">Best Picture Winner</text></g>
                            <g><circle r='4' fill={OSCAR_COLORS['none']}></circle>
                                <text className="fill-white text-sm" textAnchor="start" x="10" y="4">Not nominated</text></g>
                        </g> : null
                    }
                    {viewMode === "movie_economy" || viewMode === "cost_quality" ?
                        <g>
                            <g><circle r='8' fill={OSCAR_COLORS['none']} cx="6" cy="6" strokeWidth={1}></circle>
                                <circle r='6' fill={OSCAR_COLORS['none']} cx="2" cy="6" strokeWidth={1}></circle>
                                <circle r='4' fill={OSCAR_COLORS['none']} cx="-2" cy="6" strokeWidth={1}></circle>
                                <text className="fill-white text-sm" textAnchor="start" x="18" y="12"># of Movies</text></g>
                            <g transform="translate(0, -300)">
                                <text className="fill-white text-sm" textAnchor="middle" x="70" y="15">Profit</text>
                                <image x="0" y="20" width={70} height={15} preserveAspectRatio="none" xlinkHref={legendImage}></image>
                                <image x="69" y="20" width={71} height={15} preserveAspectRatio="none" xlinkHref={legendImage2}></image>
                                <text className="minText fill-white text-xs" textAnchor="start" x="0" y="47">min</text>
                                <text className="maxText fill-white text-xs" textAnchor="end" x="140" y="47">max</text>
                                <text className="fill-white text-xs" textAnchor="middle" x="70" y="47">0.0$</text>
                            </g>
                        </g> : null
                    }
                </g>
                <g className="x-axis" ></g>
                <g className="y-axis" ></g>
                <text className="title fill-light text-2xl" textAnchor="middle" transform={`translate(${bounds.width/2}, ${margin.top})`}>
                    {viewMode === "ratings_oscars" ? "Movie Ratings Over Time featuring Oscars" :
                        viewMode === "movie_economy" ? `Movie 
                            ${axisTitles[yAxis]} Over Time` :
                            viewMode === "cost_quality" ? `${axisTitles[yAxis]} vs. ${axisTitles[xAxis]}` : null}
                </text>
            </svg>
        </div>
    );
};