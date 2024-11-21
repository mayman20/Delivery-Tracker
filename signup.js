// signup.js

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const database = firebase.database();
  
    const signupForm = document.getElementById('signup-form');
    const signupErrorDiv = document.getElementById('signup-error');
    const signupSuccessDiv = document.getElementById('signup-success');
  
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
  
      // Create user and assign default role (driver: true, overseer: false)
      auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
          const user = userCredential.user;
          console.log('User created:', user.email);
  
          // Assign default roles in Realtime Database
          return database.ref(`users/${user.uid}`).set({
            email: email,
            roles: {
              driver: true,     // Default role
              overseer: true   // Can be updated manually by admin
            }
          });
        })
        .then(() => {
          // Send email verification
          const user = auth.currentUser;
          if (user) {
            console.log('Sending email verification...');
            return user.sendEmailVerification();
          } else {
            throw new Error('User not found after sign-up.');
          }
        })
        .then(() => {
          // Display success message
          console.log('Verification email sent.');
          signupSuccessDiv.textContent = 'Account created successfully! Please verify your email before signing in.';
          // Optionally, redirect after a short delay
          // setTimeout(() => {
          //   window.location.href = 'index.html';
          // }, 5000);
        })
        .catch(error => {
          console.error('Sign-Up Error:', error);
          handleAuthErrors(error, signupErrorDiv);
        });
    });
  
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
  
    // Function to clear error and success messages
    function clearMessages() {
      if (signupErrorDiv) signupErrorDiv.textContent = '';
      if (signupSuccessDiv) signupSuccessDiv.textContent = '';
    }
  });
  