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
    const [xAxis, setXAxis] = useState("released");
    const [yAxis, setYAxis] = useState("score");
    const [setHoverItem] = useGlobalState(state => [
        state.setHoverItem
    ]);
    const yAxes = ["score", "audience_rating", "tomatometer_rating"];
    var xScales = null;
    var yScales = null;

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

        const xScale = xScales[xAxis].rangeRound([0, bounds.innerWidth]);
        const yScale = yScales[yAxis].rangeRound([bounds.innerHeight, 0]);
        
        svg.select(".x-axis")
            .call(d3.axisBottom(xScale))
            .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`);
        svg.select(".y-axis")
            .call(d3.axisLeft(yScale))
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        svg.select(".plot-area")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => xScale(d[xAxis]))
            .attr("cy", d => yScale(d[yAxis]))
            .attr("r", 2)
            .on("mouseover", (e, d) => {
                setHoverItem({datum: d, x: e.pageX, y: e.pageY});
            })
            .on("mouseout", (e, d) => {
                setHoverItem({datum: null, x: 0, y: 0})
            });
    }, [bounds, data, yAxis, xAxis]);

    return (
        <div id="scatterplot" className="relative w-full h-full bg-violet-200" ref={target}>
            <div className="absolute top-0 right-0">
                <CDropdown options={yAxes} value={yAxis} onChange={setYAxis} />
            </div>
            <svg ref={ref} className="w-full h-full">
                <g className="plot-area"></g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
};