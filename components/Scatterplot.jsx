import rd3 from "react-d3-library";
import * as d3 from "d3";
import { useEffect, useState } from "react";
const RD3Component = rd3.Component;

export default function CScatterplot() {
    const [data, setData] = useState({ d3: "" });
    // useEffect(() => {
    //     setData({ d3: d3.csv("movies.csv", d3.autoType)});
    //     console.log(data);
    // }, []);
    d3.csv("movies.csv", d3.autoType).then(data => {
        console.log(data);
        setData({ d3: data });
    });

    return (
        <div id="scatterplot" className="w-full h-full bg-violet-200">
            <p>Scatterplot</p>
            {data ? <RD3Component data={data} /> : <p>Loading...</p>}
        </div>
    );
};