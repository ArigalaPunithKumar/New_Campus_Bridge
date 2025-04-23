// === Faculty Dashboard Specific Logic ===

// Assume utils.js provides: showMessage, hideMessage, setLoading, simulateApiCall, openModal, closeModal
// Add checks or fallbacks if needed
if (typeof window.showMessage !== 'function') console.error("showMessage function not found!");
if (typeof window.setLoading !== 'function') console.error("setLoading function not found!");
if (typeof window.simulateApiCall !== 'function') {
    window.simulateApiCall = (duration) => new Promise(resolve => setTimeout(resolve, duration));
    console.warn("simulateApiCall function not found, using basic fallback.");
}
// ... etc for openModal/closeModal

// --- DOM Elements (Scoped to Faculty Dashboard) ---
// Declare variables, but assign them inside initializeFacultyDashboard
let facultyDashboardElement, sidebarElement, mainContentElement;
let uploadContentForm, postAttendanceForm, createAssignmentForm;
let facultyCourseSelect, attendanceCourseSelect, analyticsCourseSelect, assignmentCourseSelect, submissionAssignmentFilter;
let submissionsTableBody, attendanceStudentList, existingContentList, attendanceSheetBlock, courseMgmtDetailsBlock;
let contentTypeSelect, fileUploadGroup, contentUrlGroup; // Specific form elements

// --- Initialization Function (Called by inline script in dashboard.html) --- //
const initializeFacultyDashboard = (currentUser) => {
    console.log("Initializing Faculty Dashboard for:", currentUser?.id);
    facultyDashboardElement = document.getElementById('faculty-dashboard');
    sidebarElement = document.getElementById('sidebar'); // Use ID
    mainContentElement = document.getElementById('main-content'); // Use ID

    if (!facultyDashboardElement || !sidebarElement || !mainContentElement) {
        console.error("Essential dashboard elements (faculty-dashboard, sidebar, or main-content) not found!");
        return;
    }

    // Find forms and key elements *within* mainContentElement for better scoping
    uploadContentForm = mainContentElement.querySelector('#upload-content-form');
    postAttendanceForm = mainContentElement.querySelector('#post-attendance-form');
    // createAssignmentForm = mainContentElement.querySelector('#create-assignment-form'); // Find if added later

    facultyCourseSelect = mainContentElement.querySelector('#faculty-course-select');
    attendanceCourseSelect = mainContentElement.querySelector('#attendance-course-select');
    analyticsCourseSelect = mainContentElement.querySelector('#analytics-course-select');
    assignmentCourseSelect = mainContentElement.querySelector('#assignment-course-select'); // Added
    submissionAssignmentFilter = mainContentElement.querySelector('#submission-assignment-filter'); // Added

    submissionsTableBody = mainContentElement.querySelector('#submissions-table-body');
    attendanceStudentList = mainContentElement.querySelector('#attendance-student-list');
    existingContentList = mainContentElement.querySelector('#existing-content-list');
    attendanceSheetBlock = mainContentElement.querySelector('#attendance-sheet-block'); // Added
    courseMgmtDetailsBlock = mainContentElement.querySelector('#course-management-details'); // Added

    // Specific form elements
    contentTypeSelect = mainContentElement.querySelector('#content-type');
    fileUploadGroup = mainContentElement.querySelector('#file-upload-group');
    contentUrlGroup = mainContentElement.querySelector('#content-url-group'); // Added

    if (!currentUser) {
        console.error("CurrentUser data not provided to initializeFacultyDashboard.");
        return; // Redirect should have happened in HTML
    }

    // Load Initial Data
    loadFacultyDashboardData(currentUser.id).then(() => {
        console.log("Faculty dashboard data loaded.");

        // Setup listeners and navigation after data load
        setupFacultyEventListeners(); // Will use mainContentElement for delegation
        setupDashboardNavigation(sidebarElement, mainContentElement); // Pass elements

        // Set initial active section based on the sidebar link
        const initialActiveLink = sidebarElement.querySelector('nav a.active-link');
        let initialSectionId = 'faculty-home'; // Default
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
        setActiveSection(mainContentElement, initialSectionId); // Use the correct elements

        console.log("Faculty Dashboard Initialized.");
    }).catch(error => {
        console.error("Failed to load faculty dashboard data:", error);
        if (mainContentElement) {
            mainContentElement.innerHTML = `<div class="error-message" style='padding:2rem;color:red;'>Failed to load dashboard data. Please try again later.</div>`;
        }
    });
};

// --- Data Loading & Populating Functions --- //

const loadFacultyDashboardData = async (facultyId) => {
    if (!facultyId) throw new Error("Missing faculty ID."); // Throw error to be caught

    console.log(`Loading data for faculty ID: ${facultyId}`);
    // Show loading state?
    await simulateApiCall(700); // Use simulateApiCall

    // --- TODO: Replace with actual API call --- //
    const sampleData = {
        courses: [
            { id: 'cs101', name: 'CS101 - Intro to Programming' },
            { id: 'cs201', name: 'CS201 - Data Structures' },
            { id: 'ma101', name: 'MA101 - Calculus I' }
        ],
        assignments: { // Assignments grouped by course
            'cs101': [{ id: 'a1', name: 'Lab 1: Variables' }, { id: 'a3', name: 'Quiz 1: Basics' }],
            'cs201': [{ id: 'a2', name: 'HW 1: Linked Lists' }]
        },
        submissions: { // Submissions grouped by assignment ID
            'a1': [
                { studentId: '101', studentName: 'Alice Smith', submittedOn: '2024-06-09', status: 'Submitted', grade: null, submissionData: 'print("Hello Alice")', review: null },
                { studentId: '103', studentName: 'Charlie Brown', submittedOn: '2024-06-10', status: 'Submitted', grade: null, submissionData: 'print("Hello Charlie")', review: null },
            ],
            'a3': [
                { studentId: '101', studentName: 'Alice Smith', submittedOn: '2024-06-05', status: 'Graded', grade: '85/100', submissionData: 'Answers provided...', review: 'Good effort.' },
            ],
            'a2': [] // No submissions for HW 1 yet
        },
        studentsByCourse: { // For attendance
            'cs101': [{ id: '101', name: 'Alice Smith' }, { id: '102', name: 'Bob Johnson' }, { id: '103', name: 'Charlie Brown' }],
            'cs201': [{ id: '101', name: 'Alice Smith' }, { id: '104', name: 'Diana Prince' }],
            'ma101': [{ id: '102', name: 'Bob Johnson' }, { id: '104', name: 'Diana Prince' }]
        },
        contentByCourse: {
            'cs101': [
                { id: 'c1', type: 'notes', title: 'Lecture 1 Notes.pdf', description: 'Notes for first lecture.' },
                { id: 'c2', type: 'video', title: 'Intro Video', url: 'https://youtube.com/...' },
                { id: 'c3', type: 'assignment_spec', title: 'Lab 1 Spec.pdf' },
            ],
            'cs201': [
                { id: 'c4', type: 'notes', title: 'Linked List Intro.pdf' }
            ]
        },
        stats: { courses: 3, pendingSubmissions: 2, students: 4 } // Example stats
    };
    // --- End of Sample Data --- //

    // Store data globally or pass it around (simple global storage for now)
    window.facultyData = sampleData;

    // Populate Initial Elements
    populateFacultyCourseSelects(sampleData.courses); // Populate all course selects
    populateFacultyStats(sampleData.stats); // Populate stats on home page

    // Initial population of assignment selects requires a course, leave empty for now
    // Initial population of submissions requires an assignment, leave empty for now
};

// Populate all relevant course dropdowns
const populateFacultyCourseSelects = (courses) => {
    const selects = [
        facultyCourseSelect,
        attendanceCourseSelect,
        analyticsCourseSelect,
        assignmentCourseSelect,
        // Add any other course selects here
    ];
    const optionsHtml = courses.map(course => `<option value="${course.id}">${course.name}</option>`).join('');

    selects.forEach(select => {
        if (!select) return;
        const currentValue = select.value; // Preserve selection if possible
        select.innerHTML = '<option value="">-- Select Course --</option>' + optionsHtml;
        // Try to restore previous selection if it still exists
        if (select.querySelector(`option[value="${currentValue}"]`)) {
            select.value = currentValue;
        }
    });
};

// Populate stats on faculty home
const populateFacultyStats = (stats) => {
    const coursesEl = document.getElementById('faculty-courses-stat');
    const gradingEl = document.getElementById('faculty-grading-stat');
    const studentsEl = document.getElementById('faculty-students-stat'); // Added ID in HTML
    if (coursesEl) coursesEl.textContent = stats?.courses ?? '--';
    if (gradingEl) gradingEl.textContent = stats?.pendingSubmissions ?? '--';
    if (studentsEl) studentsEl.textContent = stats?.students ?? '--';
};

// Populate assignments dropdown based on selected course
const populateAssignmentSelects = (courseId) => {
    const assignments = window.facultyData?.assignments?.[courseId] || [];
    const optionsHtml = assignments.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

    const selects = [submissionAssignmentFilter /* Add other assignment selects if needed */];
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">-- Select Assignment --</option>' + optionsHtml;
    });

    // Clear submissions table when course/assignment filter changes
    if (submissionsTableBody) {
        submissionsTableBody.innerHTML = '<tr><td colspan="5">Select an assignment to view submissions.</td></tr>';
    }
    // Populate existing assignments list in Course Management
    const existingAssignList = document.getElementById('existing-assignments-list')?.querySelector('ul');
    if (existingAssignList) {
        existingAssignList.innerHTML = assignments.length > 0
            ? assignments.map(a => `<li>${a.name} <button class="btn btn-sm btn-secondary btn-manage-assignment" data-assignment-id="${a.id}" style="float:right;">Manage</button></li>`).join('')
            : '<li>No assignments created for this course yet.</li>';
    }
};

// Populate submissions table based on selected assignment
const populateSubmissionsTable = (assignmentId) => {
    if (!submissionsTableBody) return;
    const submissions = window.facultyData?.submissions?.[assignmentId] || [];

    submissionsTableBody.innerHTML = submissions.length > 0
        ? submissions.map(s => {
            const submissionJson = JSON.stringify(s); // Stringify the data for the button
            return `
            <tr>
                <td>${s.studentName} (${s.studentId})</td>
                <td>${s.submittedOn || 'N/A'}</td>
                <td class="status-${(s.status || 'unknown').toLowerCase()}">${s.status || 'Unknown'}</td>
                <td>${s.grade || '-'}</td>
                <td>
                    <button class="btn btn-sm ${s.status === 'Submitted' ? 'btn-primary' : 'btn-secondary'} btn-review-submission"
                            data-submission='${submissionJson.replace(/'/g, "'")}' > {/* Use single quotes for JSON, escape if needed */}
                            ${s.status === 'Submitted' ? 'Review/Grade' : 'View/Edit Grade'}
                    </button>
                </td>
            </tr>`;
        }).join('')
        : '<tr><td colspan="5">No submissions found for this assignment.</td></tr>';
};

// Populate student list for attendance marking
const populateAttendanceStudentList = (courseId) => {
    if (!attendanceStudentList) return;
    const students = window.facultyData?.studentsByCourse?.[courseId] || [];

    attendanceStudentList.innerHTML = students.length > 0
        ? students.map(s => `
             <div class="attendance-student-item">
                 <input type="checkbox" id="attend-${s.id}" name="studentAttendance" value="${s.id}" checked>
                 <label for="attend-${s.id}">${s.name} (ID: ${s.id})</label>
             </div>`).join('')
        : '<p>No students found enrolled in this course.</p>';

    // Show the block if students are loaded
    if (attendanceSheetBlock) {
        attendanceSheetBlock.style.display = students.length > 0 ? 'block' : 'none';
    }
};

// Load existing content list for a course
const loadExistingCourseContent = (courseId) => {
    if (!existingContentList || !courseId) return;

    const content = window.facultyData?.contentByCourse?.[courseId] || [];
    const courseNameSpans = document.querySelectorAll('.selected-course-name-display');
    const selectedCourseName = facultyCourseSelect.options[facultyCourseSelect.selectedIndex]?.text || 'Selected Course';

    // Update display spans
    courseNameSpans.forEach(span => span.textContent = selectedCourseName);
    // Set hidden input value
    const hiddenInput = document.getElementById('upload-course-id');
    if (hiddenInput) hiddenInput.value = courseId;


    existingContentList.innerHTML = content.length > 0 ? content.map(item => `
        <li data-content-id="${item.id}">
            <span class="content-type">[${item.type}]</span>
            <span class="content-title">${item.title}</span>
            ${item.url ? `(<a href="${item.url}" target="_blank" rel="noopener noreferrer">Link</a>)` : ''}
            <button class="btn btn-sm btn-danger btn-delete-content" data-content-id="${item.id}" style="float:right;">Delete</button>
            <button class="btn btn-sm btn-secondary btn-edit-content" data-content-id="${item.id}" style="float:right; margin-right: 5px;">Edit</button>
            ${item.description ? `<p class="content-description">${item.description}</p>` : ''}
        </li>
    `).join('') : '<li>No content uploaded for this course yet.</li>';

    // Show the management block
    if (courseMgmtDetailsBlock) {
        courseMgmtDetailsBlock.style.display = 'block';
    }
};

// --- Event Handlers --- //

// Handle course selection change in the "Course Management" section
const handleCourseSelectionChange = (event) => {
    const courseId = event.target.value;
    console.log("Selected Course ID:", courseId);
    if (courseId) {
        loadExistingCourseContent(courseId);
    } else {
        // Hide details and clear list if no course selected
        if (courseMgmtDetailsBlock) courseMgmtDetailsBlock.style.display = 'none';
        if (existingContentList) existingContentList.innerHTML = '<li>Select a course to view content.</li>';
        const courseNameSpans = document.querySelectorAll('.selected-course-name-display');
        courseNameSpans.forEach(span => span.textContent = 'Selected Course');
        const hiddenInput = document.getElementById('upload-course-id');
        if (hiddenInput) hiddenInput.value = '';
    }
};

// Handle course selection change in the "Assignments" section
const handleAssignmentCourseChange = (event) => {
    const courseId = event.target.value;
    if (courseId) {
        populateAssignmentSelects(courseId); // Populates filter dropdown AND existing list
    } else {
        // Clear assignment selects and lists
        const selects = [submissionAssignmentFilter];
        selects.forEach(select => { if (select) select.innerHTML = '<option value="">Select Course First</option>'; });
        if (submissionsTableBody) submissionsTableBody.innerHTML = '<tr><td colspan="5">Select a course first.</td></tr>';
        const existingAssignList = document.getElementById('existing-assignments-list')?.querySelector('ul');
        if (existingAssignList) existingAssignList.innerHTML = '<li>Select a course to view assignments.</li>';
    }
};

// Handle assignment selection change for filtering submissions
const handleSubmissionFilterChange = (event) => {
    const assignmentId = event.target.value;
    if (assignmentId) {
        populateSubmissionsTable(assignmentId);
    } else {
        if (submissionsTableBody) submissionsTableBody.innerHTML = '<tr><td colspan="5">Select an assignment to view submissions.</td></tr>';
    }
};


// Handle Content Type change to show/hide URL or File input
const handleContentTypeChange = (event) => {
    const selectedType = event.target.value;
    if (!fileUploadGroup || !contentUrlGroup) {
        console.warn("File upload or URL group elements not found.");
        return;
    }
    // Show URL field for link types, hide file upload
    if (selectedType === 'video' || selectedType === 'resource_link') {
        contentUrlGroup.style.display = 'block';
        fileUploadGroup.style.display = 'none';
        contentUrlGroup.querySelector('input').required = true; // Make URL required
        fileUploadGroup.querySelector('input').required = false;
    }
    // Show file upload for other types, hide URL
    else {
        contentUrlGroup.style.display = 'none';
        fileUploadGroup.style.display = 'block';
        contentUrlGroup.querySelector('input').required = false;
        // Make file conditionally required (e.g., required if it's notes/assignment spec)
        fileUploadGroup.querySelector('input').required = (selectedType === 'notes' || selectedType === 'assignment_spec');
    }
};

// Handle content upload form submission
const handleContentUpload = async (event) => {
    event.preventDefault();
    if (!uploadContentForm) return;

    const formData = new FormData(uploadContentForm);
    const courseId = formData.get('courseId');
    const submitButton = uploadContentForm.querySelector('button[type="submit"]');
    const messageDiv = uploadContentForm.querySelector('#upload-message'); // Find within form

    if (!courseId) {
        if (messageDiv) showMessage(messageDiv, 'Error: Course ID not selected.');
        return;
    }

    hideMessage(messageDiv);
    setLoading(submitButton, true);

    try {
        // --- TODO: Replace with actual API call to upload formData --- //
        console.log("Uploading content for course:", courseId);
        console.log("Form Data:", Object.fromEntries(formData.entries()));
        // Check if file exists
        const fileInput = uploadContentForm.querySelector('#content-file');
        if (fileInput && fileInput.files.length > 0) {
            console.log("File selected:", fileInput.files[0].name);
            // Actual upload logic would go here (e.g., sending formData to backend)
        } else {
            console.log("No file selected (might be a link).");
        }
        await simulateApiCall(1500);
        // --- End Simulation --- //

        // Add the new item to the local data for immediate feedback
        const newContent = {
            id: `c${Date.now()}`, // Generate temporary ID
            type: formData.get('contentType'),
            title: formData.get('contentTitle'),
            url: formData.get('contentUrl'),
            description: formData.get('contentDescription')
        };
        if (!window.facultyData.contentByCourse[courseId]) {
            window.facultyData.contentByCourse[courseId] = [];
        }
        window.facultyData.contentByCourse[courseId].push(newContent);


        showMessage(messageDiv, 'Content uploaded successfully!', false);
        uploadContentForm.reset();
        handleContentTypeChange({ target: contentTypeSelect }); // Reset form visibility
        loadExistingCourseContent(courseId); // Refresh the list from potentially updated data

    } catch (error) {
        console.error("Content upload failed:", error);
        showMessage(messageDiv, `Upload failed: ${error.message || "Please try again."}`);
    } finally {
        setLoading(submitButton, false);
    }
};

// Handle clicking the "Load Student List" button for attendance
const handleLoadAttendanceList = async () => {
    const courseId = attendanceCourseSelect?.value;
    const date = document.getElementById('attendance-date')?.value;
    const loadButton = document.getElementById('load-attendance-btn');

    if (!courseId || !date) {
        showMessage(document.getElementById('attendance-message'), 'Please select both course and date.');
        if (attendanceSheetBlock) attendanceSheetBlock.style.display = 'none'; // Hide if no selection
        return;
    }

    hideMessage(document.getElementById('attendance-message'));
    setLoading(loadButton, true);
    if (attendanceStudentList) attendanceStudentList.innerHTML = '<p>Loading students...</p>';
    if (attendanceSheetBlock) attendanceSheetBlock.style.display = 'block'; // Show loading message area

    try {
        // --- TODO: API Call to fetch students for course (or use cached data) --- //
        console.log(`Loading attendance for Course: ${courseId}, Date: ${date}`);
        await simulateApiCall(800);
        // --- End Simulation --- //

        populateAttendanceStudentList(courseId); // Use data stored in window.facultyData

    } catch (error) {
        console.error("Failed to load student list for attendance:", error);
        if (attendanceStudentList) attendanceStudentList.innerHTML = `<p class="error-message">Error loading students: ${error.message}</p>`;
        if (attendanceSheetBlock) attendanceSheetBlock.style.display = 'block'; // Show error in the block
    } finally {
        setLoading(loadButton, false);
    }
};

// Handle submission of the attendance form
const handlePostAttendance = async (event) => {
    event.preventDefault();
    if (!postAttendanceForm) return;

    const formData = new FormData(postAttendanceForm);
    const presentStudentIds = formData.getAll('studentAttendance'); // Get IDs of checked boxes
    const courseId = attendanceCourseSelect?.value;
    const date = document.getElementById('attendance-date')?.value;
    const submitButton = postAttendanceForm.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('attendance-message');

    if (!courseId || !date) {
        showMessage(messageDiv, 'Missing course or date selection.');
        return;
    }

    // You might want to get the full list of students for this course to determine who was absent
    const allStudentsInCourse = window.facultyData?.studentsByCourse?.[courseId] || [];
    const allStudentIds = allStudentsInCourse.map(s => s.id);
    const absentStudentIds = allStudentIds.filter(id => !presentStudentIds.includes(id));

    const attendanceData = {
        courseId: courseId,
        date: date,
        presentIds: presentStudentIds,
        absentIds: absentStudentIds // Optional: send absent IDs too
    };

    hideMessage(messageDiv);
    setLoading(submitButton, true);

    try {
        // --- TODO: API Call to post attendanceData --- //
        console.log("Submitting attendance:", attendanceData);
        await simulateApiCall(1200);
        // --- End Simulation --- //

        showMessage(messageDiv, 'Attendance posted successfully!', false);
        // Optionally clear the form or provide other feedback
        // setTimeout(() => {
        //     if(attendanceSheetBlock) attendanceSheetBlock.style.display = 'none';
        //     if(attendanceStudentList) attendanceStudentList.innerHTML = '<p>Select course and date to load list.</p>';
        //     hideMessage(messageDiv);
        // }, 2000);


    } catch (error) {
        console.error("Attendance submission failed:", error);
        showMessage(messageDiv, `Submission failed: ${error.message || "Please try again."}`);
    } finally {
        setLoading(submitButton, false);
    }
};

// Handle creating a new assignment (likely opens a modal)
const handleCreateAssignment = (event) => {
    event.preventDefault(); // If called from a form submit
    const courseId = assignmentCourseSelect?.value;
    if (!courseId) {
        alert("Please select a course before creating an assignment.");
        return;
    }
    console.log("Create new assignment for course:", courseId);
    // --- TODO: Open a modal with the assignment creation form --- //
    const modalContent = `
        <h4>Create New Assignment for ${assignmentCourseSelect.options[assignmentCourseSelect.selectedIndex]?.text}</h4>
        <form id="actual-create-assignment-form">
            <input type="hidden" name="courseId" value="${courseId}">
            <div class="form-group">
                <label for="assignment-name">Assignment Name:</label>
                <input type="text" id="assignment-name" name="assignmentName" required>
            </div>
            <div class="form-group">
                <label for="assignment-due-date">Due Date:</label>
                <input type="datetime-local" id="assignment-due-date" name="dueDate">
            </div>
            <div class="form-group">
                <label for="assignment-instructions">Instructions:</label>
                <textarea id="assignment-instructions" name="instructions" rows="5"></textarea>
            </div>
            <div class="form-group">
                <label for="assignment-file-spec">Specification File (Optional):</label>
                <input type="file" id="assignment-file-spec" name="specFile">
            </div>
            <button type="submit" class="btn btn-primary">Create Assignment</button>
            <div id="create-assignment-modal-message" class="form-message"></div>
        </form>
     `;
    openModal("Create Assignment", modalContent);

    // Add listener for the actual form inside the modal
    const actualForm = document.getElementById('actual-create-assignment-form');
    if (actualForm) {
        actualForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(actualForm);
            const msgEl = document.getElementById('create-assignment-modal-message');
            const createBtn = actualForm.querySelector('button[type="submit"]');

            hideMessage(msgEl);
            setLoading(createBtn, true);

            try {
                // --- TODO: API Call to create assignment ---
                console.log("Submitting new assignment:", Object.fromEntries(formData.entries()));
                await simulateApiCall(1000);
                // --- End Simulation ---

                // Add to local data
                const newAssignment = {
                    id: `a${Date.now()}`, name: formData.get('assignmentName')
                };
                if (!window.facultyData.assignments[courseId]) window.facultyData.assignments[courseId] = [];
                window.facultyData.assignments[courseId].push(newAssignment);

                showMessage(msgEl, "Assignment created successfully!", false);
                populateAssignmentSelects(courseId); // Refresh dropdowns and lists
                setTimeout(closeModal, 1500);

            } catch (error) {
                showMessage(msgEl, `Error: ${error.message}`);
            } finally {
                setLoading(createBtn, false);
            }
        });
    }
};


// Opens the modal for reviewing/grading a submission
const openReviewModal = (submissionData, buttonElement) => {
    // Ensure submissionData is an object
    if (typeof submissionData !== 'object' || submissionData === null) {
        console.error("Invalid submission data passed to openReviewModal:", submissionData);
        alert("Error: Could not load submission details.");
        return;
    }

    const { studentName, studentId, assignmentName, assignmentId, grade, review, submissionData: submissionContent, submittedOn } = submissionData;

    const modalContent = `
        <h4>Submission Details</h4>
        <p><strong>Student:</strong> ${studentName || 'Unknown'} (${studentId || 'N/A'})</p>
        <p><strong>Assignment:</strong> ${assignmentName || 'Unknown Assignment'}</p>
        <p><strong>Submitted On:</strong> ${submittedOn || 'N/A'}</p>
        <hr>
        <h4>Submission Content:</h4>
        <pre class="submission-content-display">${submissionContent || '(No textual content submitted)'}</pre>
        <!-- TODO: Add link for file download if applicable -->
        <hr>
        <form id="grade-review-form">
             <h4>Grade & Review</h4>
             <div class="form-group">
                <label for="grade-input">Grade:</label>
                <input type="text" id="grade-input" name="grade" value="${grade || ''}" placeholder="e.g., 85/100 or A-">
             </div>
             <div class="form-group">
                <label for="review-input">Review Comments:</label>
                <textarea id="review-input" name="review" rows="4" placeholder="Provide feedback...">${review || ''}</textarea>
             </div>
             <button type="submit" class="btn btn-primary">Save Grade & Review</button>
             <div id="grade-review-message" class="form-message" style="display:none;"></div>
        </form>
    `;

    openModal(`Review: ${assignmentName || 'Submission'} - ${studentName || 'Unknown'}`, modalContent);

    // Add listener for the form inside the modal
    const gradeForm = document.getElementById('grade-review-form');
    if (gradeForm) {
        gradeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newGrade = gradeForm.querySelector('#grade-input').value;
            const newReview = gradeForm.querySelector('#review-input').value;
            const msgEl = document.getElementById('grade-review-message');
            const saveButton = gradeForm.querySelector('button[type="submit"]');

            setLoading(saveButton, true);
            hideMessage(msgEl);

            try {
                // --- TODO: API Call to save grade/review --- //
                console.log(`Saving grade for assignment: ${assignmentId}, Student ${studentId}, Grade: ${newGrade}, Review: ${newReview}`);
                await simulateApiCall(1000);
                // --- End Simulation ---

                // Update the local data store
                const assignmentSubmissions = window.facultyData.submissions[assignmentId];
                if (assignmentSubmissions) {
                    const subIndex = assignmentSubmissions.findIndex(s => s.studentId === studentId);
                    if (subIndex !== -1) {
                        window.facultyData.submissions[assignmentId][subIndex] = {
                            ...assignmentSubmissions[subIndex],
                            grade: newGrade,
                            review: newReview,
                            status: 'Graded'
                        };
                    }
                }

                showMessage(msgEl, "Grade and review saved successfully!", false);
                setTimeout(closeModal, 1500);

                // Update the table row visually without full reload
                if (buttonElement) {
                    const row = buttonElement.closest('tr');
                    if (row) {
                        row.cells[3].textContent = newGrade || '-'; // Grade cell index might change
                        const statusCell = row.cells[2]; // Status cell index might change
                        statusCell.textContent = 'Graded';
                        statusCell.className = 'status-graded';
                        buttonElement.textContent = 'View/Edit Grade';
                        buttonElement.classList.remove('btn-primary');
                        buttonElement.classList.add('btn-secondary');
                        // Update the data stored on the button itself
                        const updatedSubmissionData = { ...submissionData, grade: newGrade, review: newReview, status: 'Graded' };
                        buttonElement.dataset.submission = JSON.stringify(updatedSubmissionData).replace(/'/g, "'");
                    }
                }
            } catch (error) {
                console.error("Failed to save grade/review:", error);
                showMessage(msgEl, `Error saving: ${error.message}`);
            } finally {
                setLoading(saveButton, false);
            }
        });
    }
};


// --- Delegated Event Listener for Actions --- //
const handleFacultyActionClick = (event) => {
    const target = event.target;

    // Handle Review/Grade button clicks
    const reviewButton = target.closest('.btn-review-submission');
    if (reviewButton) {
        try {
            // Safely parse JSON - use try-catch
            const submissionJson = reviewButton.dataset.submission;
            if (!submissionJson) throw new Error("Missing submission data on button.");
            const submissionData = JSON.parse(submissionJson.replace(/'/g, "'")); // Decode ' back to single quote for JSON parsing
            openReviewModal(submissionData, reviewButton);
        } catch (error) {
            console.error("Error parsing submission data or opening modal:", error);
            alert("Error: Could not load submission details. Data might be corrupt.");
        }
        return; // Handled
    }

    // Handle Delete Content button clicks
    const deleteButton = target.closest('.btn-delete-content');
    if (deleteButton) {
        const contentId = deleteButton.dataset.contentId;
        const listItem = deleteButton.closest('li');
        const courseId = facultyCourseSelect?.value; // Need course ID to update local data

        if (contentId && listItem && courseId && confirm(`Are you sure you want to delete this content item?`)) {
            // --- TODO: API call to delete content --- //
            setLoading(deleteButton, true);
            console.log(`Attempting delete: Content ID ${contentId}, Course ID ${courseId}`);
            simulateApiCall(500).then(() => {
                // Remove from local data
                if (window.facultyData?.contentByCourse?.[courseId]) {
                    window.facultyData.contentByCourse[courseId] = window.facultyData.contentByCourse[courseId].filter(item => item.id !== contentId);
                }
                listItem.remove(); // Remove from UI
                console.log("Content deleted (simulated).");
            }).catch(err => {
                console.error("Deletion failed:", err);
                alert("Failed to delete content.");
                setLoading(deleteButton, false);
            });
        }
        return; // Handled
    }

    // Handle Edit Content button clicks (placeholder)
    const editButton = target.closest('.btn-edit-content');
    if (editButton) {
        const contentId = editButton.dataset.contentId;
        console.log(`Edit content clicked: ${contentId}`);
        alert(`Editing content ${contentId} - Placeholder`);
        // --- TODO: Open modal with form pre-filled with content data ---
        return; // Handled
    }

    // Handle Manage Assignment button clicks (placeholder)
    const manageAssignButton = target.closest('.btn-manage-assignment');
    if (manageAssignButton) {
        const assignmentId = manageAssignButton.dataset.assignmentId;
        console.log(`Manage assignment clicked: ${assignmentId}`);
        alert(`Managing assignment ${assignmentId} - Placeholder`);
        // --- TODO: Open modal or navigate to assignment detail view ---
        return; // Handled
    }
};


// --- Section Navigation Logic --- //
const setupDashboardNavigation = (sidebar, mainContent) => {
    if (!sidebar || !mainContent) {
        console.error("Cannot setup navigation: Sidebar or Main Content element missing.");
        return;
    }
    const navLinks = sidebar.querySelectorAll('nav ul li a[data-target]'); // Use data-target
    console.log(`setupDashboardNavigation: Found ${navLinks.length} faculty navigation links.`);

    if (navLinks.length === 0) {
        console.error("setupDashboardNavigation: No links with 'data-target' found in the faculty sidebar.");
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetSectionId = link.dataset.target; // Get target from data-target

            if (!targetSectionId) {
                console.warn("Clicked link has no data-target:", link);
                return;
            }
            console.log(`Faculty Nav Click: Target Section = ${targetSectionId}`);

            navLinks.forEach(nav => nav.classList.remove('active-link'));
            link.classList.add('active-link');

            setActiveSection(mainContent, targetSectionId);
        });
    });
    console.log("Faculty dashboard navigation listeners attached.");
};

const setActiveSection = (mainContentEl, sectionId) => {
    console.log(`Activating faculty section: ${sectionId}`);
    if (!mainContentEl || !sectionId) {
        console.error('setActiveSection (Faculty): Missing mainContentElement or sectionId');
        return;
    }
    const sections = mainContentEl.querySelectorAll(':scope > .dashboard-section'); // Direct children

    if (sections.length === 0) {
        console.error('setActiveSection (Faculty): No .dashboard-section elements found.');
        return;
    }

    let sectionFound = false;
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
            sectionFound = true;
            console.log(` -> Section ${section.id} activated.`);
        } else {
            section.classList.remove('active');
        }
    });

    if (!sectionFound) {
        console.warn(`Target faculty section '${sectionId}' not found. Activating first section.`);
        sections[0]?.classList.add('active');
        // Update sidebar link to match fallback
        const fallbackLinkId = sections[0]?.id;
        const sidebarLinks = document.querySelectorAll('#sidebar nav ul li a[data-target]');
        sidebarLinks.forEach(nav => {
            nav.classList.toggle('active-link', nav.dataset.target === fallbackLinkId);
        });
    }
};

// --- Setup Event Listeners called during Initialization --- //
const setupFacultyEventListeners = () => {
    console.log("Setting up faculty event listeners...");
    if (!mainContentElement) {
        console.error("Cannot setup listeners: mainContentElement not found.");
        return;
    }

    // Course selection listeners
    if (facultyCourseSelect) facultyCourseSelect.addEventListener('change', handleCourseSelectionChange);
    else console.warn("facultyCourseSelect not found");
    if (assignmentCourseSelect) assignmentCourseSelect.addEventListener('change', handleAssignmentCourseChange);
    else console.warn("assignmentCourseSelect not found");

    // Assignment filter listener
    if (submissionAssignmentFilter) submissionAssignmentFilter.addEventListener('change', handleSubmissionFilterChange);
    else console.warn("submissionAssignmentFilter not found");


    // Form submissions
    if (uploadContentForm) uploadContentForm.addEventListener('submit', handleContentUpload);
    else console.warn("uploadContentForm not found");
    if (postAttendanceForm) postAttendanceForm.addEventListener('submit', handlePostAttendance);
    else console.warn("postAttendanceForm not found");

    // Button Clicks (Specific buttons not handled by delegation)
    const loadAttendBtn = mainContentElement.querySelector('#load-attendance-btn');
    if (loadAttendBtn) loadAttendBtn.addEventListener('click', handleLoadAttendanceList);
    else console.warn("load-attendance-btn not found");

    const createAssignBtn = mainContentElement.querySelector('#create-assignment-btn');
    if (createAssignBtn) createAssignBtn.addEventListener('click', handleCreateAssignment);
    else console.warn("create-assignment-btn not found");

    // Content Type change listener
    if (contentTypeSelect) contentTypeSelect.addEventListener('change', handleContentTypeChange);
    else console.warn("content-type select not found");

    // Delegated listener for actions within main content (review buttons, delete buttons etc.)
    mainContentElement.addEventListener('click', handleFacultyActionClick);
    console.log("Delegated click listener attached to faculty main content.");

    // Initial check for content type visibility on load (in case default isn't 'notes')
    if (contentTypeSelect) {
        handleContentTypeChange({ target: contentTypeSelect });
    }
};

// Make the initialization function globally accessible
window.initializeFacultyDashboard = initializeFacultyDashboard;