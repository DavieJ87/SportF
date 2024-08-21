function fetchUserProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const userPointsRef = ref(database, `users/${userId}/total_points`);
    const predictionsRef = ref(database, `predictions/${userId}`);

    // Display user's total points
    get(userPointsRef).then(snapshot => {
        if (snapshot.exists()) {
            document.getElementById('user-points').textContent = `Total Points: ${snapshot.val()}`;
        }
    });

    // Display last 5 predictions
    get(predictionsRef).then(snapshot => {
        if (snapshot.exists()) {
            const predictions = Object.values(snapshot.val());
            const lastFivePredictions = predictions.slice(-5).reverse(); // Get last 5

            const predictionList = document.getElementById('prediction-list');
            predictionList.innerHTML = ''; // Clear the list first

            lastFivePredictions.forEach(prediction => {
                const predictionItem = document.createElement('li');
                predictionItem.textContent = `Match: ${prediction.matchId}, Points: ${prediction.points}`;
                predictionList.appendChild(predictionItem);
            });
        }
    }).catch(error => {
        console.error('Error fetching user predictions:', error);
    });
}

// Load user profile when the page loads
document.addEventListener('DOMContentLoaded', fetchUserProfile);
