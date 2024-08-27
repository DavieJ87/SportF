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
let logoutBtn = document.getElementById('logout-btn');

// Function to display user profile information
function displayUserProfile(user) {
    userNameElem.textContent = user.displayName;
    userEmailElem.textContent = user.email;
    userPhotoElem.src = user.photoURL || 'default-profile.png'; // Use a default image if the user doesn't have a photo

    // Fetch and display user's total points
    const userTotalPointsRef = ref(database, `users/${user.uid}/total_points`);
    onValue(userTotalPointsRef, (snapshot) => {
        const totalPoints = snapshot.val() || 0; // Default to 0 if no points are found
        totalPointsElem.textContent = `Total Points: ${totalPoints}`;
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
