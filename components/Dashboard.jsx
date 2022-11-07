import CScatterplot from './Scatterplot';

const Dashboard = () => {
  return (
    <div id="dashboard" className="p-2 w-full h-full grid grid-cols-2 grid-rows-2 gap-2">
      <div className="bg-slate-200 col-span-2"><CScatterplot /></div>
      <div className="bg-slate-200"></div>
      <div className="bg-slate-200"></div>
    </div>
  );
}

export default Dashboard;