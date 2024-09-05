// Firebase configuration
const firebaseConfig = {
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
const database = firebase.database();

// Global variables
let teams = [];
let schedule = [];

// Fetch Teams Data
function fetchTeams() {
    return database.ref("nba/teams").once('value').then((snapshot) => {
        teams = snapshot.val();
    });
}

// Fetch Schedule Data (Season 2024)
function fetchSchedule() {
    return database.ref("nba/season_2024").once('value').then((snapshot) => {
        schedule = snapshot.val();
    });
}

// Display Dates in Horizontal Menu
function displayDateMenu() {
    const dateMenu = document.getElementById("dateMenu");
    const uniqueDates = [...new Set(schedule.map(game => new Date(game.DateTime).toDateString()))];
    
    uniqueDates.forEach(date => {
        const dateButton = document.createElement("button");
        dateButton.setAttribute("data-date", date);
        dateButton.innerText = date;
        dateMenu.appendChild(dateButton);

        // Event listener to fetch games for selected date
        dateButton.addEventListener("click", (event) => {
            const dateSelected = event.target.getAttribute("data-date");
            displayGamesByDate(dateSelected);
        });
    });
}

// Fetch and Display NBA Games by Date
function displayGamesByDate(dateSelected) {
    const gamesForDate = schedule.filter(game => new Date(game.DateTime).toDateString() === dateSelected);
    const gamesTable = document.getElementById("gamesTable");
    gamesTable.innerHTML = ""; // Clear previous games

    gamesForDate.forEach(game => {
        const homeTeam = teams.find(team => team.TeamID === game.GlobalHomeTeamID);
        const awayTeam = teams.find(team => team.TeamID === game.GlobalAwayTeamID);

        const row = document.createElement("tr");

        // Home Team
        const homeTeamCell = document.createElement("td");
        homeTeamCell.innerHTML = `<img src="${homeTeam.WikipediaLogoUrl}" alt="${homeTeam.Name} logo" width="50"/> ${homeTeam.Name}`;
        row.appendChild(homeTeamCell);

        // Away Team
        const awayTeamCell = document.createElement("td");
        awayTeamCell.innerHTML = `<img src="${awayTeam.WikipediaLogoUrl}" alt="${awayTeam.Name} logo" width="50"/> ${awayTeam.Name}`;
        row.appendChild(awayTeamCell);

        // Checkbox for winner prediction
        const winnerCell = document.createElement("td");
        const homeCheckbox = document.createElement("input");
        homeCheckbox.type = "checkbox";
        homeCheckbox.dataset.team = homeTeam.TeamID;

        const awayCheckbox = document.createElement("input");
        awayCheckbox.type = "checkbox";
        awayCheckbox.dataset.team = awayTeam.TeamID;

        // Only allow one checkbox to be selected at a time
        homeCheckbox.addEventListener('change', function () {
            if (this.checked) awayCheckbox.checked = false;
        });

        awayCheckbox.addEventListener('change', function () {
            if (this.checked) homeCheckbox.checked = false;
        });

        winnerCell.appendChild(homeCheckbox);
        winnerCell.appendChild(awayCheckbox);
        row.appendChild(winnerCell);

        gamesTable.appendChild(row);
    });
}

// Submit Predictions
function submitPredictions() {
    const predictions = [];
    const checkboxes = document.querySelectorAll("input[type='checkbox']:checked");

    checkboxes.forEach(checkbox => {
        predictions.push({
            teamID: checkbox.dataset.team,
            gameID: checkbox.dataset.gameId
        });
    });

    const userId = firebase.auth().currentUser.uid;
    database.ref(`predictions/${userId}`).set(predictions).then(() => {
        alert("Predictions submitted successfully!");
    }).catch((error) => {
        console.error("Error submitting predictions:", error);
    });
}

// Initialize Predictor Page
function initPredictor() {
    Promise.all([fetchTeams(), fetchSchedule()]).then(() => {
        displayDateMenu();
    });
}

// Event listener for submit button
document.getElementById("submitBtn").addEventListener("click", submitPredictions);

// Start predictor after Firebase auth
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        initPredictor();
    } else {
        window.location.href = "login.html"; // Redirect to login if not authenticated
    }
});
