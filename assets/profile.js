// Import Firebase libraries
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


// Function to fetch user profile data
function fetchUserProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const userPointsRef = ref(database, `users/${userId}/total_points`);
    const predictionsRef = ref(database, `predictions/${userId}`);

    // Display user's total points
    get(userPointsRef).then(snapshot => {
        if (snapshot.exists()) {
            document.getElementById('user-points').textContent = `Total Points: ${snapshot.val()}`;
        }
    });

    // Display last 5 predictions
    get(predictionsRef).then(snapshot => {
        if (snapshot.exists()) {
            const predictions = Object.values(snapshot.val());
            const lastFivePredictions = predictions.slice(-5).reverse(); // Get last 5

            const predictionList = document.getElementById('prediction-list');
            predictionList.innerHTML = ''; // Clear the list first

            lastFivePredictions.forEach(prediction => {
                const predictionItem = document.createElement('li');
                predictionItem.textContent = `Match: ${prediction.matchId}, Points: ${prediction.points}`;
                predictionList.appendChild(predictionItem);
            });
        }
    }).catch(error => {
        console.error('Error fetching user predictions:', error);
    });
}

// Load user profile when the page loads
document.addEventListener('DOMContentLoaded', fetchUserProfile);
