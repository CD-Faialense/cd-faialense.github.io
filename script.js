
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

if (upcomingContainer && previousContainer) {
    fetch("https://cd-faialense-backend.vercel.app/api/schedule")
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not load schedule");
            }
            return response.json();
        })
        .then(data => {
            const matches = data.matches.filter(match =>
                match.homeTeam.toLowerCase().includes("cd faialense") ||
                match.awayTeam.toLowerCase().includes("cd faialense")
            );

            upcomingContainer.replaceChildren();
            previousContainer.replaceChildren();

            matches.forEach(match => {
                const hasScore =
                    match.homeScore !== null &&
                    match.awayScore !== null;

                const card = document.createElement("div");
                card.className = "match-card";

                if (hasScore) {
                    card.classList.add("completed");
                }

                const date = document.createElement("div");
                date.className = "match-date";

                const dateText = document.createElement("span");
                dateText.textContent = match.date || "Date TBD";

                const status = document.createElement("strong");
                status.textContent = hasScore ? "FINAL" : "UPCOMING";

                date.append(dateText, status);

                const info = document.createElement("div");
                info.className = "match-info";

                const teams = document.createElement("h3");
                teams.textContent = `${match.homeTeam} vs ${match.awayTeam}`;

                info.appendChild(teams);

                if (hasScore) {
                    const score = document.createElement("p");
                    score.className = "match-score";
                    score.textContent =
                        `${match.homeScore} - ${match.awayScore}`;
                    info.appendChild(score);
                }

                const location = document.createElement("p");
                location.className = "match-location";
                location.textContent = match.field || "Field information pending";

                info.appendChild(location);

                const time = document.createElement("p");
                time.className = "match-location";
                time.textContent = match.time || "Kickoff time TBD";
                info.appendChild(time);

                card.append(date, info);

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

                (hasScore ? previousContainer : upcomingContainer)
                    .appendChild(card);
            });

            if (!upcomingContainer.hasChildNodes()) {
                upcomingContainer.textContent = "No upcoming matches listed.";
            }

            if (!previousContainer.hasChildNodes()) {
                previousContainer.textContent = "No previous results listed.";
            }
        })
        .catch(error => {
            console.error("Schedule error:", error);
            upcomingContainer.textContent = "Schedule could not load.";
            previousContainer.textContent = "Results could not load.";
        });
}



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