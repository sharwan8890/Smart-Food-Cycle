// Initialize data arrays
let foodData = JSON.parse(localStorage.getItem('foodData')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let requestData = JSON.parse(localStorage.getItem('requestData')) || [];

// DOM Elements - dashboard elements
const weeklyWaste = document.getElementById('weeklyWaste');
const moneyLost = document.getElementById('moneyLost');
const wasteReduction = document.getElementById('wasteReduction');
const peopleHelped = document.getElementById('peopleHelped');

// Authentication DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginNav = document.getElementById('loginNav');
const registerNav = document.getElementById('registerNav');
const userNav = document.getElementById('userNav');
const usernameSpan = document.getElementById('username');

// Food Donation DOM Elements
const foodForm = document.getElementById('foodForm');
const foodInventory = document.getElementById('foodInventory');
const totalFood = document.getElementById('totalFood');
const expiringSoon = document.getElementById('expiringSoon');
const freshFood = document.getElementById('freshFood');

// Request DOM Elements
const requestForm = document.getElementById('requestForm');
const requestsTable = document.getElementById('requestsTable');

// Constants
const AVERAGE_MEAL_WEIGHT = 0.5; // Average meal weight in kg
const MEALS_PER_PERSON = 3; // Average meals per person per day

// Event Listeners
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (registerForm) registerForm.addEventListener('submit', handleRegister);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (foodForm) foodForm.addEventListener('submit', handleFoodSubmission);
if (requestForm) requestForm.addEventListener('submit', handleRequestSubmission);

// Initialize the app
initializeApp();

// Functions
function initializeApp() {
    updateAuthUI();
    updateDashboard();
    updateFoodTracking();
    renderFoodInventory();
    renderRequestTable();
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;
    
    const user = users.find(u => u.email === email && u.password === password && u.role === role);
    
    if (user) {
        currentUser = {
            name: user.name,
            email: user.email,
            role: user.role
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthUI();
        
        // Close the modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) loginModal.hide();
        
        // Show success message
        alert(`Welcome back, ${user.name}!`);
    } else {
        alert('Invalid credentials. Please try again.');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
        alert('Email already registered. Please use a different email or login.');
        return;
    }
    
    // Add new user
    const newUser = {
        name,
        email,
        password,
        role
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Log in the new user
    currentUser = {
        name,
        email,
        role
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateAuthUI();
    
    // Close the modal
    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
    if (registerModal) registerModal.hide();
    
    // Show success message
    alert(`Welcome, ${name}! Your account has been created successfully.`);
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    alert('You have been logged out successfully.');
}

function updateAuthUI() {
    if (currentUser) {
        if (loginNav) loginNav.classList.add('d-none');
        if (registerNav) registerNav.classList.add('d-none');
        if (userNav) {
            userNav.classList.remove('d-none');
            usernameSpan.textContent = currentUser.name;
        }
    } else {
        if (loginNav) loginNav.classList.remove('d-none');
        if (registerNav) registerNav.classList.remove('d-none');
        if (userNav) userNav.classList.add('d-none');
    }
}

// Food Donation Functions
function handleFoodSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to donate food items.');
        return;
    }
    
    const foodName = document.getElementById('foodName').value;
    const category = document.getElementById('foodCategory').value;
    const quantity = parseFloat(document.getElementById('foodQuantity').value);
    const expiryDate = document.getElementById('expiryDate').value;
    const location = document.getElementById('foodLocation').value;
    const additionalInfo = document.getElementById('additionalInfo')?.value || '';
    const addedDate = new Date().toISOString().split('T')[0];
    
    const foodItem = {
        id: Date.now(),
        name: foodName,
        category,
        quantity,
        expiryDate,
        location,
        additionalInfo,
        addedDate,
        donor: currentUser.name,
        donorEmail: currentUser.email,
        status: 'available'
    };
    
    foodData.push(foodItem);
    saveFoodData();
    
    // Reset form
    foodForm.reset();
    
    // Update UI
    updateFoodTracking();
    renderFoodInventory();
    updateDashboard();
    
    alert('Thank you! Your food donation has been added successfully.');
}

function updateFoodTracking() {
    if (!totalFood || !expiringSoon || !freshFood) return;
    
    const totalQuantity = foodData.reduce((total, item) => total + item.quantity, 0);
    totalFood.textContent = `${totalQuantity.toFixed(1)} kg`;
    
    // Calculate expiring soon (3 days)
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const expiringSoonQuantity = foodData
        .filter(item => {
            const expiryDate = new Date(item.expiryDate);
            return expiryDate <= threeDaysFromNow && expiryDate >= today;
        })
        .reduce((total, item) => total + item.quantity, 0);
    
    expiringSoon.textContent = `${expiringSoonQuantity.toFixed(1)} kg`;
    
    // Calculate fresh food (more than 3 days)
    const freshFoodQuantity = foodData
        .filter(item => {
            const expiryDate = new Date(item.expiryDate);
            return expiryDate > threeDaysFromNow;
        })
        .reduce((total, item) => total + item.quantity, 0);
    
    freshFood.textContent = `${freshFoodQuantity.toFixed(1)} kg`;
    
    // Update progress bars
    if (totalQuantity > 0) {
        document.querySelector('.progress-bar.bg-warning').style.width = `${(expiringSoonQuantity / totalQuantity) * 100}%`;
        document.querySelector('.progress-bar.bg-info').style.width = `${(freshFoodQuantity / totalQuantity) * 100}%`;
        document.querySelector('.progress-bar.bg-success').style.width = `100%`;
    } else {
        document.querySelector('.progress-bar.bg-warning').style.width = '0%';
        document.querySelector('.progress-bar.bg-info').style.width = '0%';
        document.querySelector('.progress-bar.bg-success').style.width = '0%';
    }
    
    // Calculate people helped
    const mealsProvided = totalQuantity / AVERAGE_MEAL_WEIGHT;
    const peopleHelpedCount = Math.floor(mealsProvided / MEALS_PER_PERSON);
    
    if (peopleHelped) peopleHelped.textContent = peopleHelpedCount;
}

function renderFoodInventory() {
    if (!foodInventory) return;
    
    foodInventory.innerHTML = '';
    
    const today = new Date();
    
    foodData.forEach((item, index) => {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let freshness;
        let freshnessClass;
        
        if (daysUntilExpiry < 0) {
            freshness = 'Expired';
            freshnessClass = 'text-danger';
        } else if (daysUntilExpiry <= 3) {
            freshness = `Urgent (${daysUntilExpiry} days left)`;
            freshnessClass = 'text-warning';
        } else {
            freshness = `Fresh (${daysUntilExpiry} days left)`;
            freshnessClass = 'text-success';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} kg</td>
            <td>${item.expiryDate}</td>
            <td class="${freshnessClass}">${freshness}</td>
            <td>${item.location}</td>
            <td>${item.donor}</td>
            <td>
                <button class="btn btn-primary btn-sm me-1" data-id="${item.id}" onclick="window.claimFoodItem(this.getAttribute('data-id'))">
                    <i class="fas fa-hand-holding"></i> Claim
                </button>
                ${currentUser && (currentUser.email === item.donorEmail) ? 
                    `<button class="btn btn-danger btn-sm" data-index="${index}" onclick="window.deleteFoodItem(this.getAttribute('data-index'))">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
            </td>
        `;
        foodInventory.appendChild(row);
    });
}

// Request Functions
function handleRequestSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to submit food requests.');
        return;
    }
    
    if (currentUser.role !== 'recipient') {
        alert('Only recipients can submit food requests.');
        return;
    }
    
    const requestItem = document.getElementById('requestItem').value;
    const requestQuantity = parseFloat(document.getElementById('requestQuantity').value);
    const requestLocation = document.getElementById('requestLocation').value;
    const requestDate = new Date().toISOString().split('T')[0];
    
    const request = {
        id: Date.now(),
        item: requestItem,
        quantity: requestQuantity,
        location: requestLocation,
        date: requestDate,
        status: 'pending',
        requesterName: currentUser.name,
        requesterEmail: currentUser.email
    };
    
    requestData.push(request);
    saveRequestData();
    
    // Reset form
    requestForm.reset();
    
    // Update UI
    renderRequestTable();
    
    alert('Your food request has been submitted successfully.');
}

function renderRequestTable() {
    if (!requestsTable) return;
    
    requestsTable.innerHTML = '';
    
    requestData.forEach((request, index) => {
        const row = document.createElement('tr');
        
        let statusBadge;
        switch(request.status) {
            case 'pending':
                statusBadge = '<span class="badge bg-warning">Pending</span>';
                break;
            case 'fulfilled':
                statusBadge = '<span class="badge bg-success">Fulfilled</span>';
                break;
            case 'cancelled':
                statusBadge = '<span class="badge bg-danger">Cancelled</span>';
                break;
            default:
                statusBadge = '<span class="badge bg-secondary">Unknown</span>';
        }
        
        row.innerHTML = `
            <td>${request.requesterName}</td>
            <td>${request.item}</td>
            <td>${request.quantity} kg</td>
            <td>${request.location}</td>
            <td>${request.date}</td>
            <td>${statusBadge}</td>
            <td>
                ${request.status === 'pending' && currentUser && currentUser.role === 'donor' ? 
                    `<button class="btn btn-success btn-sm me-1" data-id="${request.id}" onclick="window.fulfillRequest(this.getAttribute('data-id'))">
                        <i class="fas fa-check"></i> Fulfill
                    </button>` : ''}
                ${currentUser && (currentUser.email === request.requesterEmail) && request.status === 'pending' ? 
                    `<button class="btn btn-danger btn-sm" data-index="${index}" onclick="window.cancelRequest(this.getAttribute('data-index'))">
                        <i class="fas fa-times"></i> Cancel
                    </button>` : ''}
            </td>
        `;
        requestsTable.appendChild(row);
    });
}

function saveRequestData() {
    localStorage.setItem('requestData', JSON.stringify(requestData));
}

// Make request functions available globally for HTML buttons
window.fulfillRequest = function(id) {
    const requestIndex = requestData.findIndex(r => r.id === parseInt(id));
    if (requestIndex === -1) return;
    
    if (!currentUser || currentUser.role !== 'donor') {
        alert('Only donors can fulfill requests.');
        return;
    }
    
    if (confirm('Are you sure you want to fulfill this request?')) {
        requestData[requestIndex].status = 'fulfilled';
        requestData[requestIndex].fulfilledBy = currentUser.name;
        requestData[requestIndex].fulfilledEmail = currentUser.email;
        requestData[requestIndex].fulfilledDate = new Date().toISOString().split('T')[0];
        
        saveRequestData();
        renderRequestTable();
        
        alert('Thank you for fulfilling this request!');
    }
};

window.cancelRequest = function(index) {
    if (!currentUser) return;
    
    const request = requestData[parseInt(index)];
    
    if (request.requesterEmail !== currentUser.email) {
        alert('You can only cancel your own requests.');
        return;
    }
    
    if (confirm('Are you sure you want to cancel this request?')) {
        requestData[parseInt(index)].status = 'cancelled';
        saveRequestData();
        renderRequestTable();
    }
};

// Make food functions available globally for HTML buttons
window.deleteFoodItem = function(index) {
    deleteFood(parseInt(index));
};

window.claimFoodItem = function(id) {
    claimFood(parseInt(id));
};

function deleteFood(index) {
    if (!currentUser) {
        alert('Please login to perform this action.');
        return;
    }
    
    const item = foodData[index];
    
    // Check if current user is the donor
    if (item.donorEmail !== currentUser.email) {
        alert('You can only delete food items that you added.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
        foodData.splice(index, 1);
        saveFoodData();
        updateFoodTracking();
        renderFoodInventory();
        updateDashboard();
    }
}

function claimFood(id) {
    if (!currentUser) {
        alert('Please login as a recipient to claim food.');
        return;
    }
    
    if (currentUser.role !== 'recipient') {
        alert('Only recipients can claim food.');
        return;
    }
    
    const itemIndex = foodData.findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    const item = foodData[itemIndex];
    
    // Prompt for quantity to claim
    const claimedQuantity = prompt(`How much of ${item.name} would you like to claim (kg)? Available: ${item.quantity} kg`);
    const quantity = parseFloat(claimedQuantity);
    
    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }
    
    if (quantity > item.quantity) {
        alert(`Cannot claim more than available quantity (${item.quantity} kg).`);
        return;
    }
    
    // Update food item quantity
    if (quantity === item.quantity) {
        // Remove the item if all quantity is claimed
        foodData.splice(itemIndex, 1);
    } else {
        // Reduce the quantity
        foodData[itemIndex].quantity -= quantity;
    }
    
    saveFoodData();
    updateFoodTracking();
    renderFoodInventory();
    updateDashboard();
    
    alert(`Successfully claimed ${quantity} kg of ${item.name}. Thank you for reducing food waste!`);
}

function saveFoodData() {
    localStorage.setItem('foodData', JSON.stringify(foodData));
}

// Dashboard update
function updateDashboard() {
    if (!weeklyWaste || !moneyLost || !wasteReduction) return;
    
    // Calculate weekly donations
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const weeklyDonations = foodData
        .filter(item => new Date(item.addedDate) >= oneWeekAgo)
        .reduce((total, item) => total + item.quantity, 0);
    
    weeklyWaste.textContent = `${weeklyDonations.toFixed(1)} kg`;
    
    // Calculate meals provided
    const totalMeals = Math.floor(foodData.reduce((total, item) => total + item.quantity, 0) / AVERAGE_MEAL_WEIGHT);
    moneyLost.textContent = totalMeals;
    
    // Calculate people fed
    const peopleFed = Math.floor(totalMeals / MEALS_PER_PERSON);
    wasteReduction.textContent = peopleFed;
}

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
}); 