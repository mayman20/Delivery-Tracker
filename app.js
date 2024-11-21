// app.js

// Ensure Firebase is initialized
if (!firebase.apps.length) {
    // Initialize Firebase if not already initialized
    firebase.initializeApp(firebaseConfig);
  }
  
  // Reference to Firebase services
  const auth = firebase.auth();
  const database = firebase.database();
  
  // Utility function to get current user role
  function getUserRole(userId) {
    return database.ref(`users/${userId}/role`).once('value').then(snapshot => snapshot.val());
  }
  
  // Landing Page: Handle Sign In and Sign Up
  if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupContainer = document.querySelector('.signup-container');
    const authContainer = document.querySelector('.auth-container');
    const signupLink = document.getElementById('signup-link');
    const loginLink = document.getElementById('login-link');
  
    // Toggle between login and signup forms
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      authContainer.style.display = 'none';
      signupContainer.style.display = 'block';
    });
  
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupContainer.style.display = 'none';
      authContainer.style.display = 'block';
    });
  
    // Handle Sign In
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
  
      auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
          const user = userCredential.user;
          // Save role in database
          database.ref(`users/${user.uid}/role`).set(role);
          // Redirect based on role
          if (role === 'driver') {
            window.location.href = 'driver.html';
          } else if (role === 'overseer') {
            window.location.href = 'overseer.html';
          }
        })
        .catch(error => {
          alert(error.message);
        });
    });
  
    // Handle Sign Up
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const role = document.getElementById('signup-role').value;
  
        auth.createUserWithEmailAndPassword(email, password)
          .then(userCredential => {
            const user = userCredential.user;
            // Save role in database
            database.ref(`users/${user.uid}/role`).set(role);
            // Redirect based on role
            if (role === 'driver') {
              window.location.href = 'driver.html';
            } else if (role === 'overseer') {
              window.location.href = 'overseer.html';
            }
          })
          .catch(error => {
            alert(error.message);
          });
      });
    }
  }
  
  // Driver Page: Share Location
  if (document.getElementById('status') && document.getElementById('map')) {
    const statusDiv = document.getElementById('status');
    const logoutButton = document.getElementById('logout-button');
  
    let driverId = null;
    let locationInterval = null;
    let map = null;
    let marker = null;
  
    auth.onAuthStateChanged(user => {
      if (user) {
        driverId = user.uid;
        statusDiv.textContent = 'Fetching your location...';
  
        // Initialize Map
        map = L.map('map').setView([0, 0], 2); // Default view
  
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
  
        // Request Geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            updateLocation(latitude, longitude);
            map.setView([latitude, longitude], 13);
            marker = L.marker([latitude, longitude]).addTo(map)
              .bindPopup('You are here.').openPopup();
  
            // Update location every minute
            locationInterval = setInterval(() => {
              navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                updateLocation(latitude, longitude);
                map.setView([latitude, longitude], 13);
                marker.setLatLng([latitude, longitude]);
              }, err => {
                console.error('Error fetching location:', err);
              });
            }, 60000); // 60000ms = 1 minute
  
          }, error => {
            statusDiv.textContent = 'Error fetching location: ' + error.message;
          });
        } else {
          statusDiv.textContent = 'Geolocation is not supported by your browser.';
        }
  
        // Function to update location in Firebase
        function updateLocation(lat, lng) {
          statusDiv.textContent = 'Location updated.';
          database.ref(`drivers/${driverId}`).set({
            latitude: lat,
            longitude: lng,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
        }
      } else {
        // No user is signed in, redirect to landing page
        window.location.href = 'index.html';
      }
    });
  
    // Handle Logout
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
          // Clear interval
          if (locationInterval) clearInterval(locationInterval);
          window.location.href = 'index.html';
        });
      });
    }
  }
  
  // Overseer Page: View All Drivers
  if (document.getElementById('overseer.html') || document.getElementById('map')) {
    const statusDiv = document.getElementById('status');
    const logoutButton = document.getElementById('logout-button');
  
    let map = null;
    let markers = {};
  
    auth.onAuthStateChanged(user => {
      if (user) {
        // Initialize Map
        map = L.map('map').setView([0, 0], 2); // Default view
  
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
  
        // Listen for drivers' location updates
        database.ref('drivers').on('value', snapshot => {
          const drivers = snapshot.val();
          if (drivers) {
            statusDiv.textContent = 'Viewing all drivers.';
            for (const [id, data] of Object.entries(drivers)) {
              const { latitude, longitude } = data;
              if (markers[id]) {
                markers[id].setLatLng([latitude, longitude]);
              } else {
                markers[id] = L.marker([latitude, longitude]).addTo(map)
                  .bindPopup(`Driver ID: ${id}`);
              }
            }
          } else {
            statusDiv.textContent = 'No drivers are currently active.';
          }
        });
      } else {
        // No user is signed in, redirect to landing page
        window.location.href = 'index.html';
      }
    });
  
    // Handle Logout
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
          window.location.href = 'index.html';
        });
      });
    }
  }
  