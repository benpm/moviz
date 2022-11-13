import * as d3 from "d3";
import CScatterplot from './Scatterplot';
import loadMovieData from '../scripts/loadData';
import { useEffect, useState } from 'react';
import CTooltip from './Tooltip';
import CHeatMap from './HeatMap';
import useGlobalState from '../hooks/useGlobalState';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [setScales] = useGlobalState(s => [s.setScales]);
  useEffect(() => {
    if (data.length == 0) {
      loadMovieData().then((data) => {
        setScales({
          x: {
            released: d3.scaleTime().domain(d3.extent(data, d => d.released)),
            budget: d3.scaleLinear().domain(d3.extent(data, d => d.budget)),
            gross: d3.scaleLinear().domain(d3.extent(data, d => d.gross)),
          },
          y: {
            score: d3.scaleLinear().domain([0, 10]),
            tomatometer_rating: d3.scaleLinear().domain([0, 100]),
            audience_rating: d3.scaleLinear().domain([0, 100]),
            nominations: d3.scaleLinear(),
            gross: d3.scaleLinear(),
            budget: d3.scaleLinear(),
          },
          xFormat: {
            released: d3.timeFormat("%b %d, %Y"),
            budget: d3.format("$,.1s"),
            gross: d3.format("$,.1s"),
          },
          yFormat: {
            score: d => d,
            tomatometer_rating: d => d,
            audience_rating: d => d,
            nominations: d3.format("~s"),
            gross: d3.format("$,.1s"),
            budget: d3.format("$,.1s"),
          }
        });
        setData(data);
      });
    }
  }, []);
  return (
    <div id="dashboard" className="p-2 grow grid grid-cols-2 grid-rows-2 gap-2">
      <div className="bg-dark col-span-2"><CScatterplot data={data}/></div>
      <div className="bg-dark"></div>
      <div className="bg-dark"><CHeatMap data={data}/></div>
      <CTooltip />
    </div>
  );
}

export default Dashboard;