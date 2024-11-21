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
  
    // Utility function to get user roles
    function getUserRoles(userId) {
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
        console.log('Sign Up link clicked.');
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        clearMessages();
      });
  
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Sign In link clicked.');
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
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
              getUserRoles(user.uid).then(userRoles => {
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
  
          console.log(`Attempting to sign up user: ${email}`);
  
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
  
          // Create user and assign default role (driver)
          auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
              const user = userCredential.user;
              console.log('User created:', user.email);
              // Assign default role: driver
              return database.ref(`users/${user.uid}`).set({
                email: email,
                roles: {
                  driver: true // Default role
                }
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
      // Driver dashboard code...
    }
  
    // Overseer Page: View All Drivers
    if (page === 'overseer-page') {
      // Overseer dashboard code...
    }
  });
  