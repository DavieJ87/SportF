// Firebase config
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
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let teamsData = {};

// Wait for authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById("user-info").innerText = `Hello, ${user.displayName}`;
        loadTeamsData();
    } else {
        console.log("User is not authenticated, redirecting to login.");
        window.location.href = 'login.html';
    }
});

// Load NBA teams data
function loadTeamsData() {
    const teamsRef = db.ref('nba/teams');
    teamsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            teamsData = snapshot.val();
            console.log("Teams data loaded:", teamsData);
            loadUserPredictions();
        } else {
            console.error("No teams data found");
        }
    }).catch(error => console.error("Error loading teams:", error));
}

// Load the user's predictions
function loadUserPredictions() {
    const predictionsRef = db.ref(`nba/predictions/${currentUser.uid}`);
    predictionsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            const predictions = snapshot.val();
            console.log("User predictions loaded:", predictions);
            displayUserPredictions(predictions);
        } else {
            console.log("No predictions found for this user.");
        }
    }).catch(error => console.error("Error loading predictions:", error));
}

// Display last 5 predictions and calculate points
function displayUserPredictions(predictions) {
    const predictionsArray = Object.entries(predictions).slice(-5); // Get the last 5 predictions
    const predictionsTableBody = document.getElementById('predictionsTableBody');
    predictionsTableBody.innerHTML = ''; // Clear previous predictions

    let totalPoints = 0;

    predictionsArray.forEach(([gameID, predictedWinner]) => {
        console.log(`Loading data for gameID: ${gameID}, predictedWinner: ${predictedWinner}`);

        const gameRef = db.ref(`nba/season_2024/${gameID}`);
        gameRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const gameData = snapshot.val();
                console.log(`Game data for gameID ${gameID}:`, gameData);

                const homeTeam = teamsData[gameData.HomeTeamID];
                const awayTeam = teamsData[gameData.AwayTeamID];

                const homeTeamName = homeTeam ? homeTeam.Name : 'Unknown Team';
                const awayTeamName = awayTeam ? awayTeam.Name : 'Unknown Team';

                const homeScore = gameData.homeTeamScore;
                const awayScore = gameData.awayTeamScore;

                // Determine the actual winner
                let actualWinner = '';
                if (homeScore > awayScore) {
                    actualWinner = 'home';
                } else if (awayScore > homeScore) {
                    actualWinner = 'away';
                }

                // Check if the user's prediction is correct
                const isCorrect = actualWinner === predictedWinner;
                if (isCorrect) {
                    totalPoints += 1;
                }

                // Display the prediction in the table
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${awayTeamName} vs ${homeTeamName}</td>
                    <td>${awayScore} - ${homeScore}</td>
                    <td>${predictedWinner === 'home' ? homeTeamName : awayTeamName}</td>
                    <td>${isCorrect ? 'Correct' : 'Incorrect'}</td>
                `;
                predictionsTableBody.appendChild(row);
            } else {
                console.error(`Game with ID ${gameID} not found.`);
            }
        }).catch(error => console.error(`Error loading game data for gameID ${gameID}:`, error));
    });

    document.getElementById('totalPoints').innerText = `Total Points: ${totalPoints}`;
}

// Prevent modifying predictions after submission
document.addEventListener('DOMContentLoaded', function () {
    const predictionInputs = document.querySelectorAll('input[type="checkbox"]');
    predictionInputs.forEach(input => {
        input.disabled = true; // Disable all prediction inputs
    });
});
