document.addEventListener("DOMContentLoaded", async () => {
    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(userString);

    if (user.role !== "admin") {
        alert("Access Forbidden: Administrator privileges required.");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("user-name-display").textContent = `Admin: ${user.full_name}`;

    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 2. DOM ELEMENTS
    const form = document.getElementById("funding-form");
    const projectSelect = document.getElementById("project_id");
    const fundingList = document.getElementById("funding-list");
    const systemMessage = document.getElementById("system-message");
    const errorMessage = document.getElementById("error-message");
    const submitBtn = document.getElementById("add-funding-btn");

    // Formatter for Indian Rupees
    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });

    // 3. FETCH INITIAL DATA
    async function loadData() {
        try {
            // A. Fetch Projects (Only Approved Projects should get funding)
            const projRes = await fetch("http://localhost:3001/api/projects", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const projData = await projRes.json();

            if (projData.success) {
                const approvedProjects = projData.projects.filter(p => p.status === "approved" || p.status === "in_progress");
                
                projectSelect.innerHTML = '<option value="" disabled selected>Select an approved project...</option>';
                if (approvedProjects.length === 0) {
                    projectSelect.innerHTML = '<option value="" disabled>No approved projects available</option>';
                } else {
                    approvedProjects.forEach(p => {
                        projectSelect.innerHTML += `<option value="${p.project_id}">${p.title} (${p.student_name})</option>`;
                    });
                }
            }

            // B. Fetch Existing Funding Records
            fetchFundingRecords();

        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async function fetchFundingRecords() {
        try {
            const fundRes = await fetch("http://localhost:3001/api/funding", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const fundData = await fundRes.json();

            if (fundData.success) {
                fundingList.innerHTML = ""; 

                if (!fundData.funding || fundData.funding.length === 0) {
                    fundingList.innerHTML = '<p class="empty-state">No funding records found.</p>';
                    return;
                }

                fundData.funding.forEach(record => {
                    const formattedAmount = currencyFormatter.format(record.sanctioned_amount);
                    const formattedDate = new Date(record.approval_date).toLocaleDateString();
                    
                    // Badge color logic based on utilization
                    let badgeColor = "#bdc3c7"; 
                    let textColor = "#2c3e50";
                    if (record.utilization_status === "Not Used") { badgeColor = "#fadbd8"; textColor = "#c0392b"; }
                    if (record.utilization_status === "Partially Used") { badgeColor = "#ffeaa7"; textColor = "#d35400"; }
                    if (record.utilization_status === "Fully Used") { badgeColor = "#d4edda"; textColor = "#155724"; }

                    const card = `
                        <div class="list-item-card" style="display: block; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div class="item-info">
                                    <h4 style="font-size: 1.1rem; color: #2c3e50;">${record.project_title}</h4>
                                    <p style="margin-top: 5px;"><strong>Agency:</strong> ${record.funding_agency} | <strong>Grant ID:</strong> ${record.grant_id || "N/A"}</p>
                                    <p style="margin-top: 5px;"><strong>Sanctioned Amount:</strong> <span style="color: #27ae60; font-weight: bold;">${formattedAmount}</span></p>
                                    <p style="font-size: 12px; margin-top: 5px;">Approved on: ${formattedDate}</p>
                                </div>
                                <div style="text-align: right;">
                                    <span class="status-badge" style="background-color: ${badgeColor}; color: ${textColor}; display: inline-block; margin-bottom: 10px;">
                                        ${record.utilization_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                    fundingList.innerHTML += card;
                });
            }
        } catch (error) {
            console.error("Error fetching funding:", error);
            fundingList.innerHTML = '<p class="empty-state error-visible">Failed to load records.</p>';
        }
    }

    // 4. HANDLE ADD FUNDING SUBMISSION
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        systemMessage.className = "success-hidden";
        errorMessage.className = "error-hidden";
        submitBtn.textContent = "Recording...";
        submitBtn.disabled = true;

        const payload = {
            project_id: projectSelect.value,
            funding_agency: document.getElementById("funding_agency").value,
            grant_id: document.getElementById("grant_id").value,
            sanctioned_amount: document.getElementById("sanctioned_amount").value,
            approval_date: document.getElementById("approval_date").value,
            utilization_status: document.getElementById("utilization_status").value
        };

        try {
            const response = await fetch("http://localhost:3001/api/funding/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                systemMessage.textContent = "Funding Record Added Successfully!";
                systemMessage.className = "success-visible";
                form.reset();
                
                // Refresh the funding list immediately
                fetchFundingRecords();
            } else {
                errorMessage.textContent = data.message || "Failed to add funding record.";
                errorMessage.className = "error-visible";
            }
        } catch (error) {
            errorMessage.textContent = "Server error. Please try again later.";
            errorMessage.className = "error-visible";
        } finally {
            submitBtn.textContent = "Record Funding";
            submitBtn.disabled = false;
        }
    });

    // Initialize page
    loadData();
});
