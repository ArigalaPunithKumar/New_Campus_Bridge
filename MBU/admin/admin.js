// === Admin Dashboard Specific Logic ===

// Assume utils.js provides: showMessage, hideMessage, setLoading, simulateApiCall, openModal, closeModal
if (typeof window.showMessage !== 'function') console.error("showMessage function not found!");
if (typeof window.setLoading !== 'function') console.error("setLoading function not found!");
if (typeof window.simulateApiCall !== 'function') {
    window.simulateApiCall = (duration) => new Promise(resolve => setTimeout(resolve, duration));
    console.warn("simulateApiCall function not found, using basic fallback.");
}
// ... etc for openModal/closeModal

// --- DOM Elements (Scoped to Admin Dashboard) ---
// Declare variables, assign inside initializeAdminDashboard
let adminDashboardElement, sidebarElement, mainContentElement;
let adminUsersTableBody, adminCoursesTableBody, adminLeaderboard, adminEventsList;
let scheduleEventForm, exportReportForm, platformSettingsForm; // Forms

// --- Initialization Function (Called by inline script in dashboard.html) --- //
const initializeAdminDashboard = (currentUser) => {
    console.log("Initializing Admin Dashboard for:", currentUser?.id);
    adminDashboardElement = document.getElementById('admin-dashboard');
    sidebarElement = document.getElementById('sidebar'); // Use ID
    mainContentElement = document.getElementById('main-content'); // Use ID

    if (!adminDashboardElement || !sidebarElement || !mainContentElement) {
        console.error("Essential dashboard elements (admin-dashboard, sidebar, or main-content) not found!");
        return;
    }

    // Find key elements *within* mainContentElement for scoping
    adminUsersTableBody = mainContentElement.querySelector('#admin-users-table-body');
    adminCoursesTableBody = mainContentElement.querySelector('#admin-courses-table-body');
    adminLeaderboard = mainContentElement.querySelector('#admin-leaderboard');
    adminEventsList = mainContentElement.querySelector('#admin-events-list');
    scheduleEventForm = mainContentElement.querySelector('#schedule-event-form');
    exportReportForm = mainContentElement.querySelector('#export-report-form');
    platformSettingsForm = mainContentElement.querySelector('#platform-settings-form'); // Added

    if (!currentUser) {
        console.error("CurrentUser data not provided to initializeAdminDashboard.");
        return; // Redirect should have happened
    }

    // Load Initial Data
    loadAdminDashboardData().then(() => {
        console.log("Admin dashboard data loaded.");

        // Setup listeners and navigation AFTER data load
        setupAdminEventListeners(); // Will use mainContentElement for delegation
        setupDashboardNavigation(sidebarElement, mainContentElement); // Pass elements

        // Set initial active section based on the sidebar link
        const initialActiveLink = sidebarElement.querySelector('nav a.active-link');
        let initialSectionId = 'admin-home'; // Default
        if (initialActiveLink && initialActiveLink.dataset.target) { // Use data-target
            initialSectionId = initialActiveLink.dataset.target;
        } else {
            // Fallback: activate the first link if none is marked
            const firstLink = sidebarElement.querySelector('nav a[data-target]');
            if (firstLink) {
                firstLink.classList.add('active-link');
                initialSectionId = firstLink.dataset.target;
            }
        }
        setActiveSection(mainContentElement, initialSectionId);

        console.log("Admin Dashboard Initialized.");
    }).catch(error => {
        console.error("Failed to load admin dashboard data:", error);
        if (mainContentElement) {
            mainContentElement.innerHTML = `<div class="error-message" style='padding:2rem;color:red;'>Failed to load dashboard data. Please try again later.</div>`;
        }
    });
};

// --- Data Loading & Populating Functions --- //

const loadAdminDashboardData = async () => {
    console.log(`Loading admin data`);
    // Show loading state?
    await simulateApiCall(600);
    // --- TODO: Replace with actual API call --- //
    const sampleData = {
        users: [
            { id: '101', name: 'Alice Smith', email: 'alice@example.com', role: 'Student', status: 'Active' },
            { id: '102', name: 'Bob Johnson', email: 'bob@example.com', role: 'Student', status: 'Inactive' },
            { id: 'F201', name: 'Prof. Davis', email: 'davis@example.com', role: 'Faculty', status: 'Active' },
            { id: 'ADM01', name: 'Admin One', email: 'admin@example.com', role: 'Admin', status: 'Active' },
            { id: '104', name: 'Diana Prince', email: 'diana@example.com', role: 'Student', status: 'Active' }
        ],
        courses: [
            { code: 'CS101', title: 'Intro to Programming', faculty: 'Prof. Davis' },
            { code: 'MA101', title: 'Calculus I', faculty: 'Prof. Einstein' },
            { code: 'CS201', title: 'Data Structures', faculty: 'Prof. Davis' },
            { code: 'PHY101', title: 'General Physics I', faculty: 'Prof. Curie' }
        ],
        leaderboard: [
            { name: 'Alice Smith', score: 1500 },
            { name: 'David Lee', score: 1450 },
            { name: 'Charlie Brown', score: 1300 },
            { name: 'Diana Prince', score: 1250 },
            { name: 'Eve Adams', score: 1100 },
        ],
        metrics: { totalUsers: 5, activeStudents: 3, submissionsToday: 45, totalCourses: 4 },
        events: [
            { id: 'e1', type: 'Contest', title: 'Weekly Challenge #5', datetime: '2024-07-01T10:00', duration: 120, description: 'Easy level contest.' },
            { id: 'e2', type: 'Test', title: 'Mock Placement Test - July', datetime: '2024-07-15T14:00', duration: 180, description: 'Comprehensive test.' }
        ],
        settings: { maintenanceMode: false, defaultRole: 'student' } // Example settings
    };
    // --- End of Sample Data --- //

    // Store data (optional, for easier access in handlers)
    window.adminData = sampleData;

    // Populate UI
    populateAdminUsersTable(sampleData.users);
    populateAdminCoursesTable(sampleData.courses);
    populateAdminLeaderboard(sampleData.leaderboard);
    populateAdminMetrics(sampleData.metrics);
    populateAdminEvents(sampleData.events);
    populateAdminSettings(sampleData.settings);
};

// Keep the individual populate functions (populateAdminUsersTable, populateAdminCoursesTable, etc.)
// Ensure they correctly target elements by ID.
const populateAdminUsersTable = (users) => {
    if (!adminUsersTableBody) return;
    adminUsersTableBody.innerHTML = users.length > 0
        ? users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td class="status-${u.status.toLowerCase()}">${u.status}</td>
                <td>
                    <button class="btn btn-sm btn-secondary btn-edit-user" data-user-id="${u.id}" title="Edit User">Edit</button>
                    <button class="btn btn-sm ${u.status === 'Active' ? 'btn-danger' : 'btn-success'} btn-toggle-user-status" data-user-id="${u.id}" title="${u.status === 'Active' ? 'Deactivate User' : 'Activate User'}">
                        ${u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>`).join('')
        : '<tr><td colspan="6">No users found matching criteria.</td></tr>';
};

const populateAdminCoursesTable = (courses) => {
    if (!adminCoursesTableBody) return;
    adminCoursesTableBody.innerHTML = courses.length > 0
        ? courses.map(c => `
            <tr>
                <td>${c.code}</td>
                <td>${c.title}</td>
                <td>${c.faculty || 'Unassigned'}</td>
                <td>
                     <button class="btn btn-sm btn-secondary btn-edit-course" data-course-code="${c.code}" title="Edit Course">Edit</button>
                     <button class="btn btn-sm btn-danger btn-delete-course" data-course-code="${c.code}" title="Delete Course">Delete</button>
                </td>
            </tr>`).join('')
        : '<tr><td colspan="4">No courses found matching criteria.</td></tr>';
};

const populateAdminLeaderboard = (leaderboard) => {
    if (!adminLeaderboard) return;
    adminLeaderboard.innerHTML = leaderboard.length > 0
        ? leaderboard.slice(0, 10).map(item => `<li>${item.name} <span class="score">(Score: ${item.score})</span></li>`).join('') // Limit to top 10
        : '<li>Leaderboard is empty.</li>';
};

const populateAdminMetrics = (metrics) => {
    // Use the specific IDs from the Admin Home section if different from the Analytics section
    const totalUsersEl = document.getElementById('metric-total-users'); // ID from Home section
    const activeStudentsEl = document.getElementById('metric-active-students'); // ID from Home section
    const submissionsTodayEl = document.getElementById('metric-submissions-today'); // ID from Home section
    const totalCoursesEl = document.getElementById('metric-total-courses'); // Added ID in HTML

    if (totalUsersEl) totalUsersEl.textContent = metrics?.totalUsers ?? '--';
    if (activeStudentsEl) activeStudentsEl.textContent = metrics?.activeStudents ?? '--';
    if (submissionsTodayEl) submissionsTodayEl.textContent = metrics?.submissionsToday ?? '--';
    if (totalCoursesEl) totalCoursesEl.textContent = metrics?.totalCourses ?? '--';


    // Handle the separate Analytics section display if IDs are different
    const analyticsTotalUsersEl = document.getElementById('metric-total-users-display'); // Example ID from Analytics section
    if (analyticsTotalUsersEl) analyticsTotalUsersEl.textContent = metrics?.totalUsers ?? '--';
    const analyticsActiveStudentsEl = document.getElementById('metric-active-students-display');
    if (analyticsActiveStudentsEl) analyticsActiveStudentsEl.textContent = metrics?.activeStudents ?? '--';
    const analyticsSubmissionsTodayEl = document.getElementById('metric-submissions-today-display');
    if (analyticsSubmissionsTodayEl) analyticsSubmissionsTodayEl.textContent = metrics?.submissionsToday ?? '--';

    // Placeholder for chart rendering
    const chartContainer = document.getElementById('admin-course-activity-chart');
    if (chartContainer) {
        // Replace with actual chart library initialization (e.g., Chart.js, ApexCharts)
        chartContainer.innerHTML = `<div style="border:1px dashed #ccc; padding: 2rem; text-align: center; background: #f9f9f9;">(Course Activity Chart Placeholder)</div>`;
    }
};

const populateAdminEvents = (events) => {
    if (!adminEventsList) return;
    // Ensure the container exists before modifying innerHTML
    // Clear previous content before adding header and list
    adminEventsList.innerHTML = '';

    const header = document.createElement('h3');
    header.textContent = 'Upcoming/Past Events';
    adminEventsList.appendChild(header);

    if (events.length > 0) {
        events.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)); // Sort by date
        events.forEach(e => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item'; // Add class for potential styling
            eventDiv.style.borderBottom = '1px solid #eee';
            eventDiv.style.padding = '10px 0';
            eventDiv.style.overflow = 'hidden';

            eventDiv.innerHTML = `
                <strong>${e.title || 'Untitled Event'}</strong> (${e.type || 'Unknown'}) - ${e.datetime ? new Date(e.datetime).toLocaleString() : 'No date'}
                <button class="btn btn-sm btn-danger btn-delete-event" data-event-id="${e.id}" style="float: right;" title="Delete Event">Delete</button>
                <button class="btn btn-sm btn-secondary btn-edit-event" data-event-id="${e.id}" style="float: right; margin-right: 5px;" title="Edit Event">Edit</button>
                ${e.description ? `<p style="margin-top: 5px; font-size: 0.9em; color: #555;">${e.description}</p>` : ''}
            `;
            adminEventsList.appendChild(eventDiv);
        });
    } else {
        const noEventsP = document.createElement('p');
        noEventsP.textContent = 'No events scheduled.';
        adminEventsList.appendChild(noEventsP);
    }
};

const populateAdminSettings = (settings) => {
    if (!platformSettingsForm || !settings) return;
    const maintenanceCheck = platformSettingsForm.querySelector('#setting-maintenance-mode');
    const defaultRoleSelect = platformSettingsForm.querySelector('#setting-default-role');

    if (maintenanceCheck) maintenanceCheck.checked = settings.maintenanceMode || false;
    if (defaultRoleSelect) defaultRoleSelect.value = settings.defaultRole || 'student';
};

// --- Event Handlers --- //

// Debounced search function (optional but good for performance)
let searchTimeout;
const debounce = (func, delay) => {
    return function (...args) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
};

const handleAdminUserSearch = async () => {
    const searchTerm = document.getElementById('admin-user-search')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('admin-user-role-filter')?.value || '';
    console.log(`Admin searching users: Term='${searchTerm}', Role='${roleFilter}'`);

    // --- TODO: Replace with actual API call incorporating filters --- //
    if (adminUsersTableBody) adminUsersTableBody.innerHTML = '<tr><td colspan="6">Searching...</td></tr>';
    await simulateApiCall(500); // Simulate network delay
    // --- End Simulation --- //

    // Filter the local sample data for demo purposes
    const filteredUsers = (window.adminData?.users || []).filter(user => {
        const roleMatch = !roleFilter || user.role.toLowerCase() === roleFilter.toLowerCase();
        const termMatch = !searchTerm ||
            user.name.toLowerCase().includes(searchTerm) ||
            user.id.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        return roleMatch && termMatch;
    });
    populateAdminUsersTable(filteredUsers); // Update table with filtered results
};
const debouncedUserSearch = debounce(handleAdminUserSearch, 400); // 400ms delay

const handleAdminCourseSearch = async () => {
    const searchTerm = document.getElementById('admin-course-search')?.value.toLowerCase() || '';
    console.log(`Admin searching courses: Term='${searchTerm}'`);

    // --- TODO: Replace with actual API call --- //
    if (adminCoursesTableBody) adminCoursesTableBody.innerHTML = '<tr><td colspan="4">Searching...</td></tr>';
    await simulateApiCall(500);
    // --- End Simulation --- //

    const filteredCourses = (window.adminData?.courses || []).filter(course => {
        return !searchTerm ||
            course.code.toLowerCase().includes(searchTerm) ||
            course.title.toLowerCase().includes(searchTerm);
    });
    populateAdminCoursesTable(filteredCourses);
};
const debouncedCourseSearch = debounce(handleAdminCourseSearch, 400);


const handleToggleUserStatus = async (userId, buttonElement) => {
    const action = buttonElement.textContent.trim() === 'Deactivate' ? 'deactivate' : 'activate';
    const originalText = buttonElement.textContent; // Store original text
    setLoading(buttonElement, true, '...'); // Show minimal loading text

    try {
        // --- TODO: API Call --- //
        console.log(`Admin: ${action} user ${userId}`);
        await simulateApiCall(800);
        // --- End API Simulation --- //

        // Update local data store (important for consistency)
        const userIndex = window.adminData?.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            window.adminData.users[userIndex].status = (action === 'deactivate' ? 'Inactive' : 'Active');
        }

        // Update UI
        const row = buttonElement.closest('tr');
        if (row) {
            const statusCell = row.cells[4]; // Assuming status is 5th cell (index 4)
            if (action === 'deactivate') {
                statusCell.textContent = 'Inactive';
                statusCell.className = 'status-inactive';
                buttonElement.textContent = 'Activate';
                buttonElement.title = 'Activate User'; // Update tooltip
                buttonElement.classList.remove('btn-danger');
                buttonElement.classList.add('btn-success');
            } else {
                statusCell.textContent = 'Active';
                statusCell.className = 'status-active';
                buttonElement.textContent = 'Deactivate';
                buttonElement.title = 'Deactivate User'; // Update tooltip
                buttonElement.classList.remove('btn-success');
                buttonElement.classList.add('btn-danger');
            }
        }
    } catch (error) {
        console.error(`Failed to ${action} user ${userId}:`, error);
        alert(`Error updating user status: ${error.message}`);
        // Restore button text on error
        buttonElement.textContent = originalText;
    } finally {
        setLoading(buttonElement, false); // Restore button state correctly
    }
};


const handleDeleteCourse = async (courseCode, buttonElement) => {
    setLoading(buttonElement, true, '...');
    try {
        // --- TODO: API call --- //
        console.log(`Admin: Deleting course ${courseCode}`);
        await simulateApiCall(800);
        // --- End API simulation --- //

        // Remove from local data
        window.adminData.courses = (window.adminData.courses || []).filter(c => c.code !== courseCode);

        // Remove from UI
        buttonElement.closest('tr').remove();
        // Don't use alert for success, maybe a subtle message if needed
        console.log(`Course ${courseCode} deleted successfully (Simulated).`);
    } catch (error) {
        console.error(`Failed to delete course ${courseCode}:`, error);
        alert(`Error deleting course: ${error.message}`);
        setLoading(buttonElement, false); // Restore on error
    }
    // setLoading(buttonElement, false); // This should not be here, it's handled in finally or success
};

const handleScheduleEvent = async (event) => {
    event.preventDefault();
    if (!scheduleEventForm) return;

    const formData = new FormData(scheduleEventForm);
    const eventData = Object.fromEntries(formData.entries());
    const submitButton = scheduleEventForm.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('schedule-event-message');

    // Basic Validation (can be more complex)
    if (!eventData.eventType || !eventData.eventTitle || !eventData.eventDatetime) {
        showMessage(messageDiv, "Please fill in all required event fields.");
        return;
    }


    hideMessage(messageDiv);
    setLoading(submitButton, true);

    try {
        // --- TODO: API Call to save eventData --- //
        console.log("Admin: Scheduling event:", eventData);
        await simulateApiCall(1200);
        // --- End API Simulation --- //

        // Add to local data for immediate feedback
        const newEvent = { ...eventData, id: `e${Date.now()}` }; // Add temporary ID
        if (!window.adminData.events) window.adminData.events = [];
        window.adminData.events.push(newEvent);

        showMessage(messageDiv, 'Event scheduled successfully!', false);
        scheduleEventForm.reset();
        populateAdminEvents(window.adminData.events); // Refresh events list

    } catch (error) {
        console.error("Event scheduling failed:", error);
        showMessage(messageDiv, `Scheduling failed: ${error.message || "Please try again."}`);
    } finally {
        setLoading(submitButton, false);
    }
};

const handleExportReport = async (event) => {
    event.preventDefault();
    if (!exportReportForm) return;

    const formData = new FormData(exportReportForm);
    const reportType = formData.get('reportType');
    const submitButton = exportReportForm.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('export-report-message');

    if (!reportType) {
        showMessage(messageDiv, 'Please select a report type.');
        return;
    }

    hideMessage(messageDiv);
    setLoading(submitButton, true, 'Generating...');

    try {
        // --- TODO: API Call to generate/fetch report blob based on reportType --- //
        console.log(`Admin: Exporting report type: ${reportType}`);
        await simulateApiCall(1500); // Simulate report generation time
        // --- End Simulation --- //

        // --- Simulate file download based on type --- //
        let simulatedCsvData = "Report Type Not Implemented";
        let filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;

        if (reportType === 'user_list' && window.adminData?.users) {
            simulatedCsvData = "ID,Name,Email,Role,Status\n";
            simulatedCsvData += window.adminData.users.map(u => `${u.id},"${u.name}","${u.email}",${u.role},${u.status}`).join("\n");
        } else if (reportType === 'course_activity' && window.adminData?.courses) {
            simulatedCsvData = "Code,Title,Faculty Assigned\n";
            simulatedCsvData += window.adminData.courses.map(c => `${c.code},"${c.title}","${c.faculty || ''}"`).join("\n");
        } // Add other report types here...

        const blob = new Blob([simulatedCsvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");

        if (link.download !== undefined) { // Check for download attribute support
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up blob URL
            showMessage(messageDiv, 'Report generated and download started!', false);
        } else {
            // Fallback for browsers that don't support download attribute
            showMessage(messageDiv, 'Error: Browser does not support automatic download.');
        }
        // --- End Download Simulation --- //

    } catch (error) {
        console.error("Report export failed:", error);
        showMessage(messageDiv, `Export failed: ${error.message || "Please try again."}`);
    } finally {
        setLoading(submitButton, false);
    }
};

const handleSaveSettings = async (event) => {
    event.preventDefault();
    if (!platformSettingsForm) return;

    const formData = new FormData(platformSettingsForm);
    // FormData doesn't directly capture checkbox state, get it manually
    const maintenanceMode = platformSettingsForm.querySelector('#setting-maintenance-mode')?.checked || false;
    const defaultRole = formData.get('defaultRole');

    const settingsData = {
        maintenanceMode: maintenanceMode,
        defaultRole: defaultRole
    };

    const submitButton = platformSettingsForm.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('settings-save-message');

    hideMessage(messageDiv);
    setLoading(submitButton, true);

    try {
        // --- TODO: API Call to save settingsData --- //
        console.log("Admin: Saving settings:", settingsData);
        await simulateApiCall(900);
        // --- End API Simulation --- //

        // Update local settings store
        window.adminData.settings = settingsData;

        showMessage(messageDiv, 'Settings saved successfully!', false);

    } catch (error) {
        console.error("Saving settings failed:", error);
        showMessage(messageDiv, `Save failed: ${error.message || "Please try again."}`);
    } finally {
        setLoading(submitButton, false);
    }
};

// --- Delegated Event Handler for Actions --- //
const handleAdminActionClick = (event) => {
    const target = event.target;

    // --- User Actions ---
    const editUserButton = target.closest('.btn-edit-user');
    if (editUserButton) {
        const userId = editUserButton.dataset.userId;
        console.log(`Admin: Edit user ${userId}`);
        openModal("Edit User", `<p>Placeholder form for editing user ID: ${userId}. Load user data and populate form.</p>`);
        return;
    }
    const toggleUserButton = target.closest('.btn-toggle-user-status');
    if (toggleUserButton) {
        const userId = toggleUserButton.dataset.userId;
        handleToggleUserStatus(userId, toggleUserButton);
        return;
    }

    // --- Course Actions ---
    const editCourseButton = target.closest('.btn-edit-course');
    if (editCourseButton) {
        const courseCode = editCourseButton.dataset.courseCode;
        console.log(`Admin: Edit course ${courseCode}`);
        openModal("Edit Course", `<p>Placeholder form for editing course ${courseCode}. Load course data and populate form.</p>`);
        return;
    }
    const deleteCourseButton = target.closest('.btn-delete-course');
    if (deleteCourseButton) {
        const courseCode = deleteCourseButton.dataset.courseCode;
        if (confirm(`Are you sure you want to delete course ${courseCode}? This action cannot be undone.`)) {
            handleDeleteCourse(courseCode, deleteCourseButton);
        }
        return;
    }

    // --- Event Actions ---
    const editEventButton = target.closest('.btn-edit-event');
    if (editEventButton) {
        const eventId = editEventButton.dataset.eventId;
        console.log(`Admin: Edit event ${eventId}`);
        // Find event data
        const eventData = window.adminData?.events.find(e => e.id === eventId);
        // --- TODO: Open modal with form pre-filled with eventData ---
        openModal("Edit Event", `<p>Placeholder form for editing event ID: ${eventId}. Pre-fill with:\n${JSON.stringify(eventData, null, 2)}</p>`);
        return;
    }
    const deleteEventButton = target.closest('.btn-delete-event');
    if (deleteEventButton) {
        const eventId = deleteEventButton.dataset.eventId;
        if (confirm(`Are you sure you want to delete this event?`)) {
            console.log(`Admin: Deleting event ${eventId}`);
            // --- TODO: API Call to delete event --- //
            setLoading(deleteEventButton, true);
            simulateApiCall(500).then(() => {
                // Remove from local data
                window.adminData.events = (window.adminData.events || []).filter(e => e.id !== eventId);
                // Remove from UI
                deleteEventButton.closest('.event-item').remove(); // Assuming parent div has class 'event-item'
                console.log(`Event ${eventId} deleted (Simulated).`);
            }).catch(err => {
                alert(`Error deleting event: ${err.message}`);
                setLoading(deleteEventButton, false);
            });
        }
        return;
    }
};


// --- Event Listener Setup Function --- //
const setupAdminEventListeners = () => {
    console.log("Setting up admin event listeners...");
    if (!mainContentElement) {
        console.error("Cannot setup listeners: mainContentElement not found.");
        return;
    }

    // --- Specific Button Clicks ---
    const addUserBtn = mainContentElement.querySelector('#admin-add-user-btn');
    if (addUserBtn) addUserBtn.addEventListener('click', () => openModal("Add New User", "<p>Form placeholder for adding a new user...</p>"));
    else console.warn("#admin-add-user-btn not found");

    const bulkUploadBtn = mainContentElement.querySelector('#admin-bulk-upload-btn');
    if (bulkUploadBtn) bulkUploadBtn.addEventListener('click', () => openModal("Bulk Upload Users", "<p>Form placeholder for bulk user upload (CSV)...</p>"));
    else console.warn("#admin-bulk-upload-btn not found");

    const userSearchBtn = mainContentElement.querySelector('#admin-user-search-btn');
    if (userSearchBtn) userSearchBtn.addEventListener('click', handleAdminUserSearch); // Direct click search
    else console.warn("#admin-user-search-btn not found");

    // Add listener for Enter key in search input
    const userSearchInput = mainContentElement.querySelector('#admin-user-search');
    if (userSearchInput) userSearchInput.addEventListener('keyup', (event) => {
        if (event.key === "Enter") {
            handleAdminUserSearch(); // Trigger search on Enter
        }
        // debouncedUserSearch(); // Or trigger debounced search on keyup
    });

    // Add listener for role filter change
    const userRoleFilter = mainContentElement.querySelector('#admin-user-role-filter');
    if (userRoleFilter) userRoleFilter.addEventListener('change', handleAdminUserSearch); // Trigger search on filter change


    const addCourseBtn = mainContentElement.querySelector('#admin-add-course-btn');
    if (addCourseBtn) addCourseBtn.addEventListener('click', () => openModal("Add New Course", "<p>Form placeholder for adding a new course...</p>"));
    else console.warn("#admin-add-course-btn not found");

    const courseSearchBtn = mainContentElement.querySelector('#admin-course-search-btn');
    if (courseSearchBtn) courseSearchBtn.addEventListener('click', handleAdminCourseSearch);
    else console.warn("#admin-course-search-btn not found");

    const courseSearchInput = mainContentElement.querySelector('#admin-course-search');
    if (courseSearchInput) courseSearchInput.addEventListener('keyup', (event) => {
        if (event.key === "Enter") {
            handleAdminCourseSearch();
        }
        // debouncedCourseSearch(); // Or trigger debounced search on keyup
    });

    // --- Form Submissions ---
    if (scheduleEventForm) scheduleEventForm.addEventListener('submit', handleScheduleEvent);
    else console.warn("#schedule-event-form not found");

    if (exportReportForm) {
        exportReportForm.addEventListener('submit', handleExportReport);
        // Enable button only when a report type is selected
        const reportTypeSelect = exportReportForm.querySelector('#report-type');
        const exportButton = exportReportForm.querySelector('button[type="submit"]');
        if (reportTypeSelect && exportButton) {
            reportTypeSelect.addEventListener('change', (e) => {
                exportButton.disabled = !e.target.value; // Disable if no value selected
            });
            // Initial check
            exportButton.disabled = !reportTypeSelect.value;
        }
    } else console.warn("#export-report-form not found");


    if (platformSettingsForm) platformSettingsForm.addEventListener('submit', handleSaveSettings);
    else console.warn("#platform-settings-form not found");

    // --- Delegated Event Listener ---
    // Use one listener for all actions within tables/lists if possible
    mainContentElement.removeEventListener('click', handleAdminActionClick); // Remove previous if any
    mainContentElement.addEventListener('click', handleAdminActionClick);
    console.log("Delegated click listener attached to admin main content.");
};

// --- Section Navigation Logic --- //
const setupDashboardNavigation = (sidebar, mainContent) => {
    if (!sidebar || !mainContent) {
        console.error("Cannot setup admin navigation: Sidebar or Main Content element missing.");
        return;
    }
    const navLinks = sidebar.querySelectorAll('nav ul li a[data-target]'); // Use data-target
    console.log(`setupDashboardNavigation (Admin): Found ${navLinks.length} links.`);

    if (navLinks.length === 0) {
        console.error("Admin sidebar: No links with 'data-target' found.");
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetSectionId = link.dataset.target;

            if (!targetSectionId) return;

            navLinks.forEach(nav => nav.classList.remove('active-link'));
            link.classList.add('active-link');

            setActiveSection(mainContent, targetSectionId);
        });
    });
    console.log("Admin dashboard navigation listeners attached.");
};

const setActiveSection = (mainContentEl, sectionId) => {
    console.log(`Activating admin section: ${sectionId}`);
    if (!mainContentEl || !sectionId) {
        console.error('setActiveSection (Admin): Missing mainContentElement or sectionId');
        return;
    }
    const sections = mainContentEl.querySelectorAll(':scope > .dashboard-section');

    if (sections.length === 0) {
        console.error('setActiveSection (Admin): No .dashboard-section elements found.');
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
        console.warn(`Target admin section '${sectionId}' not found. Activating first.`);
        sections[0]?.classList.add('active');
        const fallbackLinkId = sections[0]?.id;
        const sidebarLinks = document.querySelectorAll('#sidebar nav ul li a[data-target]');
        sidebarLinks.forEach(nav => {
            nav.classList.toggle('active-link', nav.dataset.target === fallbackLinkId);
        });
    }
};

// Make the initialization function globally accessible
window.initializeAdminDashboard = initializeAdminDashboard;