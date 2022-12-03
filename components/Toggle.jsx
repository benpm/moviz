import { useEffect } from "react";
import { useState } from "react";

// Toggle switch component
export default function CToggle({handler, label, icon, initValue}) {
    const baseButtonStyle = "flex justify-center place-items-center px-2 py-1 rounded-md text-sm font-medium w-8 h-8 hover:text-accent "
    const buttonToggleStyles = [
        "bg-dark text-light",
        "bg-mid text-white"
    ];

    const [toggled, setToggled] = useState(initValue);
    const [buttonStyle, setButtonStyle] = useState(baseButtonStyle);

    const toggle = () => {
        setToggled(!toggled);
        handler(!toggled);

        setButtonStyle(baseButtonStyle + buttonToggleStyles[Number(!toggled)]);
    };

    useEffect(() => {
        setButtonStyle(baseButtonStyle + buttonToggleStyles[Number(initValue)]);
    }, []);

    return (
        <div className="flex flex-row place-items-center p-3 overflow-hidden">
            <button onClick={toggle}
                    className={buttonStyle}>
                <span className="material-symbols-outlined">{icon instanceof Array ? icon[Number(toggled)] : icon}</span>
            </button>
            <p className="p-2 whitespace-nowrap">{label instanceof Array ? label[Number(toggled)] : label}</p>
        </div>
    );
}