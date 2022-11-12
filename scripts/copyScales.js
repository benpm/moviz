export default function copyScales(scales) {
    if (scales === null) return null;
    let out = {x:{}, y:{}};
    for (let k in scales.x) {
        out.x[k] = scales.x[k].copy();
    }
    for (let k in scales.y) {
        out.y[k] = scales.y[k].copy();
    }
    return out;
}