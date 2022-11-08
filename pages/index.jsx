import Dashboard from "../components/Dashboard";
import CNavBar from "../components/Navbar";

const Main = () => {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      <CNavBar />
      <Dashboard />
    </div>
  )
}

export default Main;
