import { useState } from "react";

export default function CViewSelector({ }) {
  const commonStyle = " h-9 py-1 px-1 text-sm font-medium border-black/50 text-black hover:border-gray-500 ";
  const pressedStyle = commonStyle + " hover:text-white bg-tealBlue-dark shadow-inner shadow-black ";
  const unpressedStyle = commonStyle + " bg-tealBlue z-4 hover:bg-straw ";
  const exButtonStyles = [
    " rounded-l-3xl border-l-2 border-t ",
    " border-t ",
    " rounded-r-3xl border-r-2 border-t "
  ];

  const [viewSelected, setViewSelected] = useState(0);
  const [buttonStyle, setButtonStyle] = useState([pressedStyle, unpressedStyle, unpressedStyle].map((s,i) => exButtonStyles[i] + s));

  const onClick = (view) => {
    setViewSelected(view);
    setButtonStyle(buttonStyle.map(
      (_,i) => ((view == i) ? pressedStyle : unpressedStyle) + (exButtonStyles[i])));
  };

  //Create a rounded rectange with a border
  return (
    <>
      <div className="text-center text-l w-full">Select View</div>
      <div className="grid grid-cols-3 w-full rounded-md shadow-sm" role="group">
        <button type="button" className={buttonStyle[0]} onClick={()=>onClick(0)}>
          Ratings & Oscars
        </button>
        <button type="button" className={buttonStyle[1]} onClick={()=>onClick(1)}>
          Movie Economy
        </button>
        <button type="button" className={buttonStyle[2]} onClick={()=>onClick(2)}>
          Cost vs Quality
        </button>
      </div>
    </>
  );
}