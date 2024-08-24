// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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
let totalPointsDisplay, lastFivePredictionsDisplay;

// Get references to DOM elements
document.addEventListener('DOMContentLoaded', () => {
    totalPointsDisplay = document.getElementById('total-points');
    lastFivePredictionsDisplay = document.getElementById('last-five-predictions');

    // Authenticate the user and fetch profile data
    onAuthStateChanged(auth, (user) => {
        if (user) {
            fetchUserProfile(user.uid);
        } else {
            console.log("No user signed in.");
        }
    });
});

// Function to fetch user profile data
function fetchUserProfile(userId) {
    const userRef = ref(database, `users/${userId}/points_by_week`);

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const pointsData = snapshot.val();
            displayTotalPoints(pointsData);
            fetchLastFivePredictions(userId);
        } else {
            console.log("No points data available for this user.");
        }
    }).catch((error) => {
        console.error("Error fetching points data:", error);
    });
}

// Function to display total points sorted by season
function displayTotalPoints(pointsData) {
    let totalPoints = 0;

    // Sum all points for all weeks
    for (let week in pointsData) {
        totalPoints += pointsData[week].points;
    }

    // Display the total points
    if (totalPointsDisplay) {
        totalPointsDisplay.textContent = `Total Points: ${totalPoints}`;
    } else {
        console.error("Total Points Display not found in the DOM.");
    }
}

// Function to fetch the last five predictions
function fetchLastFivePredictions(userId) {
    const predictionsRef = ref(database, `predictions/${userId}`);

    get(predictionsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const predictionsData = snapshot.val();
            displayLastFivePredictions(predictionsData);
        } else {
            console.log("No predictions available for this user.");
        }
    }).catch((error) => {
        console.error("Error fetching predictions:", error);
    });
}

// Function to display the last five predictions
function displayLastFivePredictions(predictionsData) {
    let allPredictions = [];

    // Flatten predictions by week and match into an array
    for (let week in predictionsData) {
        for (let matchId in predictionsData[week]) {
            const prediction = predictionsData[week][matchId];
            prediction.week = week; // Attach the week number to the prediction
            allPredictions.push(prediction);
        }
    }

    // Sort predictions by timestamp in descending order
    allPredictions.sort((a, b) => b.timestamp - a.timestamp);

    // Get the last five predictions
    const lastFivePredictions = allPredictions.slice(0, 5);

    // Display the last five predictions
    if (lastFivePredictionsDisplay) {
        lastFivePredictionsDisplay.innerHTML = ''; // Clear previous content

        lastFivePredictions.forEach((prediction) => {
            const predictionDiv = document.createElement('div');
            predictionDiv.className = 'prediction-item';

            const matchInfo = document.createElement('p');
            matchInfo.textContent = `Week ${prediction.week}: ${prediction.predicted_home_score} - ${prediction.predicted_away_score} (Outcome: ${prediction.predicted_outcome}, Points: ${prediction.points})`;

            predictionDiv.appendChild(matchInfo);
            lastFivePredictionsDisplay.appendChild(predictionDiv);
        });
    } else {
        console.error("Last Five Predictions Display not found in the DOM.");
    }
}
