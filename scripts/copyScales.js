export default function copyScales(scales) {
    if (scales === null) return null;
    let out = {f:{}, format: scales.format};
    for (let k in scales.f) {
        out.f[k] = scales.f[k].copy();
    }
    return out;
}