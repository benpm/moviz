import CViewSelector from "./ViewSelector";
import {CLeftPanel, CRightPanel} from "./Panels";
export default function CNavBar() {
    //console.log(Logo);
    return (
        <div className="bg-navbar flex flex-row text-slate-100 h-16">
            <img src="logo-white.svg" alt="logo" className="h-full ml-4" />
            <div className="flex-grow text-center basis-3/12"><CLeftPanel/></div>
            <div className="basis-4/12">
                <CViewSelector/>
            </div>
            <div className ="flex-grow text-center basis-2/12"><CRightPanel/></div>
            <div className="flex-shrink flex flex-col text-right">
                <a className="p-1" href="https://benpm.github.io/">Ben Mastripolito</a>
                <a className="p-1" href="https://stlkrv1.github.io/personal-website/#about">Alper Sahistan</a>
            </div>
        </div>
    );
}