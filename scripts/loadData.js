import * as d3 from "d3";

/**
 * Load movie data from a CSV file, returning a promise
 * 
 * @returns {Promise} A promise that resolves to the data
 */
function loadMovieData() {
    return d3.csv("movies.csv").then(data => {
        data.forEach(d => {
            d.year = parseInt(d.year);
            d.budget = parseInt(d.budget);
            d.gross = parseInt(d.gross);
            d.profit = parseInt(d.profit);
            d.released = new Date(d.released);
            d.runtime = parseInt(d.runtime);
            d.score = parseFloat(d.score);
            d.votes = parseInt(d.votes);
            d.runtime = parseInt(d.runtime);
            d.audience_rating = parseInt(d.audience_rating);
            d.nominations = parseInt(d.nominations);
        });
        return data;
    });
}

function loadScatterPlotData() {
    return d3.csv("scatterplot.csv").then(data => {
        data.forEach(d => {
            d.lvl = parseInt(d.lvl);
            d.x = parseFloat(d.x);
            d.y = parseFloat(d.y);
            d.r = parseFloat(d.r);
            d.movies = d.movies.split(" ").map(i => parseInt(i));
            d.idx = parseInt(d.idx);
        });
        const groupedData = d3.group(data, d => d.lvl, d => d.x_axis, d => d.y_axis);
        return groupedData;
    });
}

export { loadMovieData, loadScatterPlotData };