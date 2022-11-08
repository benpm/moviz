import * as d3 from "d3";
import { useEffect, useRef } from "react";

// From https://www.pluralsight.com/guides/using-d3.js-inside-a-react-app
export default function useD3(renderFn, dependencies, ref) {
    ref = ref || useRef();
    useEffect(() => {
        renderFn(d3.select(ref.current));
        return () => {};
    }, dependencies);
    return ref;
}