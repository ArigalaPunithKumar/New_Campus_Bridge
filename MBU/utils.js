// === Shared Utility Functions ===

// Show/Hide Form Messages
const showMessage = (element, message, isError = true) => {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${isError ? 'error-message' : 'success-message'} show`;
};

const hideMessage = (element) => {
    if (!element) return;
    element.textContent = '';
    element.classList.remove('show');
};

// Add/Remove Loading State
const setLoading = (buttonElement, isLoading) => {
    if (!buttonElement) return;
    const originalContentAttribute = 'data-original-content';
    if (isLoading) {
        if (!buttonElement.hasAttribute(originalContentAttribute)) {
            buttonElement.setAttribute(originalContentAttribute, buttonElement.innerHTML);
        }
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<span class="loading-spinner" style="width:1em; height:1em; border-width:2px; display:inline-block; margin-right: 5px; vertical-align: middle;"></span> Processing...';
    } else {
        if (buttonElement.hasAttribute(originalContentAttribute)) {
            buttonElement.innerHTML = buttonElement.getAttribute(originalContentAttribute);
            buttonElement.removeAttribute(originalContentAttribute);
        } else {
            // Fallback if needed
            const defaultText = buttonElement.dataset.defaultText || 'Submit';
            buttonElement.textContent = defaultText;
            console.warn('setLoading: Could not restore original button text for', buttonElement);
        }
        buttonElement.disabled = false;
    }
};

// Simulate API Call Delay (Keep for frontend testing without backend)
const simulateApiCall = (delay = 1000, shouldSucceed = true) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldSucceed) {
                console.log("Simulated API call successful.");
                resolve({ success: true, message: "Operation successful (Simulated)" });
            } else {
                console.log("Simulated API call failed.");
                reject({ success: false, message: "Operation failed (Simulated Error)" });
            }
        }, delay);
    });
};


// Modal Management - Requires modal DOM elements to be present on the page
const openModal = (title, content, modalClass = '') => {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const body = document.body;
    if (!modal || !modalTitle || !modalBody) {
        console.error("Modal elements not found in the DOM.");
        return;
    }

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.className = `modal ${modalClass}`; // Reset classes and add optional one
    modal.classList.add('active');
    body.style.overflow = 'hidden';
};

const closeModal = () => {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const body = document.body;
    if (!modal) return;

    modal.classList.remove('active');
    // Optional: Clear content after animation if needed
    // setTimeout(() => {
    //     if (modalTitle) modalTitle.textContent = '';
    //     if (modalBody) modalBody.innerHTML = '';
    //     modal.className = 'modal';
    // }, 400); // Match animation duration
    body.style.overflow = '';
};

// Add event listener for modal close button if modal exists
// This should ideally be run only once per page load where a modal is present.
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const closeModalButton = document.getElementById('modal-close-button');

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
    if(closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }
}); 