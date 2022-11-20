import React from "react";

//an event handler function that disables the button and enables the other buttons in the group
function btnClicked(event) {
  //get the button that was clicked
  let button = event.target;
  if(button.disabled)
    return;
  //get the parent element of the button
  let parent = button.parentElement;
  //get the children of the parent element
  let children = parent.children;
  //loop through the children and enable the buttons
  for (let i = 0; i < children.length; i++) {
      children[i].disabled = false;
      //attach the event handler to the button
      children[i].addEventListener("click", btnClicked);
  }
  //disable the button that was clicked
  button.disabled = true;
}

export default function CViewSelector({ }) {
  //Create a rounded rectange with a border
  return (
    <>
      <div className="text-center text-l w-full">Select View</div>
      <div className="grid grid-cols-3 w-full rounded-md shadow-sm" role="group">
        <button type="button" className="h-9 py-1 px-1 text-sm font-medium text-gray-900 bg-tealBlue rounded-l-3xl border-l-2 border-t border-black/50
          shadow-inner disabled:shadow-black shadow-teal-100/60 disabled:border-gray-800
        hover:text-white disabled:z-4 disabled:bg-gray-900 disabled:text-black 
          dark:text-black dark:hover:text-white hover:bg-straw dark:disabled:bg-tealBlue-dark" onClick={btnClicked} disabled>
          Ratings & Oscars
        </button>
        <button type="button" className="h-9 py-1 px-1 text-sm font-medium text-gray-900 bg-tealBlue border-t border-black/50 
         shadow-inner disabled:shadow-black shadow-teal-100/60 disabled:border-gray-800
        hover:text-white disabled:z-4 disabled:bg-gray-900 disabled:text-black 
          dark:text-black dark:hover:text-white hover:bg-straw dark:disabled:bg-tealBlue-dark" onClick={btnClicked}>
          Movie Economy
        </button>
        <button type="button" className="h-9 py-1 px-1 text-sm font-medium text-gray-900 bg-tealBlue rounded-r-3xl border-r-2 border-t border-black/50
          shadow-inner disabled:shadow-black shadow-teal-100/60 disabled:border-gray-800
        hover:text-white disabled:z-4 disabled:bg-gray-900 disabled:text-black 
          dark:text-black dark:hover:text-white hover:bg-straw dark:disabled:bg-tealBlue-dark" onClick={btnClicked}>
          Cost vs Quality
        </button>
      </div>
    </>
  );
}