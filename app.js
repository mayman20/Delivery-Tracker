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
  if (document.getElementById('login-form') || document.getElementById('signup-form')) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupContainer = document.querySelector('.signup-container');
    const authContainer = document.querySelector('.auth-container');
    const signupLink = document.getElementById('signup-link');
    const loginLink = document.getElementById('login-link');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const loginErrorDiv = document.getElementById('login-error');
    const signupErrorDiv = document.getElementById('signup-error');
    const signupSuccessDiv = document.getElementById('signup-success');
  
    // Toggle between login and signup forms
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      authContainer.style.display = 'none';
      signupContainer.style.display = 'block';
      clearMessages();
    });
  
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupContainer.style.display = 'none';
      authContainer.style.display = 'block';
      clearMessages();
    });
  
    // Handle Forgot Password
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt('Please enter your email for password reset:');
        if (email) {
          auth.sendPasswordResetEmail(email)
            .then(() => {
              alert('Password reset email sent! Please check your inbox.');
            })
            .catch(error => {
              handleAuthErrors(error, loginErrorDiv);
            });
        }
      });
    }
  
    // Function to clear error and success messages
    function clearMessages() {
      if (loginErrorDiv) loginErrorDiv.textContent = '';
      if (signupErrorDiv) signupErrorDiv.textContent = '';
      if (signupSuccessDiv) signupSuccessDiv.textContent = '';
    }
  
    // Handle Sign In
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearMessages();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
  
        // Basic validation
        if (!email || !password || !role) {
          loginErrorDiv.textContent = 'Please fill in all fields.';
          return;
        }
  
        auth.signInWithEmailAndPassword(email, password)
          .then(userCredential => {
            const user = userCredential.user;
            if (!user.emailVerified) {
              loginErrorDiv.textContent = 'Please verify your email before signing in.';
              auth.signOut();
              return;
            }
            // Retrieve the user's role from the database to ensure consistency
            getUserRole(user.uid).then(storedRole => {
              if (storedRole !== role) {
                // Role mismatch
                loginErrorDiv.textContent = 'Role does not match our records.';
                auth.signOut(); // Sign out the user
                return;
              }
              // Redirect based on role
              if (role === 'driver') {
                window.location.href = 'driver.html';
              } else if (role === 'overseer') {
                window.location.href = 'overseer.html';
              }
            });
          })
          .catch(error => {
            // Handle Firebase authentication errors
            handleAuthErrors(error, loginErrorDiv);
          });
      });
    }
  
    // Handle Sign Up
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearMessages();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const role = document.getElementById('signup-role').value;
  
        // Basic validation
        if (!email || !password || !confirmPassword || !role) {
          signupErrorDiv.textContent = 'Please fill in all fields.';
          return;
        }
  
        // Password confirmation
        if (password !== confirmPassword) {
          signupErrorDiv.textContent = 'Passwords do not match.';
          return;
        }
  
        // Password strength validation (minimum 6 characters as per Firebase)
        if (password.length < 6) {
          signupErrorDiv.textContent = 'Password should be at least 6 characters.';
          return;
        }
  
        auth.createUserWithEmailAndPassword(email, password)
          .then(userCredential => {
            const user = userCredential.user;
            // Save role in database
            return database.ref(`users/${user.uid}`).set({
              role: role,
              email: email
            }).then(() => {
              // Send verification email
              return user.sendEmailVerification();
            }).then(() => {
              // Display success message
              signupSuccessDiv.textContent = 'Account created successfully! Please verify your email before signing in.';
              // Optionally, redirect after a delay
              // setTimeout(() => {
              //   window.location.href = 'index.html';
              // }, 3000);
            });
          })
          .catch(error => {
            // Handle Firebase authentication errors
            handleAuthErrors(error, signupErrorDiv);
          });
      });
    }
  
    // Function to handle and display Firebase authentication errors
    function handleAuthErrors(error, displayDiv) {
      let message = '';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Operation not allowed. Please contact support.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak.';
          break;
        case 'auth/user-disabled':
          message = 'This user has been disabled.';
          break;
        case 'auth/user-not-found':
          message = 'No user found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password.';
          break;
        default:
          message = 'An error occurred. Please try again.';
      }
      displayDiv.textContent = message;
    }
  }
  
  // Driver Page: Share Location
  if (document.getElementById('driver.html') || document.getElementById('map')) {
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
                statusDiv.textContent = 'Error fetching location.';
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
          }).catch(error => {
            console.error('Error updating location:', error);
            statusDiv.textContent = 'Error updating location.';
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
        // Verify that the user is an overseer
        getUserRole(user.uid).then(role => {
          if (role !== 'overseer') {
            alert('Access denied. Only overseers can view driver locations.');
            auth.signOut();
            window.location.href = 'index.html';
            return;
          }
  
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
                  markers[id].getPopup().setContent(`Driver ID: ${id}<br>Last Updated: ${new Date(data.timestamp).toLocaleString()}`);
                } else {
                  markers[id] = L.marker([latitude, longitude]).addTo(map)
                    .bindPopup(`Driver ID: ${id}<br>Last Updated: ${new Date(data.timestamp).toLocaleString()}`);
                }
              }
            } else {
              statusDiv.textContent = 'No drivers are currently active.';
              // Remove existing markers if any
              for (const id in markers) {
                map.removeLayer(markers[id]);
                delete markers[id];
              }
            }
          }, error => {
            console.error('Error fetching drivers:', error);
            statusDiv.textContent = 'Error fetching driver locations.';
          });
        });
      } else {
        // No user is signed in, redirect to landing page
        window.location.href = 'index.html';
      }
    });
  
    // Function to get user role
    function getUserRole(userId) {
      return database.ref(`users/${userId}/role`).once('value').then(snapshot => snapshot.val());
    }
  
    // Handle Logout
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
          window.location.href = 'index.html';
        });
      });
    }
  }
  