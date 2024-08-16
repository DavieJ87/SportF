// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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
                const matchElement = createMatchElement(match);
                matchesContainer.appendChild(matchElement);
            }
        }
    });
}


// Function to create a match element
function createMatchElement(match) {
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

    const awayScoreInput = document.createElement('input');
    awayScoreInput.type = 'number';
    awayScoreInput.className = 'away-score';
    awayScoreInput.placeholder = 'Away Score';

    const outcomeSelect = document.createElement('select');
    outcomeSelect.className = 'outcome-select';
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

    const submitButton = document.createElement('button');
    submitButton.className = 'submit-prediction';
    submitButton.textContent = 'Submit Prediction';

    // Append inputs to predictionDiv
    predictionDiv.appendChild(homeScoreInput);
    predictionDiv.appendChild(awayScoreInput);
    predictionDiv.appendChild(outcomeSelect);
    predictionDiv.appendChild(submitButton);

    matchDiv.appendChild(title);
    matchDiv.appendChild(date);
    matchDiv.appendChild(score);
    matchDiv.appendChild(status);
    matchDiv.appendChild(predictionDiv);

    // Event listener for prediction submission
    submitButton.addEventListener('click', () => {
        const predictedHomeScore = parseInt(homeScoreInput.value);
        const predictedAwayScore = parseInt(awayScoreInput.value);
        const predictedOutcome = outcomeSelect.value;

        if (isNaN(predictedHomeScore) || isNaN(predictedAwayScore)) {
            alert('Please enter valid scores for both teams.');
            return;
        }

        savePrediction(match.match_id, predictedHomeScore, predictedAwayScore, predictedOutcome);
    });

    return matchDiv;
}

// Function to save prediction
function savePrediction(matchId, homeScore, awayScore, outcome) {
    const userId = auth.currentUser.uid;
    const predictionsRef = ref(database, `predictions/${userId}/${matchId}`);
    
    set(predictionsRef, {
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        predicted_outcome: outcome
    }).then(() => {
        alert('Prediction saved successfully!');
    }).catch((error) => {
        console.error('Error saving prediction:', error);
    });
}

// Function to calculate points
function calculatePoints(actualHomeScore, actualAwayScore, predictedHomeScore, predictedAwayScore, predictedOutcome) {
    let points = 0;

    const actualOutcome = actualHomeScore > actualAwayScore ? 'home' :
                          actualHomeScore < actualAwayScore ? 'away' : 'draw';

    if (actualOutcome === predictedOutcome) {
        points += 1; // 1 point for correct outcome
    }

    if (actualHomeScore === predictedHomeScore && actualAwayScore === predictedAwayScore) {
        points += 2; // 2 points for exact score
    }

    return points;
}

// Create an instance of the Google provider object
const provider = new GoogleAuthProvider();

// Sign in with a popup
function googleSignIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;

      // The signed-in user info
      const user = result.user;
      console.log("User signed in: ", user);
      
      // Perform any additional actions like saving user details in the database
    })
    .catch((error) => {
      // Handle errors here
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Error during Google Sign-In: ", errorCode, errorMessage);
    });
}

// Call the googleSignIn function on button click
document.getElementById("googleSignInButton").addEventListener("click", googleSignIn);


// Sign out
signOutBtn.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log("Sign-Out successful.");
        })
        .catch((error) => {
            console.error("Error during Sign-Out:", error.code, error.message);
        });
});

// Handle user state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        userInfo.style.display = 'block';
        googleSignInBtn.style.display = 'none';
        userEmail.textContent = `Signed in as: ${user.email}`;
    } else {
        // User is signed out
        userInfo.style.display = 'none';
        googleSignInBtn.style.display = 'block';
    }
});

// Event listener for Google sign-in
googleSignInBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Google Sign-In successful:", result.user);

            // Add or update user data in the database
            const user = result.user;
            const userRef = ref(database, 'users/' + user.uid);
            set(userRef, {
                email: user.email,
                points: 0 // Initialize points if not already set
            });
        })
        .catch((error) => {
            console.error("Error during Google Sign-In:", error);
        });
});


// Fetch matches for the first week by default
fetchMatchesByWeek(1);
