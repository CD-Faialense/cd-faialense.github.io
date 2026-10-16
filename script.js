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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingMatches = data.matches
            .filter(match =>
                match.homeTeam !== "Home Team" &&
                (match.homeTeam.includes("CD Faialense") ||
                 match.awayTeam.includes("CD Faialense"))
            )
            .map(match => {
                const [monthName, day] = match.date.split("-");
                const monthIndex =
                    new Date(`${monthName} 1, 2026`).getMonth();

                const matchDate = new Date(
                    2026, monthIndex, Number(day)
                );

                matchDate.setHours(0, 0, 0, 0);

                return { ...match, matchDate };
            })
            .filter(match => match.matchDate >= today)
            .sort((a, b) => a.matchDate - b.matchDate);

        const nextMatch = upcomingMatches[0];

        if (!nextMatch) {
            container.innerHTML =
                "<p>No upcoming matches scheduled.</p>";
            return;
        }

        const dateText = nextMatch.matchDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );

        const homeIsFaialense =
            nextMatch.homeTeam.includes("CD Faialense");

        const homeTeam = homeIsFaialense
            ? `<span class="faialense-team">${nextMatch.homeTeam}</span>`
            : `<span class="opponent-team">${nextMatch.homeTeam}</span>`;

        const awayTeam = !homeIsFaialense
            ? `<span class="faialense-team">${nextMatch.awayTeam}</span>`
            : `<span class="opponent-team">${nextMatch.awayTeam}</span>`;

        // If the kickoff time is known, count down to it.
        // Otherwise, count down to midnight at the start of matchday.
        const kickoff = nextMatch.time;
        const timeIsKnown = kickoff &&
            !/tbd|tba|unknown/i.test(kickoff);

        let targetDate = new Date(nextMatch.matchDate);

        if (timeIsKnown) {
            const timeMatch = kickoff.match(
                /(\d{1,2}):(\d{2})\s*(AM|PM)?/i
            );

            if (timeMatch) {
                let hours = Number(timeMatch[1]);
                const minutes = Number(timeMatch[2]);
                const meridiem = timeMatch[3]?.toUpperCase();

                if (meridiem === "PM" && hours < 12) hours += 12;
                if (meridiem === "AM" && hours === 12) hours = 0;

                targetDate.setHours(hours, minutes, 0, 0);
            } else {
                // Unrecognized time format: safely use matchday.
                targetDate.setHours(0, 0, 0, 0);
            }
        }

        const displayTime = timeIsKnown ? kickoff : "TBD";


        container.innerHTML = `

            <div class="match-teams">
                ${homeTeam}
                <span class="match-vs">VS</span>
                ${awayTeam}
            </div>

            <div class="match-details">
                <div class="match-date">${dateText}</div>
                <div class="match-kickoff">Kickoff: ${displayTime}</div>
            </div>

            <div class="countdown-label" id="countdown-label">
                ${timeIsKnown ? "KICKOFF IN" : "MATCHDAY STARTS IN"}
            </div>

            <div class="match-countdown" id="match-countdown">
                Loading countdown...
            </div>
        `;


        function updateCountdown() {
            const countdown = document.getElementById("match-countdown");
            const label = document.getElementById("countdown-label");

            if (!countdown || !label) return;

            const remaining = targetDate.getTime() - Date.now();

            if (remaining <= 0) {
                countdown.textContent = timeIsKnown
                    ? "Kickoff time!"
                    : "Matchday is here!";
                return;
            }

            const totalSeconds = Math.floor(remaining / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            countdown.textContent = 
            `${days > 0 ? `${days}d ` : ""}${days > 0 || hours > 0 ? `${hours}h ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes}m ` : ""} ${seconds}s`;
        }
        
            updateCountdown();
        setInterval(updateCountdown, 1000);

    } catch (error) {
        console.error("Error loading next match:", error);
        container.innerHTML =
            "<p>Unable to load the next match.</p>";
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

/* History Page scripts */


const historyEvents = {
    "Pre-1957": {
        date: "1427-1956",
        title: "Faial - A Ilha Azul",
        description: `In Portugal, there is a group of islands that make up the Azores.
        One of these islands is the beginning of our club's story: A Ilha Azul, Faial.
        Faial, also known as the Blue Island due to its blue hydrangeas lining its roads, 
        was a quaint island spanning only 66 square miles. Between the 18th and 20th centuries,
        it was mostly used as a stopover between Brazil and Asia.`,
        image: "images/Faial-Island-Azores.png",
        alt: "Historical photograph representing Faial's past"
    },

    "1957": {
        date: "1957–1958",
        title: "The Capelinhos Eruption",
        description: `Unfortunately, being a small island didn't mean that Faial stayed out of 
        danger. On September 27, 1957, an underwater eruption from the Capelinhos volcano began 
        and lasted until October 24, 1958. These eruptions destroyed 300 homes in the parishes 
        of Capelo and Praia do Norte in the northern parts of Faial. This destruction led to 
        1,712 people from Faial fleeing to the United States, with another 2,000–3,000 
        people also fleeing from other parts of the Azores. But where could this group of
        almost 2,000 Faialenses end up, you may ask? East Cambridge.`,
        image: "images/capelinhos_eruption.png",
        alt: "Historical photograph representing Faial's past"
    },

    "1971": {
        date: "1971",
        title: "The Founding of Faialense Sport Club",
        description: `Most of the Faialenses who fled had found themselves in Cambridge, Massachusetts. 
        In the summer of 1971, a team was formed under the name Faialense Sport Club, playing in 
        the Luso-American Soccer Association, with every founding member of the team coming
        from the Blue Island.`,
        image: "images/faialense-old-photo.png",
        alt: "Historical photograph of CD Faialense"
    },

    "1984": {
        date: "1984",
        title: "1121 Cambridge Street",
        description: `The team operated for 13 years at multiple locations, with the first and most prominent
        being a converted meat market. In 1984, the club bought a building at 1121 Cambridge Street,
         which has been its official location ever since.`,
        image: "images/clube-photo-internal.png",
        alt: "CD Faialense club trophies"
    },

    "1985-2022": {
        date: "1985-2022",
        title: "Times of Changing",
        description: `In the 1990s, the club's soccer side began to decline, with the group focusing 
        more on the club and community rather than soccer. During this period, the team went 
        through a couple of name changes, being rebranded as PAC Lawrence and then Merrimack Valley 
        United FC in 2014.`,
        image: "images/Merrimack-Valley-United.png",
        alt: "CD Faialense club trophies"
    },

    "2023": {
        date: "2023",
        title: "A new Era for CD Faialense",
        description: `In 2023, the team became CD Faialense, returning to a name connected to the Blue Island 
        and the community that founded the club. That same year, CD Faialense won the BSSL First Division,
        beginning a successful period for the club.`,
        image: "images/team-photo-2023.png",
        alt: "CD Faialense trophies"
    },

    "2024": {
        date: "2024",
        title: "Back-to-Back BSSL Champions",
        description: `CD Faialense continued its success in 2024, winning the BSSL First Division for the 
        second consecutive year. After winning the title in 2023, the club once again finished the season
         as champions. In November they also qualified for the 2025 US Open Cup after win over FCY NY`,
        image: "images/blazing-musket-image.png",
        alt: "CD Faialense trophies"
    },

    "2025": {
        date: "2025",
        title: "Road to the Open Cup",
        description: `In 2025, CD Faialense finished second in the BSSL First Division after winning the 
        title in the previous two seasons. The club played in the first round of the 2025 U.S. Open Cup, 
        facing professional US1 side Portland Hearts of Pine and bringing its name to a wider audience.
        Faialense also qualified for the 2026 version of the Open Cup.`,
        image: "images/qualified.png",
        alt: "CD Faialense team photograph"
    },

    "2026": {
        date: "2026",
        title: "Continuing the Journey",
        description: `In recent years, CD Faialense has been going from strength to strength. The club 
        played the first round of the 2026 U.S. Open Cup, playing against professional USL Championship
        side Rhode Island FC. In the current season, CD Faialense has reached the third qualifying round
        of the 2027 U.S. Open Cup, reached the final of the 2026 BSSL McKenzie Cup, and is currently in a 
        title fight to reclaim its BSSL First Division title and make a third straight appearance in the
        Open Cup.`,
        image: "images/faialense-trophies.png",
        alt: "CD Faialense trophies"
    }
};

function setupHistoryTimeline() {
    const buttons = document.querySelectorAll(".timeline-button");

    const date = document.getElementById("history-date");
    const title = document.getElementById("history-title");
    const description = document.getElementById("history-description");
    const image = document.getElementById("history-image");

    buttons.forEach(function(button) {
        button.addEventListener("click", function() {
            const year = button.dataset.year;
            const event = historyEvents[year];

            if (!event) return;

            date.textContent = event.date;
            title.textContent = event.title;
            description.textContent = event.description;

            image.src = event.image;
            image.alt = event.alt;

            buttons.forEach(function(otherButton) {
                otherButton.classList.remove("active");
            });

            button.classList.add("active");
        });
    });
}

if (document.querySelector(".history-timeline")) {
    setupHistoryTimeline();
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