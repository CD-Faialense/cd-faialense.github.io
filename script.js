
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