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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let user = null;
let teamsData = {}; // Store teams information
let scheduleData = {}; // Store schedule data

// Google Authentication
firebase.auth().onAuthStateChanged(function (authenticatedUser) {
    if (authenticatedUser) {
        user = authenticatedUser;
        document.getElementById('user-info').textContent = `Logged in as ${user.displayName}`;
        loadTeamsData(); // Load the teams data once user is authenticated
    } else {
        // Redirect to login page if not authenticated
        window.location.href = 'login.html';
    }
});

// Load teams data from Firebase
function loadTeamsData() {
    const teamsRef = database.ref('nba/teams');
    teamsRef.once('value', (snapshot) => {
        teamsData = snapshot.val();
        console.log('Teams Data:', teamsData);
        loadScheduleData(); // Load schedule data after teams are loaded
    });
}

// Load schedule data from Firebase
function loadScheduleData() {
    const scheduleRef = database.ref('nba/season_2024');
    scheduleRef.once('value', (snapshot) => {
        scheduleData = snapshot.val();
        console.log('Schedule Data:', scheduleData);
        displayDateMenu(); // Display the date selection menu after schedule is loaded
    });
}

// Display the date selection menu
function displayDateMenu() {
    const dates = new Set(); // Use Set to store unique dates
    Object.values(scheduleData).forEach((game) => {
        const gameDate = game.DateTime.split('T')[0]; // Extract the date from DateTime
        dates.add(gameDate);
    });

    const dateMenuContainer = document.getElementById('dateMenuContainer');
    dates.forEach((date) => {
        const button = document.createElement('button');
        button.textContent = date;
        button.addEventListener('click', () => displayGamesByDate(date));
        dateMenuContainer.appendChild(button);
    });
}

// Display games for the selected date
function displayGamesByDate(selectedDate) {
    const gamesForDate = Object.values(scheduleData).filter(game => game.DateTime.startsWith(selectedDate));

    // Log match data for debugging
    console.log(`Games for Date: ${selectedDate}`, gamesForDate);

    if (!Array.isArray(gamesForDate) || gamesForDate.length === 0) {
        console.error('No games found for the selected date:', selectedDate);
        return;
    }

    const gameTableBody = document.getElementById('gameTableBody');
    gameTableBody.innerHTML = ''; // Clear previous rows

    gamesForDate.forEach((game) => {
        const homeTeamID = game.HomeTeamID;
        const awayTeamID = game.AwayTeamID;

        // Fetch team data from teamsData using the HomeTeamID and AwayTeamID
        const homeTeam = teamsData[homeTeamID];
        const awayTeam = teamsData[awayTeamID];

        // Log team mapping details for debugging
        console.log(`Game ID: ${game.GameID} - Home Team ID: ${homeTeamID}, Away Team ID: ${awayTeamID}`);
        console.log(`Mapped Home Team: ${homeTeam ? homeTeam.Name : 'Unknown'} (${homeTeamID}), Away Team: ${awayTeam ? awayTeam.Name : 'Unknown'} (${awayTeamID})`);

        // Ensure that the team data exists
        if (!homeTeam || !awayTeam) {
            console.error(`Team data not found for Game ID: ${game.GameID}`);
            return;
        }

        // Ensure we have valid data for team names and logos
        const homeTeamLogo = homeTeam.WikipediaLogoUrl || 'default_logo_url';
        const awayTeamLogo = awayTeam.WikipediaLogoUrl || 'default_logo_url';

        const homeTeamName = homeTeam.Name || 'Unknown Team';
        const awayTeamName = awayTeam.Name || 'Unknown Team';

        // Create a new row in the table for each game
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><img src="${awayTeamLogo}" alt="${awayTeamName} logo" width="50"> ${awayTeamName}</td>
            <td><img src="${homeTeamLogo}" alt="${homeTeamName} logo" width="50"> ${homeTeamName}</td>
            <td>
                <input type="radio" name="game-${game.GameID}" value="away" data-game-id="${game.GameID}"> Away Win
                <input type="radio" name="game-${game.GameID}" value="home" data-game-id="${game.GameID}"> Home Win
            </td>
        `;

        gameTableBody.appendChild(row);
    });

    document.getElementById('gameTable').classList.remove('hidden');
}

// Submit the predictions to Firebase
document.getElementById('submitBtn').addEventListener('click', () => {
    const predictions = {};
    document.querySelectorAll('input[type="radio"]:checked').forEach((input) => {
        const gameID = input.getAttribute('data-game-id');
        predictions[gameID] = input.value;
    });

    if (user) {
        const userPredictionsRef = database.ref(`predictions/${user.uid}`);
        userPredictionsRef.set(predictions, (error) => {
            if (error) {
                console.error('Error saving predictions:', error);
            } else {
                alert('Predictions saved successfully!');
            }
        });
    }
});
