// API Configuration
const API_BASE_URL = '/api';

// State Management
let employees = [];
let currentEmployeeId = null;
let isEditMode = false;

// DOM Elements
const employeesGrid = document.getElementById('employeesGrid');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('employeeModal');
const modalTitle = document.getElementById('modalTitle');
const employeeForm = document.getElementById('employeeForm');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addEmployeeBtn.addEventListener('click', openAddModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    employeeForm.addEventListener('submit', handleFormSubmit);

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// API Functions
async function loadEmployees() {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        if (!response.ok) throw new Error('Failed to fetch employees');

        employees = await response.json();
        renderEmployees();
    } catch (error) {
        console.error('Error loading employees:', error);
        showError('Failed to load employees. Make sure the backend is running.');
    }
}

async function createEmployee(employeeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData),
        });

        if (!response.ok) throw new Error('Failed to create employee');

        const newEmployee = await response.json();
        employees.push(newEmployee);
        renderEmployees();
        closeModal();
        showSuccess('Employee added successfully!');
    } catch (error) {
        console.error('Error creating employee:', error);
        showError('Failed to create employee. Please check the data and try again.');
    }
}

async function updateEmployee(id, employeeData) {
    try {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData),
        });

        if (!response.ok) throw new Error('Failed to update employee');

        const updatedEmployee = await response.json();
        const index = employees.findIndex(emp => emp.id === id);
        if (index !== -1) {
            employees[index] = updatedEmployee;
        }
        renderEmployees();
        closeModal();
        showSuccess('Employee updated successfully!');
    } catch (error) {
        console.error('Error updating employee:', error);
        showError('Failed to update employee. Please try again.');
    }
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete employee');

        employees = employees.filter(emp => emp.id !== id);
        renderEmployees();
        showSuccess('Employee deleted successfully!');
    } catch (error) {
        console.error('Error deleting employee:', error);
        showError('Failed to delete employee. Please try again.');
    }
}

// Render Functions
function renderEmployees() {
    if (employees.length === 0) {
        employeesGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    employeesGrid.innerHTML = employees.map(employee => `
        <div class="employee-card">
            <div class="employee-header">
                <div class="employee-info">
                    <h3>${escapeHtml(employee.name)}</h3>
                    <p>${escapeHtml(employee.email)}</p>
                </div>
                <div class="employee-actions">
                    <button class="icon-btn edit" onclick="openEditModal(${employee.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="icon-btn delete" onclick="deleteEmployee(${employee.id})" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="employee-details">
                <div class="detail-row">
                    <span class="detail-label">Role</span>
                    <span class="detail-value">${escapeHtml(employee.role)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Department</span>
                    <span class="detail-value">${escapeHtml(employee.department)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Salary</span>
                    <span class="detail-value salary">$${formatNumber(employee.salary)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date Joined</span>
                    <span class="detail-value">${formatDate(employee.date_joined)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function openAddModal() {
    isEditMode = false;
    currentEmployeeId = null;
    modalTitle.textContent = 'Add Employee';
    employeeForm.reset();
    modal.classList.add('active');
}

function openEditModal(id) {
    isEditMode = true;
    currentEmployeeId = id;
    modalTitle.textContent = 'Edit Employee';

    const employee = employees.find(emp => emp.id === id);
    if (employee) {
        document.getElementById('name').value = employee.name;
        document.getElementById('email').value = employee.email;
        document.getElementById('role').value = employee.role;
        document.getElementById('department').value = employee.department;
        document.getElementById('salary').value = employee.salary;
        document.getElementById('date_joined').value = employee.date_joined;
    }

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    employeeForm.reset();
    isEditMode = false;
    currentEmployeeId = null;
}

// Form Handler
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(employeeForm);
    const employeeData = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        department: formData.get('department'),
        salary: parseFloat(formData.get('salary')),
        date_joined: formData.get('date_joined'),
    };

    if (isEditMode && currentEmployeeId) {
        updateEmployee(currentEmployeeId, employeeData);
    } else {
        createEmployee(employeeData);
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}

function showSuccess(message) {
    // Simple console log for now - could be enhanced with toast notifications
    console.log('✅ Success:', message);
}

function showError(message) {
    // Simple console log and alert for now - could be enhanced with toast notifications
    console.error('❌ Error:', message);
    alert(message);
}

// Make functions globally accessible for inline onclick handlers
window.openEditModal = openEditModal;
window.deleteEmployee = deleteEmployee;
