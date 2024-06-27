// Load both CSV files and create the timeline
Promise.all([
    d3.csv("first_participation.csv"),
    d3.csv("tournament_winners.csv")
]).then(function ([participationData, winnersData]) {
    const tournamentWinners = {};
    winnersData.forEach(d => {
        tournamentWinners[d.year] = {
            winner: d.winner,
            runnerUp: d.runnerUp,
            score: d.score,
            totalParticipants: +d.totalParticipants
        };
    });

    // Check if we're in a Jupyter environment
    if (window.Jupyter) {
        window.Jupyter.notebook.events.on("kernel_ready.Kernel", function () {
            createTimeline(participationData, tournamentWinners);
        });
    } else {
        // If not in Jupyter, just call createTimeline directly
        createTimeline(participationData, tournamentWinners);
    }


});

function createTimeline(data, tournamentWinners) {

    const containerEl = document.getElementById('timeline-container');

    const availableWidth = containerEl.offsetWidth;
    const availableHeight = containerEl.offsetHeight;
    const minWidth = 800;
    const minHeight = 600;
    let width = Math.max(minWidth, availableWidth);
    let height = Math.max(minHeight, availableHeight);

    // Adjust for aspect ratio
    const aspectRatio = 16 / 9;
    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    const margin = { top: 150, right: 50, bottom: 150, left: 50 };
    const fontSize = 14;
    const lineHeight = 1.5;
    const lineHeightPx = 20;
    const singleTickHeight = 40;

    const startYear = Math.min(...Object.keys(tournamentWinners).map(Number));
    const endYear = 2024;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const totalYears = years.length - 1;

    // Calculate the width of each year segment
    const yearWidth = (width - margin.left - margin.right) / totalYears;

    // Create a custom scale function using yearWidth
    function customXScale(year) {
        const yearIndex = year - startYear;
        return margin.left + yearIndex * yearWidth;
    }

    // Add expansion years data
    const expansionYears = [
        { year: 1980, text: "Expansion to 8 teams" },
        { year: 1996, text: "Expansion to 16 teams" },
        { year: 2016, text: "Expansion to 24 teams" }
    ];

    // Group data by year
    const groupedData = d3.group(data, d => d.year);
    const preparedData = Array.from(groupedData, ([year, values]) => ({
        year: year,
        teams: values,
        numberOfLines: values.length
    }));

    let animationStarted = false;

    const container = d3.select("#timeline-container")
    container.selectAll("*").remove();


    const svg = d3.select("#timeline-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Add title
    svg.append("text")
        .attr("class", "title")
        .attr("x", margin.left)
        .attr("y", margin.top - 100)
        .text("UEFA EURO Championship Timeline");

    // Add subtitle
    svg.append("text")
        .attr("class", "subtitle")
        .attr("x", margin.left)
        .attr("y", margin.top - 70)
        .text("The Evolution of European Football");

    // Add description
    const description = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top - 40})`);

    description.append("text")
        .attr("class", "description")
        .attr("y", 0)
        .text("This timeline showcases the first appearances of countries");

    description.append("text")
        .attr("class", "description")
        .attr("y", 20)
        .text("in the UEFA EURO Championship from 1960 to 2024.");

    // Add hint
    const hint = svg.append("g")
        .attr("transform", `translate(${width - margin.right}, ${margin.top - 100})`)
        .attr("text-anchor", "end");

    hint.append("text")
        .attr("class", "hint")
        .attr("y", 0)
        .text("🖱️ Hover/click for more info");

    hint.append("text")
        .attr("class", "hint")
        .attr("y", 20)
        .text("on years and countries");

    // Create start button
    const startButtonDiv = container.append("div")
        .attr("id", "start-button")
        .style("position", "absolute")
        .style("top", "50%")
        .style("left", "50%")
        .style("transform", `translate(-50%, -50%)`);

    const startButton = startButtonDiv.append("button")
        .text("Start")
        .style("font-size", "20px")
        .style("padding", "10px 20px")
        .on("click", function () {
            d3.select(this).style("display", "none");
            animationStarted = true;
            animateLine();
        });

    // Create replay button (initially hidden)
    const replayButtonDiv = container.append("div")
        .attr("id", "replay-button")
        .style("position", "absolute")
        .style("bottom", "20px")
        .style("left", "20px");

    const replayButton = replayButtonDiv.append("button")
        .text("Replay")
        .style("font-size", "16px")
        .style("padding", "5px 10px")
        .style("display", "none")
        .on("click", function () {
            d3.select(this).style("display", "none");
            resetAndAnimate();
        });

    // Use customXScale instead of d3.scaleLinear
    const line = svg.append("line")
        .attr("x1", customXScale(startYear))
        .attr("y1", height / 2)
        .attr("x2", customXScale(startYear))
        .attr("y2", height / 2)
        .attr("stroke", "#FFD700")
        .attr("stroke-width", 2);

    // Add expansion year lines (initially hidden)
    const expansionLines = svg.selectAll(".expansion-line")
        .data(expansionYears)
        .enter()
        .append("g")
        .attr("class", "expansion-line")
        .attr("transform", d => `translate(${customXScale(d.year)}, 0)`)
        .style("opacity", 0);

    expansionLines.append("line")
        .attr("y1", height / 2 - height * 0.25)
        .attr("y2", height / 2 + height * 0.3)
        .attr("stroke", "#779dd2")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "5,5");

    expansionLines.append("text")
        .attr("y", height / 2 + height * 0.3 + 20)
        .text(d => d.text)
        .attr("text-anchor", "middle")
        .attr("font-size", fontSize)
        .attr("font-weight", "bold")
        .attr("fill", "#779dd2");

    const events = svg.selectAll(".event")
        .data(preparedData)
        .enter()
        .append("g")
        .attr("class", "event")
        .attr("transform", d => `translate(${customXScale(d.year)}, ${height / 2})`)
        .style("opacity", 0);


    events.append("line")
        .attr("class", "country-tick")
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#FFD700")
        .attr("stroke-width", 2);

    events.append("circle")
        .attr("r", 3)
        .attr("fill", "white")
        .attr("stroke", "black");

    events.append("text")
        .attr("class", "year-text")
        .attr("y", (d, i) => i % 2 === 0 ? 7 : -7)
        .text(d => d.year)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", (d, i) => i % 2 === 0 ? "hanging" : "alphabetic")
        .attr("font-size", fontSize)
        .style("opacity", 0)
        .style("paint-order", "stroke")
        .style("stroke", "white")
        .style("stroke-width", "3px")
        .style("fill", "black");

    events.on("mouseover", function (event, d) {
        if (animationStarted) {
            const [x, y] = d3.pointer(event, svg.node());
            showTooltip(d, x + 10, y - 10, false);
        }
    }).on("mouseout", hideTooltip);

    const countryGroups = events.append("g")
        .attr("class", "country-group")
        .attr("transform", (d, i) => {
            const yOffset = i % 2 === 0 ?
                -(singleTickHeight + 2 + (d.teams.length - 1) * lineHeightPx) :
                singleTickHeight + 2;
            return `translate(0, ${yOffset})`;
        });

    countryGroups.selectAll(".country-item")
        .data(d => d.teams)
        .enter()
        .append("g")
        .attr("class", "country-item")
        .attr("transform", (d, i, nodes) => {
            const parentData = d3.select(nodes[i].parentNode).datum();
            const yOffset = parentData.year % 4 === 0 ?
                i * lineHeightPx :
                -i * lineHeightPx;
            return `translate(0, ${yOffset})`;
        });

    countryGroups.selectAll(".country-item")
        .append("image")
        .attr("xlink:href", d => `/logos/${d.team_code}.png`)
        .attr("width", 18)
        .attr("height", 18)
        .attr("x", -32)
        .attr("y", -12)
        .style("opacity", 0);

    countryGroups.selectAll(".country-item")
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text(d => d.team_code)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", fontSize)
        .style("opacity", 0)
        .style("paint-order", "stroke")
        .style("stroke", "white")
        .style("stroke-width", "1px")
        .style("fill", "white");

    countryGroups.selectAll(".country-item")
        .on("mouseover", function (event, d) {
            if (animationStarted) {
                event.stopPropagation();
                const [x, y] = d3.pointer(event, svg.node());
                showTooltip(d, x + 10, y - 10, true);
            }
        })
        .on("mouseout", hideTooltip);

    // Create a container for tooltips within the SVG
    const tooltipContainer = svg.append("g")
        .attr("class", "tooltip-container")
        .style("opacity", 0);

    tooltipContainer.append("rect")
        .attr("class", "tooltip-bg")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "rgba(255, 255, 255, 0.9")
        .attr("stroke", "#ccc");

    const tooltipText = tooltipContainer.append("text")
        .attr("class", "tooltip-text")
        .attr("x", 5)
        .attr("y", 3);

    function showTooltip(d, x, y, isCountry) {
        let content;
        if (isCountry) {
            content = `<tspan x="5" dy="1.2em" font-weight="bold">${d.team}</tspan>
                        <tspan x="5" dy="1.2em">Total Participations: ${d.total_participations}</tspan>
                        <tspan x="5" dy="1.2em">Wins: ${d.total_wins}</tspan>
                        <tspan x="5" dy="1.2em">Final Appearances: ${d.final_appearances}</tspan>`;
        } else {
            const winner = tournamentWinners[d.year];
            content = `<tspan x="5" dy="1.2em" font-weight="bold">${d.year}</tspan>
                        <tspan x="5" dy="1.2em">Winner: ${winner.winner}</tspan>
                        <tspan x="5" dy="1.2em">Runner-up: ${winner.runnerUp}</tspan>
                        <tspan x="5" dy="1.2em">Score: ${winner.score}</tspan>
                        <tspan x="5" dy="1.2em">Participants: ${winner.totalParticipants}</tspan>`;
        }

        tooltipText.html(content);

        const bbox = tooltipText.node().getBBox();
        tooltipContainer.select(".tooltip-bg")
            .attr("width", bbox.width + 10)
            .attr("height", bbox.height + 10);

        tooltipContainer.attr("transform", `translate(${x},${y})`)
            .transition().duration(200).style("opacity", 1);
    }

    function hideTooltip() {
        tooltipContainer.transition().duration(200).style("opacity", 0);
    }

    function resetAndAnimate() {
        animationStarted = false;
        // Reset the timeline
        line.attr("x2", customXScale(startYear));
        events.style("opacity", 0);
        events.select(".country-tick")
            .attr("y1", 0)
            .attr("y2", 0);
        events.select(".year-text").style("opacity", 0);
        countryGroups.selectAll(".country-item image").style("opacity", 0);
        countryGroups.selectAll(".country-item text").style("opacity", 0);
        expansionLines.style("opacity", 0);

        // Start the animation
        animateLine();
    }

    function animateLine() {
        animationStarted = true;
        const events = d3.selectAll('.event').nodes();
        let currentIndex = 0;

        function animateNextEvent() {

            // Check if animation is complete
            if (currentIndex >= events.length) {
                // Show replay button
                replayButton.style("display", "block");
                return;
            }

            const event = d3.select(events[currentIndex]);
            const eventData = event.datum();
            const eventX = customXScale(eventData.year);
            const nextEventX = currentIndex < events.length - 1 ?
                customXScale(d3.select(events[currentIndex + 1]).datum().year) :
                customXScale(endYear);

            const totalAnimationDuration = 800; // custom overall speed

            // Grow main line to the next event
            line.transition()
                .duration(totalAnimationDuration)
                .ease(d3.easeLinear)
                .attr("x2", nextEventX)
                .on("end", () => {
                    currentIndex++;
                    animateNextEvent();
                });

            event.style("opacity", 1);

            // Animate tick
            const tick = event.select(".country-tick");
            tick.transition()
                .duration(500)
                .attr("y1", (d, i) => currentIndex % 2 === 0 ? -singleTickHeight + 4 : 0)
                .attr("y2", (d, i) => currentIndex % 2 === 0 ? 0 : singleTickHeight - 8);

            // Animate year text
            event.select(".year-text")
                .transition()
                .duration(500)
                .style("opacity", 1);

            // Animate country codes and flags
            const countryItems = event.select(".country-group").selectAll(".country-item");
            const totalItems = countryItems.size();

            countryItems.each(function (d, i) {
                const item = d3.select(this);
                const delay = currentIndex % 2 === 0 ?
                    (totalItems - i - 1) * 200 : // Reverse order for even indices (above the line)
                    i * 200; // Normal order for odd indices (below the line)

                item.select("image")
                    .transition()
                    .delay(delay)
                    .duration(500)
                    .style("opacity", 1);

                item.select("text")
                    .transition()
                    .delay(delay)
                    .duration(500)
                    .style("opacity", 1);
            });

            // Animate expansion line if it's an expansion year
            const expansionLine = expansionLines.filter(d => d.year === eventData.year);
            if (!expansionLine.empty()) {
                expansionLine.transition()
                    .duration(500)
                    .style("opacity", 1);
            }
        }

        // Start the animation
        animateNextEvent();
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    // Load both CSV files and create the timeline
    Promise.all([
        d3.csv("first_participation.csv"),
        d3.csv("tournament_winners.csv")
    ]).then(function ([participationData, winnersData]) {
        const tournamentWinners = {};
        winnersData.forEach(d => {
            tournamentWinners[d.year] = {
                winner: d.winner,
                runnerUp: d.runnerUp,
                score: d.score,
                totalParticipants: +d.totalParticipants
            };
        });
        // Check if we're in a Jupyter environment
        if (window.Jupyter) {
            window.Jupyter.notebook.events.on("kernel_ready.Kernel", function () {
                createTimeline(participationData, tournamentWinners);
            });
        } else {
            // If not in Jupyter, just call createTimeline directly
            createTimeline(participationData, tournamentWinners);
        }
    });
});