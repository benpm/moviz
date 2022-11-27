import { useEffect } from "react";
import { useState } from "react";
import useGlobalState from "../hooks/useGlobalState";
import CToggle from "./Toggle";

const CLeftPanel = function({ }) {
    const [brushMode, setBrushMode] = useGlobalState(s => [s.brushMode, s.setBrushMode]);
    //TODO:global controls related stuff
    //TODO:A switch to enable brushing mode instead of panning
    //TODO:option to adjust bubble radius scale maybe ?
    //TODO:searchbar to filter movies

    return (
        <CToggle handler={v => setBrushMode(v)} label="Brush Mode"></CToggle>
    );
}

const CRightPanel = function ({ }) {
    const [viewMode, setViewMode] = useGlobalState(s => [s.viewMode, s.setViewMode]);
    //TODO:View specific stuff
    //TODO:if economic metrics are rendered adjust for inflation switch 
        //that also should adjust the inflation for companion plot
    //TODO:if movie economy view a checkbox to display avg trend as a line
    //TODO:story telling mode buttons we can higligth the some interesting points in the data

    return (<p>Right Panel</p>);
}

export { CLeftPanel, CRightPanel };