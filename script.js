// Wait for DOM to load fully
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. COUNTDOWN TIMER ---
    const targetDate = new Date("September 10, 2026 20:00:00").getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        if (difference < 0) {
            // Event has started or passed
            document.getElementById("days").innerText = "00";
            document.getElementById("hours").innerText = "00";
            document.getElementById("minutes").innerText = "00";
            document.getElementById("seconds").innerText = "00";
            return;
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // Add leading zero if needed
        document.getElementById("days").innerText = String(days).padStart(2, '0');
        document.getElementById("hours").innerText = String(hours).padStart(2, '0');
        document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
        document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // --- 2. BACKGROUND MUSIC CONTROLLER ---
    const bgMusic = document.getElementById("bgMusic");
    const audioToggleBtn = document.getElementById("audioToggleBtn");
    let isPlaying = false;

    // Set lower default volume so it is pleasant
    bgMusic.volume = 0.4;

    function toggleMusic() {
        if (isPlaying) {
            bgMusic.pause();
            audioToggleBtn.classList.remove("playing");
        } else {
            bgMusic.play().then(() => {
                audioToggleBtn.classList.add("playing");
            }).catch(error => {
                console.log("Autoplay was prevented by browser security rules:", error);
            });
        }
        isPlaying = !isPlaying;
    }

    audioToggleBtn.addEventListener("click", toggleMusic);

    // Modern browsers prevent autoplay without interaction.
    // Try to play music on the first user interaction anywhere on the page, then remove the listener.
    const autoPlayOnInteraction = () => {
        if (!isPlaying) {
            bgMusic.play().then(() => {
                audioToggleBtn.classList.add("playing");
                isPlaying = true;
            }).catch(() => {
                // If it fails, we keep the listener or let the user click the button
            });
        }
        document.removeEventListener("click", autoPlayOnInteraction);
        document.removeEventListener("touchstart", autoPlayOnInteraction);
    };

    document.addEventListener("click", autoPlayOnInteraction);
    document.addEventListener("touchstart", autoPlayOnInteraction);

    // --- 3. SCROLL REVEAL EFFECT ---
    const scrollElements = document.querySelectorAll(".animate-scroll");
    
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend);
    };
    
    const displayScrollElement = (element) => {
        element.classList.add("active");
    };
    
    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.15)) {
                displayScrollElement(el);
            }
        });
    };
    
    window.addEventListener("scroll", handleScrollAnimation);
    // Initial check on load
    setTimeout(handleScrollAnimation, 300);

    // Smooth scroll for anchor tags
    document.querySelectorAll(".scroll-to").forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // --- 4. RSVP & LOCALSTORAGE GUESTBOOK LOGIC ---
    const rsvpForm = document.getElementById("rsvpForm");
    const guestsCountGroup = document.getElementById("guestsCountGroup");
    const attendanceStatus = document.getElementById("attendanceStatus");
    const formSuccessMessage = document.getElementById("formSuccessMessage");
    const wishesList = document.getElementById("wishesList");

    // Dynamic adjustment of guest count field: hide it if person declines
    attendanceStatus.addEventListener("change", () => {
        if (attendanceStatus.value === "no") {
            guestsCountGroup.style.display = "none";
        } else {
            guestsCountGroup.style.display = "flex";
        }
    });

    // Dummy messages to display initially if guestbook is empty
    const dummyWishes = [
        { name: "أحمد وعائلته", text: "ألف مليون مبروك للعروسين الجمال احمد ومنة! بارك الله لكما وبارك عليكما وجمع بينكما في خير.", date: "منذ ساعتين" },
        { name: "أميرة محمد", text: "يا رب يسعد قلوبكم ويجعل أيامكم كلها حب وهنا وفرحة. مبارك الزواج السعيد!", date: "منذ 5 ساعات" },
        { name: "خال العريس", text: "أتم الله فرحتكم على خير يا احمد يا بطل وسعدنا بمنة ابنةً كريمة لعائلتنا.", date: "منذ يوم" }
    ];

    // Load wishes from LocalStorage or dummy list
    function loadGuestbook() {
        let wishes = JSON.parse(localStorage.getItem("weddingWishes")) || [];
        
        if (wishes.length === 0) {
            // Save dummy wishes first time
            localStorage.setItem("weddingWishes", JSON.stringify(dummyWishes));
            wishes = dummyWishes;
        }

        renderWishes(wishes);
    }

    function renderWishes(wishes) {
        wishesList.innerHTML = "";
        
        // Reverse array so new ones appear at the top
        const reversedWishes = [...wishes].reverse();
        
        reversedWishes.forEach(wish => {
            const card = document.createElement("div");
            card.className = "wish-card";
            card.innerHTML = `
                <div class="wish-header">
                    <span class="wish-author">${escapeHTML(wish.name)}</span>
                    <span class="wish-time">${wish.date}</span>
                </div>
                <p class="wish-text">${escapeHTML(wish.text)}</p>
            `;
            wishesList.appendChild(card);
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Handle Form Submission
    rsvpForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const guestName = document.getElementById("guestName").value.trim();
        const status = attendanceStatus.value;
        const guests = status === "yes" ? document.getElementById("guestsCount").value : "0";
        const message = document.getElementById("guestMessage").value.trim();

        // 1. Save RSVP Response
        const rsvpResponse = {
            name: guestName,
            status: status,
            guestsCount: guests,
            message: message,
            timestamp: new Date().toISOString()
        };

        // In a real application, you would send this to a backend API.
        // For this local app, we save RSVPs to a separate key
        let rsvps = JSON.parse(localStorage.getItem("weddingRSVPs")) || [];
        rsvps.push(rsvpResponse);
        localStorage.setItem("weddingRSVPs", JSON.stringify(rsvps));

        // 2. If a message is provided, save it to the guestbook wishes
        if (message) {
            let wishes = JSON.parse(localStorage.getItem("weddingWishes")) || [];
            wishes.push({
                name: guestName,
                text: message,
                date: "الآن"
            });
            localStorage.setItem("weddingWishes", JSON.stringify(wishes));
            renderWishes(wishes);
        }

        // 3. UI update: hide form, show success
        rsvpForm.style.display = "none";
        formSuccessMessage.style.display = "block";
        formSuccessMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Initialize Guestbook
    loadGuestbook();

    // --- 5. FALLING LEAVES & GOLD FLOWER PETALS CANVAS ---
    const canvas = document.getElementById("petalsCanvas");
    const ctx = canvas.getContext("2d");

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const numPetals = 25;
    const petals = [];

    // Colors: vintage reds and golden leaves
    const colors = [
        "rgba(123, 30, 40, 0.7)",  // Burgundy petal
        "rgba(173, 59, 72, 0.6)",  // Lighter red
        "rgba(189, 155, 83, 0.8)",  // Antique Gold
        "rgba(236, 220, 185, 0.6)"  // Light gold petal
    ];

    class Petal {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.size = Math.random() * 8 + 6;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.speedX = Math.random() * 1.5 - 0.75;
            this.speedY = Math.random() * 1.2 + 0.8;
            this.spinSpeed = Math.random() * 0.02 + 0.01;
            this.angle = Math.random() * Math.PI * 2;
            this.swaying = Math.random() * 0.05 + 0.01;
            this.swayCount = Math.random() * 100;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.swayCount) * 0.3;
            this.angle += this.spinSpeed;
            this.swayCount += this.swaying;

            // Reset if falls off screen
            if (this.y > height + 20) {
                this.y = -20;
                this.x = Math.random() * width;
                this.speedY = Math.random() * 1.2 + 0.8;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            
            // Draw a petal shape (almond or leaf shape)
            ctx.moveTo(0, -this.size);
            ctx.quadraticCurveTo(this.size * 0.8, -this.size * 0.2, 0, this.size);
            ctx.quadraticCurveTo(-this.size * 0.8, -this.size * 0.2, 0, -this.size);
            
            ctx.fill();
            ctx.restore();
        }
    }

    // Populate petals
    for (let i = 0; i < numPetals; i++) {
        petals.push(new Petal());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        petals.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    // Start particle falling animation
    animate();
});
