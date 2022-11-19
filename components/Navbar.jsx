import CViewSelector from "./ViewSelector";
export default function CNavBar() {
    //console.log(Logo);
    return (
        <div className="bg-navbar flex flex-row text-slate-100 h-16">
            <img src="logo-white.svg" alt="logo" className="h-full p-1" />
            <div className="flex flex-grow items-center">
                <div className="flex flex-col items-center justify-center w-2/5">
                    <div className="text-2xl font-bold">left-panel</div>
                </div>
                <div className="flex flex-col align-items-center justify-end w-1/5" style={{ height: '100%' }} >
                    <CViewSelector />
                </div>
                <div className="flex flex-col items-center justify-center w-2/5">
                    <div className="text-2xl font-bold">rigth-panel</div>
                </div>
            </div>
            <div className="flex flex-row items-center ml-auto">
                <div className="flex flex-col text-center">
                    <a className="p-1" href="https://benpm.github.io/">Ben Mastripolito</a>
                    <a className="p-1" href="https://stlkrv1.github.io/personal-website/#about">Alper Sahistan</a>
                </div>
            </div>
        </div>
    );
}