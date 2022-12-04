import CTooltip from './Tooltip';
import CHeatMap from './HeatMap';
import CCompanionPlot from "./CompanionPlot";
import CCollapsedScatterplot from "./CollapsedScatterplot";

const Dashboard = ({data}) => {
  return (
    <div id="dashboard" className="p-1 grow grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden">
      <div className="rounded bg-dark col-span-2"><CCollapsedScatterplot movieData={data}/></div>
      <div className="rounded bg-dark"><CCompanionPlot data={data}></CCompanionPlot></div>
      <div className="rounded bg-dark"><CHeatMap data={data}/></div>
      <CTooltip data={data}/>
    </div>
  );
}

export default Dashboard;