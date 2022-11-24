import { useEffect } from "react";
import { useState } from "react";
import useGlobalState from "../hooks/useGlobalState";

const CLeftPanel = function({ }) {
    const [viewMode, setViewMode] = useGlobalState(s => [s.viewMode, s.setViewMode]);
    

    return (<p>Left Panel</p>);
}

const CRightPanel = function ({ }) {
    const [viewMode, setViewMode] = useGlobalState(s => [s.viewMode, s.setViewMode]);

    return (<p>Right Panel</p>);
}

export { CLeftPanel, CRightPanel };