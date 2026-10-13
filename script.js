/* Retrieve BSSL*/


/* Retrieve BSSL Standings */

const standingsBody = document.getElementById("standings-body");

if (standingsBody) {
    fetch("https://cd-faialense-backend.vercel.app/api/standings")
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not load standings");
            }

            return response.json();
        })
        .then(data => {
            const teams = data.standings.filter(
                team => team.division === "Division 1"
            );

            standingsBody.replaceChildren();

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
        })
        .catch(error => {
            console.error("Standings error:", error);

            standingsBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 10;
            cell.textContent = "Standings could not load. Please try again later.";

            row.appendChild(cell);
            standingsBody.appendChild(row);
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