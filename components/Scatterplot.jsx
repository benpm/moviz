import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import useD3 from "../hooks/useD3";
import useSize from "../hooks/useSize";
import CDropdown from "./Dropdown";
import useGlobalState from "../hooks/useGlobalState";

export default function CScatterplot({data}) {
    const margin = {top: 20, right: 20, bottom: 20, left: 30};
    const [bounds, setBounds] = useState({width: 800, height: 800, innerWidth: 800, innerHeight: 800});
    const target = useRef(null);
    const size = useSize(target);
    // X and Y axis property labels
    const [xAxis, setXAxis] = useState("released");
    const [yAxis, setYAxis] = useState("score");
    // Hovered data item using global state
    const [setHoverItem] = useGlobalState(state => [
        state.setHoverItem
    ]);
    // Valid X axis labels
    const xAxes = ["released", "budget", "runtime"];
    // Valid Y axis labels
    const yAxes = ["score", "audience_rating", "tomatometer_rating"];
    
    var xScales = null;
    var yScales = null;
    var xAxisObj = null;
    var yAxisObj = null;

    const zoom = d3.zoom().on("zoom", ({transform}) => {
        if (xAxisObj && yAxisObj) {
            const plotArea = d3.select(ref.current).select(".plot-area");
            plotArea.attr("transform", transform);
    
            // Update axes
            d3.select(ref.current).select(".x-axis").call(xAxisObj.scale(transform.rescaleX(xScales[xAxis])));
            d3.select(ref.current).select(".y-axis").call(yAxisObj.scale(transform.rescaleY(yScales[yAxis])))
        }
    });

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
        svg.call(zoom);
        const xScale = xScales[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = yScales[yAxis].rangeRound([bounds.innerHeight, 0]);
        xAxisObj = d3.axisBottom(xScale);
        yAxisObj = d3.axisLeft(yScale);
        svg.select(".x-axis").call(xAxisObj)
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`);
        svg.select(".y-axis").call(yAxisObj)
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Draw points
        svg.select(".plot-area")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => xScale(d[xAxis]))
            .attr("cy", d => yScale(d[yAxis]))
            .attr("r", 3)
            .on("mouseover", (e, d) => {
                setHoverItem({datum: d, x: e.pageX, y: e.pageY});
                d3.select(e.target).attr("fill", "red");
            })
            .on("mouseout", (e, d) => {
                setHoverItem({datum: null, x: 0, y: 0})
                d3.select(e.target).attr("fill", "black");
            });
    }, [bounds, data, yAxis, xAxis]);

    return (
        <div id="scatterplot" className="relative w-full h-full bg-violet-200" ref={target}>
            <div className="absolute top-0 right-0">
                <CDropdown options={yAxes} value={yAxis} onChange={setYAxis} />
            </div>
            <svg ref={ref} className="w-full h-full">
                <defs>
                    <clipPath id="plot-area-clip">
                        {/* <rect fill="black" x="0" y="0" width={bounds.width} height={bounds.height} /> */}
                        <rect fill="white" x={margin.left} y={margin.top} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                <g style={{clipPath: "url(#plot-area-clip)"}}>
                    <g className="plot-area"></g>
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
};