// Firebase Configuration
var firebaseConfig = {
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

// Elements
const userInfo = document.getElementById('user-info');
const dateScroller = document.getElementById('dateScroller');
const gameTable = document.getElementById('gameTable');
const gameTableBody = document.getElementById('gameTableBody');
const submitButton = document.getElementById('submitButton');

// Current User ID
let currentUserId = null;

// Authentication State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        userInfo.innerHTML = `Logged in as ${user.displayName} <img src="${user.photoURL}" alt="User Photo" width="30" style="border-radius:50%;">`;
        loadDates();
    } else {
        userInfo.innerHTML = 'Not Logged In. Please <a href="index.html">Login</a>.';
        // Optionally, redirect to login page
        // window.location.href = 'index.html';
    }
});

// Load Unique Dates from NBA Season Data
function loadDates() {
    db.ref('nba/season_2024').once('value', snapshot => {
        const games = snapshot.val();
        if (!games) {
            dateScroller.innerHTML = '<p>No games available.</p>';
            return;
        }

        const datesSet = new Set();
        for (const gameId in games) {
            const game = games[gameId];
            // Assuming 'Day' is in ISO format, e.g., '2024-10-15T19:30:00Z'
            const date = game.Day.split('T')[0];
            datesSet.add(date);
        }

        const uniqueDates = Array.from(datesSet).sort();
        renderDateScroller(uniqueDates);
    });
}

// Render Date Scroller
function renderDateScroller(dates) {
    dates.forEach((date, index) => {
        const dateItem = document.createElement('div');
        dateItem.classList.add('date-item');
        dateItem.textContent = formatDate(date);
        dateItem.dataset.date = date;

        dateItem.addEventListener('click', () => {
            // Remove 'selected' class from all date items
            document.querySelectorAll('.date-item').forEach(item => item.classList.remove('selected'));
            // Add 'selected' class to the clicked date
            dateItem.classList.add('selected');
            // Load games for the selected date
            loadGamesForDate(date);
        });

        dateScroller.appendChild(dateItem);
    });
}

// Format Date (e.g., 2024-10-15 to Oct 15, 2024)
function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, options);
}

// Load Games for Selected Date
function loadGamesForDate(date) {
    // Clear previous games
    gameTableBody.innerHTML = '';
    gameTable.classList.add('hidden');
    submitButton.classList.add('hidden');

    // Fetch games for the selected date
    db.ref('nba/season_2024').orderByChild('Day').equalTo(date).once('value', snapshot => {
        const games = snapshot.val();
        if (!games) {
            gameTableBody.innerHTML = '<tr><td colspan="3">No games on this date.</td></tr>';
            gameTable.classList.remove('hidden');
            return;
        }

        // Populate game table
        for (const gameId in games) {
            const game = games[gameId];
            const awayTeam = game.AwayTeam; // Assuming 'AwayTeam' is the team name
            const homeTeam = game.HomeTeam; // Assuming 'HomeTeam' is the team name
            const awayLogoUrl = game.WikipediaLogoUrl_Away; // Adjust field name if different
            const homeLogoUrl = game.WikipediaLogoUrl_Home; // Adjust field name if different

            // Create table row
            const row = document.createElement('tr');

            // Away Team Cell
            const awayCell = document.createElement('td');
            awayCell.innerHTML = `<img src="${game.WikipediaLogoUrl_Away}" alt="${awayTeam} Logo" width="30"> ${awayTeam}`;
            row.appendChild(awayCell);

            // Home Team Cell
            const homeCell = document.createElement('td');
            homeCell.innerHTML = `<img src="${game.WikipediaLogoUrl_Home}" alt="${homeTeam} Logo" width="30"> ${homeTeam}`;
            row.appendChild(homeCell);

            // Winner Selection Cell
            const winnerCell = document.createElement('td');
            winnerCell.innerHTML = `
                <label>
                    <input type="radio" name="winner_${gameId}" value="Away"> Away
                </label>
                <label>
                    <input type="radio" name="winner_${gameId}" value="Home"> Home
                </label>
            `;
            row.appendChild(winnerCell);

            gameTableBody.appendChild(row);
        }

        // Show game table and submit button
        gameTable.classList.remove('hidden');
        submitButton.classList.remove('hidden');
    });
}

// Handle Prediction Submission
submitButton.addEventListener('click', () => {
    if (!currentUserId) {
        alert('You must be logged in to submit predictions.');
        return;
    }

    const predictions = {};
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');

    radioButtons.forEach(radio => {
        const gameId = radio.name.split('_')[1];
        const predictedWinner = radio.value;
        predictions[gameId] = predictedWinner;
    });

    if (Object.keys(predictions).length === 0) {
        alert('Please select at least one prediction.');
        return;
    }

    // Get selected date
    const selectedDateItem = document.querySelector('.date-item.selected');
    if (!selectedDateItem) {
        alert('No date selected.');
        return;
    }
    const selectedDate = selectedDateItem.dataset.date;

    // Save predictions to Firebase
    db.ref(`nba/predictions/${currentUserId}/${selectedDate}`).set(predictions)
        .then(() => {
            alert('Predictions submitted successfully!');
        })
        .catch(error => {
            console.error('Error submitting predictions:', error);
            alert('There was an error submitting your predictions. Please try again.');
        });
});
