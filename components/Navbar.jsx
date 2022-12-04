import CViewSelector from "./ViewSelector";
import {CLeftPanel, CRightPanel} from "./Panels";
import { FaGithub } from "react-icons/fa";
export default function CNavBar() {
    //console.log(Logo);
    return (
        <div className="bg-navbar text-sm flex flex-row text-slate-100 h-16">
            <img src="logo-white.svg" alt="logo" className="h-full ml-4" />
            <div className="flex-grow text-center basis-3/12"><CLeftPanel/></div>
            <div className="basis-4/12">
                <CViewSelector/>
            </div>
            <div className ="flex-grow text-center basis-2/12"><CRightPanel/></div>
            <div className="flex-shrink flex flex-col text-right pr-1 bg-dark pl-1">
                <a className="italic text-light" href="https://benpm.github.io/">
                    Ben Mastripolito
                </a>
                <a className="italic text-light" href="https://stlkrv1.github.io/personal-website/#about">
                    Alper Sahistan
                </a>
                <a className="italic text-light" href="https://stlkrv1.github.io/personal-website/#about">
                    <span className="inline-block pr-1"><FaGithub /></span><p className="font-bold inline-block">GitHub</p>
                </a>
            </div>
        </div>
    );
}