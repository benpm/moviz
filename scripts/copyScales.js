export default function copyScales(scales) {
    if (scales === null) return null;
    console.log(scales)
    let out = {f:{}, format: scales.format, ticksFilter: scales.ticksFilter, ticksCount: scales.ticksCount};
    for (let k in scales.f) {
        out.f[k] = scales.f[k].copy();
    }
    return out;
}