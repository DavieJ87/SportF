import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithRedirect, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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
const auth = getAuth();
const db = getDatabase();

// DOM Elements
const dateMenuContainer = document.getElementById('dateMenuContainer');
const gameTableBody = document.getElementById('gameTableBody');
const gameTable = document.getElementById('gameTable');
const submitBtn = document.getElementById('submitBtn');
const scrollLeft = document.getElementById('scrollLeft');
const scrollRight = document.getElementById('scrollRight');

// Google Sign-In provider
const provider = new GoogleAuthProvider();

// Function to handle sign-in
function handleSignIn() {
    signInWithRedirect(auth, provider);
}

// Fetch data from Firebase and populate the date menu and game table
function loadNBAData(user) {
    const seasonRef = ref(db, 'nba/season_2024');
    get(seasonRef).then((snapshot) => {
        if (snapshot.exists()) {
            const games = snapshot.val();
            displayDateMenu(games);
        } else {
            console.error('No data available');
        }
    }).catch((error) => {
        console.error('Error loading data:', error);
    });
}

// Display date menu with horizontal scrolling
function displayDateMenu(games) {
    const uniqueDates = [...new Set(Object.values(games).map(game => game.DateTime.split('T')[0]))];

    uniqueDates.forEach(date => {
        const dateButton = document.createElement('button');
        dateButton.textContent = date;
        dateButton.addEventListener('click', () => {
            displayGamesByDate(date, games);
        });
        dateMenuContainer.appendChild(dateButton);
    });

    // Initial scroll logic
    scrollLeft.addEventListener('click', () => {
        dateMenuContainer.scrollLeft -= 150;
    });

    scrollRight.addEventListener('click', () => {
        dateMenuContainer.scrollLeft += 150;
    });
}

// Display games by selected date
function displayGamesByDate(selectedDate, games) {
    gameTableBody.innerHTML = ''; // Clear previous games

    const filteredGames = Object.values(games).filter(game => game.DateTime.startsWith(selectedDate));

    filteredGames.forEach(game => {
        const row = document.createElement('tr');

        // Away team
        const awayTeamCell = document.createElement('td');
        awayTeamCell.textContent = getTeamName(game.AwayTeamID);
        row.appendChild(awayTeamCell);

        // Home team
        const homeTeamCell = document.createElement('td');
        homeTeamCell.textContent = getTeamName(game.HomeTeamID);
        row.appendChild(homeTeamCell);

        // Winner selection
        const winnerCell = document.createElement('td');
        const winnerCheckbox = document.createElement('input');
        winnerCheckbox.type = 'checkbox';
        winnerCheckbox.dataset.gameId = game.GameID;
        winnerCell.appendChild(winnerCheckbox);
        row.appendChild(winnerCell);

        gameTableBody.appendChild(row);
    });

    gameTable.classList.remove('hidden'); // Show table after selection
}

// Fetch team names (this should be optimized, here for example)
function getTeamName(teamID) {
    // Assuming teams data is stored somewhere in your database or a static object
    // Example lookup:
    const teams = {
        1: 'Los Angeles Lakers',
        2: 'Golden State Warriors',
        // Add all teams here...
    };
    return teams[teamID] || 'Unknown Team';
}

// Check if user is authenticated
onAuthStateChanged(auth, user => {
    if (user) {
        console.log("User is authenticated:", user);
        loadNBAData(user);
    } else {
        console.error("User is not authenticated, redirecting to login.");
        handleSignIn();
    }
});
