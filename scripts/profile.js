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
let teamsData = {};
let totalPoints = 0;

// Wait for authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserProfile(user.uid);
        loadTeamsData();
    } else {
        window.location.href = 'login.html'; // Redirect if not authenticated
    }
});

// Load NBA teams data
function loadTeamsData() {
    const teamsRef = db.ref('nba/teams');
    teamsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            teamsData = snapshot.val();
        } else {
            console.error("No teams data found");
        }
    }).catch(error => console.error("Error loading teams:", error));
}

// Load user profile and display predictions and points
function loadUserProfile(userId) {
    const predictionsRef = db.ref(`nba/predictions/${userId}`);
    predictionsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            const predictions = snapshot.val();
            displayPredictions(predictions);
            calculateTotalPoints(predictions);
        } else {
            console.log("No predictions found for the user.");
        }
    }).catch(error => console.error("Error loading predictions:", error));
}

// Display the last 5 predictions
function displayPredictions(predictions) {
    const predictionsContainer = document.getElementById('predictionsContainer');
    predictionsContainer.innerHTML = '';

    const lastFivePredictions = Object.entries(predictions).slice(-5);
    lastFivePredictions.forEach(([gameID, predictedWinner]) => {
        const gameRef = db.ref(`nba/season_2024/${gameID}`);
        gameRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const game = snapshot.val();
                const homeTeam = teamsData[game.HomeTeamID];
                const awayTeam = teamsData[game.AwayTeamID];
                const homeScore = game.homeTeamScore;
                const awayScore = game.awayTeamScore;

                // Determine the actual winner
                let actualWinner = 'unknown';
                if (homeScore !== undefined && awayScore !== undefined) {
                    actualWinner = homeScore > awayScore ? 'home' : 'away';
                }

                // Prevent changes to predictions once the result is available
                const isGameFinished = homeScore !== undefined && awayScore !== undefined;

                // Create prediction display
                const predictionDiv = document.createElement('div');
                predictionDiv.innerHTML = `
                    <div>
                        <p><b>${awayTeam.Name}</b> vs <b>${homeTeam.Name}</b></p>
                        <p>Your prediction: ${predictedWinner === 'home' ? homeTeam.Name : awayTeam.Name}</p>
                        <p>Actual winner: ${actualWinner === 'home' ? homeTeam.Name : awayTeam.Name}</p>
                        <p>Score: ${homeScore ?? '-'} - ${awayScore ?? '-'}</p>
                    </div>
                `;
                
                // Append to container
                predictionsContainer.appendChild(predictionDiv);
            }
        }).catch(error => console.error("Error loading game data:", error));
    });
}

// Calculate total points for the user based on correct predictions
function calculateTotalPoints(predictions) {
    Object.entries(predictions).forEach(([gameID, predictedWinner]) => {
        const gameRef = db.ref(`nba/season_2024/${gameID}`);
        gameRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const game = snapshot.val();
                const homeScore = game.homeTeamScore;
                const awayScore = game.awayTeamScore;

                // Check the actual winner and compare with the user's prediction
                if (homeScore !== undefined && awayScore !== undefined) {
                    const actualWinner = homeScore > awayScore ? 'home' : 'away';
                    if (actualWinner === predictedWinner) {
                        totalPoints += 1;
                    }
                }

                // Update the total points display
                document.getElementById('totalPoints').innerText = `Total Points: ${totalPoints}`;
            }
        }).catch(error => console.error("Error loading game data for points calculation:", error));
    });
}
