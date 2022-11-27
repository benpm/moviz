import { useEffect } from "react";
import { useState } from "react";

// Toggle switch component
export default function CToggle({handler, label}) {
    const baseButtonStyle = "flex justify-center place-items-center px-2 py-1 rounded-md text-sm font-medium w-8 h-8 "
    const buttonToggleStyles = [
        "bg-dark text-light",
        "bg-mid2 text-white"
    ];

    const [toggled, setToggled] = useState(true);
    const [buttonStyle, setButtonStyle] = useState(baseButtonStyle);

    const toggle = () => {
        setToggled(!toggled);
        handler(!toggled);

        setButtonStyle(baseButtonStyle + buttonToggleStyles[Number(!toggled)]);
    };

    useEffect(toggle, []);

    return (
        <div className="flex flex-row place-items-center p-3">
            <button onClick={toggle}
                    className={buttonStyle}>
                <span className="material-symbols-outlined">brush</span>
            </button>
            <p className="p-2">{label}</p>
        </div>
    );
}