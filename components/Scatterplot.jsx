import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import useD3 from "../hooks/useD3";
import useSize from "../hooks/useSize";

export default function CScatterplot({data}) {
    const margin = {top: 20, right: 20, bottom: 20, left: 30};
    const [bounds, setBounds] = useState({width: 800, height: 800, innerWidth: 800, innerHeight: 800});
    const target = useRef(null);
    const size = useSize(target);

    useEffect(() => {
        const w = size ? size.width : bounds.width;
        const h = size ? size.height : bounds.height;
        setBounds({
            width: w, height: h,
            innerWidth: w - margin.left - margin.right,
            innerHeight: h - margin.top - margin.bottom
        });
    }, [size]);
    
    const ref = useD3(svg => {
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.released))
            .rangeRound([margin.left, bounds.innerWidth]);
        const yScale = d3.scaleLinear()
            .domain([0, 10])
            .rangeRound([bounds.innerHeight, margin.top]);
        
        svg.select(".x-axis")
            .attr("transform", `translate(0, ${bounds.innerHeight})`)
            .call(d3.axisBottom(xScale));
        svg.select(".y-axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        svg.select(".plot-area")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => xScale(d.released))
            .attr("cy", d => yScale(d.score))
            .attr("r", 3);
    }, [size, data]);

    return (
        <div id="scatterplot" className="w-full h-full bg-violet-200" ref={target}>
            <svg ref={ref} width={bounds.width} height={bounds.height}>
                <g className="plot-area"></g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
        </div>
    );
};