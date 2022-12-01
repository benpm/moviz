import * as d3 from "d3";
import useGlobalState from "../hooks/useGlobalState";
import { FaImdb } from 'react-icons/fa';
import { SiRottentomatoes } from 'react-icons/si';
import {GiPopcorn, GiSandsOfTime} from 'react-icons/gi';

function makeTooltip(d, caller) {
    switch (caller) {
        case "scatterplot":
            return ScatterplotToolTip(d);
        case "scatterplot_group":
            return ScatterplotGroupToolTip(d);
        case "heatmap":
            return HeatmapToolTip(d);
        case "companion":
            return CompanionToolTip(d);
    }
}

function ScatterplotGroupToolTip(d) {
    return (
        <div className="tooltip bg-navbar">
            <div className="font-bold text-lightest">{d.movies.length} films</div>
        </div>
    );
}

function ScatterplotToolTip(d) {
    const dateFormat = d3.timeFormat("%b %d, %Y");
    const dollarFormat = d3.format("$,.0f");
    const runtimeFormat = m => `${m / 60 | 0}h ${m % 60}m`;

    return (
        <div className="tooltip bg-navbar">
            <div className="font-bold text-lightest">{d.name}</div>
            <div className="tooltip-body bg-navbar text-dark">
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Released:</div>
                    <div className="p-1">{dateFormat(d.released)}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Country:</div>
                    <div className="p-1">{d.country}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Company:</div>
                    <div className="p-1">{d.company}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Budget:</div>
                    <div className="p-1">{dollarFormat(d.budget)}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Profit:</div>
                    <div className="p-1">{dollarFormat(d.profit)}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Revenue:</div>
                    <div className="p-1">{dollarFormat(d.gross)}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm"><div className="inline-block pr-1"><FaImdb/></div>IMDB Score:</div>
                    <div className="p-1">{d.score}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm"><div className="inline-block pr-1"><SiRottentomatoes/></div>Tomatometer:</div>
                    <div className="p-1">{d.tomatometer_rating}%</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm"><div className="inline-block pr-1"><GiPopcorn/></div>Audience:</div>
                    <div className="p-1">{d.audience_rating}%</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm"><div className="inline-block pr-1"><GiSandsOfTime/></div>Run Time:</div>
                    <div className="p-1">{runtimeFormat(d.runtime)}</div>
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
        <div className="tooltip bg-navbar">
            <div className="font-bold text-light"># of movies: <span className="text-xl text-lightest">{d.length}</span></div>
            <div className="tooltip-body">
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Years:</div>
                    <div className="p-1">{dateFormat(minDate)}-{dateFormat(maxDate)}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Avg. Budget:</div>
                    <div className="p-1">{dollarFormat(avgBudget)}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Avg. IMDB Score:</div>
                    <div className="p-1">{imdbFormat(avgScore)}</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Tomatometer:</div>
                    <div className="p-1">{tomatometerFormat(avgTomatometer)}%</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Audience:</div>
                    <div className="p-1">{tomatometerFormat(avgAudience)}%</div>
                </div>
                <div className="grid grid-cols-2 bg-mid rounded-sm m-1">
                    <div className="p-1 bg-accent-dark rounded-sm">Avg. Run Time:</div>
                    <div className="p-1">{runtimeFormat(avgRuntime)}</div>
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

function CompanionToolTip(d) {
    const dateFormat = d3.timeFormat("%Y");
    const dollarFormat = d3.format("$,.0f");
    const runtimeFormat = m => `${m / 60 | 0}h ${m % 60}m`;

    return (
        <div className="tooltip bg-navbar">
            <div className="font-bold text-light"> <span className="text-xl text-lightest">{d.movies.length} {d.genre}
            </span> movies were nominated for <span className="text-xl text-lightest">{d.date}</span> Oscars</div>
            <div className="tooltip-body">
                {d.movies.map((m, i) => (
                    <div className="grid grid-cols-2 bg-mid rounded-sm m-1"style={{
                        backgroundColor: OSCAR_INFO[m.oscar][0]
                      }}>
                        <div className="p-1 bg-mid rounded-sm" style={{fontWeight:"bold"}}>{m.name}</div>
                        <div className="p-1" style={{fontWeight:"bold"}}>{OSCAR_INFO[m.oscar][1]} ({m.wins} wins) ({m.nominations} noms)</div>
                    </div>
                ))}
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

export default function CTooltip() {
    const [hoverItem, hoverPos, viewSize] = useGlobalState(state => [
        state.hoverItem, state.hoverPos, state.viewSize
    ]);

    return (
        <div
            className={`absolute bg-dark rounded p-2 text-sm text-gray-800 pointer-events-none
                ${hoverItem.datum ? "" : "hidden"}`}
            style={positionTooltip(hoverPos, viewSize)} >
            {hoverItem.datum ? makeTooltip(hoverItem.datum, hoverItem.caller) : ""}
        </div>
    );
}