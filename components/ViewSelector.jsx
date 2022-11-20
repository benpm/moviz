import React from "react";

export default function CViewSelector({ }) {
  //Create a rounded rectange with a border
  return (
    <>
      <div className="text-center text-l w-full">Select View</div>
      <div className="grid grid-cols-3 w-full rounded-md shadow-sm" role="group">
        <button type="button" className="h-9 py-1 px-1 text-sm font-medium text-gray-900 bg-tealBlue rounded-l-3xl border-l-2 border-t border-black/50
          shadow-inner focus:shadow-black shadow-teal-100/60 focus:border-gray-800
        hover:text-white focus:z-4 focus:bg-gray-900 focus:text-black 
          dark:text-black dark:hover:text-white hover:bg-straw dark:focus:bg-tealBlue-dark">
          <p className="text-sm">Ratings & Oscars</p>
        </button>
        <button type="button" className="h-9 py-1 px-1 text-sm font-medium text-gray-900 bg-tealBlue border-t border-black/50 
         shadow-inner focus:shadow-black shadow-teal-100/60 focus:border-gray-800
        hover:text-white focus:z-4 focus:bg-gray-900 focus:text-black 
          dark:text-black dark:hover:text-white hover:bg-straw dark:focus:bg-tealBlue-dark">
           <p className="text-sm">Movie Economy</p>
        </button>
        <button type="button" class="h-9 py-1 px-1 text-sm font-medium text-gray-900 bg-tealBlue rounded-r-3xl border-r-2 border-t border-black/50
          shadow-inner focus:shadow-black shadow-teal-100/60 focus:border-gray-800
        hover:text-white focus:z-4 focus:bg-gray-900 focus:text-black 
          dark:text-black dark:hover:text-white hover:bg-straw dark:focus:bg-tealBlue-dark">
         <p className="text-sm">Cost vs Quality</p>
        </button>
      </div>
    </>
  );
}