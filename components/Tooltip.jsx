import * as d3 from "d3";
import useGlobalState from "../hooks/useGlobalState";
import { FaImdb } from 'react-icons/fa';
import { SiRottentomatoes } from 'react-icons/si';
import { GiPopcorn, GiSandsOfTime } from 'react-icons/gi';
import { useEffect, useState } from "react";

function makeTooltip(
    d,
    caller,
    data,
    setHoveredExpandedGroup,
    hoverDetailTimeout,
    setHoverDetailTimeout,
    clearHoverDetail,
    viewSize,
    hoverListItem,
    setHoverListItem,
    searchFilter,
    accent)
{
    switch (caller) {
        case "scatterplot":
            return ScatterplotToolTip(d);
        case "scatterplot_group":
            return ScatterplotGroupToolTip(d);
        case "scatterplot_group_expanded":
            return ScatterplotGroupExpandedToolTip(
                d,
                data,
                setHoveredExpandedGroup,
                hoverDetailTimeout,
                setHoverDetailTimeout,
                clearHoverDetail,
                viewSize,
                hoverListItem,
                setHoverListItem,
                searchFilter);
        case "heatmap":
            return HeatmapToolTip(d);
        case "companion-oscars":
            return CompanionOscarsToolTip(d, accent);
        case "companion-heatmap":
            return CompanionHeatmapToolTip(d);
    }
}

function ScatterplotGroupToolTip(d) {
    return (
        <div className="pointer-events-none tooltip p-1">
            <div className="font-bold text-lightest">{d.movies.length} movies...</div>
            <div className="font-bold text-light">Hover to view all</div>
        </div>
    );
}

function ScatterplotGroupExpandedToolTip(
    d,
    data,
    setHoveredExpandedGroup,
    hoverDetailTimeout,
    setHoverDetailTimeout,
    clearHoverDetail,
    viewSize,
    hoverListItem,
    setHoverListItem,
    searchFilter)
{
    //fetch the movies with the idx from d.movies from the data and include them in the tooltip as a list.
    return (
        <div className="tooltip rounded">
            <div className="tooltip-body text-black">
                <div className="grid grid-cols-2 rounded-sm">
                    {data.map((movie, idx) => {
                        if (d.movies.includes(idx)) {
                            return <div key={`ScatterplotGroupExpandedToolTip-${idx}`}
                                onMouseEnter={(e) => {
                                    const r = e.target.getBoundingClientRect();
                                    let pos = {};
                                    if (r.y < viewSize.h / 2) {
                                        pos.top = r.y + r.height;
                                    } else {
                                        pos.bottom = viewSize.h - r.y;
                                    }
                                    if (r.x < viewSize.w / 2) {
                                        pos.left = r.x;
                                    } else {
                                        pos.right = viewSize.w - r.x;
                                    }
                                    setHoverListItem({ movie, pos });
                                }}
                                onMouseLeave={(e) => {
                                    setHoverListItem(null);
                                }}
                                className={`select-none rounded-sm p-0.5 m-px
                                    text-xs font-bold hover:bg-accent hover:text-dark
                                    ${searchFilter.has(movie.idx) ? "bg-white text-dark" : "bg-mid2 text-light"}`} key={idx}>{movie.name} </div>;
                        }
                    })}
                </div>
            </div>
        </div>
    );
}


function ScatterplotToolTip(d) {
    const dateFormat = d3.timeFormat("%b %d, %Y");
    const dollarFormat = d3.format("$,.0f");
    const runtimeFormat = m => `${m / 60 | 0}h ${m % 60}m`;

    return (
        <div className="pointer-events-none tooltip p-1 text-light">
            <div className="font-bold text-white mb-1 text-lg">{d.name}</div>
            <div className="tooltip-body">
                <div className="tooltip-row">
                    <div className="tooltip-row-label">Released</div>
                    <div className="p-1 ml-1">{dateFormat(d.released)}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label">Country</div>
                    <div className="p-1 ml-1">{d.country}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label">Company</div>
                    <div className="p-1 ml-1">{d.company}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label">Budget</div>
                    <div className="p-1 ml-1">{dollarFormat(d.budget)}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label">Profit</div>
                    <div className="p-1 ml-1">{dollarFormat(d.profit)}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label">Revenue</div>
                    <div className="p-1 ml-1">{dollarFormat(d.gross)}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label relative">
                        <div className="text-light p-1 rounded absolute right-0 top-0">
                            <FaImdb size="1.5em" />
                        </div>
                        IMDB Score <span className="inline-block w-8"> </span>
                    </div>
                    <div className="p-1 ml-1">{d.score}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label relative">
                        <div className="text-light p-1 rounded absolute right-0 top-0">
                            <SiRottentomatoes size="1.5em" />
                        </div>
                        Tomatometer <span className="inline-block w-8"> </span>
                    </div>
                    <div className="p-1 ml-1">{d.tomatometer_rating}%</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label relative">
                        <div className="text-light p-1 rounded absolute right-0 top-0">
                            <SiRottentomatoes size="1.5em" />
                        </div>
                        Audience <span className="inline-block w-8"> </span>
                    </div>
                    <div className="p-1 ml-1">{d.audience_rating}%</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-row-label relative">
                        <div className="text-light p-1 rounded absolute right-0 top-0">
                            <GiSandsOfTime size="1.5em" />
                        </div>
                        Run Time <span className="inline-block w-8"> </span>
                    </div>
                    <div className="p-1 ml-1">{runtimeFormat(d.runtime)}</div>
                </div>
            </div>
        </div>
    );
}

function HeatmapToolTip(d) {
    const dateFormat = d3.timeFormat("%Y");
    const dollarFormat = d3.format("$,.0f");
    const runtimeFormat = m => `${m / 60 | 0}h ${m % 60 | 0}m`;
    const imdbFormat = d3.format(".1f");
    const tomatometerFormat = d3.format(".0f");

    //find the min and max values for data release date
    const minDate = d3.min(d, (d) => d.released);
    const maxDate = d3.max(d, (d) => d.released);
    //find average budget
    const avgBudget = d3.mean(d, (d) => d.budget);
    //find average runtime
    const avgRuntime = d3.mean(d, (d) => d.runtime);
    //find average score
    const avgScore = d3.mean(d, (d) => d.score);
    //find average tomatometer
    const avgTomatometer = d3.mean(d, (d) => d.tomatometer_rating);
    //find average audience
    const avgAudience = d3.mean(d, (d) => d.audience_rating);
    return (
        <div className={`rounded p-1 text-sm text-light`}>
            <div className="pointer-events-none tooltip rounded-sm">
                <div className="font-bold text-light"># of movies: <span className="text-xl text-lightest">{d.length}</span></div>
                <div className="tooltip-body">
                    <div className="tooltip-row">
                        <div className="tooltip-row-label">Years</div>
                        <div className="tooltip-row-value">{dateFormat(minDate)}-{dateFormat(maxDate)}</div>
                    </div>
                    <div className="tooltip-row">
                        <div className="tooltip-row-label">Avg. Budget</div>
                        <div className="tooltip-row-value">{dollarFormat(avgBudget)}</div>
                    </div>
                    <div className="tooltip-row">
                        <div className="tooltip-row-label">Avg. IMDB Score</div>
                        <div className="tooltip-row-value">{imdbFormat(avgScore)}</div>
                    </div>
                    <div className="tooltip-row">
                        <div className="tooltip-row-label">Tomatometer</div>
                        <div className="tooltip-row-value">{tomatometerFormat(avgTomatometer)}%</div>
                    </div>
                    <div className="tooltip-row">
                        <div className="tooltip-row-label">Audience</div>
                        <div className="tooltip-row-value">{tomatometerFormat(avgAudience)}%</div>
                    </div>
                    <div className="tooltip-row">
                        <div className="tooltip-row-label">Avg. Run Time</div>
                        <div className="tooltip-row-value">{runtimeFormat(avgRuntime)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const OSCAR_INFO = {
    "winner": ["#fce603", "Won"],
    "nominee": ["#947b1b", "Nominated"],
    "best_picture_winner": ["#214ED3", "Won Best Picture"],
    "best_picture_nominee": ["#90A8EE", "Nominated for Best Picture"],
    "none": "#606060",
};

function CompanionOscarsToolTip(d, accent) {

    return (
        <div className="pointer-events-none tooltip">
            <div className="font-bold text-light">
                <span className="text-lg text-lightest">{d.movies.length} <span className="px-1 rounded text-dark" style={{backgroundColor: accent}}>{d.genre}</span>
                </span> movies were nominated for <span className="text-lg text-lightest">{d.date}</span> Oscars
            </div>
            <div className="tooltip-body">
                {d.movies.map((m, i) => (
                    <div className="tooltip-row rounded grid-col" key={`CompanionOscarsToolTip-${i}`} style={{
                        backgroundColor: OSCAR_INFO[m.oscar][0]
                    }}>
                        <div className="tooltip-row-label">{OSCAR_INFO[m.oscar][1]} <span className="font-bold">({m.wins}/{m.nominations})</span></div>
                        <div className="tooltip-row-value">{m.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CompanionHeatmapToolTip(d) {
    return (
        <div className="pointer-events-none tooltip">
            <div className="font-bold text-light"># of movies: <span className="text-xl text-lightest">{d.count}</span></div>
            <div className="tooltip-body">
            </div>
        </div>
    );
}



function positionTooltip({ x, y }, { w, h }) {
    let pos = {};
    if (x < w / 2) {
        pos.left = x;
    } else {
        pos.right = w - x;
    }
    if (y < h / 2) {
        pos.top = y;
    } else {
        pos.bottom = h - y;
    }
    return pos;
}

export default function CTooltip({ data }) {
    const [
        hoverItem,
        hoverPos,
        viewSize,
        setHoveredExpandedGroup,
        hoverDetailTimeout,
        setHoverDetailTimeout,
        searchFilter,
    ] = useGlobalState(state => [
        state.hoverItem,
        state.hoverPos,
        state.viewSize,
        state.setHoveredExpandedGroup,
        state.hoverDetailTimeout,
        state.setHoverDetailTimeout,
        state.searchFilter,
    ]);

    const [hoverListItem, setHoverListItem] = useState(null);

    useEffect(() => {
        if (hoverItem.datum == null) {
            setHoverListItem(null);
        }
    }, [hoverItem]);

    return (
        <>
            <div id="tooltip-container"
                className={`absolute text-sm p-1 bg-mid rounded ${hoverItem.datum ? "" : "hidden"} ${hoverItem.caller == "scatterplot_group_expanded" ? "" : "pointer-events-none"}`}
                style={positionTooltip(hoverPos, viewSize)}
                onMouseLeave={(e) => {
                    if (hoverItem.datum && hoverItem.caller == "scatterplot_group_expanded") {
                        // Set a new timeout for closing the group detail tooltip
                        setHoveredExpandedGroup(false);
                        if (hoverDetailTimeout) {
                            clearTimeout(hoverDetailTimeout);
                        }
                        setHoverDetailTimeout(setTimeout(() => {
                            hoverItem.clearHoverDetail();
                        }, 650));
                    }
                }}
                onMouseEnter={(e) => {
                    if (hoverItem.datum && hoverItem.caller == "scatterplot_group_expanded") {
                        // Clear the timeout for closing the group detail tooltip
                        setHoveredExpandedGroup(true);
                        clearTimeout(hoverDetailTimeout);
                        setHoverDetailTimeout(null);
                    }
                }}>
                {hoverItem.datum ? makeTooltip(
                    hoverItem.datum,
                    hoverItem.caller,
                    data,
                    setHoveredExpandedGroup,
                    hoverDetailTimeout,
                    setHoverDetailTimeout,
                    hoverItem.clearHoverDetail,
                    viewSize,
                    hoverListItem,
                    setHoverListItem,
                    searchFilter,
                    hoverItem.accent) : ""}
            </div>
            {hoverListItem &&
                <div
                    className={`pointer-events-none absolute bg-mid rounded p-1 text-sm`}
                    style={hoverListItem.pos} >
                    {ScatterplotToolTip(hoverListItem.movie)}
                </div>}
        </>
    );
}