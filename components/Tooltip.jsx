import * as d3 from "d3";
import useGlobalState from "../hooks/useGlobalState";

function makeTooltip(d) {
    const dateFormat = d3.timeFormat("%b %d, %Y");
    const dollarFormat = d3.format("$,.0f");
    const runtimeFormat = d3.timeFormat("%Hh %Mm");

    return (
        <div className="tooltip">
            <div className="font-bold">{d.name}</div>
            <div className="tooltip-body">
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Released:</div>
                    <div className="p-1">{dateFormat(d.released)}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Country:</div>
                    <div className="p-1">{d.country}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Company:</div>
                    <div className="p-1">{d.company}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Budget:</div>
                    <div className="p-1">{dollarFormat(d.budget)}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">IMDB Score:</div>
                    <div className="p-1">{d.score}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Tomatometer:</div>
                    <div className="p-1">{d.tomatometer_rating}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Audience:</div>
                    <div className="p-1">{d.audience_rating}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Run Time:</div>
                    <div className="p-1">{runtimeFormat(d.runtime)}</div>
                </div>
            </div>
        </div>
    );
}

function positionTooltip({x, y}, {w, h}) {
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
    const [hoverItem, viewSize] = useGlobalState(state => [
        state.hoverItem, state.viewSize
    ]);

    return (
        <div
            className={`absolute bg-gray-100 rounded p-2 text-sm text-gray-800 pointer-events-none
                ${hoverItem.datum ? "" : "hidden"}`}
            style={positionTooltip(hoverItem, viewSize)} >
            {hoverItem.datum ? makeTooltip(hoverItem.datum) : ""}
        </div>
    );
}