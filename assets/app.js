// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// Declare variables to hold DOM elements
let weekSelector, matchesContainer, submitWeekBtn;

// Get references to DOM elements
document.addEventListener('DOMContentLoaded', () => {
    weekSelector = document.getElementById('week');
    matchesContainer = document.getElementById('matches-container');
    submitWeekBtn = document.getElementById('submit-week-btn');

    if (!matchesContainer) {
        console.error('Matches Container not found in the DOM.');
        return;
    }

    if (submitWeekBtn) {
        submitWeekBtn.addEventListener('click', () => {
            const predictions = gatherWeekPredictions();
            const selectedWeek = weekSelector.value;
            if (predictions.length > 0) {
                saveWeekPredictions(predictions, selectedWeek);
            } else {
                alert('Please enter predictions for the matches.');
            }
        });
    } else {
        console.error('Submit Week Button not found in the DOM.');
    }

    // Populate week selector with options from 1 to 34 (Bundesliga season weeks)
    if (weekSelector) {
        for (let i = 1; i <= 34; i++) {
            let option = document.createElement('option');
            option.value = i;
            option.text = `Week ${i}`;
            weekSelector.appendChild(option);
        }

        weekSelector.addEventListener('change', () => {
            const selectedWeek = weekSelector.value;
            fetchMatchesByWeek(selectedWeek);
        });
    } else {
        console.error('Week Selector not found in the DOM.');
    }

    // Fetch matches for the selected week on initial load
    fetchMatchesByWeek(weekSelector.value);
});

// Function to fetch matches for a specific week and show user's predictions
function fetchMatchesByWeek(week) {
    const matchesRef = ref(database, 'bundesliga_2023/matches');
    onValue(matchesRef, (snapshot) => {
        const matches = snapshot.val();
        matchesContainer.innerHTML = ''; // Clear previous matches

        for (let matchId in matches) {
            const match = matches[matchId];
            if (match.week_number == week) {
                createMatchElement(match, matchId, week);
            }
        }
    });
}

// Function to create a match element and show existing predictions
function createMatchElement(match, matchId, week) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';

    const title = document.createElement('h3');
    title.textContent = `${match.home_team_name} vs ${match.away_team_name}`;

    const date = document.createElement('p');
    date.textContent = `Date: ${new Date(match.date_time).toLocaleString()}`;

    // Prediction section
    const predictionDiv = document.createElement('div');
    predictionDiv.className = 'prediction';

    const homeScoreInput = document.createElement('input');
    homeScoreInput.type = 'number';
    homeScoreInput.className = 'home-score';
    homeScoreInput.placeholder = 'Home Score';
    homeScoreInput.dataset.matchId = matchId;

    const awayScoreInput = document.createElement('input');
    awayScoreInput.type = 'number';
    awayScoreInput.className = 'away-score';
    awayScoreInput.placeholder = 'Away Score';
    awayScoreInput.dataset.matchId = matchId;

    const outcomeSelect = document.createElement('select');
    outcomeSelect.className = 'outcome-select';
    outcomeSelect.dataset.matchId = matchId;

    const homeOption = document.createElement('option');
    homeOption.value = 'home';
    homeOption.textContent = 'Home Win';

    const awayOption = document.createElement('option');
    awayOption.value = 'away';
    awayOption.textContent = 'Away Win';

    const drawOption = document.createElement('option');
    drawOption.value = 'draw';
    drawOption.textContent = 'Draw';

    outcomeSelect.appendChild(homeOption);
    outcomeSelect.appendChild(awayOption);
    outcomeSelect.appendChild(drawOption);

    // Append inputs to predictionDiv
    predictionDiv.appendChild(homeScoreInput);
    predictionDiv.appendChild(awayScoreInput);
    predictionDiv.appendChild(outcomeSelect);

    matchDiv.appendChild(title);
    matchDiv.appendChild(date);
    matchDiv.appendChild(predictionDiv);

    // Show user's existing predictions
    showExistingPrediction(matchId, homeScoreInput, awayScoreInput, outcomeSelect);

    matchesContainer.appendChild(matchDiv);
}

// Function to show existing predictions
function showExistingPrediction(matchId, homeScoreInput, awayScoreInput, outcomeSelect) {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const predictionRef = ref(database, `predictions/${userId}/${matchId}`);

    get(predictionRef).then((snapshot) => {
        if (snapshot.exists()) {
            const prediction = snapshot.val();
            homeScoreInput.value = prediction.predicted_home_score;
            awayScoreInput.value = prediction.predicted_away_score;
            outcomeSelect.value = prediction.predicted_outcome;
        }
    }).catch((error) => {
        console.error('Error fetching prediction:', error);
    });
}

// Function to gather all predictions for the week
function gatherWeekPredictions() {
    const predictions = [];
    const predictionDivs = matchesContainer.querySelectorAll('.prediction');

    predictionDivs.forEach(predictionDiv => {
        const homeScoreInput = predictionDiv.querySelector('.home-score');
        const awayScoreInput = predictionDiv.querySelector('.away-score');
        const outcomeSelect = predictionDiv.querySelector('.outcome-select');

        const predictedHomeScore = parseInt(homeScoreInput.value);
        const predictedAwayScore = parseInt(awayScoreInput.value);
        const predictedOutcome = outcomeSelect.value;
        const matchId = homeScoreInput.dataset.matchId;

        if (!isNaN(predictedHomeScore) && !isNaN(predictedAwayScore)) {
            predictions.push({
                matchId: matchId,
                predicted_home_score: predictedHomeScore,
                predicted_away_score: predictedAwayScore,
                predicted_outcome: predictedOutcome
            });
        }
    });

    return predictions;
}

// Function to calculate points
function calculatePoints(actualHomeScore, actualAwayScore, predictedHomeScore, predictedAwayScore, predictedOutcome) {
    let points = 0;

    const actualOutcome = actualHomeScore > actualAwayScore ? 'home' :
                          actualHomeScore < actualAwayScore ? 'away' : 'draw';

    if (actualOutcome === predictedOutcome) {
        points += 1; // 1 point for the correct outcome
    }

    if (actualHomeScore === predictedHomeScore && actualAwayScore === predictedAwayScore) {
        points += 3; // 3 points for the exact score
    }

    return points;
}

// Function to save predictions and calculate points for a selected week
function saveWeekPredictions(predictions, selectedWeek) {
    const user = auth.currentUser;
    if (!user) {
        alert("You need to sign in to submit predictions.");
        return;
    }

    const userId = user.uid;
    const updates = {};
    let weekTotalPoints = 0;

    const predictionPromises = predictions.map(prediction => {
        const matchRef = ref(database, `bundesliga_2023/matches/${prediction.matchId}`);

        return get(matchRef).then(snapshot => {
            if (snapshot.exists()) {
                const matchData = snapshot.val();
                const actualHomeScore = matchData.home_team_score;
                const actualAwayScore = matchData.away_team_score;

                // Calculate points based on the prediction and actual match results
                const points = calculatePoints(
                    actualHomeScore,
                    actualAwayScore,
                    prediction.predicted_home_score,
                    prediction.predicted_away_score,
                    prediction.predicted_outcome
                );

                weekTotalPoints += points;

                // Prepare the update object for this specific prediction
                updates[`predictions/${userId}/${selectedWeek}/${prediction.matchId}`] = {
                    predicted_home_score: prediction.predicted_home_score,
                    predicted_away_score: prediction.predicted_away_score,
                    predicted_outcome: prediction.predicted_outcome,
                    points: points, // Store points for the prediction
                    timestamp: Date.now() // Add timestamp
                };
            }
        }).catch(error => {
            console.error('Error fetching match data:', error);
        });
    });

    Promise.all(predictionPromises).then(() => {
        // Store total points for the week
        updates[`users/${userId}/points_by_week/${selectedWeek}`] = {
            points: weekTotalPoints
        };

        // Execute the updates in the database
        update(ref(database), updates).then(() => {
            alert('Predictions saved successfully!');
        }).catch(error => {
            console.error('Error updating database:', error);
        });
    }).catch(error => {
        console.error('Error saving predictions:', error);
    });
}

// Firebase authentication state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User signed in:", user.displayName);
    } else {
        console.log("No user signed in.");
    }
});
