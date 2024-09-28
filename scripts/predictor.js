// Import Firebase functions (SDK v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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

// Variables to store data
let currentUser = null;
let teams = {};
let selectedDate = null;
let allDates = [];

// DOM Elements
const dateMenuContainer = document.getElementById("dateMenuContainer");
const gameTableBody = document.getElementById("gameTableBody");
const submitBtn = document.getElementById("submitBtn");
const leftArrow = document.getElementById("leftArrow");
const rightArrow = document.getElementById("rightArrow");

// Auth handling
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("user-info").textContent = `Welcome, ${user.displayName}`;
        loadTeamsAndDates();
    } else {
        signInWithPopup(auth, new GoogleAuthProvider());
    }
});

// Load teams and schedule dates
function loadTeamsAndDates() {
    const teamsRef = ref(db, 'nba/teams');
    onValue(teamsRef, (snapshot) => {
        teams = snapshot.val();
        loadDates();
    });
}

// Load available game dates
function loadDates() {
    const seasonRef = ref(db, 'nba/season_2024');
    onValue(seasonRef, (snapshot) => {
        const schedule = snapshot.val();
        allDates = Array.from(new Set(Object.values(schedule).map(game => game.DateTime.split("T")[0])));
        displayDateMenu(allDates.slice(0, 3)); // Show first 3 dates initially
    });
}

// Display date selection menu
function displayDateMenu(dates) {
    dateMenuContainer.innerHTML = ''; // Clear previous dates

    dates.forEach(date => {
        const dateBtn = document.createElement('button');
        dateBtn.textContent = date;
        dateBtn.classList.add('date-btn');
        dateBtn.addEventListener('click', () => loadGamesByDate(date));
        dateMenuContainer.appendChild(dateBtn);
    });
}

// Scroll date menu left
leftArrow.addEventListener('click', () => {
    const startIdx = allDates.indexOf(dateMenuContainer.querySelector('button').textContent);
    const newDates = allDates.slice(Math.max(0, startIdx - 3), startIdx);
    displayDateMenu(newDates);
});

// Scroll date menu right
rightArrow.addEventListener('click', () => {
    const startIdx = allDates.indexOf(dateMenuContainer.querySelector('button').textContent);
    const newDates = allDates.slice(startIdx + 3, startIdx + 6);
    displayDateMenu(newDates);
});

// Load games for a specific date
function loadGamesByDate(date) {
    const seasonRef = ref(db, 'nba/season_2024');
    onValue(seasonRef, (snapshot) => {
        const schedule = snapshot.val();
        const games = Object.values(schedule).filter(game => game.DateTime.startsWith(date));
        displayGames(games);
    });
}

// Display games in the table
function displayGames(games) {
    gameTableBody.innerHTML = ''; // Clear previous games

    games.forEach(game => {
        const homeTeam = teams[game.HomeTeamID];
        const awayTeam = teams[game.AwayTeamID];

        if (!homeTeam || !awayTeam) {
            console.error('Unknown team data for game:', game);
            return;
        }

        const row = document.createElement('tr');

        // Away team
        const awayTeamCell = document.createElement('td');
        const awayLogo = document.createElement('img');
        awayLogo.src = awayTeam.WikipediaLogoUrl || 'unknown_logo.png';
        awayLogo.alt = awayTeam.Name || 'Unknown Team';
        awayLogo.classList.add('team-logo');
        awayTeamCell.appendChild(awayLogo);
        awayTeamCell.appendChild(document.createTextNode(awayTeam.Name || 'Unknown Team'));
        row.appendChild(awayTeamCell);

        // Home team
        const homeTeamCell = document.createElement('td');
        const homeLogo = document.createElement('img');
        homeLogo.src = homeTeam.WikipediaLogoUrl || 'unknown_logo.png';
        homeLogo.alt = homeTeam.Name || 'Unknown Team';
        homeLogo.classList.add('team-logo');
        homeTeamCell.appendChild(homeLogo);
        homeTeamCell.appendChild(document.createTextNode(homeTeam.Name || 'Unknown Team'));
        row.appendChild(homeTeamCell);

        // Winner selection
        const winnerCell = document.createElement('td');
        const winnerSelect = document.createElement('select');
        const optionNone = document.createElement('option');
        optionNone.value = '';
        optionNone.textContent = 'Select Winner';
        winnerSelect.appendChild(optionNone);

        const optionAway = document.createElement('option');
        optionAway.value = 'away';
        optionAway.textContent = awayTeam.Name;
        winnerSelect.appendChild(optionAway);

        const optionHome = document.createElement('option');
        optionHome.value = 'home';
        optionHome.textContent = homeTeam.Name;
        winnerSelect.appendChild(optionHome);

        winnerCell.appendChild(winnerSelect);
        row.appendChild(winnerCell);

        gameTableBody.appendChild(row);
    });
}

// Handle predictions submission
submitBtn.addEventListener('click', () => {
    const predictions = [];
    const rows = gameTableBody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const winnerSelect = row.querySelector('select').value;
        if (winnerSelect) {
            predictions.push({
                gameId: index,
                winner: winnerSelect
            });
        }
    });

    if (predictions.length > 0 && currentUser) {
        const userPredRef = ref(db, `predictions/${currentUser.uid}`);
        set(userPredRef, predictions).then(() => {
            alert('Predictions saved!');
        }).catch((error) => {
            console.error('Error saving predictions:', error);
        });
    } else {
        alert('No predictions made or user not authenticated.');
    }
});
