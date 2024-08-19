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

// Get references to DOM elements
const weekSelector = document.getElementById('week');
const matchesContainer = document.getElementById('matches-container');
const googleSignInBtn = document.getElementById('google-sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const submitWeekBtn = document.getElementById('submit-week-btn');

// Populate week selector with options from 1 to 34 (Bundesliga season weeks)
for (let i = 1; i <= 34; i++) {
    let option = document.createElement('option');
    option.value = i;
    option.text = `Week ${i}`;
    weekSelector.appendChild(option);
}

// Event listener for week selector change
weekSelector.addEventListener('change', () => {
    const selectedWeek = weekSelector.value;
    fetchMatchesByWeek(selectedWeek);
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

// Event listener for week predictions submission
submitWeekBtn.addEventListener('click', () => {
    const predictions = gatherWeekPredictions();
    if (predictions.length > 0) {
        saveWeekPredictions(predictions);
    } else {
        alert('Please enter predictions for the matches.');
    }
});

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

function saveWeekPredictions(predictions) {
    const user = auth.currentUser;
    if (!user) {
        alert("You need to sign in to submit predictions.");
        return;
    }
    
    const userId = user.uid;
    const updates = {};

    predictions.forEach(prediction => {
        const predictionPath = `predictions/${userId}/${prediction.matchId}`;
        const matchRef = ref(database, `bundesliga_2023/matches/${prediction.matchId}`);

        get(matchRef).then((snapshot) => {
            if (snapshot.exists()) {
                const matchData = snapshot.val();
                const actualHomeScore = matchData.home_team_score;
                const actualAwayScore = matchData.away_team_score;

                // Calculate points
                const points = calculatePoints(
                    actualHomeScore,
                    actualAwayScore,
                    prediction.predicted_home_score,
                    prediction.predicted_away_score,
                    prediction.predicted_outcome
                );

                // Store the prediction and points
                updates[predictionPath] = {
                    predicted_home_score: prediction.predicted_home_score,
                    predicted_away_score: prediction.predicted_away_score,
                    predicted_outcome: prediction.predicted_outcome,
                    points: points
                };

                // Update the user's total points
                const userPointsRef = ref(database, `users/${userId}/total_points`);
                get(userPointsRef).then((userSnapshot) => {
                    let currentPoints = userSnapshot.exists() ? userSnapshot.val() : 0;
                    currentPoints += points;

                    set(userPointsRef, currentPoints);
                });
            }
        }).catch((error) => {
            console.error('Error fetching match data:', error);
        });
    });

    update(ref(database), updates).then(() => {
        alert('Week predictions saved successfully!');
    }).catch((error) => {
        console.error('Error saving predictions:', error);
    });
}


/* // Function to calculate points based on the prediction
function calculatePoints(actualHomeScore, actualAwayScore, predictedHomeScore, predictedAwayScore, predictedOutcome) {
    let points = 0;

    // Determine actual outcome
    const actualOutcome = actualHomeScore > actualAwayScore ? 'home' :
                          actualHomeScore < actualAwayScore ? 'away' : 'draw';

    if (actualOutcome === predictedOutcome) {
        points += 1; // 1 point for correct outcome
    }

    if (actualHomeScore === predictedHomeScore && actualAwayScore === predictedAwayScore) {
        points += 3; // 3 points for exact score
    }

    return points;
} */

function fetchLastFivePredictions() {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const predictionsRef = ref(database, `predictions/${userId}`);

    get(predictionsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const predictions = snapshot.val();
            const predictionsArray = Object.entries(predictions).map(([key, value]) => ({ matchId: key, ...value }));
            
            // Sort predictions by match ID or timestamp (if available)
            predictionsArray.sort((a, b) => b.matchId - a.matchId);

            // Get the last 5 predictions
            const lastFive = predictionsArray.slice(0, 5);
            const lastPredictionsList = document.getElementById('last-predictions-list');
            lastPredictionsList.innerHTML = ''; // Clear existing list

            lastFive.forEach(prediction => {
                const li = document.createElement('li');
                li.textContent = `Match ID: ${prediction.matchId}, Home Score: ${prediction.predicted_home_score}, Away Score: ${prediction.predicted_away_score}, Outcome: ${prediction.predicted_outcome}, Points: ${prediction.points}`;
                lastPredictionsList.appendChild(li);
            });
        }
    }).catch((error) => {
        console.error('Error fetching predictions:', error);
    });
}

// Call this function on profile.html page load
fetchLastFivePredictions();


function fetchAndDisplayRankings() {
    const usersRef = ref(database, 'users');
    const rankingTableBody = document.getElementById('ranking-table').getElementsByTagName('tbody')[0];

    get(usersRef).then((snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersArray = [];

            // Prepare the users array
            for (let userId in usersData) {
                const userData = usersData[userId];
                usersArray.push({
                    userId: userId,
                    displayName: userData.displayName,
                    totalPoints: userData.total_points || 0
                });
            }

            // Sort users by total points in descending order
            usersArray.sort((a, b) => b.totalPoints - a.totalPoints);

            // Populate the ranking table
            rankingTableBody.innerHTML = '';
            usersArray.forEach((user, index) => {
                const row = rankingTableBody.insertRow();
                const rankCell = row.insertCell(0);
                const nameCell = row.insertCell(1);
                const pointsCell = row.insertCell(2);

                rankCell.textContent = index + 1;
                nameCell.textContent = user.displayName;
                pointsCell.textContent = user.totalPoints;
            });
        }
    }).catch((error) => {
        console.error('Error fetching user rankings:', error);
    });
}

// Call this function on the ranking.html page load
fetchAndDisplayRankings();
function fetchLastFivePredictions() {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const predictionsRef = ref(database, `predictions/${userId}`);

    get(predictionsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const predictions = snapshot.val();
            const predictionsArray = Object.entries(predictions).map(([key, value]) => ({ matchId: key, ...value }));
            
            // Sort predictions by match ID or timestamp (if available)
            predictionsArray.sort((a, b) => b.matchId - a.matchId);

            // Get the last 5 predictions
            const lastFive = predictionsArray.slice(0, 5);
            const lastPredictionsList = document.getElementById('last-predictions-list');
            lastPredictionsList.innerHTML = ''; // Clear existing list

            lastFive.forEach(prediction => {
                const li = document.createElement('li');
                li.textContent = `Match ID: ${prediction.matchId}, Home Score: ${prediction.predicted_home_score}, Away Score: ${prediction.predicted_away_score}, Outcome: ${prediction.predicted_outcome}, Points: ${prediction.points}`;
                lastPredictionsList.appendChild(li);
            });
        }
    }).catch((error) => {
        console.error('Error fetching predictions:', error);
    });
}

// Call this function on profile.html page load
fetchLastFivePredictions();


/* // Handle Google Sign-In
googleSignInBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            // You can access the user's information here
            userInfo.textContent = `Hello, ${user.displayName}`;
            userEmail.textContent = `Email: ${user.email}`;
            googleSignInBtn.style.display = 'none';
            signOutBtn.style.display = 'block';
            document.getElementById('main-content').style.display = 'block';
        })
        .catch((error) => {
            console.error('Error during sign-in:', error);
        });
});

// Handle Sign-Out
signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        userInfo.textContent = '';
        userEmail.textContent = '';
        googleSignInBtn.style.display = 'block';
        signOutBtn.style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
    }).catch((error) => {
        console.error('Error during sign-out:', error);
    });
});

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        userInfo.textContent = `Hello, ${user.displayName}`;
        userEmail.textContent = `Email: ${user.email}`;
        googleSignInBtn.style.display = 'none';
        signOutBtn.style.display = 'block';
        document.getElementById('main-content').style.display = 'block';
    } else {
        // User is signed out
        userInfo.textContent = '';
        userEmail.textContent = '';
        googleSignInBtn.style.display = 'block';
        signOutBtn.style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
    }
}); */

// Fetch matches for the first week by default
fetchMatchesByWeek(1);
