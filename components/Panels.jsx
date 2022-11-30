import { useEffect } from "react";
import { useState } from "react";
import useGlobalState from "../hooks/useGlobalState";
import CToggle from "./Toggle";

const CLeftPanel = function ({ }) {
    const [brushMode, setBrushMode] = useGlobalState(s => [s.brushMode, s.setBrushMode]);
    //TODO:global controls related stuff
    //TODO:A switch to enable brushing mode instead of panning
    //TODO:option to adjust bubble radius scale maybe ?
    //TODO:searchbar to filter movies

    return (
        <div>
            <CToggle handler={v => setBrushMode(v)} icon={["pan_tool", "brush"]}
                label={["Pan Mode", "Brush Mode"]} initValue={false}></CToggle>
        </div>
    );
}

const CRightPanel = function ({ }) {
    const [viewMode, setViewMode, toggleOtherStudios] = useGlobalState(s => [s.viewMode, s.setViewMode, s.setCompanionPlotShowOtherStudios]);
    //TODO:View specific stuff
    //TODO:if economic metrics are rendered adjust for inflation switch 
    //that also should adjust the inflation for companion plot
    //TODO:if movie economy view a checkbox to display avg trend as a line
    //TODO:story telling mode buttons we can higligth the some interesting points in the data

    return (
        <div>
            {viewMode == "movie_economy" ? 
                <CToggle handler={v => toggleOtherStudios(v)} icon="horizontal_split" label="Other Studios" initValue={false}></CToggle> :
                null}
        </div>
    );
}

export { CLeftPanel, CRightPanel };