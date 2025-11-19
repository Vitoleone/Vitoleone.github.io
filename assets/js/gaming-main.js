// ===== LOAD NAVBAR =====
document.addEventListener('DOMContentLoaded', () => {
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            const navbarPlaceholder = document.getElementById('navbar-placeholder');
            if (navbarPlaceholder) {
                navbarPlaceholder.innerHTML = data;
                // Initialize navbar functionality after loading
                initializeNavbar();
            }
        })
        .catch(error => console.error('Error loading navbar:', error));
});

function initializeNavbar() {
    // ===== NAVBAR SCROLL EFFECT WITH THROTTLING =====
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');

    let ticking = false;

    function updateNavbar() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active link based on scroll position
        let current = '';
        const sections = document.querySelectorAll('section[id]');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    }, { passive: true });

    // ===== MOBILE MENU TOGGLE =====
    const hamburger = document.querySelector('.hamburger');
    const navLinksContainer = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinksContainer.contains(e.target)) {
            navLinksContainer.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
}

// ===== PARTICLE.JS CONFIGURATION (OPTIMIZED) =====
const particleCount = window.innerWidth < 768 ? 15 : 25;

particlesJS('particles-js', {
    particles: {
        number: {
            value: particleCount,
            density: {
                enable: true,
                value_area: 1000
            }
        },
        color: {
            value: ['#00ff88', '#00d9ff', '#ff0080']
        },
        shape: {
            type: 'circle'
        },
        opacity: {
            value: 0.4,
            random: true,
            anim: {
                enable: false
            }
        },
        size: {
            value: 3,
            random: true,
            anim: {
                enable: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: '#00ff88',
            opacity: 0.2,
            width: 1
        },
        move: {
            enable: true,
            speed: 1.5,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
        }
    },
    interactivity: {
        detect_on: 'canvas',
        events: {
            onhover: {
                enable: window.innerWidth > 768,
                mode: 'grab'
            },
            onclick: {
                enable: false
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 120,
                line_linked: {
                    opacity: 0.4
                }
            }
        }
    },
    retina_detect: true
});

// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== PROJECT CARDS ANIMATION =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all project cards
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe contact cards
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
});

// ===== GLITCH EFFECT ON HOVER =====
const glitchTitle = document.querySelector('.glitch');
if (glitchTitle) {
    glitchTitle.addEventListener('mouseenter', () => {
        glitchTitle.style.animation = 'glitch 0.3s infinite';
    });

    glitchTitle.addEventListener('mouseleave', () => {
        glitchTitle.style.animation = 'glitch 5s infinite';
    });
}

// ===== NEON PINK LINE CURSOR TRAIL =====
const canvas = document.createElement('canvas');
canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9998;
`;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let isMoving = false;
let movementTimer;
const trailPositions = [];
const maxTrailLength = 40;
let trailOpacity = 1;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Detect movement
    if (Math.abs(mouseX - lastMouseX) > 1 || Math.abs(mouseY - lastMouseY) > 1) {
        isMoving = true;
        trailOpacity = 1;
        trailPositions.push({ x: mouseX, y: mouseY });

        if (trailPositions.length > maxTrailLength) {
            trailPositions.shift();
        }

        clearTimeout(movementTimer);

        // Start fade out after stop
        movementTimer = setTimeout(() => {
            isMoving = false;
        }, 150);
    }

    lastMouseX = mouseX;
    lastMouseY = mouseY;
});

window.addEventListener('mouseleave', () => {
    isMoving = false;
});

function animateCursorTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fade out when not moving (0.2 seconds = 200ms, at 60fps that's 12 frames, 1/12 ≈ 0.083)
    if (!isMoving && trailOpacity > 0) {
        trailOpacity -= 0.083;
        if (trailOpacity <= 0) {
            trailOpacity = 0;
            trailPositions.length = 0;
        }
    }

    if (trailPositions.length > 1 && trailOpacity > 0) {
        for (let i = 0; i < trailPositions.length - 1; i++) {
            const pos = trailPositions[i];
            const nextPos = trailPositions[i + 1];
            const opacity = (i / trailPositions.length) * 0.8 * trailOpacity;
            const lineWidth = (i / trailPositions.length) * 3 + 1;

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(nextPos.x, nextPos.y);
            ctx.strokeStyle = `rgba(255, 0, 110, ${opacity})`;
            ctx.lineWidth = lineWidth;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(255, 0, 110, ${0.8 * trailOpacity})`;
            ctx.stroke();
        }
    }

    requestAnimationFrame(animateCursorTrail);
}

if (window.innerWidth > 768) {
    animateCursorTrail();
}

// ===== STATS COUNTER ANIMATION =====
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                if (text.includes('+')) {
                    const target = parseInt(text);
                    let current = 0;
                    const increment = target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            stat.textContent = target + '+';
                            clearInterval(timer);
                        } else {
                            stat.textContent = Math.floor(current) + '+';
                        }
                    }, 30);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// ===== PERFORMANCE OPTIMIZATION =====
// Add CSS property for hardware acceleration
document.querySelectorAll('.project-card, .stat, .contact-card').forEach(el => {
    el.style.transform = 'translateZ(0)';
});

// ===== LOADING ANIMATION =====
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

console.log('%c🎮 Game Developer Portfolio Loaded! 🎮', 'color: #00ff88; font-size: 20px; font-weight: bold;');
console.log('%cBuilt with ❤️ and Unity', 'color: #00d9ff; font-size: 14px;');
