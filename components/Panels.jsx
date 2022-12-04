import { useEffect } from "react";
import { useState } from "react";
import useGlobalState from "../hooks/useGlobalState";
import CToggle from "./Toggle";
import CSearchBar from "./SearchBar";

const CLeftPanel = function ({data}) {
    const [brushMode, setBrushMode] = useGlobalState(s => [s.brushMode, s.setBrushMode]);
    //TODO:option to adjust bubble radius scale maybe ?
    //TODO:searchbar to filter movies

    return (
        <div className="flex h-full place-items-center">
            <CToggle handler={v => setBrushMode(v)} icon={["pan_tool", "brush"]}
                label={["Toggle Mode (Pan)", "Toggle Mode (Brush)"]} initValue={false}></CToggle>
            <CSearchBar data={data} />
        </div>
    );
}

const CRightPanel = function ({ }) {
    const [viewMode, setViewMode, setShowTrendLine, adjustInflation, setAdjustInflation] = useGlobalState(s => [
        s.viewMode, s.setViewMode, s.setShowTrendLine, s.adjustInflation, s.setAdjustInflation]);
    //TODO:if economic metrics are rendered adjust for inflation switch 
    //that also should adjust the inflation for companion plot
    //TODO:if movie economy view a checkbox to display avg trend as a line
    //TODO:story telling mode buttons we can higligth the some interesting points in the data

    return (
        <>
            {viewMode == "movie_economy" && <CToggle handler={v => setShowTrendLine(v)} icon="timeline" label="Show Trend" initValue={false}></CToggle>}
            {(viewMode == "movie_economy" || viewMode == "cost_quality")
                ? <CToggle handler={v => setAdjustInflation(v)} icon={["check_box_outline_blank", "select_check_box"]} label="Adjust for Inflation" initValue={adjustInflation}></CToggle> : null}
        </>
    );
}

export { CLeftPanel, CRightPanel };