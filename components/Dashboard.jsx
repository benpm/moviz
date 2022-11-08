import CScatterplot from './Scatterplot';
import loadMovieData from '../scripts/loadData';
import { useEffect, useState } from 'react';

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
    <div id="dashboard" className="p-2 w-full h-full grid grid-cols-2 grid-rows-2 gap-2">
      <div className="bg-slate-200 col-span-2"><CScatterplot data={data}/></div>
      <div className="bg-slate-200"></div>
      <div className="bg-slate-200"></div>
    </div>
  );
}

export default Dashboard;