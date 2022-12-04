import * as d3 from "d3";
import Dashboard from "../components/Dashboard";
import CNavBar from "../components/Navbar";
import useGlobalState from "../hooks/useGlobalState";
import { loadInflationData, loadMovieData, loadScatterPlotData } from '../scripts/loadData';
import { useEffect, useState } from 'react';

const Main = () => {
  const [setViewSize] = useGlobalState(s => [s.setViewSize]);

  useEffect(() => {
    window.addEventListener("resize", () => setViewSize({w: window.innerWidth, h: window.innerHeight}));
    setViewSize({w: window.innerWidth, h: window.innerHeight});
  }, []);

  const [data, setData] = useState([]);
  const [setScales, cpiData, setCpiData] = useGlobalState(s => [s.setScales, s.cpiData, s.setCpiData]);
  useEffect(() => {
    if (cpiData.length == 0) {
      loadInflationData().then(setCpiData);
    }
    if (data.length == 0) {
      loadMovieData().then((data) => {
        const mf = d3.format("02d");
        setScales({
          // Scales for each possible data axis
          f: {
            released: d3.scaleTime().domain(d3.extent(data, d => d.released)),
            year: d3.scaleLinear().domain(d3.extent(data, d => d.year)),
            budget: d3.scaleLog().domain(d3.extent(data, d => d.budget)),
            gross: d3.scaleLog().domain(d3.extent(data, d => d.gross)),
            profit: d3.scaleLinear().domain(d3.extent(data, d => d.profit)),
            budget_adj: d3.scaleLog().domain(d3.extent(data, d => d.budget)),
            gross_adj: d3.scaleLog().domain(d3.extent(data, d => d.gross)),
            profit_adj: d3.scaleLinear().domain(d3.extent(data, d => d.profit)),
            score: d3.scaleLinear().domain([0, 10]),
            tomatometer_rating: d3.scaleLinear().domain([0, 100]),
            audience_rating: d3.scaleLinear().domain([0, 100]),
            nominations: d3.scaleLinear(),
            runtime: d3.scaleLinear().domain(d3.extent(data, d => d.runtime)),
          },
          // Functions for configuring axes for each scale
          format: {
            released_zoomed: axis => 
              axis.tickArguments([10, d3.timeFormat("%b %d, %Y")]),
            released: axis => 
              axis.tickArguments([10, d3.timeFormat("%Y")]),
            budget: axis => 
              axis.tickArguments([8, "$,.1s"]),
            gross: axis => 
              axis.tickArguments([8, "$,.1s"]),
            profit: axis => 
              axis.tickArguments([8, "$,.1s"]),
            budget_adj: axis => 
              axis.tickArguments([8, "$,.1s"]),
            gross_adj: axis => 
              axis.tickArguments([8, "$,.1s"]),
            profit_adj: axis => 
              axis.tickArguments([8, "$,.1s"]),
            score: axis => 
              axis.tickArguments([10, "d"]),
            tomatometer_rating: axis => 
              axis.tickArguments([10, "d"]),
            audience_rating: axis => 
              axis.tickArguments([10, "d"]),
            nominations: axis => 
              axis.tickArguments([10, "~s"]),
            runtime: axis => 
              axis.ticks(10).tickFormat(m => `${Math.floor(m/60)}:${mf(m%60)}`),
          }
        });
        setData(data);
      });
    }
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-black">
      <CNavBar data={data}/>
      <Dashboard data={data}/>
    </div>
  )
}

export default Main;
