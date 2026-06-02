document.addEventListener('DOMContentLoaded', () => {
    
    const registerForm = document.getElementById('register-form');
    const errorMessageDiv = document.getElementById('error-message');
    const successMessageDiv = document.getElementById('success-message');
    const registerBtn = document.getElementById('register-btn');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Grab values from all inputs
        const full_name = document.getElementById('full_name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const department = document.getElementById('department').value;

        // Reset UI state
        errorMessageDiv.className = 'error-hidden';
        successMessageDiv.className = 'success-hidden';
        errorMessageDiv.innerText = '';
        registerBtn.innerText = 'Registering...';
        registerBtn.disabled = true;

        let response;
        try {
            response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ full_name, email, password, role, department })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // SUCCESS: Show a green message and redirect to login page
                successMessageDiv.innerText = 'Registration successful! Redirecting to login...';
                successMessageDiv.className = 'success-visible';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000); // 2-second delay so they can read the success message
            } else {
                // Handle backend validation errors (e.g., "User already exists")
                showError(data.message || 'Registration failed. Please try again.');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showError('Unable to connect to the server. Is your backend running?');
        } finally {
            // Reset button if there was an error
            if (!response || !response.ok) {
                registerBtn.innerText = 'Register';
                registerBtn.disabled = false;
            }
        }
    });

    function showError(message) {
        errorMessageDiv.innerText = message;
        errorMessageDiv.className = 'error-visible';
    }
});