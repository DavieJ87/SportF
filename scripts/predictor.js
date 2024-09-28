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
let teamsData = {};
let scheduleData = [];

// Wait for authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById("user-info").innerText = `Hello, ${user.displayName}`;
        loadTeamsData();
    } else {
        console.log("User is not authenticated, redirecting to login.");
        window.location.href = 'login.html';
    }
});

// Load NBA teams data
function loadTeamsData() {
    const teamsRef = db.ref('nba/teams');
    teamsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            teamsData = snapshot.val();
            console.log("Teams data loaded:", teamsData);
            loadScheduleData();
        } else {
            console.error("No teams data found");
        }
    }).catch(error => console.error("Error loading teams:", error));
}

// Load NBA schedule data
function loadScheduleData() {
    const scheduleRef = db.ref('nba/season_2024');
    scheduleRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            scheduleData = Object.values(snapshot.val());
            console.log("Schedule data loaded:", scheduleData);
            displayDateMenu(scheduleData);
        } else {
            console.error("No schedule data found");
        }
    }).catch(error => console.error("Error loading schedule:", error));
}

// Function to convert teamID to team data from teamsData
function getTeamData(teamID) {
    if (teamsData && teamsData[teamID]) {
        return teamsData[teamID];
    }
    return { TeamName: 'Unknown Team', WikipediaLogoUrl: 'unknown_logo.png' };
}

// Display date menu for selecting games
function displayDateMenu(schedule) {
    const dateMenuContainer = document.getElementById('dateMenuContainer');
    dateMenuContainer.innerHTML = ''; // Clear previous buttons

    const uniqueDates = [...new Set(schedule.map(game => game.DateTime.split('T')[0]))]; // Extract unique dates

    // Create buttons for scrolling through dates
    const leftArrow = document.createElement('button');
    leftArrow.textContent = '<';
    leftArrow.addEventListener('click', () => scrollDates(-1));

    const rightArrow = document.createElement('button');
    rightArrow.textContent = '>';
    rightArrow.addEventListener('click', () => scrollDates(1));

    dateMenuContainer.appendChild(leftArrow);

    const datesWrapper = document.createElement('div');
    datesWrapper.classList.add('dates-wrapper');
    uniqueDates.forEach(date => {
        const dateButton = document.createElement('button');
        dateButton.textContent = date;
        dateButton.classList.add('date-button');
        dateButton.addEventListener('click', () => {
            const gamesForDate = schedule.filter(game => game.DateTime.startsWith(date));
            displayGamesByDate(gamesForDate);
        });
        datesWrapper.appendChild(dateButton);
    });

    dateMenuContainer.appendChild(datesWrapper);
    dateMenuContainer.appendChild(rightArrow);

    // Scroll logic for dates
    let currentIndex = 0;
    const visibleDatesCount = 3;

    function scrollDates(direction) {
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex + visibleDatesCount > uniqueDates.length) currentIndex = uniqueDates.length - visibleDatesCount;
        updateDateVisibility();
    }

    function updateDateVisibility() {
        const allDateButtons = datesWrapper.querySelectorAll('.date-button');
        allDateButtons.forEach((button, index) => {
            button.style.display = (index >= currentIndex && index < currentIndex + visibleDatesCount) ? 'inline-block' : 'none';
        });
    }

    // Initialize date visibility
    updateDateVisibility();
}

// Display games for the selected date
function displayGamesByDate(games) {
    const gameTableBody = document.getElementById('gameTableBody');
    gameTableBody.innerHTML = ''; // Clear previous rows

    games.forEach((game) => {
        const homeTeam = teamsData[game.HomeTeamID];
        const awayTeam = teamsData[game.AwayTeamID];

        // Handle cases where team data is missing
        const homeTeamLogo = homeTeam ? homeTeam.WikipediaLogoUrl : 'default_logo_url.png';
        const awayTeamLogo = awayTeam ? awayTeam.WikipediaLogoUrl : 'default_logo_url.png';

        const homeTeamName = homeTeam ? homeTeam.Name : 'Unknown Team';
        const awayTeamName = awayTeam ? awayTeam.Name : 'Unknown Team';

        console.log('Game data:', game);
        console.log('Home Team:', homeTeam);
        console.log('Away Team:', awayTeam);

        // Create a new row in the table for each game
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><img src="${awayTeamLogo}" alt="${awayTeamName} logo" width="50"> ${awayTeamName}</td>
            <td><img src="${homeTeamLogo}" alt="${homeTeamName} logo" width="50"> ${homeTeamName}</td>
            <td>
                <input type="checkbox" data-game-id="${game.GameID}" data-pick="away"> Away Win
                <input type="checkbox" data-game-id="${game.GameID}" data-pick="home"> Home Win
            </td>
        `;

        gameTableBody.appendChild(row);
    });

    document.getElementById('gameTable').classList.remove('hidden');
}

// Submit predictions
document.getElementById('submitBtn').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const predictions = {};

    checkboxes.forEach(checkbox => {
        const gameID = checkbox.dataset.gameId;
        const pick = checkbox.dataset.pick;
        predictions[gameID] = pick;
    });

    const predictionsRef = db.ref(`predictions/${currentUser.uid}`);
    predictionsRef.set(predictions)
        .then(() => alert("Predictions submitted successfully"))
        .catch(error => console.error("Error submitting predictions:", error));
});
