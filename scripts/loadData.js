import * as d3 from "d3";

/**
 * Load movie data from a CSV file, returning a promise
 * 
 * @returns {Promise} A promise that resolves to the data
 */
export default function loadMovieData() {
    return d3.csv("movies.csv").then(data => {
        data.forEach(d => {
            d.year = parseInt(d.year);
            d.budget = parseInt(d.budget);
            d.gross = parseInt(d.gross);
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