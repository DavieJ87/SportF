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
            console.log("Teams loaded:", teams);
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
            console.log("Schedule loaded:", schedule);
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
    
    dateScroller.innerHTML = ""; // Clear previous dates
    
    dates.forEach(date => {
        const dateButton = document.createElement('button');
        dateButton.textContent = date; // Make sure the date is formatted correctly
        dateButton.addEventListener('click', () => displayGamesByDate(date));
        dateScroller.appendChild(dateButton);
    });

    // Attach event listeners for arrows
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
    
    if (!games) {
        console.error(`No games found for date ${date}`);
        return;
    }

    const gamesArray = Object.values(games); // Ensure we are working with an array

    gamesArray.forEach(game => {
        const awayTeam = teams[game.awayTeamID] || { Name: 'Unknown Team', WikipediaLogoUrl: 'unknown_logo.png' };
        const homeTeam = teams[game.homeTeamID] || { Name: 'Unknown Team', WikipediaLogoUrl: 'unknown_logo.png' };

        // Log the game details for debugging
        console.log("Game data:", game);
        console.log("Away team data:", awayTeam);
        console.log("Home team data:", homeTeam);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${awayTeam.WikipediaLogoUrl}" alt="Away Team Logo" width="50">${awayTeam.Name}</td>
            <td><img src="${homeTeam.WikipediaLogoUrl}" alt="Home Team Logo" width="50">${homeTeam.Name}</td>
           
