// === Student Dashboard Specific Logic ===

// Assume utils.js provides: showMessage, hideMessage, setLoading, simulateApiCall, openModal, closeModal
// Add checks or fallbacks if needed
if (typeof window.showMessage !== 'function') console.error("showMessage function not found!");
if (typeof window.setLoading !== 'function') console.error("setLoading function not found!");
if (typeof window.simulateApiCall !== 'function') {
    window.simulateApiCall = (duration) => new Promise(resolve => setTimeout(resolve, duration));
    console.warn("simulateApiCall function not found, using basic fallback.");
}
// ... etc for openModal/closeModal

// --- DOM Elements (Scoped to Student Dashboard) ---
// Declare variables, assign inside initializeStudentDashboard
let sidebarElement, mainContentElement;
// Compiler elements
let codeEditor, codeInput, languageSelect, outputConsole, aiFeedbackBox, aiRating;
let runCodeBtn, aiReviewBtn, aiDebugBtn, aiHintBtn;
// Other content areas
let assignmentsTableBody, courseList, attendanceSummary, attendanceChartContainer;
let profileName, profileId, profileEmail, badgesContainer, heatmapContainer, streakVisContainer, streakCurrent, streakLongest;
let codingTracksContainer, jobMatchesContainer;
// Stat spans
let attendanceStat, pendingStat, streakStat, badgesStat;


// --- Initialization Function ---
const initializeStudentDashboard = (currentUser) => {
    console.log("Initializing Student Dashboard for:", currentUser?.id);

    // Assign top-level elements
    sidebarElement = document.getElementById('sidebar');
    mainContentElement = document.getElementById('main-content');

    if (!sidebarElement || !mainContentElement) {
        console.error("Essential dashboard elements (sidebar or main-content) not found!");
        return;
    }

    // Find elements within mainContentElement for better scoping
    // Compiler
    codeEditor = mainContentElement.querySelector('#code-editor');
    codeInput = mainContentElement.querySelector('#code-input');
    languageSelect = mainContentElement.querySelector('#language-select');
    outputConsole = mainContentElement.querySelector('#output-console');
    aiFeedbackBox = mainContentElement.querySelector('#ai-feedback-box');
    aiRating = mainContentElement.querySelector('#ai-rating');
    runCodeBtn = mainContentElement.querySelector('#run-code-btn');
    aiReviewBtn = mainContentElement.querySelector('#ai-review-btn');
    aiDebugBtn = mainContentElement.querySelector('#ai-debug-btn');
    aiHintBtn = mainContentElement.querySelector('#ai-hint-btn');

    // Academic Hub
    assignmentsTableBody = mainContentElement.querySelector('#assignments-table-body');
    courseList = mainContentElement.querySelector('#course-list');
    attendanceSummary = mainContentElement.querySelector('#attendance-summary');
    attendanceChartContainer = mainContentElement.querySelector('#attendance-chart-container');

    // Profile
    profileName = mainContentElement.querySelector('#profile-name');
    profileId = mainContentElement.querySelector('#profile-id');
    profileEmail = mainContentElement.querySelector('#profile-email');
    badgesContainer = mainContentElement.querySelector('#badges-container');
    heatmapContainer = mainContentElement.querySelector('#heatmap-container');
    streakVisContainer = mainContentElement.querySelector('#streak-visualization');
    streakCurrent = mainContentElement.querySelector('#profile-streak-current');
    streakLongest = mainContentElement.querySelector('#profile-streak-longest');

    // Coding Zone / Jobs
    codingTracksContainer = mainContentElement.querySelector('#coding-tracks');
    jobMatchesContainer = mainContentElement.querySelector('#job-matches-container');

    // Stats (may be inside mainContentElement or globally accessible)
    // Query globally just in case, or adjust if they are inside mainContentElement
    attendanceStat = document.getElementById('student-attendance-stat');
    pendingStat = document.getElementById('student-pending-stat');
    streakStat = document.getElementById('student-streak-stat');
    badgesStat = document.getElementById('student-badges-stat');


    // Check user validity
    if (!currentUser || !currentUser.id) {
        console.error("CurrentUser data not provided or invalid for initializeStudentDashboard.");
        // Redirect should happen in HTML, but good to prevent further execution
        return;
    }

    // Load data, then setup listeners and navigation
    loadStudentDashboardData(currentUser.id, currentUser.name, currentUser.email)
        .then(() => {
            console.log("Dashboard data loaded, setting up listeners and navigation.");
            setupStudentEventListeners();
            setupDashboardNavigation(sidebarElement, mainContentElement);

            // Set initial active section
            const initialActiveLink = sidebarElement.querySelector('nav a.active-link');
            let initialSectionId = 'student-home'; // Default
            if (initialActiveLink && initialActiveLink.dataset.target) {
                initialSectionId = initialActiveLink.dataset.target;
            } else {
                const firstLink = sidebarElement.querySelector('nav a[data-target]');
                if (firstLink) {
                    firstLink.classList.add('active-link');
                    initialSectionId = firstLink.dataset.target || 'student-home';
                }
            }
            setActiveSection(mainContentElement, initialSectionId);

            console.log("Student Dashboard Initialized.");
        })
        .catch(error => {
            console.error("Failed to load student dashboard data:", error);
            if (mainContentElement) {
                mainContentElement.innerHTML = `<div class="error-message" style='padding:2rem;color:red;'>Failed to load dashboard data. Please try again later.</div>`;
            }
        });
};


// --- Data Loading & Populating Functions --- //

const loadStudentDashboardData = async (studentId, studentName, studentEmail) => {
    if (!studentId) throw new Error("Missing student ID for data loading.");

    console.log(`Loading data for student ID: ${studentId}`);
    showLoadingMessage(); // Show loading state (optional)

    try {
        await simulateApiCall(500); // Simulate API delay

        // --- TODO: Replace with actual API call --- //
        const sampleData = {
            stats: { attendance: 92, pending: 3, streak: 15, badges: 5 },
            attendance: [
                { course: "CS101", rate: "95%" }, { course: "MA101", rate: "88%" }, { course: "PH101", rate: "90%" },
            ],
            detailedAttendance: [
                { course: 'CS101 - Intro to Programming', percentage: 95 },
                { course: 'MA101 - Calculus I', percentage: 88 },
                { course: 'PH101 - Physics', percentage: 90 },
                { course: 'CH101 - Chemistry', percentage: 74 },
                { course: 'HS101 - History', percentage: 60 },
            ],
            courses: [
                { id: 'cs101', name: "CS101 - Intro to Programming", links: [{ name: 'Notes', url: '#' }, { name: 'Syllabus', url: '#' }] },
                { id: 'ma101', name: "MA101 - Calculus I", links: [{ name: 'Problems', url: '#' }, { name: 'Recordings', url: '#' }] },
            ],
            assignments: [
                { id: 'a1', course: 'CS101', title: 'Lab 1: Variables', due: '2024-07-10', status: 'Submitted', grade: 'A', review: 'Good work!' },
                { id: 'a2', course: 'MA101', title: 'Problem Set 2', due: '2024-07-15', status: 'Pending', grade: '-', review: null },
                { id: 'a3', course: 'CS101', title: 'Quiz 1: Basics', due: '2024-07-05', status: 'Graded', grade: '85/100', review: 'Solid understanding.' },
                { id: 'a4', course: 'CS101', title: 'Lab 2: Conditionals', due: '2024-07-20', status: 'Pending', grade: '-', review: null },
            ],
            profile: {
                name: studentName || 'Student Name',
                id: studentId,
                email: studentEmail || 'student@example.com',
                badges: ['Pythonista', 'DSA Novice', 'Web Crawler', '10-Day Streak', 'Problem Solver'],
                currentStreak: 15,
                longestStreak: 21
            },
            codingTracks: [
                { id: 'track1', name: 'DSA Essentials' }, { id: 'track2', name: 'Web Dev (MERN)' }, { id: 'track3', name: 'Python for Data Science' },
            ],
            jobMatches: [
                { title: 'Junior Web Developer', skills: 'HTML, CSS, JS, React', match: '75%', detail: 'Strong in JS, Learning React' },
                { title: 'Python Dev Intern', skills: 'Python, Algo, Git', match: '90%', detail: 'Excellent Python skills' },
            ]
        };
        // --- End of Sample Data --- //

        // Populate UI elements
        populateStudentStats(sampleData.stats);
        populateAttendanceSummary(sampleData.attendance);
        populateCoursesList(sampleData.courses);
        populateAssignmentsTable(sampleData.assignments);
        populateStudentProfile(sampleData.profile);
        populateCodingTracks(sampleData.codingTracks);
        populateJobMatches(sampleData.jobMatches);
        populateAttendanceChart(sampleData.detailedAttendance);

    } catch (error) {
        console.error("Error loading student dashboard data:", error);
        // Display error to user if mainContentElement is available
        if (mainContentElement) {
            mainContentElement.innerHTML = `<p class="error-message">Could not load dashboard information. Please try refreshing.</p>`;
        }
    } finally {
        hideLoadingMessage(); // Hide loading state
    }
};


// Optional Loading State Helpers
const showLoadingMessage = () => {
    if (mainContentElement) mainContentElement.style.opacity = '0.5';
};
const hideLoadingMessage = () => {
    if (mainContentElement) mainContentElement.style.opacity = '1';
};


// Individual Populate Functions (ensure variables are correctly scoped/accessed)
const populateStudentStats = (stats) => {
    if (attendanceStat) attendanceStat.textContent = stats?.attendance ?? '--';
    if (pendingStat) pendingStat.textContent = stats?.pending ?? '--';
    if (streakStat) streakStat.textContent = stats?.streak ? `🔥 ${stats.streak}` : '--';
    if (badgesStat) badgesStat.textContent = stats?.badges ?? '--';
};

const populateAttendanceSummary = (attendanceData) => {
    if (!attendanceSummary) return;
    attendanceSummary.innerHTML = attendanceData?.length > 0
        ? attendanceData.map(item => `<p><strong>${item.course}:</strong> ${item.rate}</p>`).join('')
        : '<p>No attendance summary available.</p>';
};

const populateCoursesList = (courses) => {
    if (!courseList) return;
    courseList.innerHTML = courses?.length > 0
        ? courses.map(course => `
            <li>
                <strong>${course.name}</strong>
                ${course.links.map(link => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.name}</a>`).join(' | ')}
            </li>`).join('')
        : '<li>No courses found.</li>';
};

const populateAssignmentsTable = (assignments) => {
    if (!assignmentsTableBody) return;
    assignmentsTableBody.innerHTML = assignments?.length > 0
        ? assignments.map(a => `
            <tr>
                <td>${a.course || 'N/A'}</td>
                <td>${a.title || 'N/A'}</td>
                <td>${a.due || 'N/A'}</td>
                <td class="status-${(a.status || 'unknown').toLowerCase()}">${a.status || 'Unknown'}</td>
                <td>${a.grade || '-'}</td>
                <td>
                    ${a.status === 'Pending'
                ? `<button class="btn btn-sm btn-primary btn-submit-assignment" data-assignment-id="${a.id}">Submit</button>`
                : `<button class="btn btn-sm btn-secondary btn-view-review" data-assignment-id="${a.id}" data-review="${a.review || 'No review yet.'}" ${!a.review ? 'disabled' : ''}>View Review</button>`
            }
                </td>
            </tr>`).join('')
        : '<tr><td colspan="6">No assignments found.</td></tr>';
};

const populateStudentProfile = (profile) => {
    if (profileName) profileName.textContent = profile?.name ?? 'N/A';
    if (profileId) profileId.textContent = profile?.id ?? 'N/A';
    if (profileEmail) profileEmail.textContent = profile?.email ?? 'N/A';
    if (streakCurrent) streakCurrent.textContent = profile?.currentStreak ?? '--';
    if (streakLongest) streakLongest.textContent = profile?.longestStreak ?? '--';

    if (badgesContainer) {
        badgesContainer.innerHTML = profile?.badges?.length > 0
            ? profile.badges.map(badge => `<span class="badge">${badge}</span>`).join('')
            : '<p>No badges earned yet.</p>';
    }
    if (heatmapContainer) {
        // Replace with actual heatmap rendering if using a library
        heatmapContainer.innerHTML = '<p>(Skill Heatmap Visualization Placeholder)</p>';
    }
    if (streakVisContainer) {
        // Replace with actual streak visualization
        streakVisContainer.innerHTML = '<p>(Streak Visualization Placeholder)</p>';
    }
};

const populateCodingTracks = (tracks) => {
    if (!codingTracksContainer) return;
    codingTracksContainer.innerHTML = tracks?.length > 0
        ? tracks.map(track => `<div class="track-card" data-track-id="${track.id}">${track.name}</div>`).join('')
        : '<p>No coding tracks available.</p>';
};

const populateJobMatches = (matches) => {
    if (!jobMatchesContainer) return;
    jobMatchesContainer.innerHTML = matches?.length > 0
        ? matches.map(match => `
            <div class="job-match">
                <h4>${match.title}</h4>
                <p><strong>Required Skills:</strong> ${match.skills}</p>
                <p><strong>Your Match:</strong> ${match.match} (${match.detail})</p>
                <button class="btn btn-sm btn-secondary">View Details</button>
            </div>`).join('')
        : '<p>No job recommendations available yet.</p>';
};

const populateAttendanceChart = (detailedAttendanceData) => {
    if (!attendanceChartContainer) {
        console.error('Attendance chart container not found');
        return;
    }
    if (!detailedAttendanceData || detailedAttendanceData.length === 0) {
        attendanceChartContainer.innerHTML = '<p>No detailed attendance data available for chart.</p>';
        return;
    }

    attendanceChartContainer.innerHTML = ''; // Clear loading/previous
    const maxHeight = 180; // Max bar height in pixels

    detailedAttendanceData.forEach(item => {
        const percentage = item.percentage || 0;
        let barClass = 'high'; // default green
        if (percentage < 75) barClass = 'low'; // red
        else if (percentage < 90) barClass = 'medium'; // yellow

        const barItem = document.createElement('div');
        barItem.className = 'attendance-bar-item';

        const bar = document.createElement('div');
        bar.className = `attendance-bar ${barClass}`;
        bar.style.height = `${Math.max(5, (percentage / 100) * maxHeight)}px`; // Min height 5px

        const percentageLabel = document.createElement('span');
        percentageLabel.className = 'attendance-percentage';
        percentageLabel.textContent = `${percentage}%`;

        const courseName = document.createElement('span');
        courseName.className = 'attendance-course-name';
        courseName.textContent = item.course || 'Unknown Course';
        courseName.title = item.course || 'Unknown Course'; // Tooltip for long names

        bar.appendChild(percentageLabel);
        barItem.appendChild(bar);
        barItem.appendChild(courseName);

        attendanceChartContainer.appendChild(barItem);
    });
};


// --- Simulation Helper Functions ---
// Keep simulateAiFeedback, remove simulateCodeExecution
function simulateAiFeedback(language, code, type, currentOutput = '') {
    console.log(`Simulating AI ${type} for ${language}`);
    let feedback = `AI ${type} Result for ${language}:\n`;
    let rating = `N/A`;

    if (code.trim() === "") {
        feedback += "The code editor is empty. Cannot provide feedback.";
    } else {
        switch (type) {
            case 'review':
                feedback += "- Code structure looks reasonable.\n- Variable names like 'temp' could be more descriptive.\n- Consider adding comments for complex sections.\n- Efficiency seems acceptable for typical inputs.";
                rating = `${Math.floor(Math.random() * 3) + 7}/10`; // 7-9/10
                break;
            case 'debug':
                if (currentOutput.toLowerCase().includes('error') || currentOutput.toLowerCase().includes('exception')) {
                    feedback += `- The error message suggests a problem.\n- Check line X: Ensure variable 'Y' is defined before use.\n- Verify correct indentation or bracket matching.`;
                    rating = `${Math.floor(Math.random() * 4) + 2}/10`; // 2-5/10
                } else {
                    feedback += "- No obvious errors detected in the output.\n- If the logic is wrong, try adding print statements to trace values.\n- Check edge cases (empty input, large numbers, etc.).";
                    rating = `${Math.floor(Math.random() * 2) + 6}/10`; // 6-7/10
                }
                break;
            case 'hint':
                feedback += `Hint: Think about the constraints. What happens if the input number is very large or zero? Does your loop handle all cases correctly?`;
                break;
        }
    }
    return { feedback, rating };
}


// --- Event Handler Functions ---

// *** handleRunCode uses fetch API ***
const handleRunCode = async () => {
    if (!codeEditor || !languageSelect || !outputConsole || !runCodeBtn) {
        console.error("Compiler elements not found for running code.");
        return;
    }
    const code = codeEditor.value;
    const input = codeInput ? codeInput.value : '';
    const language = languageSelect.value;

    // !!! IMPORTANT: Set your actual backend API endpoint here !!!
    const EXECUTE_API_ENDPOINT = '/api/execute';
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    setLoading(runCodeBtn, true);
    outputConsole.textContent = 'Sending code to server...';
    outputConsole.style.color = 'var(--text-muted-color)';
    if (aiFeedbackBox) aiFeedbackBox.textContent = 'AI Feedback cleared.';
    if (aiRating) aiRating.textContent = 'Rating: N/A';

    try {
        console.log(`Sending code to ${EXECUTE_API_ENDPOINT}`);
        const response = await fetch(EXECUTE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Example: Add Authorization header if your API requires it
                // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ language, code, input })
        });

        // Handle HTTP errors (e.g., 404, 500, 403)
        if (!response.ok) {
            let errorMsg = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorResult = await response.json();
                errorMsg = errorResult.message || errorResult.error || errorMsg;
            } catch (e) { /* Ignore if response body isn't JSON */ }
            throw new Error(errorMsg);
        }

        // Process successful response (2xx status code)
        const result = await response.json();
        console.log("Received result from backend:", result);

        // Display output based on backend response structure
        // Adjust fields (stdout, stderr, success) based on your API's actual response
        if (result.success === true || result.stderr === null || result.stderr === '') { // Treat no stderr as success
            outputConsole.textContent = result.stdout || '(No standard output produced)';
            // Append warnings from stderr if present
            if (result.stderr) {
                outputConsole.textContent += `\n\n--- Standard Error (Warnings) ---\n${result.stderr}`;
                outputConsole.style.color = 'var(--text-muted-color)'; // Muted color for warnings
            } else {
                outputConsole.style.color = 'var(--text-color)'; // Normal color for clean output
            }
        } else {
            // Execution failed (compilation or runtime error likely in stderr)
            outputConsole.textContent = result.stderr || 'Execution failed. No specific error message received.';
            // Prepend stdout if it exists, as code might print before erroring
            if (result.stdout) {
                outputConsole.textContent = `--- Standard Output ---\n${result.stdout}\n\n--- Standard Error ---\n${outputConsole.textContent}`;
            }
            outputConsole.style.color = 'var(--danger-color)'; // Error color
        }

        // Optional: Display execution time/memory if available
        if (result.time !== undefined) console.log(`Execution Time: ${result.time}s`);
        if (result.memory !== undefined) console.log(`Memory Used: ${result.memory} KB`);

    } catch (error) {
        console.error("Error running code via API:", error);
        outputConsole.textContent = `Execution Request Failed:\n${error.message || 'Could not connect to the execution server.'}`;
        outputConsole.style.color = 'var(--danger-color)';
    } finally {
        setLoading(runCodeBtn, false);
    }
};


// AI Handlers (still using simulation)
const handleAiReview = async () => {
    if (!codeEditor || !languageSelect || !aiFeedbackBox || !aiRating || !aiReviewBtn) return;
    const code = codeEditor.value;
    const language = languageSelect.value;

    setLoading(aiReviewBtn, true);
    aiFeedbackBox.textContent = 'Requesting AI review...';
    aiRating.textContent = 'Rating: ...';

    try {
        await simulateApiCall(1800); // Use simulateApiCall from utils.js
        const result = simulateAiFeedback(language, code, 'review'); // Use simulation
        aiFeedbackBox.textContent = result.feedback;
        aiRating.textContent = `Rating: ${result.rating}`;
    } catch (error) {
        console.error("Error getting AI review:", error);
        aiFeedbackBox.textContent = `Error: ${error.message || 'Failed to get AI review.'}`;
        aiRating.textContent = 'Rating: Error';
    } finally {
        setLoading(aiReviewBtn, false);
    }
};

const handleAiDebug = async () => {
    if (!codeEditor || !languageSelect || !aiFeedbackBox || !aiRating || !outputConsole || !aiDebugBtn) return;
    const code = codeEditor.value;
    const language = languageSelect.value;
    const currentOutput = outputConsole.textContent;

    setLoading(aiDebugBtn, true);
    aiFeedbackBox.textContent = 'Requesting AI debug assistance...';
    aiRating.textContent = 'Rating: ...';

    try {
        await simulateApiCall(2000);
        const result = simulateAiFeedback(language, code, 'debug', currentOutput); // Use simulation
        aiFeedbackBox.textContent = result.feedback;
        aiRating.textContent = `Rating: ${result.rating}`;
    } catch (error) {
        console.error("Error getting AI debug:", error);
        aiFeedbackBox.textContent = `Error: ${error.message || 'Failed to get AI debug.'}`;
        aiRating.textContent = 'Rating: Error';
    } finally {
        setLoading(aiDebugBtn, false);
    }
};

const handleAiHint = async () => {
    if (!codeEditor || !languageSelect || !aiFeedbackBox || !aiHintBtn) return;
    const code = codeEditor.value;
    const language = languageSelect.value;

    setLoading(aiHintBtn, true);
    aiFeedbackBox.textContent = 'Requesting AI hint...';
    if (aiRating) aiRating.textContent = 'Rating: N/A';

    try {
        await simulateApiCall(1500);
        const result = simulateAiFeedback(language, code, 'hint'); // Use simulation
        aiFeedbackBox.textContent = result.feedback;
    } catch (error) {
        console.error("Error getting AI hint:", error);
        aiFeedbackBox.textContent = `Error: ${error.message || 'Failed to get AI hint.'}`;
    } finally {
        setLoading(aiHintBtn, false);
    }
};


// --- General Event Listener Setup ---
const handleStudentActionClick = (event) => {
    const target = event.target;

    // Handle navigation links within main content (e.g., View Profile in stats)
    const navLink = target.closest('a[data-target]');
    if (navLink && mainContentElement?.contains(navLink)) {
        event.preventDefault();
        const targetSectionId = navLink.dataset.target;
        const sidebarLink = sidebarElement?.querySelector(`nav a[data-target="${targetSectionId}"]`);
        if (sidebarLink) {
            sidebarLink.click(); // Simulate click on sidebar link
            mainContentElement.scrollTop = 0; // Scroll to top
        }
        return;
    }

    // Handle Submit Assignment Button Click
    const submitBtn = target.closest('.btn-submit-assignment');
    if (submitBtn) {
        const assignmentId = submitBtn.dataset.assignmentId;
        console.log(`Submit button clicked for assignment ID: ${assignmentId}`);
        if (window.openModal) {
            openModal(
                `Submit Assignment ${assignmentId}`,
                `<form id="submit-assignment-form" data-assignment-id="${assignmentId}">
                    <p>Upload solution file or paste URL:</p>
                    <div class="form-group">
                        <label for="assignment-file">Upload File:</label>
                        <input type="file" id="assignment-file" name="assignmentFile">
                    </div>
                    <div class="form-group">
                        <label for="assignment-link">Or Paste URL:</label>
                        <input type="text" id="assignment-link" name="assignmentLink" placeholder="https://github.com/...">
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Assignment</button>
                    <div id="submit-assignment-message" class="form-message" style="display:none;"></div>
                 </form>`
            );
            // Add form listener within the modal
            const modalForm = document.getElementById('submit-assignment-form');
            if (modalForm) modalForm.addEventListener('submit', handleAssignmentSubmit);
        } else { console.error("openModal function not found."); }
        return;
    }

    // Handle View Review Button Click
    const reviewBtn = target.closest('.btn-view-review');
    if (reviewBtn && !reviewBtn.disabled) {
        const assignmentId = reviewBtn.dataset.assignmentId;
        const reviewText = reviewBtn.dataset.review || "No review text provided.";
        console.log(`View review clicked for assignment ID: ${assignmentId}`);
        if (window.openModal) {
            openModal(`Review for Assignment ${assignmentId}`, `<p>${reviewText.replace(/\n/g, '<br>')}</p>`); // Basic display
        } else { console.error("openModal function not found."); }
        return;
    }

    // Handle Edit Profile Button Click
    const editProfileBtn = target.closest('#edit-profile-btn');
    if (editProfileBtn) {
        console.log("Edit profile clicked");
        if (window.openModal) {
            openModal("Edit Profile", "<p>Profile editing form placeholder. Load current data and provide fields.</p>");
        } else { console.error("openModal function not found."); }
        return;
    }

    // Handle Enroll Track Button Click
    const enrollTrackBtn = target.closest('#enroll-track-btn');
    if (enrollTrackBtn) {
        console.log("Enroll track clicked");
        if (window.openModal) {
            // Fetch available tracks not already enrolled in
            openModal("Enroll in Coding Track", "<p>Track enrollment options placeholder. List available tracks here.</p>");
        } else { console.error("openModal function not found."); }
        return;
    }

    // Add more delegated event handlers here if needed
};

// Example handler for assignment submission form inside modal
const handleAssignmentSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const assignmentId = form.dataset.assignmentId;
    const msgEl = form.querySelector('#submit-assignment-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form); // Collects file/link

    // Basic check: require either file or link
    if (!formData.get('assignmentFile')?.name && !formData.get('assignmentLink')) {
        showMessage(msgEl, 'Please upload a file or provide a link.');
        return;
    }

    setLoading(submitBtn, true);
    showMessage(msgEl, 'Submitting...', false);

    try {
        // --- TODO: API Call to submit assignment ---
        // Send formData (including file) or link to backend
        console.log(`Submitting assignment ${assignmentId}:`, {
            file: formData.get('assignmentFile')?.name,
            link: formData.get('assignmentLink')
        });
        await simulateApiCall(1500); // Simulate upload/submission
        // --- End Simulation ---

        showMessage(msgEl, 'Assignment submitted successfully!', false);
        setTimeout(closeModal, 1500);

        // Refresh the assignments table or update status visually
        // Option 1: Reload all data (simpler)
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            loadStudentDashboardData(currentUser.id, currentUser.name, currentUser.email);
        }
        // Option 2: Find the row and update status/button (more complex)
        // const row = document.querySelector(`#assignments-table-body button[data-assignment-id="${assignmentId}"]`)?.closest('tr');
        // if(row) { ... update cells ... }

    } catch (error) {
        console.error("Assignment submission failed:", error);
        showMessage(msgEl, `Submission failed: ${error.message || 'Please try again.'}`);
    } finally {
        setLoading(submitBtn, false);
    }
};


// --- Section Navigation Logic ---
const setupDashboardNavigation = (sidebar, mainContent) => {
    if (!sidebar || !mainContent) {
        console.error("Cannot setup student navigation: Sidebar or Main Content element missing.");
        return;
    }
    const navLinks = sidebar.querySelectorAll('nav ul li a[data-target]');
    console.log(`setupDashboardNavigation (Student): Found ${navLinks.length} links.`);

    if (navLinks.length === 0) {
        console.error("Student sidebar: No links with 'data-target' found.");
        return;
    }

    navLinks.forEach(link => {
        // Define handler separately to potentially remove later if needed
        const handleNavClick = (event) => {
            event.preventDefault();
            const targetSectionId = link.dataset.target;

            if (!targetSectionId) return;

            navLinks.forEach(nav => nav.classList.remove('active-link'));
            link.classList.add('active-link');

            setActiveSection(mainContent, targetSectionId);
        };
        // Remove listener first to avoid duplicates if init runs multiple times
        link.removeEventListener('click', handleNavClick);
        link.addEventListener('click', handleNavClick);
    });
    console.log("Student dashboard navigation listeners attached.");
};

const setActiveSection = (mainContentEl, sectionId) => {
    console.log(`Activating student section: ${sectionId}`);
    if (!mainContentEl || !sectionId) {
        console.error('setActiveSection (Student): Missing mainContentElement or sectionId');
        return;
    }
    const sections = mainContentEl.querySelectorAll(':scope > .dashboard-section');

    if (sections.length === 0) {
        console.error('setActiveSection (Student): No .dashboard-section elements found.');
        return;
    }

    let sectionFound = false;
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
            sectionFound = true;
        } else {
            section.classList.remove('active');
        }
    });

    if (!sectionFound) {
        console.warn(`Target student section '${sectionId}' not found. Activating first.`);
        sections[0]?.classList.add('active'); // Activate first section as fallback
        const fallbackLinkId = sections[0]?.id;
        const sidebarLinks = sidebarElement?.querySelectorAll('nav ul li a[data-target]');
        sidebarLinks?.forEach(nav => {
            nav.classList.toggle('active-link', nav.dataset.target === fallbackLinkId);
        });
    }
    // Scroll to top of main content when section changes
    mainContentEl.scrollTop = 0;
};


// --- Setup Event Listeners called during Initialization ---
const setupStudentEventListeners = () => {
    console.log("Setting up student event listeners...");
    if (!mainContentElement) {
        console.error("Cannot setup student listeners: mainContentElement not found.");
        return;
    }

    // Direct listeners for static buttons (compiler)
    if (runCodeBtn) runCodeBtn.addEventListener('click', handleRunCode);
    else console.warn("runCodeBtn not found");
    if (aiReviewBtn) aiReviewBtn.addEventListener('click', handleAiReview);
    else console.warn("aiReviewBtn not found");
    if (aiDebugBtn) aiDebugBtn.addEventListener('click', handleAiDebug);
    else console.warn("aiDebugBtn not found");
    if (aiHintBtn) aiHintBtn.addEventListener('click', handleAiHint);
    else console.warn("aiHintBtn not found");

    // Delegated listener for dynamic actions within main content
    mainContentElement.removeEventListener('click', handleStudentActionClick); // Prevent duplicates
    mainContentElement.addEventListener('click', handleStudentActionClick);
    console.log("Delegated click listener attached to student main content.");
};

// Make the initialization function globally accessible
window.initializeStudentDashboard = initializeStudentDashboard;