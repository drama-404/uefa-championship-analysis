
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
    createTimeline(participationData, tournamentWinners);
});

function createTimeline(data, tournamentWinners) {
    const width = document.getElementById('timeline-container').offsetWidth;
    const height = 600;
    const margin = { top: 150, right: 50, bottom: 150, left: 50 };
    const fontSize = 14;
    const lineHeight = 1.5;
    const lineHeightPx = 20;
    const singleTickHeight = 40;

    // Add expansion years data
    const expansionYears = [
        { year: 1980, text: "Expansion to 8 teams" },
        { year: 1996, text: "Expansion to 16 teams" },
        { year: 2016, text: "Expansion to 24 teams" }
    ];

    // Group data by year
    const groupedData = d3.group(data, d => d.year);
    const preparedData = Array.from(groupedData, ([year, values]) => ({
        year: +year,
        teams: values,
        numberOfLines: values.length
    }));

    let activeTooltip = null;
    let animationStarted = false;

    d3.select("#timeline-container").selectAll("*").remove();

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
    const startButton = d3.select("#start-button")
        .append("button")
        .text("Start")
        .style("font-size", "20px")
        .style("padding", "10px 20px")
        .on("click", function () {
            d3.select(this).style("display", "none");
            animationStarted = true;
            animateLine();
        });

    // Create replay button (initially hidden)
    const replayButton = d3.select("#replay-button")
        .append("button")
        .text("Replay")
        .style("font-size", "16px")
        .style("padding", "5px 10px")
        .style("display", "none")
        .on("click", function () {
            d3.select(this).style("display", "none");
            resetAndAnimate();
        });

    const x = d3.scaleLinear()
        .domain(d3.extent(preparedData, d => d.year))
        .range([margin.left, width - margin.right]);

    const line = svg.append("line")
        .attr("x1", margin.left)
        .attr("y1", height / 2)
        .attr("x2", margin.left)
        .attr("y2", height / 2)
        .attr("stroke", "#FFD700")
        .attr("stroke-width", 2)
        ;

    // Add expansion year lines (initially hidden)
    const expansionLines = svg.selectAll(".expansion-line")
        .data(expansionYears)
        .enter()
        .append("g")
        .attr("class", "expansion-line")
        .attr("transform", d => `translate(${x(d.year)}, 0)`)
        .style("opacity", 0);

    expansionLines.append("line")
        .attr("y1", height / 2 - height * 0.3)
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
        .attr("transform", d => `translate(${x(d.year)}, ${height / 2})`)
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
            showYearTooltip(d, event.pageX, event.pageY);
        }

    }).on("mouseout", function () {
        if ((!activeTooltip || !activeTooltip.classed('country-tooltip')) && animationStarted) {
            hideTooltip();
        }
    });

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
                showCountryTooltip(d, event.pageX, event.pageY);
            }

        })
        .on("mouseout", function (event) {
            // Only hide the tooltip if we're not entering another country item
            if ((!event.relatedTarget || !d3.select(event.relatedTarget).classed('country-item')) && animationStarted) {
                hideTooltip();
            }
        });

    function showYearTooltip(data, x, y) {
        if (activeTooltip && activeTooltip.classed('country-tooltip')) return;

        hideTooltip();
        const winner = tournamentWinners[data.year];
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip year-tooltip')
            .style('left', `${x + 10}px`)
            .style('top', `${y - 10}px`)
            .style('z-index', 1000);

        tooltip.html(`
        <strong style="font-size: 14px;">${data.year}</strong><br>
        <hr>
        <span style="font-weight: bold;">Winner:</span> ${winner.winner}<br>
        <span style="font-weight: bold;">Runner-up:</span> ${winner.runnerUp}<br>
        <span style="font-weight: bold;">Score:</span> ${winner.score}<br>
        <span style="font-weight: bold;">Participants:</span> ${winner.totalParticipants}
    `);

        activeTooltip = tooltip;
    }


    function showCountryTooltip(data, x, y) {
        hideTooltip();
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip country-tooltip')
            .style('left', `${x + 10}px`)
            .style('top', `${y - 10}px`)
            .style('z-index', 1001);

        tooltip.html(`
        <strong style="font-size: 14px;">${data.team}</strong><br>
        <hr>
        <span style="font-weight: bold;">Total Participations:</span> ${data.total_participations}<br>
        <span style="font-weight: bold;">Wins:</span> ${data.total_wins}<br>
        <span style="font-weight: bold;">Final Appearances:</span> ${data.final_appearances}
    `);

        activeTooltip = tooltip;
    }

    function hideTooltip() {
        if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    }

    function resetAndAnimate() {
        animationStarted = false;
        // Reset the timeline
        line.attr("x2", margin.left);
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
            const eventX = x(eventData.year);
            const nextEventX = currentIndex < events.length - 1 ? x(d3.select(events[currentIndex + 1]).datum().year) : width - margin.right;

            const totalAnimationDuration = 800; // Adjust this value to control the overall speed

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

    // // Don't automatically start the animation
    // // The animation will start when the Start button is clicked
    // animateLine();
}

// Handle window resize
// window.addEventListener('resize', () => {
//     // Load both CSV files and create the timeline
//     Promise.all([
//         d3.csv("first_participation.csv"),
//         d3.csv("tournament_winners.csv")
//     ]).then(function ([participationData, winnersData]) {
//         const tournamentWinners = {};
//         winnersData.forEach(d => {
//             tournamentWinners[d.year] = {
//                 winner: d.winner,
//                 runnerUp: d.runnerUp,
//                 score: d.score,
//                 totalParticipants: +d.totalParticipants
//             };
//         });
//         createTimeline(participationData, tournamentWinners);
//     });
// });
// });