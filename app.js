// app.js

document.addEventListener('DOMContentLoaded', () => {
  // Ensure Firebase is initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized.');
  } else {
    console.log('Firebase already initialized.');
  }

  const auth = firebase.auth();
  const database = firebase.database();

  // Define custom Leaflet icons
  const redIcon = new L.Icon({
    iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const greenIcon = new L.Icon({
    iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // Utility function to get user roles
  function getUserRoles(userId) {
    console.log(`Fetching roles for user ID: ${userId}`);
    return database.ref(`users/${userId}/roles`).once('value').then(snapshot => {
      const roles = snapshot.val();
      console.log(`Fetched roles for user ${userId}: ${JSON.stringify(roles)}`);
      return roles;
    }).catch(error => {
      console.error('Error fetching user roles:', error);
      return null;
    });
  }

  // Detect Current Page
  const page = document.body.id;
  console.log(`Current page: ${page}`);

  // Landing Page: Handle Sign In (Sign-Up handled separately)
  if (page === 'index-page') {
    const loginForm = document.getElementById('login-form');
    const signupLink = document.getElementById('signup-link');
    const loginErrorDiv = document.getElementById('login-error');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

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

    // Function to handle and display Firebase authentication errors
    function handleAuthErrors(error, displayDiv) {
      let message = '';
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Invalid email address.';
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

    // Handle Sign In
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginErrorDiv.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        // Capture the selected role (driver/overseer)
        const selectedRole = document.querySelector('input[name="role"]:checked')?.value || '';

        console.log(`Attempting to sign in user: ${email} with selected role: ${selectedRole}`);

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
            getUserRoles(user.uid).then(userRoles => {
              if (userRoles) {
                // Check if the selected role matches the roles in the database
                if (selectedRole === 'driver' && userRoles.driver) {
                  console.log('Redirecting to Driver Dashboard.');
                  window.location.href = 'driver.html';
                } else if (selectedRole === 'overseer' && userRoles.overseer) {
                  console.log('Redirecting to Overseer Dashboard.');
                  window.location.href = 'overseer.html';
                } else {
                  console.warn('Selected role does not match database roles.');
                  loginErrorDiv.textContent = 'Role mismatch. Please select a valid role or contact support.';
                  auth.signOut();
                }
              } else {
                console.warn('No roles found for the user.');
                loginErrorDiv.textContent = 'No roles found. Please contact support.';
                auth.signOut();
              }
            }).catch(error => {
              console.error('Error retrieving user roles:', error);
              loginErrorDiv.textContent = 'Error retrieving user roles.';
              auth.signOut();
            });
          })
          .catch(error => {
            console.error('Sign-In Error:', error);
            handleAuthErrors(error, loginErrorDiv);
          });
      });
    }

    // Navigation to Sign-Up Page
    if (signupLink) {
      signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Navigating to Sign-Up page.');
        window.location.href = 'signup.html';
      });
    }
  }

  // Driver Page: Share Location and Toggle Status
  if (page === 'driver-page') {
    const statusDiv = document.getElementById('status');
    const logoutButton = document.getElementById('logout-button');
    const statusToggle = document.getElementById('status-toggle');

    let driverId = null;
    let locationInterval = null;
    let map = null;
    let marker = null;

    auth.onAuthStateChanged(user => {
      if (user) {
        driverId = user.uid;
        console.log(`Driver logged in: ${user.email}, UID: ${driverId}`);
        statusDiv.textContent = 'Fetching your location...';

        // Initialize Map
        map = L.map('map').setView([0, 0], 2); // Default view
        console.log('Map initialized.');

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        console.log('Leaflet tiles added to map.');

        // Function to update location in Firebase
        function updateLocation(lat, lng) {
          statusDiv.textContent = 'Updating your location...';
          console.log(`Attempting to update location for UID: ${driverId}`);
          database.ref(`drivers/${driverId}`).set({
            latitude: lat,
            longitude: lng,
            status: statusToggle.checked ? 'green' : 'red', // Update status based on toggle
            timestamp: firebase.database.ServerValue.TIMESTAMP
          })
          .then(() => {
            console.log('Location updated in Firebase:', lat, lng);
            statusDiv.textContent = 'Location updated.';
          })
          .catch(error => {
            console.error('Error updating location in Firebase:', error);
            statusDiv.textContent = 'Error updating location.';
          });
        }

        // Request Geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            console.log('Initial location fetched:', latitude, longitude);
            updateLocation(latitude, longitude);
            map.setView([latitude, longitude], 13);
            marker = L.marker([latitude, longitude], {
              icon: statusToggle.checked ? greenIcon : redIcon
            }).addTo(map)
              .bindPopup('You are here.<br>Status: ' + (statusToggle.checked ? 'Deliveries Completed' : 'Active'))
              .openPopup();
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

        // Listen for changes in driver's data to update marker color
        database.ref(`drivers/${driverId}`).on('value', snapshot => {
          const data = snapshot.val();
          if (data) {
            const { latitude, longitude, status } = data;
            console.log(`Driver status updated: ${status}`);
            if (marker) {
              marker.setIcon(status === 'green' ? greenIcon : redIcon);
              marker.getPopup().setContent(
                `You are here.<br>Status: ${status === 'green' ? 'Deliveries Completed' : 'Active'}`
              );
            }
          }
        });

        // Initialize the toggle state based on Firebase data
        database.ref(`drivers/${driverId}/status`).once('value').then(snapshot => {
          const status = snapshot.val();
          if (status === 'green') {
            statusToggle.checked = true;
          } else {
            statusToggle.checked = false;
          }
        }).catch(error => {
          console.error('Error fetching initial status:', error);
        });

        // Handle Toggle Switch
        if (statusToggle) {
          statusToggle.addEventListener('change', () => {
            console.log(`Toggle switched to: ${statusToggle.checked ? 'green' : 'red'}`);
            // Update the marker icon immediately
            if (marker) {
              marker.setIcon(statusToggle.checked ? greenIcon : redIcon);
              marker.getPopup().setContent(
                `You are here.<br>Status: ${statusToggle.checked ? 'Deliveries Completed' : 'Active'}`
              );
            }
            // Update status in Firebase
            database.ref(`drivers/${driverId}/status`).set(statusToggle.checked ? 'green' : 'red')
              .then(() => {
                console.log('Driver status updated to:', statusToggle.checked ? 'green' : 'red');
              })
              .catch(error => {
                console.error('Error updating driver status:', error);
                alert('Failed to update status. Please try again.');
                // Revert the toggle switch in case of error
                statusToggle.checked = !statusToggle.checked;
              });
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
        getUserRoles(user.uid).then(userRoles => {
          if (!userRoles || !userRoles.overseer) {
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
                const { latitude, longitude, timestamp, status } = data;
                if (markers[id]) {
                  // Update existing marker
                  markers[id].setLatLng([latitude, longitude]);
                  markers[id].setIcon(status === 'green' ? greenIcon : redIcon);
                  markers[id].getPopup().setContent(
                    `Driver ID: ${id}<br>Last Updated: ${new Date(timestamp).toLocaleString()}<br>Status: ${status === 'green' ? 'Deliveries Completed' : 'Active'}`
                  );
                } else {
                  // Create a new marker
                  markers[id] = L.marker([latitude, longitude], { icon: status === 'green' ? greenIcon : redIcon })
                    .addTo(map)
                    .bindPopup(
                      `Driver ID: ${id}<br>Last Updated: ${new Date(timestamp).toLocaleString()}<br>Status: ${status === 'green' ? 'Deliveries Completed' : 'Active'}`
                    );
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
        }).catch(error => {
          console.error('Error fetching user roles:', error);
          statusDiv.textContent = 'Error verifying user role.';
        });
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
          window.location.href = 'index.html';
        }).catch(error => {
          console.error('Error signing out:', error);
        });
      });
    }
  }
});
