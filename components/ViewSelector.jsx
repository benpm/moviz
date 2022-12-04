import { useEffect } from "react";
import { useState } from "react";
import useGlobalState from "../hooks/useGlobalState";

export default function CViewSelector({ }) {
  const commonStyle = " leading-4 h-full py-1 px-1 text-sm font-medium ";
  const pressedStyle = commonStyle + " bg-accent text-dark ";
  const unpressedStyle = commonStyle + " bg-mid2 z-4 hover:bg-accent-dark ";
  const exButtonStyles = [
    " rounded-tl ",
    " ",
    " rounded-tr "
  ];

  const [buttonStyle, setButtonStyle] = useState([pressedStyle, unpressedStyle, unpressedStyle].map((s,i) => exButtonStyles[i] + s));
  const [viewMode, setViewMode] = useGlobalState(s => [s.viewMode, s.setViewMode]);

  const viewModes = {
    "ratings_oscars": 0,
    "movie_economy": 1,
    "cost_quality": 2
  };

  useEffect(() => {
    const viewIdx = viewModes[viewMode];
    setButtonStyle(buttonStyle.map(
      (_,i) => ((viewIdx == i) ? pressedStyle : unpressedStyle) + (exButtonStyles[i])));
  }, [viewMode]);

  //Create a rounded rectange with a border
  return (
    <>
      <div className="grid grid-cols-3 w-full rounded-md shadow-sm text-black" role="group">
        <button type="button" className={buttonStyle[0]} onClick={()=>setViewMode("ratings_oscars")}>
          Ratings & Oscars
        </button>
        <button type="button" className={buttonStyle[1]} onClick={()=>setViewMode("movie_economy")}>
          Movie Economy
        </button>
        <button type="button" className={buttonStyle[2]} onClick={()=>setViewMode("cost_quality")}>
          Cost vs Quality
        </button>
      </div>
    </>
  );
}