import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import { useEffect, useRef, useState } from "react";
import useSize from "../hooks/useSize";
import useGlobalState from "../hooks/useGlobalState";
import copyScales from "../scripts/copyScales";
import CToggle from "./Toggle";
import { ramp, generateArrayMinMax } from "../scripts/createLegendImage";
import { exit } from "process";
import { selectAll } from "d3";

function drawStackedBarChart(svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos, brushRange, setTitleText, useNominations) {
    //filter movies with oscar wins
    let oscarData = data.filter(d => {
        return ((useNominations && d.oscar.includes("nominee")) || d.oscar.includes("winner"))
            && (brushRange === null || (d.year >= brushRange[0] && d.year <= brushRange[1]))
    });
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
            v.forEach(x => sum += useNominations ? x.nominations : x.wins);
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
    const yearsExtent = d3.extent(oscarDataByYear.keys());
    const nYears = yearsExtent[1] - yearsExtent[0];
    const tickSkip = Math.ceil(nYears / 12);
    xAxisObj = d3.axisBottom(xScale).tickValues([...oscarDataByYear.keys()].filter((d, i) => i % tickSkip == 0));
    yAxisObj = d3.axisLeft(yScale);
    svg.select(".x-axis").classed("plot-axis", true)
        .call(xAxisObj).attr("transform", `scale(0,1) translate(${margin.left}, ${bounds.innerHeight + margin.top})`)
        .attr("transform", `scale(1,1) translate(${margin.left}, ${bounds.innerHeight + margin.top})`);
    svg.select(".y-axis").classed("plot-axis", true)
        .call(yAxisObj).attr("transform", `scale(1,0) translate(${margin.left}, ${margin.top})`)
        .attr("transform", `scale(1,1) translate(${margin.left}, ${margin.top})`);

    //create a categorical color scale for every genre from oscarData
    let colorScale = d3.scaleOrdinal([...d3.schemeDark2, "#17bed0"]).domain([...new Set(data.map(d => d.genre))]);

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
        .classed("stacked-bar", true)
        .attr("x", 0)
        .attr("y", d => yScale(d[1].sum))
        .attr("width", xScale.bandwidth())
        .attr("height", d => yScale(0) - yScale(d[1].sum))
        .attr("fill", d => colorScale(d[0]))
        .attr("stroke-width", 0.5)
        .attr("rx", "2")
        .attr("ry", "2")
    
    // Stacked bar chart mouse handlers
    svg.selectAll(".stacked-bar")
        .on("mouseenter", (e, d) => {
            // Set tooltip hover item for genre group
            setHoverItem({
                datum: { genre: d[0], movies: d[1].v, date: d3.select(e.target.parentNode).datum()[0] },
                caller: "companion-oscars",
                accent: d3.color(colorScale(d[0])) });
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
        .on("mouseleave", (e, d) => {
            d3.select(e.target).transition().duration(100)
                .attr("fill", colorScale(d[0]))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            setHoverItem({ datum: null, caller: "companion-oscars" });
            d3.select(e.target).attr("stroke", "black");
        });

    setTitleText(`Number of Oscar Wins${useNominations ? " and Nominations" : ""} for Genres ${yearsExtent[0]} - ${yearsExtent[1]}`);
}

function drawStackedLineChart(svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos, viewMode, toggleOtherStudios, brushRange, setTitleText, yAxis, cpiData, adjustInflation) {
    //sum budget of the movies and group them by studio for each data month
    let studioBudgetByYear = d3.rollups(data, v => d3.sum(v, d => d[yAxis]), d => d.year, d => d.company).filter(d =>
        (brushRange === null || (d[0] >= brushRange[0] && d[0] <= brushRange[1]))
    );
    studioBudgetByYear = studioBudgetByYear.map((r) => {
        let m = new Map(r[1]);
        m.set("year", r[0]);
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
    let totalBudgetByStudioSorted = ([...totalBudgetByStudio.entries()].sort((a, b) => b[1] - a[1]));
    //get top n studios
    const TOP_N = 15;
    let topNStudios = d3.group(totalBudgetByStudioSorted.slice(0, TOP_N), d => d[0]);
    //accumilate the studios that are not in the top TOP_N into "Other" for all years
    for (let d of studioBudgetByYear) {
        let sum = 0;
        d.forEach((v, k) => {
            if (!topNStudios.has(k) && k != "year") {
                sum += v;
                d.delete(k);
            }
        });
        if (toggleOtherStudios)
            d.set("Other", sum);
    }

    let allStudios = toggleOtherStudios ? ["Other", ...topNStudios.keys()] : [...topNStudios.keys()];
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
    //create a categorical color scale for every studio from the top 25\
    let colorScale = d3.scaleOrdinal(
        ['#32964d',
        '#21f0b6',
        '#aec1b8',
        '#ace1b7',
        '#0a7fb2',
        '#9ab9f9',
        '#82269b',
        '#fa79f5',
        '#997c97',
        '#20d8fd',
        '#135ac2',
        '#faafe3',
        '#a20655',
        '#bae342',
        '#8b6033',
        '#fe8f06',
        '#7d0af6',
        '#fb8c77',
        '#d02023',
        '#d8c3b4',
        '#738a69',
        '#67f059',
        '#e0c645'
            //...d3.schemeSpectral[10], ...d3.schemePRGn[7]
        ])
        .domain(/*toggleOtherStudios ?*/['Other', allStudios] /*: allStudios*/);

    //get maximum budget overall filter out entry with key 'year'
    let maxBudget = d3.max(stackedStudioBudgetByYear, d => d3.max(d, d => d[1]));

    //create axes scales
    const yearsExtent = d3.extent(studioBudgetByYear, d => d.year);
    const xScale = d3.scaleLinear().domain(yearsExtent).rangeRound([0, bounds.innerWidth]);
    const yScale = d3.scaleLinear().domain([0, maxBudget]).rangeRound([bounds.innerHeight, 0]).nice();

    //create axes
    const tickSkip = Math.ceil((yearsExtent[1] - yearsExtent[0]) / 12);
    xAxisObj = d3.axisBottom(xScale).tickValues(d3.range(...yearsExtent, tickSkip)).tickFormat(d3.format("d"));
    yAxisObj = d3.axisLeft(yScale).tickFormat(d3.format("$.0s"));
    svg.select(".x-axis").classed("plot-axis", true)
        .call(xAxisObj)
        .attr("transform", `scale(1,1) translate(${margin.left}, ${bounds.innerHeight + margin.top})`);
    svg.select(".y-axis").classed("plot-axis", true)
        .call(yAxisObj)
        .attr("transform", `scale(1,1) translate(${margin.left}, ${margin.top})`);

    var areaGen = d3.area()
        .x((d) => xScale(d.data.year))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]));

    d3.select(".lines")
        .selectAll("path")
        .data(stackedStudioBudgetByYear)
        .join(
            enter => enter.append("path")
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
    //Map that maps studio names to their corresponding title string
    const axisTitles = {
        "budget": "Budget",
        "gross": "Revenue",
        "profit": "Profit",
        "budget_adj": "Budget (Adjusted)",
        "gross_adj": "Revenue (Adjusted)",
        "profit_adj": "Profit (Adjusted)",

    };
    setTitleText(toggleOtherStudios ?
        `Total ${axisTitles[yAxis]} of Top Studios ${yearsExtent[0]} - ${yearsExtent[1]}` :
        `Total ${axisTitles[yAxis]} of Top ${TOP_N} Studios ${yearsExtent[0]} - ${yearsExtent[1]}`);

    //create legend to show which color corresponds to which studio place it top left
    let legend = svg.select(".legend")
        .attr("transform", `translate(${margin.left + margin.left / 3}, ${margin.top + 10})`);
    legend.select(".background")
        .attr('height', 12*TOP_N + 2)

    //create legend items
    let legendItems = legend.selectAll(".legend-item")
        .data(allStudios)
        .join((enter) => {
            let g = enter.append("g").classed("legend-item", true)
                .attr("transform", (d, i) => `translate(0, ${i * 10.5})`);
            g.append("rect")
                .attr("width", 10)
                .attr("height", 6)
                .attr("fill", (d) => colorScale(d));
            g.append("text")
                .attr("x", 10)
                .attr("y", 6)
                .attr("font-size", "0.7em")
                .attr("fill", "white")
                .text((d) => d);
            g.append("text")
                .classed("legend-item-value", true)
                .attr("x", 125)
                .attr("y", 6)
                .attr("font-size", "0.7em")
                .attr("fill", "white");
            return g;
        }, update => {
            let g = update.classed("legend-item", true).attr("transform", (d, i) => `translate(0, ${i * 10.5})`);
            g.select('rect').attr("fill", (d) => colorScale(d));
            g.select('text').text((d) => d);
            return g;
        }, exit => {
            exit.remove()
        });

    //attach mousehover listener to stacked areas
    svg.select(".lines").selectAll("path")
        .on("mouseover", function (event, d) {
            //make are more bright and set opacity of non-corresponding legend item to 0.2
            d3.select(event.target).attr("fill", "white")
            d3.selectAll(".legend-item").filter((e) => e != d.key).attr("opacity", 0.2);
        })
        .on("mouseleave", function (event, d) {
            //set area back to original color and set opacity of non-corresponding legend item to 1
            d3.select(event.target).attr("fill", colorScale(d.key))
            d3.selectAll(".legend-item").attr("opacity", 1);
        });
    //go over studioBudgetByYear create a dictionary for each year insert studio name and budget

    let studioBudgetByYearDict = {};
    studioBudgetByYear.forEach((d) => {
        if (studioBudgetByYearDict[d.year] == undefined) {
            studioBudgetByYearDict[d.year] = {};
        }
        //go over all the studios from all studios
        allStudios.forEach((studio) => {
            //if studio is in the current year add it to the dictionary
            if (d[studio] != undefined) {
                studioBudgetByYearDict[d.year][studio] = d[studio];
            }
        });
    });

    const dollarFormat = d3.format("$,.3s");

    svg.on("mousemove", (e, d) => {
        //get mouse position
        let [mx, my] = d3.pointer(e);
        //draw line on mouse x position verrtical line
        d3.select(".mouse-line-group")
            .selectAll("line")
            .data([mx])
            .join("line")
            .attr("x1", d => d - 5)
            .attr("x2", d => d - 5)
            .attr("y1", margin.top)
            .attr("y2", margin.top + bounds.innerHeight)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            //.attr("stroke-opacity", 1)
            .attr("stroke-dasharray", "5,2");
        //get year of mouse position
        let year = xScale.invert(mx - margin.left);
        if (year < yearsExtent[0] || year > yearsExtent[1]) {
            return;
        }
        //round year to nearest integer
        year = Math.round(year);
        let legend = svg.select(".legend")
            .attr("transform", `translate(${mx > bounds.innerWidth / 2 ? mx - 180 : mx + 10}, ${margin.top + 10})`);
        legend.selectAll(".legend-item-value")
            .text((d) => studioBudgetByYearDict[year][d] ? dollarFormat(studioBudgetByYearDict[year][d]) : "");
    });

    svg.on("mouseover", (e, d) => {
        //get mouse position
        let [mx, my] = d3.pointer(e);
        //draw line on mouse x position verrtical line
        d3.select(".mouse-line-group")
            .selectAll("line")
            .attr("stroke-opacity", 1);
    });
    svg.on("mouseleave", (e, d) => {
        d3.select(".mouse-line-group")
            .selectAll("line")
            .attr("stroke-opacity", 0);
        d3.select(".legend")
            .attr("transform", `translate(${margin.left + margin.left / 3}, ${margin.top + 10})`);
        legend.selectAll(".legend-item-value")
            .text((d) => '');
    });
}

function drawDecadeHeatmap(svg, data, bounds, margin, setHoverItem, setHoverPos, setLegendImage, setTitleText, brushFilter) {
    const CLUSTER_SIZE = 5;

    //filter data to only include movies that are in the brush filter
    data = brushFilter.length > 0 ? brushFilter.map(i => data[i]) : data;
    //create a array of all decades from 1980 to 2020
    let decades = d3.range(1980, 2022, CLUSTER_SIZE);
    //get the number of movies per decade
    let decadeCount = d3.rollup(data, (v) => v.length, (d) => d.year - d.year % CLUSTER_SIZE);
    //push in the empty decades with 0 movies
    decades.forEach((d) => {
        if (!decadeCount.has(d)) {
            decadeCount.set(d, 0);
        }
    });
    //sort the decades
    decadeCount = new Map([...decadeCount.entries()].sort((a, b) => a[0] - b[0]));

    let max = d3.max(decadeCount, (d) => d[1]);
    let colorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, max]);

    //define the x scale banded
    let xScale = d3.scaleBand().domain(decades).range([margin.left, bounds.innerWidth + margin.right]);

    //clear axes
    svg.select(".x-axis").selectAll("*").remove();
    svg.select(".y-axis").selectAll("*").remove();

    let rects = svg.select(".rects")
        .selectAll("g")
        .data(decadeCount);

    rects.join(
        enter => {
            let g = enter.append("g").attr("transform", (d) => `translate(${xScale(d[0])}, ${bounds.innerHeight / 3})`);
            g.append("text")
                .attr("transform", `translate(${xScale.bandwidth() / 2}, ${bounds.innerHeight / 2}) rotate(-45)`)
                .attr("text-anchor", "middle")
                .attr("font-size", "0.8em")
                .attr("font-weight", "bold")
                .attr("fill", "white")
                .text((d) => d[0])
                .attr("opacity", 1);
            g.append("rect")
                .attr("width", xScale.bandwidth())
                .attr("height", bounds.innerHeight / 3)
                .attr("fill", (d) => colorScale(d[1]))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.5)
                .attr("rx", 5)
                .attr("ry", 5)
            return g;
        },
        update => {
            update.attr("transform", (d) => `translate(${xScale(d[0])}, ${bounds.innerHeight / 3})`);
            update.select("text").attr("transform", `translate(${xScale.bandwidth() / 2}, ${bounds.innerHeight / 2}) rotate(-45)`);
            update.select("rect")
                .attr("width", xScale.bandwidth())
                .attr("height", bounds.innerHeight / 3)
                .attr("fill", (d) => colorScale(d[1]))
                .on("mouseover", (e, d) => {
                    setHoverItem({ datum: { count: d[1]}, caller: "companion-heatmap" });
                    setHoverPos({ x: e.pageX, y: e.pageY });
                    d3.select(e.target)
                        .transition()
                        .duration(10)
                        .attr("fill", d3.color(colorScale(d[1])).brighter(1.5))
                        .attr("stroke-width", 2.5);
                })
                .on("mousemove", (e, d) => {
                    setHoverPos({ x: e.pageX, y: e.pageY });
                })
                .on("mouseleave", (e, d) => {
                    d3.select(e.target).transition().duration(100)
                        .attr("fill", colorScale(d[1]))
                        .attr("stroke", "black")
                        .attr("stroke-width", 1);
                    setHoverItem({ datum: null, caller: "companion-heatmap" });
                    d3.select(e.target).attr("stroke", "black");
                });
            return update;
        },
        exit => exit.remove()
    );

    //draw legend
    setLegendImage(ramp(colorScale, false).toDataURL());
    svg.select(".legend-ticks")
        .selectAll("text")
        .data(generateArrayMinMax(0, max, 4))
        .join("text")
        .text((d) => d)

    svg.on("mousemove", null);
    svg.on("mouseenter", null);
    svg.on("mouseleave", null);

    //Set the title text
    setTitleText(`Distribution of ${brushFilter.length > 0 ? "Selected" : ""} Movies for every ${CLUSTER_SIZE} Years`);
}


export default function CCompanionPlot({ data }) {
    const [margin, setMargin] = useState({ top: 20, right: 35, bottom: 20, left: 45 });
    const [bounds, setBounds] = useState({ width: 800, height: 800, innerWidth: 800, innerHeight: 800 });
    const target = useRef(null);
    const size = useSize(target);
    const [legendImage, setLegendImage] = useState("");
    const [titleText, setTitleText] = useState("");
    const titleRef = useRef();
    const titleSize = useSize(titleRef);
    const [useNominations, setUseNominations] = useState(!~!false);

    let [setHoverItem,
        setHoverPos,
        xAxis,
        yAxis,
        gScales,
        viewMode,
        toggleOtherStudios,
        setToggleOtherStudios,
        brushRange,
        brushFilter,
        cpiData,
        adjustInflation,
        setAdjustInflation
    ] = useGlobalState(state => [
        state.setHoverItem,
        state.setHoverPos,
        state.scatterXAxis,
        state.scatterYAxis,
        state.scales,
        state.viewMode,
        state.companionPlotShowOtherStudios,
        state.setCompanionPlotShowOtherStudios,
        state.brushRange,
        state.brushFilter,
        state.cpiData,
        state.adjustInflation,
        state.setAdjustInflation
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
    }, [size, margin]);
    useEffect(() => {
        setMargin({ top: titleRef.current.getBoundingClientRect().height, right: 35, bottom: 20, left: 45 });
    }, [titleSize]);

    // Render chart function
    const ref = useD3(svg => {
        if (!gScales) {
            return;
        } else if (!scales) {
            scales = copyScales(gScales);
        }
        switch (viewMode) {
            case "ratings_oscars":
                drawStackedBarChart(
                    svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos,
                    brushRange, setTitleText, useNominations);
                break;
            case "movie_economy":
                drawStackedLineChart(
                    svg, data, bounds, margin, xAxisObj, yAxisObj, setHoverItem, setHoverPos,
                    viewMode, toggleOtherStudios, brushRange, setTitleText, yAxis, cpiData, adjustInflation);
                break;
            case "cost_quality":
                drawDecadeHeatmap(svg, data, bounds, margin, setHoverItem, setHoverPos, setLegendImage, setTitleText, brushFilter);
                break;
        }
    }, [bounds, scales, yAxis, xAxis, data, viewMode, toggleOtherStudios, brushRange, brushFilter, useNominations, adjustInflation]);

    return (
        <div id="companion-plot" className="relative w-full h-full" ref={target}>
            {viewMode == "movie_economy" &&
                <>
                    <div className="absolute left-14 z-50 pl-1 text-white bg-dark rounded"
                        style={{top: margin.top + 190}}>
                        <CToggle handler={v => setToggleOtherStudios(v)} icon={["check_box_outline_blank", "select_check_box"]} label="Show Others" initValue={toggleOtherStudios}></CToggle>
                    </div>
                </>
            }
            <svg ref={ref} width={bounds.width} height={bounds.height} className="absolute top-0 left-0">
                <defs>
                    <clipPath id="plot-clip">
                        <rect fill="white" x={margin.left} y={margin.top} width={bounds.innerWidth} height={bounds.innerHeight} />
                    </clipPath>
                </defs>
                <g>
                    {viewMode == "ratings_oscars" && <g className="bars"></g>}
                    {viewMode == "movie_economy" && <><g className="lines" style={{ clipPath: "url(#plot-clip)" }}></g>
                        <g className="mouse-line-group pointer-events-none"></g>
                        <g className="legend pointer-events-none">
                            <rect className="background" x={-margin.left / 10} y={-margin.top / 3}
                                width="170" height="130" fillOpacity={0.7}
                                strokeWidth="1" strokeOpacity="0.5"
                                rx={5}></rect>
                        </g>
                    </>}
                    {viewMode == "cost_quality" &&
                        <>
                            <g className="rects"></g>
                            <g className="legend" transform={`translate(${bounds.width - margin.right / 3},${bounds.height - margin.bottom}) rotate(-90 0,0)`}>
                                <image width={bounds.innerHeight} height={margin.right / 3} preserveAspectRatio="none" xlinkHref={legendImage}></image>
                                <g className="legend-ticks">
                                    <text x={margin.bottom - margin.top} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                                    <line x1={0} y1={0} x2={0} y2={margin.right / 3} stroke="white" strokeWidth={2} />

                                    <text x={(bounds.innerHeight) / 3} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                                    <line x1={(bounds.innerHeight) / 3} y1={0} x2={(bounds.innerHeight) / 3} y2={margin.right / 3} stroke="white" strokeWidth={2} />

                                    <text x={(bounds.innerHeight) * 2 / 3} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                                    <line x1={(bounds.innerHeight) * 2 / 3} y1={0} x2={(bounds.innerHeight) * 2 / 3} y2={margin.right / 3} stroke="white" strokeWidth={2} />

                                    <text x={(bounds.innerHeight)} y={-margin.right / 2} textAnchor="middle" dominantBaseline="hanging" fill="white">0</text>
                                    <line x1={(bounds.innerHeight)} y1={0} x2={(bounds.innerHeight)} y2={margin.right / 3} stroke="white" strokeWidth={2} />
                                </g>
                            </g>
                        </>}
                </g>
                <g className="x-axis"></g>
                <g className="y-axis"></g>
            </svg>
            {viewMode == "ratings_oscars" && (<div className="absolute left-12 top-4 text-white">
                <CToggle icon={["check_box_outline_blank", "select_check_box"]} label="Include Nominations" handler={setUseNominations} initValue={useNominations} />
            </div>)}
            <p ref={titleRef} className="text-light text-xl text-center px-1 w-full">{titleText}</p>
        </div>
    );
}