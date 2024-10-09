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
const db = firebase.database();
const auth = firebase.auth();

let currentUser = null;
let predictions = {};
let totalPoints = 0;

// Wait for authentication
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        document.getElementById("user-info").innerText = `Hello, ${user.displayName}`;
        loadUserPredictions();
    } else {
        console.log("User is not authenticated, redirecting to login.");
        window.location.href = 'login.html';
    }
});

// Load user predictions and calculate points
function loadUserPredictions() {
    const predictionsRef = db.ref(`nba/predictions/${currentUser.uid}`);
    predictionsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            predictions = snapshot.val();
            loadGameResults(); // Compare with game results
        } else {
            console.error("No predictions found");
        }
    }).catch(error => console.error("Error loading predictions:", error));
}

// Load game results and calculate points
function loadGameResults() {
    const scheduleRef = db.ref('nba/season_2024');
    scheduleRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            const games = snapshot.val();
            calculatePoints(games);
        } else {
            console.error("No game results found");
        }
    }).catch(error => console.error("Error loading game results:", error));
}

// Compare predictions with game results and calculate points
function calculatePoints(games) {
    totalPoints = 0;
    const lastFivePredictions = [];

    Object.keys(predictions).forEach(gameID => {
        const prediction = predictions[gameID];
        const game = games[gameID];

        if (game) {
            const actualWinner = game.homeTeamScore > game.awayTeamScore ? 'home' : 'away';
            if (prediction === actualWinner) {
                totalPoints += 1;
            }

            // Add to the last 5 predictions array
            if (lastFivePredictions.length < 5) {
                lastFivePredictions.push({
                    gameID,
                    homeTeam: game.HomeTeamID,
                    awayTeam: game.AwayTeamID,
                    prediction,
                    actualWinner
                });
            }
        }
    });

    displayLastFivePredictions(lastFivePredictions);
    displayTotalPoints(totalPoints);
}

// Display the last 5 predictions
function displayLastFivePredictions(lastFive) {
    const predictionsTable = document.getElementById('predictionsTableBody');
    predictionsTable.innerHTML = '';

    lastFive.forEach(pred => {
        const row = document.createElement('tr');
        const predictedWinner = pred.prediction === 'home' ? 'Home' : 'Away';
        const actualWinner = pred.actualWinner === 'home' ? 'Home' : 'Away';
        const isCorrect = pred.prediction === pred.actualWinner ? 'Correct' : 'Incorrect';

        row.innerHTML = `
            <td>${pred.homeTeam} vs ${pred.awayTeam}</td>
            <td>${predictedWinner}</td>
            <td>${actualWinner}</td>
            <td>${isCorrect}</td>
        `;

        predictionsTable.appendChild(row);
    });
}

// Display the total points
function displayTotalPoints(points) {
    document.getElementById('totalPoints').innerText = `Total Points: ${points}`;
}

// Disable editing after predictions are made
function disablePredictionEditing() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.disabled = true; // Disable all checkboxes
    });
}

// Disable prediction editing after submitting
disablePredictionEditing();
