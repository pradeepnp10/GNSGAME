// app.js

// Initialize the map centered on Australia initially
const map = L.map('map').setView([-25.2744, 133.7751], 4);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add zoom and scale controls
L.control.zoom({ position: 'topright' }).addTo(map);
L.control.scale().addTo(map);

// Define Australian markers with questions
const markers = [
    { 
        position: [-33.8688, 151.2093], // Sydney
        question: "What is the name of Sydney's famous opera house?",
        answer: "Sydney Opera House"
    },
    {
        position: [-37.8136, 144.9631], // Melbourne
        question: "Which Australian city is known as the cultural capital?",
        answer: "Melbourne"
    },
    {
        position: [-27.4705, 153.0260], // Brisbane
        question: "What is the capital city of Queensland?",
        answer: "Brisbane"
    },
    {
        position: [-31.9505, 115.8605], // Perth
        question: "Which Australian city is closest to Indonesia?",
        answer: "Perth"
    },
    {
        position: [-35.2809, 149.1300], // Canberra
        question: "What is the capital city of Australia?",
        answer: "Canberra"
    }
];

let currentQuestionIndex = 0;
let score = 0;
let userMarker = null;
let userCircle = null;
let watchId = null;

// Add markers to the map
markers.forEach(marker => {
    L.marker(marker.position)
        .addTo(map)
        .bindPopup(`Location: ${marker.position}`);
});

// Function to update user's location on the map
function updateUserLocation(position) {
    const userPosition = [position.coords.latitude, position.coords.longitude];
    
    // Remove previous user location marker and circle if they exist
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    if (userCircle) {
        map.removeLayer(userCircle);
    }

    // Add new user location marker
    userMarker = L.marker(userPosition)
        .addTo(map)
        .bindPopup("You are here!")
        .openPopup();

    // Add accuracy circle
    userCircle = L.circle(userPosition, {
        radius: position.coords.accuracy / 2,
        color: 'blue',
        fillColor: '#3388ff',
        fillOpacity: 0.1
    }).addTo(map);

    // Center map on user's location with appropriate zoom
    map.setView(userPosition, 13);

    // Check proximity to markers
    checkProximity(userPosition);
}

// Function to handle location errors
function handleLocationError(error) {
    const messageElement = document.getElementById('message');
    messageElement.style.display = 'block';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            messageElement.textContent = "Location access denied. Please enable location services to play.";
            break;
        case error.POSITION_UNAVAILABLE:
            messageElement.textContent = "Location information unavailable. Please try again.";
            break;
        case error.TIMEOUT:
            messageElement.textContent = "Location request timed out. Please try again.";
            break;
        default:
            messageElement.textContent = "An unknown error occurred while getting location.";
    }

    // Still start the game but centered on Australia
    startGameWithoutLocation();
}

// Start game without location
function startGameWithoutLocation() {
    map.setView([-25.2744, 133.7751], 4);
    showNextQuestion();
}

// Start game function with enhanced location tracking
function startGame() {
    score = 0;
    updateScore(score);
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        handleLocationError({ code: 0, message: "Geolocation is not supported by this browser." });
        return;
    }

    // Get initial position with high accuracy
    navigator.geolocation.getCurrentPosition(
        (position) => {
            updateUserLocation(position);
            showNextQuestion();

            // Start watching position with high accuracy
            watchId = navigator.geolocation.watchPosition(
                updateUserLocation,
                handleLocationError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        },
        handleLocationError,
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }
    );
}

// Clean up function to stop watching location
function stopGame() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// Start the game when the page loads
window.onload = function() {
    startGame();
};

// Clean up when the window is closed
window.onunload = function() {
    stopGame();
};

// Rest of your existing functions...
function checkProximity(userPosition) {
    markers.forEach(marker => {
        const distance = getDistance(userPosition, marker.position);
        if (distance < 1000) { // 1 kilometer
            showPopupQuestion(marker.question, marker.answer);
        }
    });
}

function getDistance(pos1, pos2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1[0] * Math.PI / 180;
    const φ2 = pos2[0] * Math.PI / 180;
    const Δφ = (pos2[0] - pos1[0]) * Math.PI / 180;
    const Δλ = (pos2[1] - pos1[1]) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function showNextQuestion() {
    if (currentQuestionIndex < markers.length) {
        setTimeout(() => {
            showPopupQuestion(
                markers[currentQuestionIndex].question,
                markers[currentQuestionIndex].answer
            );
            currentQuestionIndex++;
        }, 1000);
    } else {
        alert(`Game Over! Final Score: ${score}`);
    }
}

function showPopupQuestion(question, correctAnswer) {
    const userAnswer = prompt(question);
    const messageElement = document.getElementById('message');
    messageElement.style.display = 'none';

    if (userAnswer && userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        score += 10;
        updateScore(score);
        alert("Correct! +10 points");
        showNextQuestion();
    } else {
        messageElement.textContent = "Incorrect answer. Try the next question!";
        messageElement.style.display = 'block';
        showNextQuestion();
    }
}

function updateScore(newScore) {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = newScore;
}