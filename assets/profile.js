import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Get current user
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, let's fetch their points and predictions
        fetchUserTotalPoints(user.uid);
        fetchLastFivePredictions(user.uid);
    } else {
        console.log('No user is signed in.');
        document.getElementById('total-points').textContent = "Please sign in to see your profile.";
        document.getElementById('last-five-predictions').innerHTML = "<p>Please sign in to see your predictions.</p>";
    }
});

// Fetch and display the user's total points
function fetchUserTotalPoints(userId) {
    const userPointsRef = ref(database, `users/${userId}/total_points`);

    get(userPointsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const totalPoints = snapshot.val();
            document.getElementById('total-points').textContent = `Total Points: ${totalPoints}`;
        } else {
            console.log('No points data available for this user.');
            document.getElementById('total-points').textContent = "Total Points: 0";
        }
    }).catch((error) => {
        console.error('Error fetching total points:', error);
    });
}

// Fetch and display the last five predictions
function fetchLastFivePredictions(userId) {
    const predictionsRef = ref(database, `predictions/${userId}`);

    get(predictionsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const predictions = snapshot.val();
            const predictionsArray = [];

            // Convert predictions object to an array with additional metadata
            Object.keys(predictions).forEach(week => {
                Object.keys(predictions[week]).forEach(matchId => {
                    predictionsArray.push({
                        week,
                        matchId,
                        ...predictions[week][matchId]
                    });
                });
            });

            // Sort by timestamp or match ID
            predictionsArray.sort((a, b) => b.timestamp - a.timestamp || b.matchId - a.matchId);

            // Get the last 5 predictions
            const lastFive = predictionsArray.slice(0, 5);
            const lastPredictionsList = document.getElementById('last-five-predictions');
            lastPredictionsList.innerHTML = ''; // Clear existing list

            if (lastFive.length === 0) {
                lastPredictionsList.innerHTML = "<p>No predictions available.</p>";
            } else {
                lastFive.forEach(prediction => {
                    const predictionItem = document.createElement('div');
                    predictionItem.className = 'prediction-item';

                    // Fetching match details
                    const matchRef = ref(database, `matches/${prediction.matchId}`);
                    get(matchRef).then(matchSnapshot => {
                        if (matchSnapshot.exists()) {
                            const matchData = matchSnapshot.val();
                            const homeTeam = matchData.home_team;
                            const awayTeam = matchData.away_team;

                            predictionItem.innerHTML = `
                                <p><strong>Week ${prediction.week}</strong></p>
                                <p>${homeTeam} vs ${awayTeam}</p>
                                <p>Predicted Score: ${prediction.predicted_home_score} - ${prediction.predicted_away_score}</p>
                                <p>Outcome: ${prediction.predicted_outcome}, Points: ${prediction.points}</p>
                                <p><small>Timestamp: ${prediction.timestamp ? new Date(prediction.timestamp).toLocaleString() : 'N/A'}</small></p>
                            `;
                        } else {
                            console.error(`No match data found for match ID: ${prediction.matchId}`);
                            predictionItem.innerHTML = `<p>Error loading match details for week ${prediction.week}</p>`;
                        }

                        lastPredictionsList.appendChild(predictionItem);
                    }).catch(error => {
                        console.error(`Error fetching match data for match ID: ${prediction.matchId}`, error);
                    });
                });
            }
        } else {
            console.log('No predictions data available for this user.');
            document.getElementById('last-five-predictions').innerHTML = "<p>No predictions available.</p>";
        }
    }).catch((error) => {
        console.error('Error fetching predictions:', error);
    });
}
