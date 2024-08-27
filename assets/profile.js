// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// DOM elements
let userNameElem = document.getElementById('user-name');
let userEmailElem = document.getElementById('user-email');
let userPhotoElem = document.getElementById('user-photo');
let totalPointsElem = document.getElementById('total-points');
let recentPredictionsContainer = document.getElementById('recent-predictions');
let logoutBtn = document.getElementById('logout-btn');

// Function to display user profile information
function displayUserProfile(user) {
    if (userNameElem) userNameElem.textContent = user.displayName;
    if (userEmailElem) userEmailElem.textContent = user.email;
    if (userPhotoElem) userPhotoElem.src = user.photoURL || 'default-profile.png'; // Use a default image if the user doesn't have a photo

    // Fetch and display user's total points
    fetchTotalPoints(user.uid);

    // Fetch and display the user's most recent predictions
    fetchRecentPredictions(user.uid);
}

// Function to fetch and display the user's total points
function fetchTotalPoints(userId) {
    const userPointsRef = ref(database, `users/${userId}/points_by_week`);
    onValue(userPointsRef, (snapshot) => {
        if (snapshot.exists()) {
            const pointsByWeek = snapshot.val();
            let totalPoints = 0;

            for (let week in pointsByWeek) {
                totalPoints += pointsByWeek[week].points || 0;
            }

            if (totalPointsElem) {
                totalPointsElem.textContent = `Total Points: ${totalPoints}`;
            }
        } else {
            console.log("No points data available for this user.");
            if (totalPointsElem) {
                totalPointsElem.textContent = "Total Points: 0";
            }
        }
    }, (error) => {
        console.error('Error fetching total points:', error);
    });
}

// Function to fetch and display the user's recent predictions
function fetchRecentPredictions(userId) {
    const userPredictionsRef = ref(database, `predictions/${userId}`);

    get(userPredictionsRef).then((snapshot) => {
        if (snapshot.exists()) {
            const predictions = snapshot.val();
            const recentPredictions = [];
            const maxRecent = 5;

            // Flatten predictions and sort by timestamp
            Object.keys(predictions).forEach(week => {
                Object.keys(predictions[week]).forEach(matchId => {
                    const prediction = predictions[week][matchId];
                    prediction.week = week; // Add the week information
                    prediction.matchId = matchId; // Add match ID information
                    recentPredictions.push(prediction);
                });
            });

            // Sort predictions by timestamp and get the latest 5
            recentPredictions.sort((a, b) => b.timestamp - a.timestamp);
            const latestPredictions = recentPredictions.slice(0, maxRecent);

            // Display the predictions
            if (recentPredictionsContainer) {
                recentPredictionsContainer.innerHTML = ""; // Clear previous content
                latestPredictions.forEach(prediction => {
                    const predictionElem = document.createElement('div');
                    predictionElem.className = 'prediction-item';
                    predictionElem.innerHTML = `
                        <p>Week: ${prediction.week}</p>
                        <p>Match: ${prediction.matchId}</p>
                        <p>Predicted: ${prediction.predicted_home_score} - ${prediction.predicted_away_score}</p>
                        <p>Outcome: ${prediction.predicted_outcome}</p>
                        <p>Points: ${prediction.points}</p>
                        <p>Date: ${new Date(prediction.timestamp).toLocaleString()}</p>
                    `;
                    recentPredictionsContainer.appendChild(predictionElem);
                });
            }
        } else {
            console.log("No recent predictions found for this user.");
            if (recentPredictionsContainer) {
                recentPredictionsContainer.innerHTML = "<p>No recent predictions available.</p>";
            }
        }
    }).catch((error) => {
        console.error('Error fetching predictions:', error);
    });
}

// Function to handle user logout
function handleLogout() {
    signOut(auth).then(() => {
        window.location.href = "index.html"; // Redirect to homepage after logout
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        displayUserProfile(user);
    } else {
        window.location.href = "index.html"; // Redirect to homepage if not signed in
    }
});

// Logout button event listener
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
} else {
    console.error('Logout button not found in the DOM.');
}
