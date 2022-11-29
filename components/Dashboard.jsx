import * as d3 from "d3";
import { loadMovieData, loadScatterPlotData } from '../scripts/loadData';
import { useEffect, useState } from 'react';
import CTooltip from './Tooltip';
import CHeatMap from './HeatMap';
import CCompanionPlot from "./CompanionPlot";
import useGlobalState from '../hooks/useGlobalState';
import CCollapsedScatterplot from "./CollapsedScatterplot";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [setScales] = useGlobalState(s => [s.setScales]);
  useEffect(() => {
    if (data.length == 0) {
      loadMovieData().then((data) => {
        setScales({
          f: {
            released: d3.scaleTime().domain(d3.extent(data, d => d.released)),
            budget: d3.scaleLog().domain(d3.extent(data, d => d.budget)),
            gross: d3.scaleLog().domain(d3.extent(data, d => d.gross)),
            score: d3.scaleLinear().domain([0, 10]),
            tomatometer_rating: d3.scaleLinear().domain([0, 100]),
            audience_rating: d3.scaleLinear().domain([0, 100]),
            nominations: d3.scaleLinear(),
          },
          format: {
            released_zoomed: [10, d3.timeFormat("%b %d, %Y")],
            released: [10, d3.timeFormat("%Y")],
            budget: [4, d3.format("$,.1s")],
            gross: [4, d3.format("$,.1s")],
            score: [10, d => d],
            tomatometer_rating: [10, d => d],
            audience_rating: [10, d => d],
            nominations: [10, d3.format("~s")],
            gross: [10, d3.format("$,.1s")],
            budget: [10, d3.format("$,.1s")],
          }
        });
        setData(data);
      });
    }
  }, []);
  return (
    <div id="dashboard" className="p-2 grow grid grid-cols-2 grid-rows-2 gap-2">
      <div className="bg-dark col-span-2"><CCollapsedScatterplot movieData={data}/></div>
      <div className="bg-dark"><CCompanionPlot data={data}></CCompanionPlot></div>
      <div className="bg-dark"><CHeatMap data={data}/></div>
      <CTooltip />
    </div>
  );
}

export default Dashboard;