// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// Function to fetch matches for a specific week
function fetchMatchesByWeek(week) {
    const matchesRef = ref(database, 'bundesliga_2023/matches');
    onValue(matchesRef, (snapshot) => {
        const matches = snapshot.val();
        matchesContainer.innerHTML = ''; // Clear previous matches

        for (let matchId in matches) {
            const match = matches[matchId];
            if (match.week_number == week) {
                const matchElement = createMatchElement(match, matchId); // Pass matchId
                matchesContainer.appendChild(matchElement);
            }
        }
    });
}

// Function to create a match element
function createMatchElement(match, matchId) { // Include matchId as parameter
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';

    const title = document.createElement('h3');
    title.textContent = `${match.home_team_name} vs ${match.away_team_name}`;

    const date = document.createElement('p');
    date.textContent = `Date: ${new Date(match.date_time).toLocaleString()}`;

      const score = document.createElement('p');
    score.textContent = `Score: ${match.home_team_score} - ${match.away_team_score}`;

    const status = document.createElement('p');
    status.textContent = `Status: ${match.status}`;

    // Prediction section
    const predictionDiv = document.createElement('div');
    predictionDiv.className = 'prediction';

    const homeScoreInput = document.createElement('input');
    homeScoreInput.type = 'number';
    homeScoreInput.className = 'home-score';
    homeScoreInput.placeholder = 'Home Score';
    homeScoreInput.dataset.matchId = matchId; // Store match ID in data attribute

    const awayScoreInput = document.createElement('input');
    awayScoreInput.type = 'number';
    awayScoreInput.className = 'away-score';
    awayScoreInput.placeholder = 'Away Score';
    awayScoreInput.dataset.matchId = matchId; // Store match ID in data attribute

    const outcomeSelect = document.createElement('select');
    outcomeSelect.className = 'outcome-select';
    outcomeSelect.dataset.matchId = matchId; // Store match ID in data attribute

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
    matchDiv.appendChild(score);
    matchDiv.appendChild(status);
    matchDiv.appendChild(predictionDiv);

    return matchDiv;
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
        const matchId = homeScoreInput.dataset.matchId; // Access match ID

        if (!isNaN(predictedHomeScore) && !isNaN(predictedAwayScore)) {
            predictions.push({
                matchId: matchId, // Ensure matchId is included
                predicted_home_score: predictedHomeScore,
                predicted_away_score: predictedAwayScore,
                predicted_outcome: predictedOutcome
            });
        }
    });

    return predictions;
}

// Function to save all predictions for the week
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
        updates[predictionPath] = {
            predicted_home_score: prediction.predicted_home_score,
            predicted_away_score: prediction.predicted_away_score,
            predicted_outcome: prediction.predicted_outcome
        };
    });

    update(ref(database), updates).then(() => {
        alert('Week predictions saved successfully!');
    }).catch((error) => {
        console.error('Error saving predictions:', error);
    });
}

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
