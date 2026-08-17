'use strict';

const searchInput = document.querySelector("#service-search");
const cards = document.querySelectorAll(".card-item");
const headerBookingBtn = document.getElementById("header-booking-btn");

// 1. Navigation & Mobile Menu Logic
const navbar = document.querySelector("[data-navbar]");
const navToggler = document.querySelector("[data-nav-toggler]");

navToggler?.addEventListener("click", function () {
  navbar.classList.toggle("active");
  this.classList.toggle("active");
});

document.querySelectorAll("#header-back-btn, #header-logo").forEach(el => {
    el?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "./index.html";
    });
});

// 2. Search Logic
searchInput?.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();
    cards.forEach(card => {
        card.classList.remove("highlight");
        if (val && card.dataset.service.toLowerCase().includes(val)) {
            card.classList.add("highlight");
        }
    });
});

// 3. Selection Toggle & Local Storage Memory
let selectedServices = JSON.parse(localStorage.getItem('safetay_cart')) || [];
let selectedCount = selectedServices.length;

function updateHeaderCart() {
    const cartCountBadge = document.getElementById("cart-count");
    if (cartCountBadge) {
        cartCountBadge.innerText = selectedCount;
        cartCountBadge.classList.add("pop");
        setTimeout(() => cartCountBadge.classList.remove("pop"), 200);
    }

    // Pulse effect (Fixed to trigger exactly ONCE per addition or page load)
    if (headerBookingBtn) {
        if (selectedCount > 0) {
            headerBookingBtn.classList.remove("ready-to-click");
            void headerBookingBtn.offsetWidth; // This forces the browser to restart the animation
            headerBookingBtn.classList.add("ready-to-click");
        } else {
            headerBookingBtn.classList.remove("ready-to-click");
        }
    }
}

// 4. Card Button Click Logic (Restricted to Buttons Only)
cards.forEach(card => {
    const serviceName = card.dataset.service;
    const addBtn = card.querySelector(".add-btn:not(.config-btn)");
    
    // NEW FIX: Check memory for base name OR configured versions (e.g., "Brakes" OR "Brakes: Front Axle")
    const isSelected = selectedServices.some(s => s === serviceName || s.startsWith(serviceName + ":"));
    
    if (isSelected) {
        card.classList.add("selected");
        const anyBtn = card.querySelector(".add-btn"); 
        if (anyBtn) {
            anyBtn.innerHTML = anyBtn.classList.contains("config-btn") ? "✓ CONFIGURED" : "✓ ADDED";
        }
    }

    // ONLY listen for clicks on the standard Add button
    if (addBtn) {
        addBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            e.preventDefault();

            card.classList.toggle("selected");
            
            if (card.classList.contains("selected")) {
                addBtn.innerHTML = "✓ ADDED";
                if (!selectedServices.includes(serviceName)) {
                    selectedServices.push(serviceName); 
                }
            } else {
                addBtn.innerHTML = "+ ADD";
                selectedServices = selectedServices.filter(s => s !== serviceName); 
            }

            selectedCount = selectedServices.length;
            localStorage.setItem('safetay_cart', JSON.stringify(selectedServices));
            updateHeaderCart();
        });
    }
});

// 5. Header Booking Button Click (Always go to Quote Page)
headerBookingBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "./quote.html"; 
});

// Clean URLs
window.addEventListener("load", () => {
  if (window.location.hash) {
    setTimeout(() => { history.replaceState(null, null, window.location.pathname); }, 10);
  }
});

// 6. Stop links from triggering the card selection
document.querySelectorAll('.card-details-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation(); 
    });
});

// 7. SMART MODAL LOGIC
const modal = document.getElementById("config-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalSubmitBtn = document.getElementById("modal-submit-btn");

// Find any button with the 'config-btn' class
document.querySelectorAll(".config-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        e.preventDefault();
        
        const card = btn.closest(".card-item");
        const serviceName = card.dataset.service;

        // If it is already selected on the main grid, REMOVE it!
        if (card.classList.contains("selected")) {
            card.classList.remove("selected");
            btn.innerHTML = "ADD & CONFIGURE"; 
            
            selectedServices = selectedServices.filter(s => s !== serviceName && !s.startsWith(serviceName + ":"));
            selectedCount = selectedServices.length;
            localStorage.setItem('safetay_cart', JSON.stringify(selectedServices));
            updateHeaderCart();
        } else {
            modal.classList.add("active"); 
        }
    });
});

// Close Modal Logic
closeModalBtn?.addEventListener("click", () => modal.classList.remove("active"));
modal?.addEventListener("click", (e) => {
    if(e.target === modal) modal.classList.remove("active"); 
});

// --- NEW FIX: DOUBLE CLICK TO QUICK-ADD ---
document.querySelectorAll('.option-pill').forEach(pill => {
    pill.addEventListener('dblclick', (e) => {
        // Find the hidden radio button behind this pill
        const radio = pill.previousElementSibling;
        
        // Force it to be checked
        radio.checked = true;
        
        // Magically click the Submit button for the user!
        modalSubmitBtn?.click();
    });
});

// Submit from Modal
modalSubmitBtn?.addEventListener("click", () => {
    // Safety Check: If they deselected everything, don't try to add nothing!
    const checkedRadio = document.querySelector('input[name="brake_option"]:checked');
    if (!checkedRadio) return; 

    const selectedOption = checkedRadio.value;
    
    if (!selectedServices.includes(selectedOption)) {
        selectedServices.push(selectedOption);
        localStorage.setItem('safetay_cart', JSON.stringify(selectedServices));
        selectedCount = selectedServices.length;
        updateHeaderCart();
    }

    const brakesCard = document.querySelector('[data-service="Brakes"]');
    if (brakesCard) {
        brakesCard.classList.add("selected");
        const baseBtn = brakesCard.querySelector(".add-btn");
        if (baseBtn) baseBtn.innerHTML = "✓ CONFIGURED";
    }

    modal.classList.remove("active");
});

// 8. CATEGORY FILTER LOGIC
const filterBtns = document.querySelectorAll('.filter-btn');
const filterItems = document.querySelectorAll('.filter-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Stop it from re-loading if they click the button they are already on
        if (btn.classList.contains('active')) return;

        // 1. Swap button colors
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. Get the category we want to show
        const filterValue = btn.dataset.filter;

        // 3. THE STAGGERED CASCADE
        let visibleIndex = 0; 

        filterItems.forEach(item => {
            // Cancel any old cleanup timers if the user clicks really fast
            clearTimeout(item.dataset.cleanupTimer);

            if (filterValue === 'all' || item.classList.contains(filterValue)) {
                // Unhide the card
                item.classList.remove('hide');
                
                // Reset the animation completely
                item.style.animation = 'none';
                void item.offsetWidth; 
                
                // Apply the pop-up animation with the staggered delay
                item.style.animation = `staggerPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both`;
                item.style.animationDelay = `${visibleIndex * 0.05}s`; 
                
                // THE FIX: Clean up the animation after it finishes (400ms duration + delay)
                // This removes the "Ghost Animation" landmine!
                const cleanupTime = 400 + (visibleIndex * 50);
                item.dataset.cleanupTimer = setTimeout(() => {
                    item.style.animation = '';
                    item.style.animationDelay = '';
                }, cleanupTime + 50); // Added a tiny 50ms buffer for safety

                visibleIndex++; 
            } else {
                // Hide cards that don't match and wipe their animations
                item.classList.add('hide');
                item.style.animation = ''; 
                item.style.animationDelay = '';
            }
        });
    });
});

// Run immediately on load to update the badge and trigger the 1-time pulse
updateHeaderCart();
