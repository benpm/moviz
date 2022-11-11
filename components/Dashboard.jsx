import CScatterplot from './Scatterplot';
import loadMovieData from '../scripts/loadData';
import { useEffect, useState } from 'react';
import CTooltip from './Tooltip';
import CHeatMap from './HeatMap';

const Dashboard = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (data.length == 0) {
      loadMovieData().then((data) => {
        console.log(data);
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