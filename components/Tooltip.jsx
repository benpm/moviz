import useGlobalState from "../hooks/useGlobalState";

export default function CTooltip() {
    const [hoverItem] = useGlobalState(state => [
        state.hoverItem
    ]);

    return (
        <div
            className={`absolute bg-gray-100 rounded p-2 text-sm text-gray-800 ${hoverItem.datum ? "" : "hidden"}`}
            style={{ left: hoverItem.x, top: hoverItem.y }} >
            {hoverItem.datum ? hoverItem.datum.name : ""}
        </div>
    );
}