import { useEffect } from "react";
import { useState } from "react";
import useGlobalState from "../hooks/useGlobalState";

export default function CViewSelector({ }) {
  const commonStyle = " h-9 py-1 px-1 text-sm font-medium border-black/50 text-black hover:border-gray-500 ";
  const pressedStyle = commonStyle + " hover:text-white bg-tealBlue-dark shadow-inner shadow-black ";
  const unpressedStyle = commonStyle + " bg-tealBlue z-4 hover:bg-straw ";
  const exButtonStyles = [
    " rounded-l-3xl border-l-2 border-t ",
    " border-t ",
    " rounded-r-3xl border-r-2 border-t "
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
      <div className="text-center text-l w-full">Select View</div>
      <div className="grid grid-cols-3 w-full rounded-md shadow-sm" role="group">
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