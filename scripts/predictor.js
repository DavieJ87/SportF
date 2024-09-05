document.addEventListener('DOMContentLoaded', function () {
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

    // Grab elements
    const userInfo = document.getElementById('user-info');
    const dateMenuContainer = document.getElementById('dateMenuContainer');
    const gameTable = document.getElementById('gameTable');
    const gameTableBody = document.getElementById('gameTableBody');
    const submitBtn = document.getElementById('submitBtn');

    // Check for null elements before proceeding
    if (!userInfo || !dateMenuContainer || !gameTable || !gameTableBody || !submitBtn) {
        console.error("One or more DOM elements are null");
        return;
    }

    // Load NBA teams data
    let teams = {};
    function loadTeams() {
        return database.ref('nba/teams').once('value').then((snapshot) => {
            teams = snapshot.val();
        });
    }

    // Load NBA schedule data
    function loadSchedule() {
        return database.ref('nba/season_2024').once('value').then((snapshot) => {
            return snapshot.val();
        });
    }

    // Display date menu for selecting games
    function displayDateMenu(schedule) {
        const uniqueDates = [...new Set(schedule.map(game => game.DateTime.split('T')[0]))];

        uniqueDates.forEach(date => {
            const dateButton = document.createElement('button');
            dateButton.textContent = date;
            dateButton.addEventListener('click', () => displayGamesByDate(date, schedule));
            dateMenuContainer.appendChild(dateButton);
        });
    }

    // Display games for the selected date
    function displayGamesByDate(selectedDate, schedule) {
        gameTableBody.innerHTML = ''; // Clear previous table content
        const gamesForDate = schedule.filter(game => game.DateTime.split('T')[0] === selectedDate);

        gamesForDate.forEach(game => {
            const row = document.createElement('tr');

            // Get team info
            const awayTeam = teams[game.GlobalAwayTeamID];
            const homeTeam = teams[game.GlobalHomeTeamID];

            // Away team cell
            const awayTeamCell = document.createElement('td');
            awayTeamCell.innerHTML = `<img src="${awayTeam.WikipediaLogoUrl}" alt="${awayTeam.Name}" width="50"> ${awayTeam.Name}`;
            row.appendChild(awayTeamCell);

            // Home team cell
            const homeTeamCell = document.createElement('td');
            homeTeamCell.innerHTML = `<img src="${homeTeam.WikipediaLogoUrl}" alt="${homeTeam.Name}" width="50"> ${homeTeam.Name}`;
            row.appendChild(homeTeamCell);

            // Winner selection cell
            const selectWinnerCell = document.createElement('td');
            const winnerSelect = document.createElement('input');
            winnerSelect.type = 'checkbox';
            winnerSelect.dataset.gameId = game.GameID; // Store Game ID in the checkbox
            selectWinnerCell.appendChild(winnerSelect);
            row.appendChild(selectWinnerCell);

            gameTableBody.appendChild(row);
        });

        // Show game table after selection
        gameTable.classList.remove('hidden');
    }

    // Submit predictions
    function submitPredictions() {
        const selectedPredictions = [];
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            selectedPredictions.push({
                gameId: checkbox.dataset.gameId,
                predictedWinner: checkbox.closest('tr').children[1].textContent.trim() // Home team
            });
        });

        const user = firebase.auth().currentUser;
        if (user) {
            const userId = user.uid;
            const predictionsRef = database.ref(`predictions/${userId}`);

            predictionsRef.push({
                predictions: selectedPredictions,
                timestamp: new Date().toISOString()
            }).then(() => {
                alert('Predictions submitted successfully!');
            }).catch((error) => {
                console.error('Error submitting predictions:', error);
            });
        } else {
            alert('You must be logged in to submit predictions.');
        }
    }

    // Load user data and handle SSO
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            userInfo.textContent = `Logged in as ${user.displayName}`;
        } else {
            window.location.href = "index.html"; // Redirect to login if not authenticated
        }
    });

    // Attach event listener for submitting predictions
    submitBtn.addEventListener('click', submitPredictions);

    // Load data and initialize the page
    Promise.all([loadTeams(), loadSchedule()]).then(([_, schedule]) => {
        displayDateMenu(schedule); // Populate date menu
    }).catch((error) => {
        console.error('Error loading data:', error);
    });
});
