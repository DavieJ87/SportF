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
let userPredictions = {}; // Store the user's predictions

// Google Authentication
firebase.auth().onAuthStateChanged(function (authenticatedUser) {
    if (authenticatedUser) {
        user = authenticatedUser;
        document.getElementById('user-info').textContent = `Logged in as ${user.displayName}`;
        loadTeamsData(); // Load the teams data once user is authenticated
        loadUserPredictions(); // Load user's previous predictions if they exist
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

// Load user's previous predictions from Firebase
function loadUserPredictions() {
    const userPredictionsRef = database.ref(`predictions/${user.uid}`);
    userPredictionsRef.once('value', (snapshot) => {
        userPredictions = snapshot.val() || {};
        console.log('User Predictions:', userPredictions);
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
    dateMenuContainer.innerHTML = ''; // Clear previous content

    // Convert set to array for easier slicing
    const dateArray = Array.from(dates);

    dateArray.forEach((date) => {
        const button = document.createElement('button');
        button.textContent = date;
        button.addEventListener('click', () => displayGamesByDate(date));
        dateMenuContainer.appendChild(button);
    });

    // Allow horizontal scrolling and display only 3 dates at a time
    dateMenuContainer.style.overflowX = 'auto';
    dateMenuContainer.style.whiteSpace = 'nowrap';
    dateMenuContainer.scrollTo(0, 0); // Start scrolled to the beginning
}

// Display games for the selected date
function displayGamesByDate(selectedDate) {
    const gamesForDate = Object.values(scheduleData).filter(game => game.DateTime.startsWith(selectedDate));

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

        const homeTeam = teamsData[homeTeamID];
        const awayTeam = teamsData[awayTeamID];

        if (!homeTeam || !awayTeam) {
            console.error(`Team data not found for Game ID: ${game.GameID}`);
            return;
        }

        const homeTeamLogo = homeTeam.WikipediaLogoUrl || 'default_logo_url';
        const awayTeamLogo = awayTeam.WikipediaLogoUrl || 'default_logo_url';

        const homeTeamName = homeTeam.Name || 'Unknown Team';
        const awayTeamName = awayTeam.Name || 'Unknown Team';

        const row = document.createElement('tr');

        // Check if user already made a prediction for this game
        const previousPrediction = userPredictions[game.GameID];

        row.innerHTML = `
            <td><img src="${awayTeamLogo}" alt="${awayTeamName} logo" width="50"> ${awayTeamName}</td>
            <td><img src="${homeTeamLogo}" alt="${homeTeamName} logo" width="50"> ${homeTeamName}</td>
            <td>
                <input type="radio" name="game-${game.GameID}" value="away" data-game-id="${game.GameID}" ${previousPrediction === 'away' ? 'checked' : ''}> Away Win
                <input type="radio" name="game-${game.GameID}" value="home" data-game-id="${game.GameID}" ${previousPrediction === 'home' ? 'checked' : ''}> Home Win
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
