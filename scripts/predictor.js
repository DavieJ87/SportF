import { getDatabase, ref, get, set, child } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();

let currentUser = null;
let teams = {};
let schedule = {};

// Wait for authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadTeams();
    } else {
        console.log("User is not authenticated, redirecting to login.");
        window.location.href = 'login.html';
    }
});

// Load teams
function loadTeams() {
    const teamsRef = ref(db, 'nba/teams');
    get(teamsRef).then(snapshot => {
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
    const scheduleRef = ref(db, 'nba/season_2024');
    get(scheduleRef).then(snapshot => {
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

    const predictionsRef = ref(db, `predictions/${currentUser.uid}`);
    set(predictionsRef, predictions).then(() => {
        alert("Predictions submitted successfully");
    }).catch(error => {
        console.error("Error submitting predictions:", error);
    });
}
