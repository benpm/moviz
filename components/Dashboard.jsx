import * as d3 from "d3";
import { loadMovieData, loadScatterPlotData } from '../scripts/loadData';
import { useEffect, useState } from 'react';
import CTooltip from './Tooltip';
import CHeatMap from './HeatMap';
import CCompanionPlot from "./CompanionPlot";
import useGlobalState from '../hooks/useGlobalState';
import CCollapsedScatterplot from "./CollapsedScatterplot";
import { timeFormat } from "d3";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [setScales] = useGlobalState(s => [s.setScales]);
  useEffect(() => {
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
    <div id="dashboard" className="p-2 grow grid grid-cols-2 grid-rows-2 gap-2 overflow-hidden">
      <div className="bg-dark col-span-2"><CCollapsedScatterplot movieData={data}/></div>
      <div className="bg-dark"><CCompanionPlot data={data}></CCompanionPlot></div>
      <div className="bg-dark"><CHeatMap data={data}/></div>
      <CTooltip />
    </div>
  );
}

export default Dashboard;