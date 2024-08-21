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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase (ensure this matches your other files)
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    const rankingContainer = document.getElementById('ranking-container');

    if (rankingContainer) {
        const rankingsRef = ref(database, 'rankings/');
        get(rankingsRef).then((snapshot) => {
            if (snapshot.exists()) {
                const rankings = snapshot.val();
                Object.entries(rankings).forEach(([userId, ranking]) => {
                    const rankingElement = document.createElement('div');
                    rankingElement.textContent = `${ranking.userName}: ${ranking.points} points`;
                    rankingContainer.appendChild(rankingElement);
                });
            } else {
                rankingContainer.textContent = "No rankings available.";
            }
        }).catch((error) => {
            console.error('Error fetching rankings:', error);
        });
    } else {
        console.error("Ranking container element not found!");
    }
});
