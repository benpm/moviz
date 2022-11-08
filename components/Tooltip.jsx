import * as d3 from "d3";
import useGlobalState from "../hooks/useGlobalState";

function makeTooltip(d) {
    const dateFormat = d3.timeFormat("%b %d, %Y");

    return (
        <div className="tooltip">
            <div className="font-bold">{d.name}</div>
            <div className="tooltip-body">
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Released:</div>
                    <div className="p-1">{dateFormat(d.released)}</div>
                </div>
                <div className="grid grid-cols-2 bg-slate-200 rounded-sm m-1">
                    <div className="p-1 bg-slate-300 rounded-sm">Score:</div>
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
            </div>
        </div>
    );
}

function positionTooltip({x, y}) {
    let pos = {};
    if (x < window.innerWidth / 2) {
        pos.left = x;
    } else {
        pos.right = window.innerWidth - x;
    }
    if (y < window.innerHeight / 2) {
        pos.top = y;
    } else {
        pos.bottom = window.innerHeight - y;
    }
    return pos;
}

export default function CTooltip() {
    const [hoverItem] = useGlobalState(state => [
        state.hoverItem
    ]);

    return (
        <div
            className={`absolute bg-gray-100 rounded p-2 text-sm text-gray-800 pointer-events-none
                ${hoverItem.datum ? "" : "hidden"}`}
            style={positionTooltip(hoverItem)} >
            {hoverItem.datum ? makeTooltip(hoverItem.datum) : ""}
        </div>
    );
}