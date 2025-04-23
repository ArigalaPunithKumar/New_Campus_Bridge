// === Login Page Specific Logic ===

document.addEventListener('DOMContentLoaded', () => {

    // Check if utils.js is loaded (optional, basic check)
    if (typeof showMessage !== 'function' || typeof setLoading !== 'function') {
        console.error("Utility functions (showMessage, setLoading) not found! Make sure utils.js is loaded before login.js.");
        // Display a user-facing error
        const loginMsgEl = document.getElementById('login-message');
        if(loginMsgEl) {
            loginMsgEl.textContent = "Page initialization error. Please refresh or contact support.";
            loginMsgEl.className = 'form-message error-message show';
        }
        return; // Stop execution if utils are missing
    }

    // --- DOM Elements ---
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const forgotPasswordView = document.getElementById('forgot-password-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');

    const showSignupLink = document.getElementById('show-signup');
    const showForgotPasswordLink = document.getElementById('show-forgot-password');
    const backToLoginLinks = document.querySelectorAll('#back-to-login-from-signup, #back-to-login-from-forgot');

    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');
    const forgotMessage = document.getElementById('forgot-message');

    // --- View Switching --- //
    const showAuthView = (viewToShow) => {
        [loginView, signupView, forgotPasswordView].forEach(view => {
            if (view) view.classList.remove('active');
        });
        hideMessage(loginMessage);
        hideMessage(signupMessage);
        hideMessage(forgotMessage);
        if (viewToShow) viewToShow.classList.add('active');
    };

    // --- Event Handlers --- //

    const handleLogin = async (event) => {
        event.preventDefault();
        hideMessage(loginMessage);
        const formData = new FormData(loginForm);
        const identifier = formData.get('identifier');
        const password = formData.get('password');
        const role = formData.get('role');
        const submitButton = loginForm.querySelector('button[type="submit"]');

        if (!identifier || !password) {
            showMessage(loginMessage, "Please enter ID/Email and Password.");
            return;
        }

        setLoading(submitButton, true);

        try {
            // --- Replace with actual API call --- //
            console.log(`Attempting login: Role=${role}, ID=${identifier}`);
            await simulateApiCall(1500, identifier !== "fail"); // Use simulateApiCall from utils.js
            // --- End of simulation --- //

            // On Success: Assume API returns user object
            const simulatedUser = {
                id: identifier,
                name: role === 'student' ? 'Alice Smith' : (role === 'faculty' ? 'Prof. Davis' : 'Admin One'),
                role: role,
                email: `${identifier}@example.com`
                // Add token here if received from actual API
                // token: "YOUR_AUTH_TOKEN"
            };

            // Store user info in localStorage
            localStorage.setItem('currentUser', JSON.stringify(simulatedUser));
            console.log("User info stored in localStorage.");

            // Redirect to the appropriate dashboard page
            let dashboardUrl;
            switch (role) {
                case 'student':
                    dashboardUrl = 'student/dashboard.html';
                    break;
                case 'faculty':
                    dashboardUrl = 'faculty/dashboard.html';
                    break;
                case 'admin':
                    dashboardUrl = 'admin/dashboard.html';
                    break;
                default:
                    console.error("Unknown role for redirection:", role);
                    showMessage(loginMessage, "Login successful, but dashboard not found.");
                    setLoading(submitButton, false); // Reset button
                    return;
            }
            window.location.href = dashboardUrl;

        } catch (error) {
            console.error("Login failed:", error);
            showMessage(loginMessage, error.message || "Login failed. Please check your credentials.");
            setLoading(submitButton, false); // Reset button only on failure
        }
        // No finally block resetting loading, as we redirect on success
    };

    const handleSignup = async (event) => {
        event.preventDefault();
        hideMessage(signupMessage);
        const formData = new FormData(signupForm);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        const submitButton = signupForm.querySelector('button[type="submit"]');

        if (password !== confirmPassword) {
            showMessage(signupMessage, "Passwords do not match!");
            return;
        }
        if (password.length < 8) {
            showMessage(signupMessage, "Password must be at least 8 characters long.");
            return;
        }

        const userData = Object.fromEntries(formData.entries());
        delete userData.confirm_password;

        setLoading(submitButton, true);

        try {
            // --- Replace with actual API call --- //
            console.log("Attempting signup:", userData);
            await simulateApiCall(1500, userData.email !== "fail@example.com");
            // --- End of simulation --- //

            // Show success message and switch back to login view
            showMessage(loginMessage, "Signup successful! Please log in.", false);
            signupForm.reset();
            showAuthView(loginView);

        } catch (error) {
            console.error("Signup failed:", error);
            showMessage(signupMessage, error.message || "Signup failed. Please try again.");
        } finally {
            setLoading(submitButton, false);
        }
    };

    const handleForgotPassword = async (event) => {
        event.preventDefault();
        hideMessage(forgotMessage);
        const formData = new FormData(forgotPasswordForm);
        const email = formData.get('email');
        const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');

        if (!email) {
            showMessage(forgotMessage, "Please enter your email address.");
            return;
        }

        setLoading(submitButton, true);

        try {
            // --- Replace with actual API call --- //
            console.log(`Requesting password reset for: ${email}`);
            await simulateApiCall(1000);
            // --- End of simulation --- //

            showMessage(forgotMessage, `If an account exists for ${email}, a reset link has been sent.`, false);
            forgotPasswordForm.reset();
            // Maybe switch back to login after a delay?
             setTimeout(() => showAuthView(loginView), 3000);

        } catch (error) {
            console.error("Forgot password failed:", error);
            showMessage(forgotMessage, error.message || "Failed to send reset link. Please try again.");
        } finally {
            setLoading(submitButton, false);
        }
    };

    // --- Event Listeners Setup --- //

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', handleForgotPassword);

    if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showAuthView(signupView); });
    if (showForgotPasswordLink) showForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showAuthView(forgotPasswordView); });
    backToLoginLinks.forEach(link => {
        if (link) link.addEventListener('click', (e) => { e.preventDefault(); showAuthView(loginView); });
    });

    // --- Initial State --- //
    // Ensure the login view is active when the page loads
    showAuthView(loginView);
    console.log("Login page script initialized.");

}); 