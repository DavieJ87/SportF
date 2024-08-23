// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
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
let weekSelector, matchesContainer, googleSignInBtn, signOutBtn, userInfo, userEmail, submitWeekBtn;

// Get references to DOM elements
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();

    if (submitWeekBtn) {
        submitWeekBtn.addEventListener('click', handleWeekSubmit);
    }

    populateWeekSelector();
});

// Initialize DOM elements
function initializeDOMElements() {
    weekSelector = document.getElementById('week');
    matchesContainer = document.getElementById('matches-container');
    googleSignInBtn = document.getElementById('google-sign-in-btn');
    signOutBtn = document.getElementById('sign-out-btn');
    userInfo = document.getElementById('user-info');
    userEmail = document.getElementById('user-email');
    submitWeekBtn = document.getElementById('submit-week-btn');
}

// Handle week submit button click
function handleWeekSubmit() {
    const predictions = gatherWeekPredictions();
    const selectedWeek = weekSelector.value;
    if (predictions.length > 0) {
        saveWeekPredictions(predictions, selectedWeek);
    } else {
        alert('Please enter predictions for the matches.');
    }
}

// Populate week selector with options from 1 to 34 (Bundesliga season weeks)
function populateWeekSelector() {
    if (weekSelector) {
        for (let i = 1; i <= 34; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `Week ${i}`;
            weekSelector.appendChild(option);
        }

        weekSelector.addEventListener('change', () => {
            const selectedWeek = weekSelector.value;
            fetchMatchesByWeek(selectedWeek);
        });
    }
}

// Fetch matches for a specific week and display them
function fetchMatchesByWeek(week) {
    const matchesRef = ref(database, 'bundesliga_2023/matches');
    onValue(matchesRef, (snapshot) => {
        const matches = snapshot.val();
        matchesContainer.innerHTML = '';

        Object.keys(matches).forEach((matchId) => {
            const match = matches[matchId];
            if (match.week_number == week) {
                createMatchElement(match, matchId);
            }
        });
    });
}

// Create a match element and display existing predictions
function createMatchElement(match, matchId) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';

    const title = document.createElement('h3');
    title.textContent = `${match.home_team_name} vs ${match.away_team_name}`;

    const date = document.createElement('p');
    date.textContent = `Date: ${new Date(match.date_time).toLocaleString()}`;

    const predictionDiv = createPredictionElement(matchId);

    matchDiv.appendChild(title);
    matchDiv.appendChild(date);
    matchDiv.appendChild(predictionDiv);

    showExistingPrediction(matchId, predictionDiv);

    matchesContainer.appendChild(matchDiv);
}

// Create prediction element for match
function createPredictionElement(matchId) {
    const predictionDiv = document.createElement('div');
    predictionDiv.className = 'prediction';

    const homeScoreInput = createInputElement('home-score', matchId, 'Home Score');
    const awayScoreInput = createInputElement('away-score', matchId, 'Away Score');
    const outcomeSelect = createOutcomeSelectElement(matchId);

    predictionDiv.appendChild(homeScoreInput);
    predictionDiv.appendChild(awayScoreInput);
    predictionDiv.appendChild(outcomeSelect);

    return predictionDiv;
}

// Create an input element
function createInputElement(className, matchId, placeholder) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = className;
    input.placeholder = placeholder;
    input.dataset.matchId = matchId;
    return input;
}

// Create an outcome select element
function createOutcomeSelectElement(matchId) {
    const outcomeSelect = document.createElement('select');
    outcomeSelect.className = 'outcome-select';
    outcomeSelect.dataset.matchId = matchId;

    ['Home Win', 'Away Win', 'Draw'].forEach((outcome, index) => {
        const option = document.createElement('option');
        option.value = outcome.toLowerCase().replace(' ', '');
        option.textContent = outcome;
        outcomeSelect.appendChild(option);
    });

    return outcomeSelect;
}

// Show existing predictions
function showExistingPrediction(matchId, predictionDiv) {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const predictionRef = ref(database, `predictions/${userId}/${matchId}`);

    get(predictionRef).then((snapshot) => {
        if (snapshot.exists()) {
            const prediction = snapshot.val();
            predictionDiv.querySelector('.home-score').value = prediction.predicted_home_score;
            predictionDiv.querySelector('.away-score').value = prediction.predicted_away_score;
            predictionDiv.querySelector('.outcome-select').value = prediction.predicted_outcome;
        }
    }).catch((error) => {
        console.error('Error fetching prediction:', error);
    });
}

// Gather all predictions for the week
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

// Calculate points based on predictions
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

// Save predictions and calculate points
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

                const points = calculatePoints(
                    actualHomeScore,
                    actualAwayScore,
                    prediction.predicted_home_score,
                    prediction.predicted_away_score,
                    prediction.predicted_outcome
                );

                weekTotalPoints += points;

                updates[`predictions/${userId}/${selectedWeek}/${prediction.matchId}`] = {
                    predicted_home_score: prediction.predicted_home_score,
                    predicted_away_score: prediction.predicted_away_score,
                    predicted_outcome: prediction.predicted_outcome,
                    points: points
                };
            }
        }).catch(error => {
            console.error('Error fetching match data:', error);
        });
    });

    // Update user's weekly and total points
    Promise.all(predictionPromises).then(() => {
        updates[`users/${userId}/weekly_points/${selectedWeek}`] = weekTotalPoints;

        get(ref(database, `users/${userId}/total_points`)).then(snapshot => {
            let totalPoints = snapshot.exists() ? snapshot.val() : 0;
            totalPoints += weekTotalPoints;
            updates[`users/${userId}/total_points`] = totalPoints;

            update(ref(database), updates).then(() => {
                alert('Predictions submitted successfully!');
            }).catch(error => {
                console.error('Error updating predictions:', error);
            });
        }).catch(error => {
            console.error('Error fetching total points:', error);
        });
    }).catch(error => {
        console.error('Error saving predictions:', error);
    });
}

// Sign in with Google
function signInWithGoogle() {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then(result => {
            const user = result.user;
            userInfo.style.display = 'block';
            userEmail.textContent = user.email;
            googleSignInBtn.style.display = 'none';
            signOutBtn.style.display = 'block';
        })
        .catch(error => {
            console.error('Google sign-in error:', error);
        });
}

// Sign out
function signOutUser() {
    signOut(auth)
        .then(() => {
            userInfo.style.display = 'none';
            googleSignInBtn.style.display = 'block';
            signOutBtn.style.display = 'none';
        })
        .catch(error => {
            console.error('Sign-out error:', error);
        });
}

// Authentication state observer
onAuthStateChanged(auth, user => {
    if (user) {
        userInfo.style.display = 'block';
        userEmail.textContent = user.email;
        googleSignInBtn.style.display = 'none';
        signOutBtn.style.display = 'block';
    } else {
        userInfo.style.display = 'none';
        googleSignInBtn.style.display = 'block';
        signOutBtn.style.display = 'none';
    }
});

// Event listeners for sign-in and sign-out buttons
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', signInWithGoogle);
}

if (signOutBtn) {
    signOutBtn.addEventListener('click', signOutUser);
}
