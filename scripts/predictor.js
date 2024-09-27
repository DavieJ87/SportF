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
firebase.initializeApp(firebaseConfig);

// Variables
let teams = [];
let gamesByDate = {};

// Function to fetch teams data
function fetchTeams() {
    return firebase.database().ref('nba/teams').once('value')
        .then(snapshot => snapshot.val());
}

// Function to fetch schedule data
function fetchSchedule() {
    return firebase.database().ref('nba/season_2024').once('value')
        .then(snapshot => snapshot.val());
}

// Function to display dates in the scrolling menu
function displayDateMenu(dates) {
    const dateMenuContainer = document.getElementById("dateMenuContainer");
    dateMenuContainer.innerHTML = ''; // Clear any existing dates

    // Show only first 3 dates
    dates.slice(0, 3).forEach(date => {
        const button = document.createElement('button');
        button.textContent = new Date(date).toLocaleDateString();
        button.addEventListener('click', () => displayGamesByDate(gamesByDate[date], teams));
        dateMenuContainer.appendChild(button);
    });
}

// Function to display games for a selected date
function displayGamesByDate(games, teams) {
    const gameTableBody = document.getElementById("gameTableBody");
    gameTableBody.innerHTML = ""; // Clear any existing rows

    games.forEach(game => {
        const homeTeam = teams.find(team => team.TeamID === game.HomeTeamID);
        const awayTeam = teams.find(team => team.TeamID === game.AwayTeamID);

        const homeTeamName = homeTeam ? homeTeam.Name : "Unknown Home Team";
        const awayTeamName = awayTeam ? awayTeam.Name : "Unknown Away Team";

        const homeTeamLogo = homeTeam ? homeTeam.WikipediaLogoUrl : "";
        const awayTeamLogo = awayTeam ? awayTeam.WikipediaLogoUrl : "";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><img src="${awayTeamLogo}" alt="${awayTeamName} logo" width="50"> ${awayTeamName}</td>
            <td><img src="${homeTeamLogo}" alt="${homeTeamName} logo" width="50"> ${homeTeamName}</td>
            <td><input type="checkbox" name="winner" value="${game.GameID}"></td>
        `;

        gameTableBody.appendChild(row);
    });

    document.getElementById("gameTable").classList.remove("hidden");
}

// Function to save predictions to Firebase
function savePredictions(predictions) {
    const userId = firebase.auth().currentUser.uid;
    firebase.database().ref(`predictions/${userId}`).push(predictions)
        .then(() => console.log("Predictions saved successfully"))
        .catch(error => console.error("Error saving predictions:", error));
}

// Function to load existing predictions
function loadPredictions() {
    const userId = firebase.auth().currentUser.uid;
    return firebase.database().ref(`predictions/${userId}`).once('value')
        .then(snapshot => snapshot.val() || {});
}

// Function to handle submission of predictions
document.getElementById("submitBtn").addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('input[name="winner"]:checked');
    const predictions = Array.from(checkboxes).map(checkbox => checkbox.value);
    savePredictions(predictions);
});

// Function to initialize the app
function init() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("User ID:", user.uid); // Ensure the user ID is logged
            
            // Load teams and schedule data
            Promise.all([fetchTeams(), fetchSchedule(), loadPredictions()])
                .then(([teamsData, scheduleData, userPredictions]) => {
                    teams = teamsData;

                    // Group games by date
                    gamesByDate = {};
                    scheduleData.forEach(game => {
                        const date = game.DateTime.split('T')[0];
                        if (!gamesByDate[date]) gamesByDate[date] = [];
                        gamesByDate[date].push(game);
                    });

                    const dates = Object.keys(gamesByDate);
                    displayDateMenu(dates); // Display the date selection menu

                    console.log("Schedule and Teams Data Loaded");
                })
                .catch(error => {
                    console.error("Error loading data:", error);
                });
        } else {
            console.log("User is not signed in.");
        }
    });
}

// Initialize the app
window.onload = init;
