// app.js

// Ensure Firebase is initialized
if (!firebase.apps.length) {
    // Initialize Firebase if not already initialized
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized.');
  } else {
    console.log('Firebase already initialized.');
  }
  
  // Reference to Firebase services
  const auth = firebase.auth();
  const database = firebase.database();
  
  // Utility function to get current user role
  function getUserRole(userId) {
    return database.ref(`users/${userId}/roles`).once('value').then(snapshot => {
      const roles = snapshot.val();
      console.log(`Fetched roles for user ${userId}: ${JSON.stringify(roles)}`);
      return roles;
    });
  }
  
  // Detect Current Page
  const page = document.body.id;
  console.log(`Current page: ${page}`);
  
  // Landing Page: Handle Sign In and Sign Up
  if (page === 'index-page') {
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
      console.log('Switching to Sign-Up form.');
      authContainer.style.display = 'none';
      signupContainer.style.display = 'block';
      clearMessages();
    });
  
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Switching to Sign-In form.');
      signupContainer.style.display = 'none';
      authContainer.style.display = 'block';
      clearMessages();
    });
  
    // Handle Forgot Password
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Forgot Password clicked.');
        const email = prompt('Please enter your email for password reset:');
        if (email) {
          auth.sendPasswordResetEmail(email)
            .then(() => {
              alert('Password reset email sent! Please check your inbox.');
              console.log('Password reset email sent to:', email);
            })
            .catch(error => {
              console.error('Error sending password reset email:', error);
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
        
        // Get selected role
        const roleRadios = document.querySelectorAll('input[name="role"]:checked');
        const selectedRole = roleRadios.length > 0 ? roleRadios[0].value : null;
        
        console.log(`Attempting to sign in user: ${email} as ${selectedRole}`);
  
        // Basic validation
        if (!email || !password || !selectedRole) {
          console.warn('Sign-In: Missing email, password, or role.');
          loginErrorDiv.textContent = 'Please fill in all fields and select a role.';
          return;
        }
  
        auth.signInWithEmailAndPassword(email, password)
          .then(userCredential => {
            const user = userCredential.user;
            console.log('User signed in:', user.email);
            if (!user.emailVerified) {
              console.warn('User email not verified.');
              loginErrorDiv.textContent = 'Please verify your email before signing in.';
              auth.signOut();
              return;
            }
            // Retrieve the user's roles from the database
            database.ref(`users/${user.uid}/roles`).once('value').then(snapshot => {
              const userRoles = snapshot.val();
              console.log(`User roles: ${JSON.stringify(userRoles)}`);
              if (userRoles && userRoles[selectedRole]) {
                // User has the selected role
                if (selectedRole === 'driver') {
                  console.log('Redirecting to Driver Dashboard.');
                  window.location.href = 'driver.html';
                } else if (selectedRole === 'overseer') {
                  console.log('Redirecting to Overseer Dashboard.');
                  window.location.href = 'overseer.html';
                } else {
                  console.warn('Undefined role selected.');
                  loginErrorDiv.textContent = 'Undefined role selected. Please contact support.';
                  auth.signOut();
                }
              } else {
                // User does not have the selected role
                console.warn(`User does not have the role: ${selectedRole}`);
                loginErrorDiv.textContent = `You do not have the '${selectedRole}' role. Please contact support.`;
                auth.signOut();
              }
            });
          })
          .catch(error => {
            console.error('Sign-In Error:', error);
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
  
        // Collect selected roles
        const roleCheckboxes = document.querySelectorAll('input[name="signup-role"]:checked');
        const selectedRoles = Array.from(roleCheckboxes).map(checkbox => checkbox.value);
        
        console.log(`Attempting to sign up user: ${email} with roles: ${selectedRoles}`);
  
        // Basic validation
        if (!email || !password || !confirmPassword) {
          console.warn('Sign-Up: Missing fields.');
          signupErrorDiv.textContent = 'Please fill in all fields.';
          return;
        }
  
        // Password confirmation
        if (password !== confirmPassword) {
          console.warn('Sign-Up: Passwords do not match.');
          signupErrorDiv.textContent = 'Passwords do not match.';
          return;
        }
  
        // Password strength validation (minimum 6 characters as per Firebase)
        if (password.length < 6) {
          console.warn('Sign-Up: Weak password.');
          signupErrorDiv.textContent = 'Password should be at least 6 characters.';
          return;
        }
  
        // Validate that at least one role is selected
        if (selectedRoles.length === 0) {
          console.warn('Sign-Up: No roles selected.');
          signupErrorDiv.textContent = 'Please select at least one role.';
          return;
        }
  
        // Create user
        auth.createUserWithEmailAndPassword(email, password)
          .then(userCredential => {
            const user = userCredential.user;
            console.log('User created:', user.email);
            // Assign selected roles
            const rolesObject = {};
            selectedRoles.forEach(role => {
              rolesObject[role] = true;
            });
            return database.ref(`users/${user.uid}`).set({
              email: email,
              roles: rolesObject
            });
          })
          .then(() => {
            // Send verification email
            const user = auth.currentUser;
            if (user) {
              return user.sendEmailVerification();
            }
          })
          .then(() => {
            // Display success message
            console.log('Verification email sent.');
            signupSuccessDiv.textContent = 'Account created successfully! Please verify your email before signing in.';
            // Optionally, redirect after a short delay
            // setTimeout(() => {
            //   window.location.href = 'index.html';
            // }, 3000);
          })
          .catch(error => {
            console.error('Sign-Up Error:', error);
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
  if (page === 'driver-page') {
    const statusDiv = document.getElementById('status');
    const logoutButton = document.getElementById('logout-button');
  
    let driverId = null;
    let locationInterval = null;
    let map = null;
    let marker = null;
  
    auth.onAuthStateChanged(user => {
      if (user) {
        driverId = user.uid;
        console.log(`Driver logged in: ${user.email}, UID: ${driverId}`);
        statusDiv.textContent = 'Fetching your location...';
  
        // Initialize Map (optional: show driver's own location)
        map = L.map('map').setView([0, 0], 2); // Default view
        console.log('Map initialized.');
  
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        console.log('Leaflet tiles added to map.');
  
        // Request Geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            console.log('Initial location fetched:', latitude, longitude);
            updateLocation(latitude, longitude);
            map.setView([latitude, longitude], 13);
            marker = L.marker([latitude, longitude]).addTo(map)
              .bindPopup('You are here.').openPopup();
            console.log('Marker added to map.');
  
            // Update location every minute
            locationInterval = setInterval(() => {
              navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                console.log('Periodic location update:', latitude, longitude);
                updateLocation(latitude, longitude);
                map.setView([latitude, longitude], 13);
                marker.setLatLng([latitude, longitude]);
              }, err => {
                console.error('Error fetching location:', err);
                statusDiv.textContent = 'Error fetching location.';
              });
            }, 60000); // 60000ms = 1 minute
  
          }, error => {
            console.error('Geolocation error:', error);
            statusDiv.textContent = 'Error fetching location: ' + error.message;
          });
        } else {
          console.error('Geolocation not supported.');
          statusDiv.textContent = 'Geolocation is not supported by your browser.';
        }
  
        // Function to update location in Firebase
        function updateLocation(lat, lng) {
          statusDiv.textContent = 'Location updated.';
          database.ref(`drivers/${driverId}`).set({
            latitude: lat,
            longitude: lng,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          })
          .then(() => {
            console.log('Location updated in Firebase:', lat, lng);
          })
          .catch(error => {
            console.error('Error updating location in Firebase:', error);
            statusDiv.textContent = 'Error updating location.';
          });
        }
      } else {
        // No user is signed in, redirect to landing page
        console.warn('No user is signed in. Redirecting to sign-in page.');
        window.location.href = 'index.html';
      }
    });
  
    // Handle Logout
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
          console.log('User signed out.');
          // Clear interval
          if (locationInterval) clearInterval(locationInterval);
          window.location.href = 'index.html';
        }).catch(error => {
          console.error('Error signing out:', error);
        });
      });
    }
  }
  
  // Overseer Page: View All Drivers
  if (page === 'overseer-page') {
    const statusDiv = document.getElementById('status');
    const logoutButton = document.getElementById('logout-button');
  
    let map = null;
    let markers = {};
  
    auth.onAuthStateChanged(user => {
      if (user) {
        // Verify that the user is an overseer
        getUserRole(user.uid).then(role => {
          if (!role || !role.overseer) {
            console.warn('Access denied. User is not an overseer.');
            alert('Access denied. Only overseers can view driver locations.');
            auth.signOut();
            window.location.href = 'index.html';
            return;
          }
  
          console.log('Overseer logged in:', user.email);
  
          // Initialize Map
          map = L.map('map').setView([0, 0], 2); // Default view
          console.log('Map initialized.');
  
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          console.log('Leaflet tiles added to map.');
  
          // Listen for drivers' location updates
          database.ref('drivers').on('value', snapshot => {
            const drivers = snapshot.val();
            console.log('Drivers data fetched:', drivers);
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
        console.warn('No user is signed in. Redirecting to sign-in page.');
        window.location.href = 'index.html';
      }
    });
  
    // Function to get user role
    function getUserRole(userId) {
      return database.ref(`users/${userId}/roles`).once('value').then(snapshot => {
        const role = snapshot.val();
        console.log(`Fetched roles for user ${userId}: ${JSON.stringify(role)}`);
        return role;
      });
    }
  
    // Handle Logout
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
          console.log('User signed out.');
          window.location.href = 'index.html';
        }).catch(error => {
          console.error('Error signing out:', error);
        });
      });
    }
  }
  