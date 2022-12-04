import CViewSelector from "./ViewSelector";
import {CLeftPanel, CRightPanel} from "./Panels";
import { FaGithub } from "react-icons/fa";
export default function CNavBar({data}) {
    //console.log(Logo);
    return (
        <div className="bg-navbar text-sm flex flex-row text-slate-100 h-10 place-items-center relative">
            <div className="basis-28 mr-2">
                <img src="logo-white.svg" alt="logo" className="h-full ml-4" />
            </div>
            <div className="flex-grow text-center basis-2/12"><CLeftPanel data={data}/></div>
            <div className="basis-3/12 flex place-items-end h-full">
                <CViewSelector/>
            </div>
            <div className ="flex flex-row-reverse flex-grow text-center basis-2/12"><CRightPanel/></div>
            <div className="h-full flex-shrink flex flex-col text-right p-1 bg-dark pl-1">
                <a className="animate-pulse h-full" href="https://github.com/benpm/moviz"><FaGithub size="100%" /></a>
            </div>
        </div>
    );
}