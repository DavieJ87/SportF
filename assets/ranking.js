import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Your Firebase configuration
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

// Fetch and display user rankings
const rankingsContainer = document.getElementById('rankings-container');

function displayRankings() {
    const usersRef = ref(database, 'users');

    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        const rankings = [];

        for (let userId in users) {
            const user = users[userId];
            rankings.push({
                email: user.email,
                points: user.points || 0
            });
        }

        rankings.sort((a, b) => b.points - a.points);

        rankingsContainer.innerHTML = '';
        rankings.forEach((user, index) => {
            const rankDiv = document.createElement('div');
            rankDiv.className = 'rank';
            rankDiv.textContent = `${index + 1}. ${user.email} - ${user.points} points`;
            rankingsContainer.appendChild(rankDiv);
        });
    });
}

displayRankings();
