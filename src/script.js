// Load the data
Promise.all([
    d3.json("https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/GeoJSON/europe.geojson"),
    d3.csv("country_euro_stats.csv"),
    d3.csv("euro_match_data.csv")
]).then(([europeData, countryStats, matchData]) => {

    if (window.Jupyter) {
        window.Jupyter.notebook.events.on("kernel_ready.Kernel", function () {
            createDashboard(europeData, countryStats, matchData);
        });
    } else {
        createDashboard(europeData, countryStats, matchData);
    }
}).catch(error => {
    console.error("Error loading the data:", error);
});

function createDashboard(europeData, countryStats, matchData) {

    const container = d3.select("#dashboard-container");
    let width = container.node().getBoundingClientRect().width;
    let height = Math.max(800, window.innerHeight);
    const margin = { top: 40, right: 20, bottom: 40, left: 20 };

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);
    const g = svg.append("g")

    // Calculate dimensions for each component
    const mapHeight = height * 0.5;
    const mapWidth = width;
    const plotHeight = height * 0.4;

    // Add title and subtitle
    svg.append("text")
        .attr("class", "title2")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .text("UEFA EURO Performance Dashboard");

    svg.append("text")
        .attr("class", "subtitle2")
        .attr("x", margin.left)
        .attr("y", margin.top + 20)
        .text("Analyzing Success Scores and Goal Statistics Across Europe");


    // Add hint
    const hint = svg.append("g")
        .attr("transform", `translate(${width - margin.right}, ${margin.top})`)
        .attr("text-anchor", "end");

    hint.append("text")
        .attr("class", "hint2")
        .attr("y", 0)
        .text("🖱️ Click on a country to view its detailed performance");

    hint.append("text")
        .attr("class", "hint2")
        .attr("y", 20)
        .text("Hover over points for match details");


    // Create containers for each visualization
    const mapContainer = svg.append("g");
    const scatterPlotContainer = svg.append("g").attr("transform", `translate(0,${mapHeight + margin.top})`);

    // Create the main map
    const map = createMainMap(mapContainer, europeData, countryStats, mapWidth, mapHeight, updateVisualizations);

    // Initialize the other visualizations
    const scatterPlot = createScatterPlot(scatterPlotContainer, matchData, width, plotHeight);

    // Find the country with the highest success score
    const bestCountry = countryStats.reduce((prev, current) =>
        (prev.success_score > current.success_score) ? prev : current
    );
    scatterPlot.update(bestCountry.country);

    function updateVisualizations(selectedCountry) {
        scatterPlot.update(selectedCountry);
    }

    function createMainMap(container, europeData, countryStats, width, height, onCountryClick) {

        // Filter out Israel from the GeoJSON data for title readability
        europeData.features = europeData.features.filter(d => d.properties.NAME !== "Israel");

        const projection = d3.geoMercator()
            .center([25, 55])
            .scale(height)
            .translate([width / 2, height / 2 + 80]);

        // Create a path generator
        const path = d3.geoPath().projection(projection);

        // Create a color scale
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, 1]);  // Updated domain to match our new score range

        // Create a tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Create a map of country codes to success scores
        const successScores = new Map(countryStats.map(d => [d.country, +d.success_score]));

        // Create a map of country names to centroids for UEFA cup placement
        const countryCentroids = new Map(europeData.features.map(d => [d.properties.NAME, d3.geoCentroid(d)]));

        // Draw the map
        g.selectAll("path")
            .data(europeData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "country")
            .attr("fill", d => {
                let score;
                if (d.properties.NAME === 'United Kingdom') {
                    score = Math.max(successScores.get("England"),
                        successScores.get("Scotland"),
                        successScores.get("Wales"),
                        successScores.get("Northern Ireland"));
                }
                else if (d.properties.NAME === 'The former Yugoslav Republic of Macedonia') {
                    d.properties.NAME = "North Macedonia";
                    score = successScores.get(d.properties.NAME);
                }
                else {
                    score = successScores.get(d.properties.NAME);
                }
                return score ? colorScale(score) : "#ccc";
            })
            .on("mouseover", function (event, d) {

                let tooltipContent;
                if (d.properties.NAME === 'United Kingdom') {
                    tooltipContent = createUKTooltip(countryStats);
                    if (tooltipContent) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html(tooltipContent)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    }
                } else {
                    const countryData = countryStats.find(c => c.country === d.properties.NAME);
                    if (countryData) {
                        showCountryTooltip(event, countryData)
                    }
                }

            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function (event, d) {
                console.log("Clicked on:", d.properties.NAME)
                onCountryClick(d.properties.NAME);
            });

        const margin = { top: 40, right: width > 800 ? width / 6 : 20, bottom: 40, left: width > 800 ? width / 6 : 60 };

        // Add a legend
        const legendWidth = 20;
        const legendHeight = 100;
        const legendX = width > 800 ? width - margin.right : width - margin.right - 60; // Position to the right of the map
        const legendY = height / 2 - legendHeight / 2 + margin.top; // Center vertically

        const legend = container.append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        const legendScale = d3.scaleLinear()
            .domain([0, 1])
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(6)
            .tickFormat(d3.format(".1f"));

        legend.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", legendHeight)
            .attr("x2", 0)
            .attr("y2", 0)
            .selectAll("stop")
            .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: colorScale(t) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        legend.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "10px");

        // Add divisions to the legend
        const divisions = [0, 0.2, 0.4, 0.6, 0.8, 1];
        legend.selectAll(".division")
            .data(divisions)
            .enter()
            .append("line")
            .attr("class", "division")
            .attr("x1", 0)
            .attr("x2", legendWidth)
            .attr("y1", d => legendScale(d))
            .attr("y2", d => legendScale(d))
            .attr("stroke", "white")
            .attr("stroke-width", 0.5);

        legend.append("text")
            .attr("x", -5)
            .attr("y", -10)
            .attr("text-anchor", "start")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .text("Success Score");


        // Add UEFA cup icons for tournament winners
        g.selectAll("image")
            .data(countryStats.filter(d => d.tournament_wins > 0))
            .enter()
            .append("image")
            .attr("xlink:href", "/logos/uefa_cup.png")  // Update this path
            .attr("x", d => projection(countryCentroids.get(d.country))[0] - 15)
            .attr("y", d => projection(countryCentroids.get(d.country))[1] - 20)
            .attr("width", d => 20 + d.tournament_wins * 5)
            .attr("height", d => 20 + d.tournament_wins * 5 * (1529 / 1171))
            .attr("preserveAspectRatio", "xMidYMid meet")
            .on("mouseover", function (event, d) {
                showCountryTooltip(event, d)
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function (event, d) {
                console.log("Clicked on:", d.country)
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
                onCountryClick(d.country);
            });

        // Function to create country/cup tooltip (except UK countries)
        function showCountryTooltip(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            tooltip.html(`<strong>${d.country}</strong><br>`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        // Function to create UK tooltip content
        function createUKTooltip(countryStats) {
            const ukCountries = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
            const ukData = ukCountries.map(country => countryStats.find(c => c.country === country));

            let content = `<strong>United Kingdom</strong>`;
            return content;
        }

    }


    function createScatterPlot(container, matchData, width, height) {
        const margin = { top: 100, right_plot: width > 800 ? width / 6 : 20, bottom: 40, left: width > 800 ? width / 6 : 20, right_legend: 100 };
        const innerWidth = width > 800 ? width - margin.left - margin.right_plot : width - margin.left - margin.right_plot - margin.right_legend;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = container.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scalePoint().range([0, innerWidth]);
        const yScale = d3.scaleLinear().range([innerHeight, 0]);
        const sizeScale = d3.scaleLinear().range([10, 25]);
        const colorScale = d3.scaleOrdinal()
            .domain(["win", "draw", "loss"])
            .range(["#4caba4", "#edcc17", "#e84f1c"]);

        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`);
        const yAxis = svg.append("g");

        // Add x-axis label
        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .text("Year");

        // Add y-axis label
        svg.append("text")
            .attr("x", -innerHeight / 2)
            .attr("y", -25)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .text("Goals Scored");

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width > 800 ? innerWidth + 20 : innerWidth + 10}, 20)`);

        const legendItems = [
            { label: "Win", color: colorScale("win") },
            { label: "Draw", color: colorScale("draw") },
            { label: "Loss", color: colorScale("loss") },
            { label: "Tournament Win", image: "logos/uefa_cup.png" }
        ];

        legendItems.forEach((item, i) => {
            const legendItem = legend.append("g")
                .attr("transform", `translate(0, ${i * 15})`);

            if (item.image) {
                legendItem.append("image")
                    .attr("href", item.image)
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("x", -6)
                    .attr("y", -6);
            } else {
                legendItem.append("circle")
                    .attr("r", 4)
                    .attr("fill", item.color);
            }

            legendItem.append("text")
                .attr("x", 8)
                .attr("y", 4)
                .style("font-size", "10px")
                .text(item.label);
        });

        // Get the bounding box of the legend group
        const legendBBox = legend.node().getBBox();

        // Add border rectangle based on the content size
        legend.insert("rect", ":first-child")
            .attr("x", legendBBox.x - 5)
            .attr("y", legendBBox.y - 5)
            .attr("width", legendBBox.width + 10)
            .attr("height", legendBBox.height + 10)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("rx", 5)
            .attr("ry", 5);

        // Add title group
        const titleGroup = svg.append("g")
            .attr("transform", `translate(${innerWidth / 2}, ${-margin.top / 4.5})`);

        // Add flag to title
        const flagImage = titleGroup.append("image")
            .attr("x", -10)
            .attr("y", -8)
            .attr("width", 15)
            .attr("height", 15);

        // Add title text
        const titleText = titleGroup.append("text")
            .attr("class", "title-text")
            .attr("x", 10)  // Adjust this value to fine-tune text position
            .attr("y", 5)   // Adjust this value to align text vertically
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("font-weight", "bold");


        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "5px");



        function update(selectedCountry) {
            let countryData;
            if (selectedCountry === "United Kingdom") {
                const ukCountries = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
                countryData = matchData.filter(d => ukCountries.includes(d.country));
            } else {
                countryData = matchData.filter(d => d.country === selectedCountry);
            }

            updateTitle(selectedCountry, countryData[0].country_code);

            const participationYears = [...new Set(countryData.map(d => d.year))].sort((a, b) => a - b);
            xScale.domain(participationYears);


            const maxGoals = Math.ceil(d3.max(countryData, d => +d.goals_scored));
            yScale.domain([0, maxGoals]);
            sizeScale.domain(d3.extent(countryData, d => +d.teams_in_tournament));

            xAxis.transition().duration(1000)
                .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
                .selectAll("text")
                .style("font-size", "14px");

            yAxis.transition().duration(1000)
                .call(d3.axisLeft(yScale).tickFormat(d3.format("d")).ticks(maxGoals)) // Ensure integer ticks
                .selectAll("text")
                .style("font-size", "14px");

            const points = svg.selectAll(".point")
                .data(countryData, d => d.year);

            points.enter()
                .append("g")
                .attr("class", "point")
                .merge(points)
                .each(function (d) {
                    const g = d3.select(this);
                    g.selectAll("*").remove(); // Clear existing content

                    if (d.round === "FINAL" && d.result === "win") {
                        g.append("image")
                            .attr("href", "logos/uefa_cup.png")
                            .attr("width", 20)
                            .attr("height", 20)
                            .attr("x", -10)
                            .attr("y", -10);
                    } else {
                        g.append("circle")
                            .attr("r", 5)
                            .attr("fill", colorScale(d.result))
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .attr("opacity", 0.6);
                    }
                })
                .transition()
                .duration(1000)
                .attr("transform", d => {
                    const baseX = xScale(d.year);
                    const baseY = yScale(+d.goals_scored);
                    const jitterX = (Math.random() - 0.5) * 30;
                    const jitterY = (Math.random() - 0.5) * 10;
                    const x = Math.max(0, Math.min(innerWidth, baseX + jitterX));
                    const y = Math.max(0, Math.min(innerHeight, baseY + jitterY));
                    return `translate(${x}, ${y})`;
                });


            points.exit().remove();

            // Add tooltip functionality
            svg.selectAll(".point")
                .on("mouseover", function (event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`<strong>${d.country} vs ${d.opponent}</strong><br/>
                          Result: ${parseInt(d.goals_scored)} - ${parseInt(d.goals_conceded)}<br/>
                          Stage: ${d.round}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function (d) {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Add arrow to show progress
            svg.selectAll(".progress-arrow").remove();
            if (participationYears.length > 1) {
                const firstYear = participationYears[0];
                const lastYear = participationYears[participationYears.length - 1];
                const firstPoint = countryData.find(d => d.year === firstYear);
                const lastPoint = countryData.find(d => d.year === lastYear);

                const startX = xScale(firstYear);
                const startY = yScale(d3.mean(countryData.filter(d => d.year === firstYear), d => +d.goals_scored));
                const endX = xScale(lastYear);
                const endY = yScale(d3.mean(countryData.filter(d => d.year === lastYear), d => +d.goals_scored));

                const arrowPath = d3.path();
                arrowPath.moveTo(startX, startY);
                arrowPath.quadraticCurveTo(
                    (startX + endX) / 2,
                    Math.min(startY, endY) - 30,
                    endX,
                    endY
                );

                svg.append("path")
                    .attr("class", "progress-arrow")
                    .attr("d", arrowPath)
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.5)
                    .attr("marker-end", "url(#arrow)")
                    .raise(); // Ensure the arrow is above all bubbles
            }
        }

        function updateTitle(selectedCountry, countryCode) {
            if (selectedCountry === "United Kingdom") {
                flagImage.attr("href", null);
            } else {
                flagImage.attr("href", `logos/${countryCode}.png`);
            }

            titleText.text(`${selectedCountry}: Goals scored over the years`);

            // Recenter the entire title group after text is updated
            const titleWidth = titleText.node().getBBox().width + 30; // 30 is the approximate width of flag + spacing
            titleGroup.attr("transform", `translate(${(innerWidth - titleWidth) / 2}, ${-margin.top / 5})`);
        }

        // Add arrow marker
        svg.append("defs").append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "black");

        return { update };
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        // Load the data
        Promise.all([
            d3.json("https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/GeoJSON/europe.geojson"),
            d3.csv("country_euro_stats.csv"),
            d3.csv("euro_match_data.csv")
        ]).then(([europeData, countryStats, matchData]) => {

            if (window.Jupyter) {
                window.Jupyter.notebook.events.on("kernel_ready.Kernel", function () {
                    createDashboard(europeData, countryStats, matchData);
                });
            } else {
                createDashboard(europeData, countryStats, matchData);
            }
        }).catch(error => {
            console.error("Error loading the data:", error);
        });
    });
}