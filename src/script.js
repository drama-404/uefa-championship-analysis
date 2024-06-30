// Load the data
Promise.all([
    d3.json("https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/GeoJSON/europe.geojson"),
    d3.csv("country_euro_stats.csv")
]).then(([europeData, countryStats]) => {

    // Set up dimensions
    const width = 960;
    const height = 600;

    // Create SVG
    const svg = d3.select("#map-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a group for the map
    const g = svg.append("g");

    // Create a projection
    const projection = d3.geoMercator()
        .center([10, 55])
        .scale(500)
        .translate([width / 2, height / 2]);

    // Create a path generator
    const path = d3.geoPath().projection(projection);

    // Create a color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, 1]);

    // Create a tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Create a map of country codes to success scores
    const successScores = new Map(countryStats.map(d => [d.country_code, +d.success_score]));

    // Draw the map
    g.selectAll("path")
        .data(europeData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            const score = successScores.get(d.properties.ISO2);
            return score ? colorScale(score) : "#ccc";
        })
        .on("mouseover", function (event, d) {
            const countryData = countryStats.find(c => c.country_code === d.properties.ISO2);
            if (countryData) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>${countryData.country}</strong><br>
                    Success Score: ${(+countryData.success_score).toFixed(3)}<br>
                    Appearances: ${countryData.tournament_appearances}<br>
                    Wins: ${countryData.total_wins}<br>
                    Goals Scored: ${countryData.total_goals_scored}<br>
                    Goals Conceded: ${countryData.total_goals_conceded}<br>
                    Finals Appearances: ${countryData.finals_appearances}<br>
                    Tournament Wins: ${countryData.tournament_wins}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            // Here you can add the logic to transform the view
            console.log("Clicked on:", d.properties.NAME);
        });

    // Add a legend
    const legend = svg.append("g")
        .attr("transform", `translate(20, ${height - 100})`);

    const legendScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 200]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f"));

    legend.append("g")
        .call(legendAxis);

    const legendGradient = legend.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    legendGradient.selectAll("stop")
        .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: colorScale(t) })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    legend.append("rect")
        .attr("width", 200)
        .attr("height", 20)
        .style("fill", "url(#legend-gradient)");

    legend.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .text("Success Score");
}).catch(error => {
    console.error("Error loading the data:", error);
});