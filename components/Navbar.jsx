import { default as logo } from '../logo.svg';

export default function CNavBar() {
    //console.log(Logo);
    return (
        <div className="bg-slate-700 flex flex-row text-slate-100">
            <img src={logo} alt="logo" />
            <div className="flex flex-row">
                <div className="p-2">menu2</div>
                <div className="p-2">menu3</div>
            </div>
        </div>
    );
}