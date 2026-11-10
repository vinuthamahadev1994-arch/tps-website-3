/* ==========================================================================
   Total Procurement Solutions (TPS) - Main JS
   Tasteful 3D Effects, 1.5s Preloader, Interactive Telematics & Responsive Helpers
   ========================================================================== */

// 1. Preloader Handler - Display for exactly 1.5 seconds (1.5s)
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        var preloader = document.getElementById("tpsPreloader");
        if (preloader) {
            preloader.classList.add("loaded");
            setTimeout(function () {
                preloader.style.display = "none";
            }, 350); // Smooth 0.35s dissolve after 1.5s display
        }
    }, 1500); // 1500ms = exactly 1.5s
});

document.addEventListener("DOMContentLoaded", function () {
    // 2. Dynamic Year Update
    var yrElem = document.getElementById("yr");
    if (yrElem) {
        yrElem.textContent = new Date().getFullYear();
    }

    // 3. Sticky Navbar Shadow on Scroll across all devices
    var nav = document.querySelector(".navbar");
    if (nav) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 30) {
                nav.classList.add("navbar-scrolled");
            } else {
                nav.classList.remove("navbar-scrolled");
            }
        }, { passive: true });
    }

    // 4. Back-to-Top Button Handler
    var backToTopBtn = document.getElementById("backToTop");
    if (backToTopBtn) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add("show");
            } else {
                backToTopBtn.classList.remove("show");
            }
        }, { passive: true });

        backToTopBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // 5. Stats Counter Animation
    var statNumbers = document.querySelectorAll("[data-counter]");
    if (statNumbers.length > 0 && "IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseInt(el.getAttribute("data-counter"), 10);
                    var duration = 1200;
                    var stepTime = 20;
                    var steps = duration / stepTime;
                    var increment = target / steps;
                    var current = 0;

                    var timer = setInterval(function () {
                        current += increment;
                        if (current >= target) {
                            el.textContent = target;
                            clearInterval(timer);
                        } else {
                            el.textContent = Math.floor(current);
                        }
                    }, stepTime);

                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.4 });

        statNumbers.forEach(function (el) {
            observer.observe(el);
        });
    }

    // 6. Gallery Filtering
    var filterBtns = document.querySelectorAll(".filter-btn");
    var galleryCards = document.querySelectorAll(".gallery-item-card");

    if (filterBtns.length > 0 && galleryCards.length > 0) {
        filterBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                filterBtns.forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");

                var filterValue = btn.getAttribute("data-filter");
                galleryCards.forEach(function (card) {
                    if (filterValue === "all" || card.classList.contains(filterValue)) {
                        card.style.display = "block";
                    } else {
                        card.style.display = "none";
                    }
                });
            });
        });
    }

    // 7. Image Lightbox for Truck Photos
    var lightboxModal = document.getElementById("truckLightboxModal");
    if (lightboxModal) {
        var modalImg = document.getElementById("lightboxImage");
        var modalCaption = document.getElementById("lightboxCaption");

        var triggers = document.querySelectorAll(".open-lightbox");
        triggers.forEach(function (trig) {
            trig.addEventListener("click", function (e) {
                e.preventDefault();
                var fullSrc = trig.getAttribute("data-img-src") || trig.querySelector("img").getAttribute("src");
                var caption = trig.getAttribute("data-caption") || trig.querySelector("img").getAttribute("alt") || "TPS Cold Chain Truck";
                if (modalImg) modalImg.src = fullSrc;
                if (modalCaption) modalCaption.textContent = caption;
                
                var bsModal = new bootstrap.Modal(lightboxModal);
                bsModal.show();
            });
        });
    }

    // 8. Tasteful 3D Perspective Tilt on Interactive Cards
    init3DTilt();

    // 9. Interactive 3D Cold-Chain Simulator
    initReeferSimulator();
});

// Tasteful 3D Tilt Effect on interactive cards (Desktop + Responsive Mobile)
function init3DTilt() {
    var tiltCards = document.querySelectorAll(".card-s, .truck-card, .why-partner-card, .reefer-3d-card, .truck-3d-viewport-card");
    if (!tiltCards.length) return;

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        tiltCards.forEach(function (card) {
            card.addEventListener("mousemove", function (e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var centerX = rect.width / 2;
                var centerY = rect.height / 2;
                var rotateX = ((y - centerY) / centerY) * -7;
                var rotateY = ((x - centerX) / centerX) * 7;
                card.style.transform = "perspective(1000px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) translateY(-6px) translateZ(10px)";
            });
            card.addEventListener("mouseleave", function () {
                card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0)";
            });
        });
    } else {
        // Touch devices & responsive mobile 3D interaction
        tiltCards.forEach(function (card) {
            card.addEventListener("touchstart", function (e) {
                if (e.touches.length === 1) {
                    var touch = e.touches[0];
                    var rect = card.getBoundingClientRect();
                    var x = touch.clientX - rect.left;
                    var y = touch.clientY - rect.top;
                    var centerX = rect.width / 2;
                    var centerY = rect.height / 2;
                    var rotateX = ((y - centerY) / centerY) * -5;
                    var rotateY = ((x - centerX) / centerX) * 5;
                    card.style.transform = "perspective(800px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) translateY(-5px) translateZ(8px)";
                }
            }, { passive: true });

            card.addEventListener("touchmove", function (e) {
                if (e.touches.length === 1) {
                    var touch = e.touches[0];
                    var rect = card.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        var x = touch.clientX - rect.left;
                        var y = touch.clientY - rect.top;
                        var centerX = rect.width / 2;
                        var centerY = rect.height / 2;
                        var rotateX = ((y - centerY) / centerY) * -5;
                        var rotateY = ((x - centerX) / centerX) * 5;
                        card.style.transform = "perspective(800px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) translateY(-5px) translateZ(8px)";
                    }
                }
            }, { passive: true });

            card.addEventListener("touchend", function () {
                setTimeout(function () {
                    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0)";
                }, 350);
            }, { passive: true });
        });
    }
}

// Interactive Cold-Chain Simulator Mode Switcher
function initReeferSimulator() {
    var modeButtons = document.querySelectorAll(".reefer-mode-btn");
    var tempDisplay = document.getElementById("reeferTempDisplay");
    var cargoDisplay = document.getElementById("reeferCargoDisplay");
    var statusDisplay = document.getElementById("reeferStatusDisplay");
    var rangeDisplay = document.getElementById("reeferRangeDisplay");
    var vaporElem = document.getElementById("reeferVapor");
    var vaporTempStatus = document.getElementById("vaporTempStatus");

    if (!modeButtons.length) return;

    var modes = {
        meat: { temp: "-18°C", cargo: "Frozen Meat & Poultry", status: "Sub-Zero Deep Chill Active", range: "-18°C to -22°C", color: "#00d2ff" },
        pharma: { temp: "+4°C", cargo: "Medicines & Vaccines", status: "GDP Regulated Active Chill", range: "+2°C to +8°C", color: "#20e3b2" },
        icecream: { temp: "-25°C", cargo: "Ice Cream & Frozen Desserts", status: "Ultra-Low Cryo Freeze Active", range: "-25°C to -20°C", color: "#a5e8ff" },
        confectionery: { temp: "+15°C", cargo: "Chocolates & Pastries", status: "Climate Stabilized Airflow", range: "+14°C to +18°C", color: "#4cb814" }
    };

    modeButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            modeButtons.forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");
            var key = btn.getAttribute("data-mode");
            var data = modes[key] || modes.meat;
            if (tempDisplay) tempDisplay.textContent = data.temp;
            if (cargoDisplay) cargoDisplay.textContent = data.cargo;
            if (statusDisplay) statusDisplay.textContent = data.status;
            if (rangeDisplay) rangeDisplay.textContent = data.range;
            if (vaporTempStatus) vaporTempStatus.textContent = data.temp + " Active";

            if (vaporElem) {
                vaporElem.classList.remove("vapor-animate");
                void vaporElem.offsetWidth;
                vaporElem.classList.add("vapor-animate");
            }

            // Sync with 3D Truck Model in tps-3D-section
            window.dispatchEvent(new CustomEvent("tpsReeferModeChange", { detail: { mode: key, data: data } }));
        });
    });
}

// Global Enquiry Form Handler
function tpsEnquiry(e) {
    e.preventDefault();
    var msg = document.getElementById("enqMsg");
    if (msg) {
        msg.className = "alert alert-success mt-3 small mb-0";
        msg.innerHTML = "<i class='fa-solid fa-circle-check me-1'></i> Thank you! Your freight enquiry has been received. Our Bangalore logistics desk will contact you within 15 minutes.";
    }
    
    // Also look for page-specific enquiry alerts
    var pageMsg = document.getElementById("contactEnqMsg");
    if (pageMsg) {
        pageMsg.className = "alert alert-success mt-3 small mb-0";
        pageMsg.innerHTML = "<i class='fa-solid fa-circle-check me-1'></i> Thank you! Your freight enquiry has been received. We will call you shortly.";
    }

    try {
        e.target.reset();
    } catch (err) {}
    return false;
}
