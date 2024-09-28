// Firebase config
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let teams = {};
let schedule = {};

// Wait for authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById("user-info").innerText = `Hello, ${user.displayName}`;
        loadTeams();
    } else {
        console.log("User is not authenticated, redirecting to login.");
        window.location.href = 'login.html';
    }
});

// Load teams
function loadTeams() {
    const teamsRef = db.ref('nba/teams');
    teamsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            teams = snapshot.val();
            loadSchedule();
        } else {
            console.error("No teams data found");
        }
    }).catch(error => console.error("Error loading teams:", error));
}

// Load schedule and display date scroller
function loadSchedule() {
    const scheduleRef = db.ref('nba/season_2024');
    scheduleRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            schedule = snapshot.val();
            displayDateMenu();
        } else {
            console.error("No schedule data found");
        }
    }).catch(error => console.error("Error loading schedule:", error));
}

// Display date menu
function displayDateMenu() {
    const dates = Object.keys(schedule).sort();
    const dateScroller = document.getElementById('dateScroller');

    dates.forEach(date => {
        const dateButton = document.createElement('button');
        dateButton.textContent = date;
        dateButton.addEventListener('click', () => displayGamesByDate(date));
        dateScroller.appendChild(dateButton);
    });

    document.getElementById("leftArrow").addEventListener('click', scrollDatesLeft);
    document.getElementById("rightArrow").addEventListener('click', scrollDatesRight);

    // Show only 3 dates at a time
    scrollDates(0);
}

// Scroll dates (helper)
let currentIndex = 0;
function scrollDates(index) {
    const dates = document.querySelectorAll('#dateScroller button');
    dates.forEach((btn, i) => {
        btn.style.display = (i >= index && i < index + 3) ? 'inline-block' : 'none';
    });
    currentIndex = index;
}

function scrollDatesLeft() {
    if (currentIndex > 0) {
        scrollDates(currentIndex - 1);
    }
}

function scrollDatesRight() {
    const dates = document.querySelectorAll('#dateScroller button');
    if (currentIndex + 3 < dates.length) {
        scrollDates(currentIndex + 1);
    }
}

// Display games by date
function displayGamesByDate(date) {
    const gameTableBody = document.getElementById('gameTableBody');
    gameTableBody.innerHTML = ''; // Clear previous games

    const games = schedule[date];
    games.forEach(game => {
        const awayTeam = teams[game.AwayTeamID] || { Name: 'Unknown Team', WikipediaLogoUrl: 'unknown_logo.png' };
        const homeTeam = teams[game.HomeTeamID] || { Name: 'Unknown Team', WikipediaLogoUrl: 'unknown_logo.png' };

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${awayTeam.WikipediaLogoUrl}" alt="Away Team Logo">${awayTeam.Name}</td>
            <td><img src="${homeTeam.WikipediaLogoUrl}" alt="Home Team Logo">${homeTeam.Name}</td>
            <td><input type="checkbox" class="winnerCheckbox"></td>
        `;
        gameTableBody.appendChild(row);
    });

    document.getElementById('gameTable').classList.remove('hidden');
}

// Handle submission
document.getElementById('submitBtn').addEventListener('click', submitPredictions);

function submitPredictions() {
    const checkboxes = document.querySelectorAll('.winnerCheckbox');
    const predictions = Array.from(checkboxes).map(cb => cb.checked);

    const predictionsRef = db.ref(`predictions/${currentUser.uid}`);
    predictionsRef.set(predictions).then(() => {
        alert("Predictions submitted successfully");
    }).catch(error => {
        console.error("Error submitting predictions:", error);
    });
}
