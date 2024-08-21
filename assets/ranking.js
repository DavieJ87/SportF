// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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

    // Initialize Firebase (ensure this matches your other files)
   const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function fetchAndDisplayRankings() {
    const rankingsRef = ref(database, 'users/');
    
    get(rankingsRef).then(snapshot => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const rankings = [];

            // Loop through each user and calculate their total points
            for (const userId in usersData) {
                const user = usersData[userId];
                const totalPoints = user.total_points || 0;

                rankings.push({ userId: userId, totalPoints: totalPoints, email: user.email });
            }

            // Sort users by total points in descending order
            rankings.sort((a, b) => b.totalPoints - a.totalPoints);

            // Display the rankings
            const rankingList = document.getElementById('ranking-list');
            rankingList.innerHTML = ''; // Clear the list first

            rankings.forEach((ranking, index) => {
                const rankingItem = document.createElement('li');
                rankingItem.textContent = `${index + 1}. ${ranking.email} - ${ranking.totalPoints} points`;
                rankingList.appendChild(rankingItem);
            });
        } else {
            document.getElementById('ranking-list').textContent = "No rankings available.";
        }
    }).catch(error => {
        console.error('Error fetching rankings:', error);
    });
}

// Load rankings when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayRankings);
