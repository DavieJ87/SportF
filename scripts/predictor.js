import { auth, database, onAuthStateChanged, signOut } from "./firebase-config.js";
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  const userInfoDiv = document.getElementById("user-info");
  const dateMenuContainer = document.getElementById("dateMenuContainer");
  const gameTable = document.getElementById("gameTable");
  const gameTableBody = document.getElementById("gameTableBody");
  const submitBtn = document.getElementById("submitBtn");

  let selectedDate = null;
  let user = null;

  onAuthStateChanged(auth, (loggedInUser) => {
    if (loggedInUser) {
      user = loggedInUser;
      userInfoDiv.innerHTML = `Welcome, ${user.displayName}`;
      loadDates();
    } else {
      userInfoDiv.innerHTML = "User not logged in";
    }
  });

  function loadDates() {
    // Load available dates (replace with real data logic)
    const dates = ['2023-10-24', '2023-10-25', '2023-10-26'];
    dates.forEach((date) => {
      const dateBtn = document.createElement("button");
      dateBtn.textContent = date;
      dateBtn.addEventListener("click", () => {
        selectedDate = date;
        loadGamesByDate(selectedDate);
      });
      dateMenuContainer.appendChild(dateBtn);
    });
  }

  function loadGamesByDate(date) {
    gameTableBody.innerHTML = ""; // Clear the table before displaying new data
    gameTable.classList.remove("hidden");

    // Fetch games for the selected date (replace with real data logic)
    const games = [
      { awayTeamID: 29, homeTeamID: 26, gameID: 19594 },
      { awayTeamID: 5, homeTeamID: 17, gameID: 19605 }
    ];

    games.forEach((game) => {
      const row = document.createElement("tr");

      const awayTeamCell = document.createElement("td");
      const homeTeamCell = document.createElement("td");
      const winnerCell = document.createElement("td");

      // Retrieve team names and logos from Firebase database (real logic)
      get(ref(database, `nba/teams/${game.awayTeamID}`)).then((snapshot) => {
        if (snapshot.exists()) {
          awayTeamCell.innerHTML = `<img src="${snapshot.val().WikipediaLogoUrl}" alt="Logo"> ${snapshot.val().TeamName}`;
        } else {
          awayTeamCell.textContent = "Unknown Away Team";
        }
      });

      get(ref(database, `nba/teams/${game.homeTeamID}`)).then((snapshot) => {
        if (snapshot.exists()) {
          homeTeamCell.innerHTML = `<img src="${snapshot.val().WikipediaLogoUrl}" alt="Logo"> ${snapshot.val().TeamName}`;
        } else {
          homeTeamCell.textContent = "Unknown Home Team";
        }
      });

      const winnerSelect = document.createElement("input");
      winnerSelect.type = "checkbox";
      winnerCell.appendChild(winnerSelect);

      row.appendChild(awayTeamCell);
      row.appendChild(homeTeamCell);
      row.appendChild(winnerCell);
      gameTableBody.appendChild(row);
    });
  }

  submitBtn.addEventListener("click", () => {
    // Handle prediction submission logic here
    alert("Prediction Submitted!");
  });
});
