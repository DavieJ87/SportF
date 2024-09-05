// Firebase Configuration
var firebaseConfig = {
    apiKey: "AIzaSyDaQnfeZFAFy8FNv1OiTisa50Vao9kT3OI",
    authDomain: "sportf-8c772.firebaseapp.com",
    databaseURL: "https://sportf-8c772-default-rtdb.firebaseio.com",
    projectId: "sportf-8c772",
    storageBucket: "sportf-8c772.appspot.com",
    messagingSenderId: "523775447476",
    appId: "1:523775447476:web:0f7a1a95fdc8fe7e02a2e1"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Load dates from NBA season data
window.onload = function() {
    const dateScroller = document.getElementById("dateScroller");

    // Fetch all game dates
    db.ref('nba/season_2024').once('value', (snapshot) => {
        const games = snapshot.val();
        const dates = new Set();

        // Extract unique dates from games
        for (const gameId in games) {
            const game = games[gameId];
            const gameDate = game.Day.split('T')[0];  // Only date part
            dates.add(gameDate);
        }

        // Display dates in the scroller
        dates.forEach(date => {
            const dateItem = document.createElement("div");
            dateItem.className = "dateItem";
            dateItem.textContent = date;
            dateItem.onclick = () => loadGamesForDate(date);
            dateScroller.appendChild(dateItem);
        });
    });
};

// Load games for selected date
function loadGamesForDate(date) {
    const gameTableBody = document.getElementById("gameTableBody");
    const gameTable = document.getElementById("gameTable");
    const submitButton = document.getElementById("submitButton");

    // Clear previous games
    gameTableBody.innerHTML = '';
    gameTable.style.display = 'none';
    submitButton.style.display = 'none';

    // Fetch games for the selected date
    db.ref('nba/season_2024').orderByChild('Day').equalTo(date).once('value', (snapshot) => {
        const games = snapshot.val();

        if (games) {
            gameTable.style.display = 'block';  // Show table when games are available
            submitButton.style.display = 'block';

            for (const gameId in games) {
                const game = games[gameId];
                const awayTeam = game.AwayTeam;
                const homeTeam = game.HomeTeam;

                // Create row for the game
                const row = document.createElement("tr");

                // Away team logo and name
                const awayTeamCell = document.createElement("td");
                awayTeamCell.innerHTML = `<img src="${game.WikipediaLogoUrl}" alt="${awayTeam} logo" width="40"> ${awayTeam}`;
                row.appendChild(awayTeamCell);

                // Home team logo and name
                const homeTeamCell = document.createElement("td");
                homeTeamCell.innerHTML = `<img src="${game.WikipediaLogoUrl}" alt="${homeTeam} logo" width="40"> ${homeTeam}`;
                row.appendChild(homeTeamCell);

                // Winner selection checkbox
                const winnerCell = document.createElement("td");
                winnerCell.innerHTML = `
                    <input type="radio" name="winner_${gameId}" value="away"> Away 
                    <input type="radio" name="winner_${gameId}" value="home"> Home
                `;
                row.appendChild(winnerCell);

                gameTableBody.appendChild(row);
            }
        }
    });
}

// Submit predictions
document.getElementById("submitButton").onclick = function() {
    const gameTableBody = document.getElementById("gameTableBody");
    const predictions = {};

    // Loop through games and gather user predictions
    for (let i = 0; i < gameTableBody.rows.length; i++) {
        const row = gameTableBody.rows[i];
        const gameId = row.cells[2].querySelector('input').name.split('_')[1];
        const selectedWinner = row.cells[2].querySelector('input[type="radio"]:checked');

        if (selectedWinner) {
            predictions[gameId] = selectedWinner.value;
        }
    }

    const userId = firebase.auth().currentUser.uid;
    db.ref(`predictions/${userId}`).set(predictions)
        .then(() => alert('Predictions saved!'))
        .catch(error => console.error("Error saving predictions:", error));
};
