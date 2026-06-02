// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');

    loginForm.addEventListener('submit', async (e) => {
        // Prevent the default HTML form submission (page reload)
        e.preventDefault();

        // Grab the values from the input fields
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Reset UI state
        errorMessageDiv.className = 'error-hidden';
        errorMessageDiv.innerText = '';
        loginBtn.innerText = 'Logging in...';
        loginBtn.disabled = true;

        try {
            // Make the POST request to your backend API
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // SUCCESS! 
                // 1. Save the JWT token and user info to sessionStorage
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));

                // 2. Redirect to the correct dashboard based on their role
                const role = data.user.role.toLowerCase();
                window.location.href = `${role}-dashboard.html`; 
                // (e.g., this will send them to student-dashboard.html)
            } else {
                // Handle backend validation errors (e.g., "Invalid Password")
                showError(data.message || 'Login failed. Please try again.');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showError('Unable to connect to the server. Is your backend running?');
        } finally {
            // Reset button state
            loginBtn.innerText = 'Log In';
            loginBtn.disabled = false;
        }
    });

    // Helper function to display errors
    function showError(message) {
        errorMessageDiv.innerText = message;
        errorMessageDiv.className = 'error-visible';
    }
});