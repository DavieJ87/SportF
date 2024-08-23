// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const database = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let weekSelector, matchesContainer, submitWeekBtn, currentUserId;

document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    authenticateUserWithGoogle();

    if (submitWeekBtn) {
        submitWeekBtn.addEventListener('click', handleWeekSubmit);
    }

    populateWeekSelector();
});

// Initialize DOM elements
function initializeDOMElements() {
    weekSelector = document.getElementById('week');
    matchesContainer = document.getElementById('matches-container');
    submitWeekBtn = document.getElementById('submit-week-btn');
}

// Authenticate user with Google SSO
function authenticateUserWithGoogle() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid; // The authenticated user's UID
            console.log(`User ${user.displayName} is signed in with UID: ${currentUserId}`);
        } else {
            // If no user is signed in, initiate Google SSO
            signInWithPopup(auth, provider)
                .then((result) => {
                    const user = result.user;
                    currentUserId = user.uid;
                    console.log(`User ${user.displayName} signed in with UID: ${currentUserId}`);
                })
                .catch((error) => {
                    console.error('Error during sign-in:', error);
                });
        }
    });
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
        // Initial option to prompt user selection
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = 'Select a Week';
        weekSelector.appendChild(defaultOption);

        for (let i = 1; i <= 34; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `Week ${i}`;
            weekSelector.appendChild(option);
        }

        weekSelector.addEventListener('change', () => {
            const selectedWeek = weekSelector.value;
            if (selectedWeek) {
                fetchMatchesByWeek(selectedWeek);
            } else {
                matchesContainer.innerHTML = ''; // Clear matches container if no week is selected
            }
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
                createMatchElement(match, matchId, week);
            }
        });
    });
}

// Create a match element and display existing predictions
function createMatchElement(match, matchId, selectedWeek) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';

    const title = document.createElement('h3');
    title.textContent = `${match.home_team_name} vs ${match.away_team_name}`;

    const date = document.createElement('p');
    date.textContent = `Date: ${new Date(match.date_time).toLocaleString()}`;

    const predictionDiv = createPredictionElement(matchId, match.date_time);

    matchDiv.appendChild(title);
    matchDiv.appendChild(date);
    matchDiv.appendChild(predictionDiv);

    showExistingPrediction(matchId, selectedWeek, predictionDiv, match.date_time);

    matchesContainer.appendChild(matchDiv);
}

// Create prediction element for match
function createPredictionElement(matchId, matchDateTime) {
    const predictionDiv = document.createElement('div');
    predictionDiv.className = 'prediction';

    const homeScoreInput = createInputElement('home-score', matchId, 'Home Score');
    const awayScoreInput = createInputElement('away-score', matchId, 'Away Score');
    const outcomeSelect = createOutcomeSelectElement(matchId);

    predictionDiv.appendChild(homeScoreInput);
    predictionDiv.appendChild(awayScoreInput);
    predictionDiv.appendChild(outcomeSelect);

    // Commenting out the disabling logic for testing phase
    /*
    // Disable inputs if the match date has passed
    if (new Date(matchDateTime) < new Date()) {
        homeScoreInput.disabled = true;
        awayScoreInput.disabled = true;
        outcomeSelect.disabled = true;
    }
    */

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

    ['Home Win', 'Away Win', 'Draw'].forEach((outcome) => {
        const option = document.createElement('option');
        option.value = outcome.toLowerCase().replace(' ', '');
        option.textContent = outcome;
        outcomeSelect.appendChild(option);
    });

    return outcomeSelect;
}

// Show existing predictions
function showExistingPrediction(matchId, selectedWeek, predictionDiv, matchDateTime) {
    const predictionRef = ref(database, `predictions/${currentUserId}/${selectedWeek}/${matchId}`);

    get(predictionRef).then((snapshot) => {
        if (snapshot.exists()) {
            const prediction = snapshot.val();
            predictionDiv.querySelector('.home-score').value = prediction.predicted_home_score;
            predictionDiv.querySelector('.away-score').value = prediction.predicted_away_score;
            predictionDiv.querySelector('.outcome-select').value = prediction.predicted_outcome;

            // Commenting out the disabling logic for testing phase
            /*
            // If match date has passed, disable inputs to prevent modification
            if (new Date(matchDateTime) < new Date()) {
                predictionDiv.querySelector('.home-score').disabled = true;
                predictionDiv.querySelector('.away-score').disabled = true;
                predictionDiv.querySelector('.outcome-select').disabled = true;
            }
            */
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
        points += 1;
    }

    if (actualHomeScore === predictedHomeScore && actualAwayScore === predictedAwayScore) {
        points += 3;
    }

    return points;
}

// Save week predictions to the database
function saveWeekPredictions(predictions, selectedWeek) {
    const updates = {};
    let weekTotalPoints = 0;

    predictions.forEach(prediction => {
        const matchRef = ref(database, `bundesliga_2023/matches/${prediction.matchId}`);
        
        get(matchRef).then(snapshot => {
            if (snapshot.exists()) {
                const match = snapshot.val();
                const points = calculatePoints(
                    match.home_score,
                    match.away_score,
                    prediction.predicted_home_score,
                    prediction.predicted_away_score,
                    prediction.predicted_outcome
                );

                weekTotalPoints += points;

                updates[`predictions/${currentUserId}/${selectedWeek}/${prediction.matchId}`] = {
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

    // Update user points
    updates[`user_points/${currentUserId}/week_${selectedWeek}_points`] = weekTotalPoints;

    update(ref(database), updates).then(() => {
        alert('Predictions saved successfully!');
    }).catch(error => {
        console.error('Error saving predictions:', error);
    });
}
