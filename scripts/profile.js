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

// Wait for authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById("user-info").innerText = `Hello, ${user.displayName}`;
        loadUserPredictions();
    } else {
        console.log("User is not authenticated, redirecting to login.");
        window.location.href = 'login.html';
    }
});

// Load user's predictions
function loadUserPredictions() {
    const predictionsRef = db.ref(`nba/predictions/${currentUser.uid}`);
    predictionsRef.once('value').then(snapshot => {
        const predictions = snapshot.val();
        if (predictions) {
            displayUserPredictions(predictions);
        } else {
            console.log("No predictions found.");
        }
    }).catch(error => {
        console.error("Error loading predictions:", error);
    });
}

// Display user's predictions and calculate points
function displayUserPredictions(predictions) {
    const predictionList = document.getElementById('predictionList');
    let totalPoints = 0;

    Object.keys(predictions).forEach(gameID => {
        const gameRef = db.ref(`nba/season_2024/${gameID}`);
        gameRef.once('value').then(snapshot => {
            const game = snapshot.val();
            if (game) {
                const homeWin = game.HomeTeamScore > game.AwayTeamScore;
                const predictedWinner = predictions[gameID];

                let correct = false;
                if ((homeWin && predictedWinner === 'home') || (!homeWin && predictedWinner === 'away')) {
                    correct = true;
                    totalPoints += 1;
                }

                const gameRow = document.createElement('div');
                gameRow.innerHTML = `
                    <p>Game: ${game.HomeTeam} vs ${game.AwayTeam}</p>
                    <p>Your prediction: ${predictedWinner}</p>
                    <p>Correct: ${correct ? 'Yes' : 'No'}</p>
                `;
                predictionList.appendChild(gameRow);
            } else {
                console.error(`Game with ID ${gameID} not found.`);
            }
        }).catch(error => {
            console.error(`Error loading game with ID ${gameID}:`, error);
        });
    });

    document.getElementById('totalPoints').innerText = `Total points: ${totalPoints}`;
}
