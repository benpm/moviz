import { useEffect } from "react";
import Dashboard from "../components/Dashboard";
import CNavBar from "../components/Navbar";
import useGlobalState from "../hooks/useGlobalState";

const Main = () => {
  const [setViewSize] = useGlobalState(s => [s.setViewSize]);

  useEffect(() => {
    window.addEventListener("resize", () => setViewSize({w: window.innerWidth, h: window.innerHeight}));
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      <CNavBar />
      <Dashboard />
    </div>
  )
}

export default Main;
