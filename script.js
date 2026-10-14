/* Next Match */
async function loadNextMatch() {
    const container = document.getElementById("next-match-content");

    if (!container) return;

    try {
        const response = await fetch(
            "https://cd-faialense-backend.vercel.app/api/schedule"
        );

        if (!response.ok) {
            throw new Error("Failed to load schedule");
        }

        const data = await response.json();

        console.log("Schedule data:", data);

        // We'll select the next match in the next step.
    } catch (error) {
        console.error("Error loading next match:", error);
        container.innerHTML = "<p>Unable to load the next match.</p>";
    }
}

loadNextMatch();


/* Retrieve BSSL Standings */

const standingsBody = document.getElementById("standings-body");
const seasonSelect = document.getElementById("season-select");
const seasonSubtitle = document.getElementById("season-subtitle");

async function loadStandings(year) {
    if (!standingsBody) return;

    standingsBody.replaceChildren();

    const loadingRow = document.createElement("tr");
    const loadingCell = document.createElement("td");
    loadingCell.colSpan = 10;
    loadingCell.textContent = "Loading standings...";
    loadingRow.appendChild(loadingCell);
    standingsBody.appendChild(loadingRow);

    try {
        const response = await fetch(
            `https://cd-faialense-backend.vercel.app/api/standings?year=${year}`
        );

        if (!response.ok) {
            throw new Error("Could not load standings");
        }

        const data = await response.json();

        const teams = data.standings.filter(
            team => team.division === "Division 1"
        );

        standingsBody.replaceChildren();

        if (teams.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 10;
            cell.textContent = "No standings available for this season.";
            row.appendChild(cell);
            standingsBody.appendChild(row);
            return;
        }

        teams.forEach(team => {
            const row = document.createElement("tr");

            if (team.team === "CD Faialense") {
                row.classList.add("faialense-row");
            }

            const values = [
                team.position,
                team.team,
                team.played,
                team.wins,
                team.losses,
                team.draws,
                team.goalsFor,
                team.goalsAgainst,
                team.goalDifference > 0
                    ? `+${team.goalDifference}`
                    : team.goalDifference,
                team.points
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            standingsBody.appendChild(row);
        });

    } catch (error) {
        console.error("Standings error:", error);

        standingsBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 10;
        cell.textContent = "Standings could not load. Please try again later.";
        row.appendChild(cell);
        standingsBody.appendChild(row);
    }

    if (seasonSubtitle) {
        seasonSubtitle.textContent =
            `Bay State Soccer League — ${year} Season`;
    }
}

if (standingsBody && seasonSelect) {
    seasonSelect.addEventListener("change", () => {
        loadStandings(seasonSelect.value);
    });

    loadStandings(seasonSelect.value);
}



/* Schedule */

const upcomingContainer = document.getElementById("upcoming-matches");
const previousContainer = document.getElementById("previous-matches");

async function loadSchedule() {
    if (!upcomingContainer || !previousContainer) {
        return;
    }

    try {
        const response = await fetch(
            "https://cd-faialense-backend.vercel.app/api/schedule"
        );

        if (!response.ok) {
            throw new Error(`Schedule request failed: ${response.status}`);
        }

        const data = await response.json();

        // Keep only CD Faialense matches and exclude the table header.
        const matches = data.matches.filter(match => {
            const home = match.homeTeam.toLowerCase();
            const away = match.awayTeam.toLowerCase();

            return (
                (home.includes("cd faialense") ||
                    away.includes("cd faialense")) &&
                home !== "home team" &&
                away !== "away team"
            );
        });

        // Convert dates such as "Oct-17" into 2026 dates.
        function getMatchDate(match) {
            const [month, day] = match.date.split("-");

            const monthNumbers = {
                Jan: 0,
                Feb: 1,
                Mar: 2,
                Apr: 3,
                May: 4,
                Jun: 5,
                Jul: 6,
                Aug: 7,
                Sep: 8,
                Oct: 9,
                Nov: 10,
                Dec: 11
            };

            return new Date(2026, monthNumbers[month], Number(day));
        }

        // Today's date, without the time.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Upcoming matches: soonest first.
        const upcomingMatches = matches
            .filter(match => getMatchDate(match) >= today)
            .sort((a, b) => getMatchDate(a) - getMatchDate(b));

        // Previous matches: only past games with recorded scores,
        // ordered from newest to oldest.
        const previousMatches = matches
            .filter(match =>
                getMatchDate(match) < today &&
                match.homeScore !== null &&
                match.awayScore !== null
            )
            .sort((a, b) => getMatchDate(b) - getMatchDate(a));

        // Build and display the match cards.
        function renderMatches(matchList, container, isUpcoming) {
            container.replaceChildren();

            if (matchList.length === 0) {
                container.textContent = isUpcoming
                    ? "No upcoming matches listed."
                    : "No previous results listed.";
                return;
            }

            matchList.forEach(match => {
                const hasScore =
                    match.homeScore !== null &&
                    match.awayScore !== null;

                const card = document.createElement("div");
                card.className = "match-card";

                if (hasScore) {
                    card.classList.add("completed");
                }

                // Date and status.
                const date = document.createElement("div");
                date.className = "match-date";

                const dateText = document.createElement("span");
                dateText.textContent = match.date || "Date TBD";

                const status = document.createElement("strong");
                status.textContent = hasScore ? "FINAL" : "UPCOMING";

                date.append(dateText, status);

                // Teams and match details.
                const info = document.createElement("div");
                info.className = "match-info";

                const teams = document.createElement("h3");
                teams.textContent =
                    `${match.homeTeam} vs ${match.awayTeam}`;

                info.appendChild(teams);

                // Show the score when available.
                if (hasScore) {
                    const score = document.createElement("p");
                    score.className = "match-score";
                    score.textContent =
                        `${match.homeScore} - ${match.awayScore}`;

                    info.appendChild(score);
                }

                // Venue.
                const location = document.createElement("p");
                location.className = "match-location";
                location.textContent =
                    match.field || "Field information pending";

                info.appendChild(location);

                // Kickoff time.
                const time = document.createElement("p");
                time.className = "match-location";
                time.textContent =
                    match.time || "Kickoff time TBD";

                info.appendChild(time);

                card.append(date, info);

                // Show CD Faialense's result for completed matches.
                if (hasScore) {
                    const result = document.createElement("div");
                    result.className = "match-result";

                    const isHome = match.homeTeam
                        .toLowerCase()
                        .includes("cd faialense");

                    const clubScore = isHome
                        ? match.homeScore
                        : match.awayScore;

                    const opponentScore = isHome
                        ? match.awayScore
                        : match.homeScore;

                    result.textContent =
                        clubScore > opponentScore ? "W" :
                        clubScore < opponentScore ? "L" : "D";

                    card.appendChild(result);
                }

                container.appendChild(card);
            });
        }

        renderMatches(
            upcomingMatches,
            upcomingContainer,
            true
        );

        renderMatches(
            previousMatches,
            previousContainer,
            false
        );

    } catch (error) {
        console.error("Schedule error:", error);

        upcomingContainer.textContent =
            "Schedule could not load. Please try again later.";

        previousContainer.textContent =
            "Results could not load. Please try again later.";
    }
}

loadSchedule();



/* Header + Footer */

fetch("header.html")
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("afterbegin", data);
    });

fetch("footer.html")
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("beforeend", data);
    });