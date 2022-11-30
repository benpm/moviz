import * as d3 from "d3";

function ramp(scale, n = 256) {
    const color = scale.copy().domain(d3.quantize(d3.interpolate(0, n), n));
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1));
        context.fillRect(i, 0, 1, 1);
    }
    return canvas;
}

//https://stackoverflow.com/questions/63842169/i-have-min-and-max-number-how-can-i-generate-n-number-of-array
function generateArrayMinMax(min, max, n) {
    let list = [min],
        interval = (max - min) / (n - 1);

    for (let i = 1; i < n - 1; i++) {
        list.push(Number.parseInt(min + interval * i));
    }
    list.push(Number.parseInt(max));                        // prevent floating point arithmetic errors
    return list;
}

export {ramp, generateArrayMinMax};