// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";


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

    matchDiv.appendChild(title);
    matchDiv.appendChild(date);
    matchDiv.appendChild(score);
    matchDiv.appendChild(status);

    return matchDiv;
}

// Sign in with Google
googleSignInBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Google Sign-In successful:", result.user);
        })
        .catch((error) => {
            console.error("Error during Google Sign-In:", error);
        });
});

// Sign out
signOutBtn.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log("Sign-Out successful.");
        })
        .catch((error) => {
            console.error("Error during Sign-Out:", error);
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

// Fetch matches for the first week by default
fetchMatchesByWeek(1);
