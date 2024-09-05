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

// User info (Google SSO)
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        document.getElementById('user-info').innerText = `Logged in as ${user.displayName}`;
    } else {
        window.location.href = 'login.html'; // Redirect to login if not logged in
    }
});

const db = firebase.database();
let selectedDate = '';
let predictions = {};
let userID = '';

// Get NBA games data
function loadGamesForDate(date) {
    db.ref('nba/season_2024')
        .orderByChild('Day')
        .equalTo(date)
        .once('value', snapshot => {
            const games = snapshot.val();
            if (games) {
                renderGameList(games);
            }
        });
}

// Render Date Menu (Scrollable)
function renderDateMenu(dates) {
    const dateMenu = document.getElementById('date-menu');
    dates.forEach(date => {
        const dateDiv = document.createElement('div');
        dateDiv.innerText = new Date(date).toLocaleDateString();
        dateDiv.onclick = () => selectDate(date);
        dateMenu.appendChild(dateDiv);
    });
}

// Select Date
function selectDate(date) {
    selectedDate = date;
    loadGamesForDate(date);

    document.querySelectorAll('.date-menu div').forEach(div => div.classList.remove('selected'));
    event.target.classList.add('selected');
}

// Render game list in table
function renderGameList(games) {
    const gameList = document.getElementById('game-list');
    gameList.innerHTML = ''; // Clear previous games

    Object.values(games).forEach(game => {
        const row = document.createElement('tr');
        
        const awayTeam = document.createElement('td');
        awayTeam.innerHTML = `<img src="nba/teams/${game.AwayTeamID}/WikipediaLogoUrl" alt="logo" width="30"> ${game.AwayTeam}`;
        row.appendChild(awayTeam);

        const homeTeam = document.createElement('td');
        homeTeam.innerHTML = `<img src="nba/teams/${game.HomeTeamID}/WikipediaLogoUrl" alt="logo" width="30"> ${game.HomeTeam}`;
        row.appendChild(homeTeam);

        const winnerSelect = document.createElement('td');
        winnerSelect.innerHTML = `
            <label>
                <input type="radio" name="game_${game.GameID}" value="Away"> Away
            </label>
            <label>
                <input type="radio" name="game_${game.GameID}" value="Home"> Home
            </label>
        `;
        row.appendChild(winnerSelect);

        gameList.appendChild(row);
    });

    document.getElementById('submit-predictions').disabled = false;
}

// Submit Predictions
document.getElementById('submit-predictions').addEventListener('click', () => {
    const selectedPredictions = {};
    
    document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        const gameID = input.name.split('_')[1];
        selectedPredictions[gameID] = input.value;
    });

    if (Object.keys(selectedPredictions).length > 0) {
        db.ref(`predictions/${userID}/${selectedDate}`).set(selectedPredictions)
            .then(() => alert('Predictions submitted!'))
            .catch(err => console.error(err));
    }
});

// Fetch available dates and render the menu
db.ref('nba/season_2024').once('value', snapshot => {
    const games = snapshot.val();
    const dates = [...new Set(Object.values(games).map(game => game.Day))];
    renderDateMenu(dates);
});
