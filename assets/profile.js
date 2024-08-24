// profile.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase configuration (replace with your actual config)
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

// DOM Elements
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const totalPointsEl = document.getElementById('total-points');
const lastPredictionsEl = document.getElementById('last-predictions');

// Authenticate User and Initialize Profile
onAuthStateChanged(auth, (user) => {
    if (user) {
        displayUserInfo(user);
        fetchAndDisplayTotalPoints(user.uid);
        fetchAndDisplayLastFivePredictions(user.uid);
    } else {
        // If not signed in, initiate sign-in
        signInWithPopup(auth, provider)
            .then((result) => {
                const signedInUser = result.user;
                displayUserInfo(signedInUser);
                fetchAndDisplayTotalPoints(signedInUser.uid);
                fetchAndDisplayLastFivePredictions(signedInUser.uid);
            })
            .catch((error) => {
                console.error('Error during sign-in:', error);
            });
    }
});

// Function to Display User Information
function displayUserInfo(user) {
    userNameEl.textContent = `Name: ${user.displayName}`;
    userEmailEl.textContent = `Email: ${user.email}`;
}

// Function to Fetch and Display Total Points by Season
function fetchAndDisplayTotalPoints(userId) {
    const userPointsRef = ref(database, `user_points/${userId}`);
    get(userPointsRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const seasonsData = snapshot.val();
                displayTotalPoints(seasonsData);
            } else
