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
const db = firebase.database();

// Data objects to store teams and schedule information
let teamsData = {};
let scheduleData = {};

// Fetch teams data from Firebase
function fetchTeams() {
    return db.ref('nba/teams').once('value').then(snapshot => {
        teamsData = snapshot.val();
        console.log("Teams Data: ", teamsData);  // Log the teams data to verify structure
    });
}

// Fetch schedule data from Firebase
function fetchSchedule() {
    return db.ref('nba/season_2024').once('value').then(snapshot => {
        scheduleData = snapshot.val();
        console.log("Schedule Data: ", scheduleData);  // Log the schedule data
        displayDateMenu();
    });
}

// Display date selection menu
function displayDateMenu() {
    const dateMenuContainer = document.getElementById('dateMenuContainer');

    if (!dateMenuContainer) {
        console.error('Date menu container is not found!');
        return;
    }

    // Get unique dates from schedule
    const uniqueDates = [...new Set(Object.values(scheduleData).map(game => game.DateTime.split('T')[0]))];
    
    uniqueDates.forEach(date => {
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

        // Log the match details
        console.log(`Game ID: ${game.GameID}, Home Team ID: ${homeTeamID}, Away Team ID: ${awayTeamID}`);

        // Get team data using HomeTeamID and AwayTeamID
        const homeTeam = teamsData[homeTeamID];
        const awayTeam = teamsData[awayTeamID];

        console.log(`Home Team Data: `, homeTeam);
        console.log(`Away Team Data: `, awayTeam);

        // Handle cases where team data is missing
        const homeTeamLogo = homeTeam && homeTeam.WikipediaLogoUrl ? homeTeam.WikipediaLogoUrl : 'default_logo_url';
        const awayTeamLogo = awayTeam && awayTeam.WikipediaLogoUrl ? awayTeam.WikipediaLogoUrl : 'default_logo_url';

        const homeTeamName = homeTeam ? homeTeam.Name : 'Unknown Team';
        const awayTeamName = awayTeam ? awayTeam.Name : 'Unknown Team';

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

// Submit predictions
function submitPredictions() {
    const predictions = [];

    const radios = document.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(radio => {
        predictions.push({
            gameId: radio.getAttribute('data-game-id'),
            winner: radio.value
        });
    });

    const userId = firebase.auth().currentUser.uid;
    db.ref(`nba/predictions/${userId}`).set(predictions).then(() => {
        alert('Predictions submitted successfully!');
    }).catch(error => {
        console.error('Error submitting predictions:', error);
    });
}

// Set up event listener for the submit button
document.getElementById('submitBtn').addEventListener('click', submitPredictions);

// Fetch data and initialize the predictor page
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        fetchTeams().then(fetchSchedule);
    } else {
        window.location.href = 'login.html';
    }
});
