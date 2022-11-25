import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";
import useGlobalState from "../hooks/useGlobalState";
import copyScales from "../scripts/copyScales";

function clearPlot(svg)
{
    svg.select(".bars").selectAll("*").remove();
    svg.select(".lines").selectAll("*").remove();
    svg.select(".legend").selectAll("*").remove();
    svg.select(".mouse-line-group").selectAll("*").remove();
    //disable svg event listeners
    svg.on("mousemove", null);
    svg.on("mouseout", null);
    svg.on("mouseover", null);
}

function drawStackedBarChart(svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos) {
    //filter movies with oscar wins
    let oscarData = data.filter(d => d.oscar.includes("nominee") != 0 || d.oscar.includes("winner") != 0);
    //bin the data by year and genre and count the number of movies in each bin
    let oscarDataByYear = d3.group(oscarData, d => d.year, d => d.genre);
    //sort by year
    oscarDataByYear = new Map([...oscarDataByYear.entries()].sort());
    //sort by genre
    oscarDataByYear.forEach((value, key) => {
        //sort entries of each value by their key
        let keys = Array.from(value.keys()).sort();
        let m = new Map();

        keys.forEach(key => m.set(key, value.get(key)));
        value.clear();
        m.forEach((v, k) => value.set(k, v));
    });

    //prefix sum over length of each genre for each year
    let prefixSum = new Map();
    oscarDataByYear.forEach((value, key) => {
        let sum = 0;
        let m = new Map();
        value.forEach((v, k) => {
            sum += v.length;
            m.set(k, { sum, v });
        });
        prefixSum.set(key, m);
    });

    prefixSum.forEach((value, key) => {
        let m = new Map();
        //iterate over values in reversed order
        for (let [k, v] of [...value.entries()].reverse()) {
            m.set(k, v);
        }
        prefixSum.set(key, m);
    });

    // find max value in prefix sum usinf d3.max
    let max = d3.max(prefixSum, (d) => {
        return d3.max(d[1], (d) => {
            return d[1].sum;
        });
    });

    const xScale = d3.scaleBand().domain([...oscarDataByYear.keys()]).rangeRound([0, bounds.innerWidth]);
    const countScale = d3.scaleLinear().domain([0, max]).range([0, 1]).nice();
    const yScale = countScale.rangeRound([bounds.innerHeight, 0]).nice();
    xAxisObj = d3.axisBottom(xScale).tickValues([...oscarDataByYear.keys()].filter((d, i) => i % 5 == 0));
    yAxisObj = d3.axisLeft(yScale);
    svg.select(".x-axis").call(xAxisObj)
        .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
        .classed("plot-axis", true);
    svg.select(".y-axis").call(yAxisObj)
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .classed("plot-axis", true);

    //create a categorical color scale for every genre from oscarData
    let colorScale = d3.scaleOrdinal([...d3.schemeDark2, "#17bed0"]).domain([...new Set(oscarData.map(d => d.genre))]);

    // draw stacked bar chart
    svg.select(".bars")
        .selectAll("g")
        .data(oscarDataByYear, d => d)
        .join("g")
        .attr("transform", d => `translate(${xScale(d[0]) + margin.left}, ${margin.top})`)
        .selectAll("rect")
        .data(d => prefixSum.get(d[0]))
        .join(
            enter => enter.append("rect")
                .attr("y", d => yScale(0))
                .attr("height", 0)
                .attr("width", xScale.bandwidth()),
            update => update,
            exit => exit.remove()
        )
        .classed("stacked-bar", true).transition(
            //disable pointer events until transition is done
            svg.selectAll(".stacked-bar").style("pointer-events", "none")
            //enable pointer events after transition is done
        ).on("end", () => svg.selectAll(".stacked-bar").style("pointer-events", "auto"))
        .duration(1000)
        .attr("x", 0)
        .attr("y", d => yScale(d[1].sum))
        .attr("width", xScale.bandwidth())
        .attr("height", d => yScale(0) - yScale(d[1].sum))
        .attr("fill", d => colorScale(d[0]))
        .attr("stroke-width", 0.5)
        .attr("rx", "2")
        .attr("ry", "2")
    svg.selectAll(".stacked-bar").on("mouseover", (e, d) => {
        //get year of the bar
        setHoverItem({ datum: { genre: d[0], movies: d[1].v, date: d3.select(e.target.parentNode).datum()[0] }, caller: "companion" });
        setHoverPos({ x: e.pageX, y: e.pageY });
        d3.select(e.target)
            .transition()
            .duration(10)
            .attr("fill", d3.color(colorScale(d[0])).brighter(1.5))
            .attr("stroke", d3.color(colorScale(d[0])).brighter(1))
            .attr("stroke-width", 2.5);
    })
        .on("mousemove", (e, d) => {
            setHoverPos({ x: e.pageX, y: e.pageY });
        })
        .on("mouseout", (e, d) => {
            d3.select(e.target).transition().duration(100)
                .attr("fill", colorScale(d[0]))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            setHoverItem({ datum: null, caller: "companion" });
            d3.select(e.target).attr("stroke", "black");
        });

    //selecte plot title
    let title = svg.select(".plot-title");
    //set title 
    title.text("Number of Oscar Wins and Nominations for Genres over the Years")
        .attr("x", bounds.innerWidth / 2 + margin.left)
        .attr("y", margin.top + bounds.innerHeight * 0.06)
        .attr("text-anchor", "middle")
        .attr("font-size", "1.2em")
        .attr("font-weight", "bold")
        .attr("fill", "white");
}

function drawStackedLineChart(svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos, viewMode) {
    //sum budget of the movies and group them by studio for each data month
    let studioBudgetByYear = d3.rollups(data, v => d3.sum(v, d => d.budget), d => d.year, d => d.company);
    studioBudgetByYear = studioBudgetByYear.map((r) => {
        let m = new Map();
        m.set("year", r[0]);
        r[1].forEach(([key, value]) => {
            m.set(key, value);
        });
        return m;
    });

    //Find avg budget for each studio over all years
    let totalBudgetByStudio = new Map();
    studioBudgetByYear.forEach((d) => {
        d.forEach((v, k) => {
            if (k != "year") {
                if (totalBudgetByStudio.has(k)) {
                    totalBudgetByStudio.set(k, totalBudgetByStudio.get(k) + v);
                } else {
                    totalBudgetByStudio.set(k, v);
                }
            }
        });
    });
    //sort avgBudgetByStudio by budget
    totalBudgetByStudio = ([...totalBudgetByStudio.entries()].sort((a, b) => b[1] - a[1]));
    //get top n studios
    const TOP_N = 15;
    let topNStudios = d3.group(totalBudgetByStudio.slice(0, TOP_N), d => d[0]);
    //accumilate the studios that are not in the top TOP_N into "Other" for all years
    let otherStudios = [];
    for (let d of studioBudgetByYear) {
        let sum = 0;
        d.forEach((v, k) => {
            if (!topNStudios.has(k) && k != "year") {
                sum += v;
                d.delete(k);
            }
        });
        d.set("Other", sum);
    }

    let allStudios = ["Other", ...topNStudios.keys()];
    studioBudgetByYear.forEach((d) => {
        allStudios.forEach((s) => {
            if (!d.has(s)) {
                d.set(s, 0);
            }
        });
    });
    //convert studioBudgetByYear to objects
    studioBudgetByYear = studioBudgetByYear.map((d) => {
        let obj = {};
        d.forEach((v, k) => {
            obj[k] = v;
        });
        return obj;
    });

    let stackedStudioBudgetByYear = d3.stack().keys(allStudios)
    stackedStudioBudgetByYear = stackedStudioBudgetByYear(studioBudgetByYear);
    //create a categorical color scale for every studio from the top 25
    let colorScale = d3.scaleOrdinal([...d3.schemeTableau10, "#17bed0",
                "#292929", "#4F4F4F", "#949494", "#C4C4C4", "#CCCCCC", "#E8E8E8", "#FAFAFA"]).domain(['Other', allStudios]);

    //get maximum budget overall filter out entry with key 'year'
    let maxBudget = d3.max(stackedStudioBudgetByYear, d => d3.max(d, d => d[1]));

    //create axes scales
    const xScale = d3.scaleLinear().domain(d3.extent(data, d => d.year)).rangeRound([0, bounds.innerWidth]);
    const yScale = d3.scaleLinear().domain([0, maxBudget]).rangeRound([bounds.innerHeight, 0]).nice();

    //create axes
    xAxisObj = d3.axisBottom(xScale).tickValues(d3.range(1980, 2021, 5)).tickFormat(d3.format("d"));
    yAxisObj = d3.axisLeft(yScale).tickFormat(d3.format("$.0s"));
    svg.select(".x-axis").call(xAxisObj)
        .attr("transform", `translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
        .classed("plot-axis", true);
    svg.select(".y-axis").call(yAxisObj)
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .classed("plot-axis", true);

    var areaGen = d3.area()
        .x((d) => xScale(d.data.year))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]));

    d3.select(".lines")
        //.attr("transform", `translate(${margin.left}, ${margin.top})`)
        .selectAll("path")
        .data(stackedStudioBudgetByYear)
        .join(
            enter => enter.append("path")
            .attr("transform", `translate(${margin.left} ${margin.top + bounds.innerHeight}) scale(1,0)`)
            .transition().duration(1000)
            .attr("transform", `translate(${margin.left} ${margin.top}) scale(1,1)`),
            update => update,
            exit => exit.remove()
        )
        .attr("d", areaGen)
        .attr("fill", (d) => colorScale(d.key))
        .attr("fill-opacity", '0.7')
        .attr("stroke", (d) => colorScale(d.key))
        .attr("stroke-opacity", 1) 
        .attr("stroke-width", 2) 
        .attr("stroke-linejoin", "round") 
        .attr("stroke-linecap", "round");

    //selecte plot title
    let title = svg.select(".plot-title");
    //set title 
    title.text(`Stacked Budget of Top ${TOP_N} Studios`)
        .attr("x", bounds.innerWidth / 2 + margin.left)
        .attr("y", margin.top + bounds.innerHeight * 0.06)
        .attr("text-anchor", "middle")
        .attr("font-size", "1.2em")
        .attr("font-weight", "bold")
        .attr("fill", "white");

    //create legend to show which color corresponds to which studio place it top left
    let legend = svg.select(".legend")
        .attr("transform", `translate(${margin.left + margin.left/3}, ${margin.top * 2})`);
        //add transparent reectangle with rounded borders to make legend stand out
    legend.append("rect")
        .attr("x", -margin.left/10)
        .attr("y", -margin.top/3)
        .attr("width", 170)
        .attr("height", 17 * 10.5)
        .attr("fill", "white")
        .attr("fill-opacity", 0.1)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5)
        .attr("rx", 5)
        .attr("ry", 5);

    //create legend items
    let legendItems = legend.selectAll(".legend-item")
        .data(allStudios)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 10.8})`);
    //create legend item rectangles 
    legendItems.append("rect")
        .attr("width", 6)
        .attr("height", 6)
        .attr("fill", (d) => colorScale(d));
    //create legend item text
    legendItems.append("text")
        .attr("x", 10)
        .attr("y", 6)
        .attr("font-size", "0.7em")
        .attr("fill", "white")
        .text((d) => d);

    //attach mouse listener to legend items make the non selected studios transparent
    legendItems.on("mouseover", (e, d) => {
        //make other legend items transparent
        legendItems.filter((s) => s != d).attr("fill-opacity", 0.2);
        //make affiliated area brighter
        svg.select(".lines").selectAll("path")
            .filter((s) => s.key == d )
            .attr("fill", (d) => d3.color(colorScale(d.key)).brighter(1.5))
    });
    legendItems.on("mouseout", (e, d) => {
        legendItems.attr("fill-opacity", 1);
        //make affiliated area original color
        svg.select(".lines").selectAll("path")
            //reset the fill colors
            .attr("fill", (d) => colorScale(d.key))

    });
    
    //attach mousehover listener to stacked areas
    svg.select(".lines").selectAll("path")
        .on("mouseover", function (event, d) {
            //make are more bright and set opacity of non-corresponding legend item to 0.2
            d3.select(event.target).attr("fill", d3.color(colorScale(d.key)).brighter(1.5))
            d3.selectAll(".legend-item").filter((e) => e != d.key).attr("opacity", 0.2);
    })
        .on("mouseout", function (event, d) {
            //set area back to original color and set opacity of non-corresponding legend item to 1
            d3.select(event.target).attr("fill", colorScale(d.key))
            d3.selectAll(".legend-item").attr("opacity", 1);
    });

    svg.on("mousemove", (e, d) => {
        //get mouse position
        let [mx, my] = d3.pointer(e);
        //draw line on mouse x position verrtical line
        d3.select(".mouse-line-group")
            .selectAll("line")
            .data([mx])
            .join("line")
            .attr("x1", d=> d-5)
            .attr("x2", d=>d-5)
            .attr("y1", margin.top)
            .attr("y2", margin.top + bounds.innerHeight)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            //.attr("stroke-opacity", 1)
            .attr("stroke-dasharray", "5,2");
            //get year of mouse position
        let year = xScale.invert(mx);
        //round year to nearest integer
        year = Math.round(year);
        //get year index in data
        //TODO:render a text that shows the year and the budgets of the studios
        let text = svg.select(".mouse-text-group")
            .selectAll("text")
            .data([year])
            .join("text")
            .attr("x", mx)
            .attr("y", margin.top + bounds.innerHeight * 0.06)
            .attr("font-size", "0.8em")
            .attr("fill", "white")
            .attr("text-anchor", "middle")
            .text((d) => {
                let text = d;
                //get data for year
                let data = allData.filter((e) => e.year == d);
                //add budget for each studio
                data.forEach((e) => {
                    text += `\n${e.studio}: ${e.budget}`;
                })
                return text;
            });
        //TODO: make the legend disappear
    });

    svg.on("mouseover", (e, d) => {
        //get mouse position
        let [mx, my] = d3.pointer(e);
        //draw line on mouse x position verrtical line
        d3.select(".mouse-line-group")
            .selectAll("line")
            .attr("stroke-opacity", 1);
    });
    svg.on("mouseout", (e, d) => {
        d3.select(".mouse-line-group")
            .selectAll("line")
            .attr("stroke-opacity", 0);
    });
}

export default function CCompanionPlot({ data }) {
    let test = false;
    const margin = { top: 20, right: 35, bottom: 20, left: (test ? 35 : 45) };
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);
    const [legendImage, setLegendImage] = useState("");


    let [setHoverItem, setHoverPos, xAxis, yAxis, gScales, viewMode] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
        state.scatterXAxis,
        state.scatterYAxis,
        state.scales,
        state.viewMode
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

        switch (viewMode) {
            case "ratings_oscars":
                clearPlot(svg);
                drawStackedBarChart(svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos);
                break;
            case "movie_economy":
                //svg.select(".bars").selectAll("*").remove();
                clearPlot(svg);
                drawStackedLineChart(svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos, viewMode);
                break;
            case "cost_quality":
                clearPlot(svg);
                break;
        }


    }, [bounds, scales, yAxis, xAxis, data, viewMode]);

    return (
        <div id="companion-plot" className="relative w-full h-full bg-slate-900" ref={target}>
            <svg ref={ref} className="w-full h-full">
                <defs>
                    <clipPath id="plot-clip">
                        <rect fill="white" x={margin.left} y={margin.top} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                <g style={{ clipPath: "url(#plot-clip)" }}>
                    <text className="plot-title" />
                    <g className="bars"></g>
                    <g className="lines"></g>
                    <g className="mouse-line-group"></g>
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
                <g className="legend"></g>
            </svg>
        </div>
    );
}