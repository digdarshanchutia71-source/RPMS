document.addEventListener("DOMContentLoaded", () => {
    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html"; // Redirect to login if not authenticated
        return;
    }

    const user = JSON.parse(userString);

    // Ensure only students access this page
    if (user.role !== "student") {
        alert("Access Forbidden: Only students can submit proposals.");
        window.location.href = "index.html";
        return;
    }

    // Display user name in the navbar
    document.getElementById("user-name-display").textContent = `Hello, ${user.full_name}`;

    // 2. LOGOUT FUNCTIONALITY
    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 3. FORM SUBMISSION
    const form = document.getElementById("proposal-form");
    const systemMessage = document.getElementById("system-message");
    const errorMessage = document.getElementById("error-message");
    const submitBtn = document.getElementById("submit-proposal-btn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Reset messages
        systemMessage.className = "success-hidden";
        errorMessage.className = "error-hidden";
        submitBtn.textContent = "Submitting...";
        submitBtn.disabled = true;

        // Gather form data
        const payload = {
            title: document.getElementById("title").value,
            domain: document.getElementById("domain").value,
            abstract: document.getElementById("abstract").value,
            methodology: document.getElementById("methodology").value,
            start_date: document.getElementById("start_date").value,
            end_date: document.getElementById("end_date").value,
            student_id: user.id, // Extracted from logged-in user data
            description: "Initial Research Proposal Submission" // Defaulting description
        };

        try {
            const response = await fetch("http://localhost:3001/api/projects/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                systemMessage.textContent = "Project Proposal Submitted Successfully!";
                systemMessage.className = "success-visible";
                form.reset();
            } else {
                // Show error message from backend
                errorMessage.textContent = data.message || "Failed to submit proposal.";
                errorMessage.className = "error-visible";
            }
        } catch (error) {
            errorMessage.textContent = "Server error. Please try again later.";
            errorMessage.className = "error-visible";
        } finally {
            submitBtn.textContent = "Submit Proposal";
            submitBtn.disabled = false;
        }
    });
});