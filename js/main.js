/**
 * APEX ATHLETICS - High-Performance Kinetic Gym Website
 * Powered by GSAP, ScrollTrigger, Lenis & Web Audio API
 */

(function () {
  'use strict';

  // --- STATE & UTILS ---
  const state = {
    audioEnabled: false,
    billingAnnual: false,
    activeDay: 'monday',
    activeCategory: 'all'
  };

  // Safe DOM helper
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  // --- AUDIO SYNTHESIZER (WEB AUDIO API - ZERO EXTERNAL ASSET DEPENDENCIES) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type = 'click') {
    if (!state.audioEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'swoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'bass') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Audio Toggle Button
  function setupAudioToggle() {
    const audioBtn = $('#audio-toggle-btn');
    const audioText = $('#audio-status-text');
    const audioIcon = $('#audio-icon');

    if (!audioBtn) return;

    audioBtn.addEventListener('click', () => {
      initAudio();
      state.audioEnabled = !state.audioEnabled;

      if (state.audioEnabled) {
        audioText.textContent = 'SFX: ON';
        audioText.classList.add('text-neon-lime');
        audioIcon.className = 'fa-solid fa-volume-high text-neon-lime';
        audioBtn.classList.add('border-neon-lime', 'bg-neon-lime/10');
        playSound('success');
      } else {
        audioText.textContent = 'SFX: OFF';
        audioText.classList.remove('text-neon-lime');
        audioIcon.className = 'fa-solid fa-volume-xmark text-neutral-400';
        audioBtn.classList.remove('border-neon-lime', 'bg-neon-lime/10');
      }
    });
  }

  // --- SMOOTH SCROLL (LENIS + GSAP SCROLLTRIGGER SYNC) ---
  let lenis = null;

  function initSmoothScroll() {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024 && window.matchMedia('(pointer: fine)').matches;
    if (typeof Lenis !== 'undefined' && isDesktop) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,
        wheelMultiplier: 1.05
      });

      // Synchronize Lenis with GSAP ScrollTrigger
      if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }

      // Smooth anchor link scrolling with header offset
      $$('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId && targetId !== '#') {
            const targetEl = $(targetId);
            if (targetEl) {
              e.preventDefault();
              playSound('click');
              lenis.scrollTo(targetEl, { offset: -70 });
            }
          }
        });
      });
    } else {
      // Fallback for native smooth scrolling
      $$('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId && targetId !== '#') {
            const targetEl = $(targetId);
            if (targetEl) {
              e.preventDefault();
              playSound('click');
              targetEl.scrollIntoView({ behavior: 'smooth' });
            }
          }
        });
      });
    }
  }

  // --- CUSTOM DUAL-RING CURSOR WITH LERP ---
  function initCustomCursor() {
    // Only initialize for non-touch fine pointer devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = $('#cursor-dot');
    const outline = $('#cursor-outline');
    if (!dot || !outline) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outlineX = mouseX;
    let outlineY = mouseY;
    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        dot.style.opacity = '1';
        outline.style.opacity = '1';
        isVisible = true;
      }

      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    });

    // Smooth lerp trailing loop for outer ring
    function renderCursor() {
      const ease = 0.18;
      outlineX += (mouseX - outlineX) * ease;
      outlineY += (mouseY - outlineY) * ease;

      outline.style.left = `${outlineX}px`;
      outline.style.top = `${outlineY}px`;

      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Mouse leave / enter window
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      outline.style.opacity = '0';
      isVisible = false;
    });

    document.addEventListener('mouseenter', (e) => {
      if (e.clientX > 0 && e.clientY > 0) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        outlineX = mouseX;
        outlineY = mouseY;
        dot.style.opacity = '1';
        outline.style.opacity = '1';
        isVisible = true;
      }
    });

    // Hover state expansion for interactive items
    const hoverTargets = 'a, button, input, select, textarea, .tilt-card, .btn-magnetic, [data-cursor-hover]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        document.body.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        document.body.classList.remove('cursor-hover');
      }
    });
  }

  // --- MAGNETIC BUTTONS EFFECT ---
  function initMagneticButtons() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const magneticElements = $$('.btn-magnetic');

    magneticElements.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;

        // Magnet strength factor
        const strength = 0.35;

        gsap.to(el, {
          x: distanceX * strength,
          y: distanceY * strength,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1.1, 0.4)'
        });
      });
    });
  }

  // --- 3D TILT EFFECT ON CARDS ---
  function init3DTilt() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const tiltCards = $$('.tilt-card');

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  }

  // --- GSAP ENTRANCE & SCROLL ANIMATIONS ---
  function initAnimations() {
    if (typeof gsap === 'undefined') return;
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Hero Reveal Timeline (Fast, instant render without 3D rotation clipping)
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl
      .from('#hero-badge', {
        y: -15,
        opacity: 0,
        duration: 0.5,
        delay: 0.1
      })
      .from('.hero-word', {
        y: 30,
        opacity: 0,
        stagger: 0.05,
        duration: 0.7
      }, '-=0.25')
      .from('#hero-desc', {
        y: 15,
        opacity: 0,
        duration: 0.5
      }, '-=0.35')
      .from('.hero-cta-group', {
        y: 15,
        opacity: 0,
        duration: 0.5
      }, '-=0.3')
      .from('#hero-scroll-indicator', {
        opacity: 0,
        duration: 0.4
      }, '-=0.2')
      .from('#metrics-bar', {
        y: 20,
        opacity: 0,
        duration: 0.5
      }, '-=0.2');

    // 2. Animated Metrics Counters with ScrollTrigger
    const counterElements = $$('.metric-counter');

    counterElements.forEach((el) => {
      const targetVal = parseFloat(el.getAttribute('data-target') || '0');
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

      const obj = { val: 0 };

      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 95%',
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: targetVal,
              duration: 1.8,
              ease: 'power3.out',
              onUpdate: () => {
                if (decimals > 0) {
                  el.textContent = obj.val.toFixed(decimals) + suffix;
                } else {
                  el.textContent = Math.floor(obj.val).toLocaleString() + suffix;
                }
              }
            });
          }
        });
      } else {
        el.textContent = (decimals > 0 ? targetVal.toFixed(decimals) : Math.floor(targetVal).toLocaleString()) + suffix;
      }
    });

    // 3. Fast Section & Card Reveals (Trigger early to eliminate any empty/blank space)
    if (typeof ScrollTrigger !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      const startPos = isMobile ? 'top 96%' : 'top 88%';

      $$('.section-reveal').forEach((sec) => {
        gsap.from(sec.children, {
          scrollTrigger: {
            trigger: sec,
            start: startPos,
            once: true
          },
          y: isMobile ? 20 : 35,
          opacity: 0,
          duration: isMobile ? 0.4 : 0.7,
          stagger: 0.06,
          ease: 'power2.out'
        });
      });

      // 4. Staggered Program Cards Reveal
      gsap.from('.program-card', {
        scrollTrigger: {
          trigger: '#programs-grid',
          start: startPos,
          once: true
        },
        y: isMobile ? 25 : 45,
        opacity: 0,
        duration: isMobile ? 0.45 : 0.7,
        stagger: 0.08,
        ease: 'power2.out'
      });

      // 5. Features Pin/Stagger Reveal
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: '#features-container',
          start: startPos,
          once: true
        },
        y: isMobile ? 20 : 40,
        opacity: 0,
        duration: isMobile ? 0.4 : 0.65,
        stagger: 0.06,
        ease: 'power2.out'
      });

      // 6. Pricing Cards Reveal
      gsap.from('.pricing-card', {
        scrollTrigger: {
          trigger: '#pricing-grid',
          start: startPos,
          once: true
        },
        y: isMobile ? 25 : 45,
        opacity: 0,
        duration: isMobile ? 0.45 : 0.7,
        stagger: 0.08,
        ease: 'power2.out'
      });
    }

    // 7. Sticky Glass Navbar on Scroll
    const navbar = $('#main-navbar');
    if (navbar) {
      const handleNavbarScroll = () => {
        if (window.scrollY > 30) {
          navbar.classList.add('bg-black/95', 'shadow-2xl', 'backdrop-blur-xl', 'border-neutral-800/80', 'py-3');
          navbar.classList.remove('bg-black/80', 'backdrop-blur-md', 'border-white/5', 'py-3.5', 'sm:py-4');
        } else {
          navbar.classList.remove('bg-black/95', 'shadow-2xl', 'backdrop-blur-xl', 'border-neutral-800/80', 'py-3');
          navbar.classList.add('bg-black/80', 'backdrop-blur-md', 'border-white/5', 'py-3.5', 'sm:py-4');
        }
      };
      window.addEventListener('scroll', handleNavbarScroll);
      handleNavbarScroll();
    }
  }

  // --- TIMETABLE / SCHEDULE DATA & LOGIC ---
  const scheduleData = [
    {
      id: 1,
      day: 'monday',
      time: '06:00 AM - 07:15 AM',
      name: 'Iron Forge: Heavy Barbell Mechanics',
      category: 'strength',
      coach: 'Marcus "Titan" Vance',
      coachImg: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=200&auto=format&fit=crop',
      intensity: 'High (85% 1RM)',
      room: 'Arsenal Pit 1',
      spotsLeft: 4
    },
    {
      id: 2,
      day: 'monday',
      time: '09:00 AM - 10:00 AM',
      name: 'Hypersonic HIIT: Tabata Blitz',
      category: 'hiit',
      coach: 'Elena Rostova',
      coachImg: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=200&auto=format&fit=crop',
      intensity: 'Extreme (HR Zone 4-5)',
      room: 'Conditioning Dome',
      spotsLeft: 7
    },
    {
      id: 3,
      day: 'monday',
      time: '05:30 PM - 06:45 PM',
      name: 'Apex Strike: Striking & Footwork',
      category: 'combat',
      coach: 'David Brooks',
      coachImg: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=200&auto=format&fit=crop',
      intensity: 'High (Combative Anaerobic)',
      room: 'The Octagon Cage',
      spotsLeft: 2
    },
    {
      id: 4,
      day: 'monday',
      time: '07:30 PM - 08:30 PM',
      name: 'Deep Contrast & Fascial Reset',
      category: 'recovery',
      coach: 'Maya Lin',
      coachImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop',
      intensity: 'Regenerative (Parasympathetic)',
      room: 'Sanctuary Cryo Zone',
      spotsLeft: 8
    },
    // Tuesday
    {
      id: 5,
      day: 'tuesday',
      time: '06:30 AM - 07:45 AM',
      name: 'Hypertrophy Matrix: Upper Body Mass',
      category: 'strength',
      coach: 'Jaxson Reed',
      coachImg: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=200&auto=format&fit=crop',
      intensity: 'High Volume',
      room: 'Arsenal Pit 2',
      spotsLeft: 5
    },
    {
      id: 6,
      day: 'tuesday',
      time: '12:00 PM - 01:00 PM',
      name: 'Metabolic Inferno: Kettlebell Sprints',
      category: 'hiit',
      coach: 'Elena Rostova',
      coachImg: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=200&auto=format&fit=crop',
      intensity: 'Max VO2 Pulse',
      room: 'Turf Zone Alpha',
      spotsLeft: 3
    },
    {
      id: 7,
      day: 'tuesday',
      time: '06:00 PM - 07:15 PM',
      name: 'Muay Thai Clinch & Elbow Craft',
      category: 'combat',
      coach: 'David Brooks',
      coachImg: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=200&auto=format&fit=crop',
      intensity: 'Elite Conditioning',
      room: 'Combat Lab',
      spotsLeft: 6
    },
    // Wednesday
    {
      id: 8,
      day: 'wednesday',
      time: '06:00 AM - 07:15 AM',
      name: 'Olympic Snatch & Clean Protocol',
      category: 'strength',
      coach: 'Marcus "Titan" Vance',
      coachImg: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=200&auto=format&fit=crop',
      intensity: 'Explosive Power',
      room: 'Eleiko Platforms',
      spotsLeft: 2
    },
    {
      id: 9,
      day: 'wednesday',
      time: '05:30 PM - 06:30 PM',
      name: 'Valkyrie HIIT: Battle Ropes & Sleds',
      category: 'hiit',
      coach: 'Elena Rostova',
      coachImg: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=200&auto=format&fit=crop',
      intensity: 'Max Heartrate',
      room: 'Conditioning Dome',
      spotsLeft: 5
    },
    {
      id: 10,
      day: 'wednesday',
      time: '07:15 PM - 08:30 PM',
      name: 'Infrared Spine & Hip Decompression',
      category: 'recovery',
      coach: 'Maya Lin',
      coachImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop',
      intensity: 'Deep Mobility',
      room: 'Sanctuary Cryo Zone',
      spotsLeft: 9
    },
    // Thursday
    {
      id: 11,
      day: 'thursday',
      time: '07:00 AM - 08:15 AM',
      name: 'Posterior Chain Overdrive: Deadlifts',
      category: 'strength',
      coach: 'Marcus "Titan" Vance',
      coachImg: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=200&auto=format&fit=crop',
      intensity: 'Heavy Load',
      room: 'Arsenal Pit 1',
      spotsLeft: 3
    },
    {
      id: 12,
      day: 'thursday',
      time: '06:00 PM - 07:15 PM',
      name: 'MMA Takedown Dynamics & Ground',
      category: 'combat',
      coach: 'David Brooks',
      coachImg: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=200&auto=format&fit=crop',
      intensity: 'High Combat',
      room: 'The Octagon Cage',
      spotsLeft: 4
    },
    // Friday
    {
      id: 13,
      day: 'friday',
      time: '06:00 AM - 07:00 AM',
      name: 'Full Body Savage Circuit',
      category: 'hiit',
      coach: 'Jaxson Reed',
      coachImg: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=200&auto=format&fit=crop',
      intensity: 'Lethal Burn',
      room: 'Turf Zone Alpha',
      spotsLeft: 6
    },
    {
      id: 14,
      day: 'friday',
      time: '05:30 PM - 06:45 PM',
      name: 'Friday Fight Night: Boxing Sparring',
      category: 'combat',
      coach: 'David Brooks',
      coachImg: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=200&auto=format&fit=crop',
      intensity: 'Max Intensity',
      room: 'Boxing Ring',
      spotsLeft: 2
    },
    {
      id: 15,
      day: 'friday',
      time: '07:15 PM - 08:30 PM',
      name: 'Sound Bath & Cold Immersion Flow',
      category: 'recovery',
      coach: 'Maya Lin',
      coachImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop',
      intensity: 'Cellular Restoration',
      room: 'Sanctuary Cryo Zone',
      spotsLeft: 10
    },
    // Saturday
    {
      id: 16,
      day: 'saturday',
      time: '08:00 AM - 09:30 AM',
      name: 'The 90-Minute Apex Gauntlet',
      category: 'hiit',
      coach: 'Elena Rostova',
      coachImg: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=200&auto=format&fit=crop',
      intensity: 'Endurance Beast',
      room: 'Main Arena',
      spotsLeft: 5
    },
    {
      id: 17,
      day: 'saturday',
      time: '10:30 AM - 12:00 PM',
      name: 'Atlas Powerlifting Masterclass',
      category: 'strength',
      coach: 'Marcus "Titan" Vance',
      coachImg: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=200&auto=format&fit=crop',
      intensity: 'Elite Technical',
      room: 'Arsenal Pit 1',
      spotsLeft: 3
    },
    // Sunday
    {
      id: 18,
      day: 'sunday',
      time: '09:00 AM - 10:30 AM',
      name: 'Hyper-Mobility & Athletic Flow',
      category: 'recovery',
      coach: 'Maya Lin',
      coachImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop',
      intensity: 'Flow State Active',
      room: 'Sanctuary Cryo Zone',
      spotsLeft: 8
    },
    {
      id: 19,
      day: 'sunday',
      time: '11:00 AM - 12:30 PM',
      name: 'Open Mat & Combative Drills',
      category: 'combat',
      coach: 'David Brooks',
      coachImg: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=200&auto=format&fit=crop',
      intensity: 'Free Sparring',
      room: 'The Octagon Cage',
      spotsLeft: 6
    }
  ];

  function renderTimetable() {
    const container = $('#timetable-grid');
    if (!container) return;

    const filtered = scheduleData.filter((item) => {
      const matchDay = state.activeDay === 'all' || item.day === state.activeDay;
      const matchCat = state.activeCategory === 'all' || item.category === state.activeCategory;
      return matchDay && matchCat;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-neutral-800">
          <i class="fa-solid fa-calendar-xmark text-4xl mb-4 text-neon-lime/60"></i>
          <h4 class="text-xl font-bold uppercase tracking-wider text-white">No Classes Scheduled</h4>
          <p class="text-sm mt-1">Try selecting another day or category filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((item) => {
      let badgeColor = 'bg-neon-lime/10 text-neon-lime border-neon-lime/30';
      if (item.category === 'combat') badgeColor = 'bg-red-500/10 text-neon-crimson border-red-500/30';
      if (item.category === 'recovery') badgeColor = 'bg-cyan-500/10 text-neon-cyan border-cyan-500/30';
      if (item.category === 'hiit') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

      return `
        <div class="schedule-item glass-panel hover:glass-panel-glow rounded-xl p-5 border border-neutral-800 transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeColor}">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                ${item.category}
              </span>
              <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-300">
                <i class="fa-regular fa-clock text-neon-lime mr-1"></i>${item.time}
              </span>
            </div>

            <h3 class="text-lg font-bold font-display uppercase tracking-wide text-white group-hover:text-neon-lime transition-colors">
              ${item.name}
            </h3>

            <div class="flex items-center gap-3 mt-4 pt-3 border-t border-neutral-800/80">
              <img src="${item.coachImg}" alt="${item.coach}" class="w-9 h-9 rounded-full object-cover ring-2 ring-neutral-700" loading="lazy">
              <div>
                <p class="text-xs text-neutral-400">Lead Coach</p>
                <p class="text-sm font-semibold text-neutral-200">${item.coach}</p>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <div class="text-xs text-neutral-400">
              <span class="text-white font-semibold">${item.room}</span> • 
              <span class="${item.spotsLeft <= 3 ? 'text-neon-crimson font-bold' : 'text-neutral-400'}">${item.spotsLeft} spots left</span>
            </div>
            <button class="book-slot-btn px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neon-lime hover:text-black text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95" data-class-name="${encodeURIComponent(item.name)}" data-coach="${encodeURIComponent(item.coach)}" data-time="${encodeURIComponent(item.time)}">
              Reserve
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Smooth entry stagger
    if (typeof gsap !== 'undefined') {
      gsap.from('.schedule-item', {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out'
      });
    }

    // Attach click listener to newly rendered reserve buttons
    $$('.book-slot-btn', container).forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound('click');
        const className = decodeURIComponent(btn.getAttribute('data-class-name') || '');
        const coach = decodeURIComponent(btn.getAttribute('data-coach') || '');
        const time = decodeURIComponent(btn.getAttribute('data-time') || '');
        openBookingModal({ type: 'class', name: className, details: `${coach} | ${time}` });
      });
    });
  }

  function setupTimetableFilters() {
    // Day Tabs
    const dayButtons = $$('.timetable-day-btn');
    dayButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound('click');
        dayButtons.forEach((b) => {
          b.classList.remove('bg-neon-lime', 'text-black', 'shadow-[0_0_15px_rgba(204,255,0,0.4)]');
          b.classList.add('bg-neutral-900', 'text-neutral-400', 'border-neutral-800');
        });
        btn.classList.add('bg-neon-lime', 'text-black', 'shadow-[0_0_15px_rgba(204,255,0,0.4)]');
        btn.classList.remove('bg-neutral-900', 'text-neutral-400', 'border-neutral-800');

        state.activeDay = btn.getAttribute('data-day') || 'monday';
        renderTimetable();
      });
    });

    // Category Filter Pills
    const catButtons = $$('.timetable-cat-btn');
    catButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound('click');
        catButtons.forEach((b) => {
          b.classList.remove('border-neon-lime', 'text-neon-lime', 'bg-neon-lime/10');
          b.classList.add('border-neutral-800', 'text-neutral-400');
        });
        btn.classList.add('border-neon-lime', 'text-neon-lime', 'bg-neon-lime/10');
        btn.classList.remove('border-neutral-800', 'text-neutral-400');

        state.activeCategory = btn.getAttribute('data-category') || 'all';
        renderTimetable();
      });
    });
  }

  // --- PRICING & MEMBERSHIP BILLING TOGGLE ---
  function setupPricingToggle() {
    const toggle = $('#billing-toggle');
    if (!toggle) return;

    const prices = [
      { id: 'starter-price', monthly: 49, annual: 39 },
      { id: 'pro-price', monthly: 89, annual: 69 },
      { id: 'titan-price', monthly: 149, annual: 119 }
    ];

    const cycleLabels = $$('.billing-cycle-label');

    toggle.addEventListener('change', () => {
      playSound('click');
      state.billingAnnual = toggle.checked;

      prices.forEach((item) => {
        const el = $(`#${item.id}`);
        if (!el) return;

        const currentVal = parseFloat(el.textContent.replace('$', ''));
        const targetVal = state.billingAnnual ? item.annual : item.monthly;

        const animObj = { val: currentVal };
        gsap.to(animObj, {
          val: targetVal,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `$${Math.round(animObj.val)}`;
          }
        });
      });

      cycleLabels.forEach((label) => {
        label.textContent = state.billingAnnual ? '/month, billed annually' : '/month, billed monthly';
      });

      const discountBadge = $('#annual-discount-pill');
      if (discountBadge) {
        if (state.billingAnnual) {
          discountBadge.classList.add('scale-110', 'bg-neon-lime', 'text-black');
          discountBadge.classList.remove('bg-neutral-800', 'text-neon-lime');
        } else {
          discountBadge.classList.remove('scale-110', 'bg-neon-lime', 'text-black');
          discountBadge.classList.add('bg-neutral-800', 'text-neon-lime');
        }
      }
    });

    // Plan selection buttons
    $$('.select-plan-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound('click');
        const planName = btn.getAttribute('data-plan-name') || 'Apex Pro';
        const price = state.billingAnnual
          ? btn.getAttribute('data-annual-price') || '$69'
          : btn.getAttribute('data-monthly-price') || '$89';
        openBookingModal({
          type: 'membership',
          name: `${planName} Tier`,
          details: `${price} / mo (${state.billingAnnual ? 'Annual Billing' : 'Monthly'})`
        });
      });
    });
  }

  // --- COACHES CAROUSEL ---
  function setupCoachesCarousel() {
    const track = $('#coaches-track');
    const prevBtn = $('#coaches-prev');
    const nextBtn = $('#coaches-next');

    if (!track || !prevBtn || !nextBtn) return;

    const scrollAmount = 360;

    prevBtn.addEventListener('click', () => {
      playSound('swoosh');
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      playSound('swoosh');
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // --- KINETIC ATHLETIC CALCULATOR (BMI & CALORIC TARGET) ---
  function setupAthleticCalculator() {
    const form = $('#athlete-calc-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      playSound('bass');

      const heightCm = parseFloat($('#calc-height')?.value || '0');
      const weightKg = parseFloat($('#calc-weight')?.value || '0');
      const age = parseInt($('#calc-age')?.value || '25', 10);
      const gender = $('#calc-gender')?.value || 'male';
      const goal = $('#calc-goal')?.value || 'hypertrophy';
      const activity = parseFloat($('#calc-activity')?.value || '1.55');

      // Validation
      if (heightCm < 100 || heightCm > 250 || weightKg < 30 || weightKg > 250) {
        showToast('Please enter valid height and weight values', 'error');
        return;
      }

      // 1. BMI
      const heightM = heightCm / 100;
      const bmi = (weightKg / (heightM * heightM)).toFixed(1);

      // 2. BMR (Mifflin-St Jeor)
      let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
      bmr += gender === 'male' ? 5 : -161;

      // 3. TDEE
      let tdee = Math.round(bmr * activity);

      // Adjust for goal
      let targetCalories = tdee;
      let goalAdvice = '';
      let recommendedProgram = 'Apex Hypertrophy Protocol';

      if (goal === 'fatloss') {
        targetCalories = Math.round(tdee - 500);
        goalAdvice = 'Deficit targeting aggressive body fat oxidation while preserving lean mass.';
        recommendedProgram = 'Hypersonic HIIT & Conditioning';
      } else if (goal === 'hypertrophy') {
        targetCalories = Math.round(tdee + 350);
        goalAdvice = 'Caloric surplus geared for maximum myofibrillar protein synthesis.';
        recommendedProgram = 'Iron Forge Heavy Powerlifting & Hypertrophy';
      } else if (goal === 'recomp') {
        targetCalories = Math.round(tdee);
        goalAdvice = 'Maintenance intake for simultaneous adipose reduction and neuromuscular density.';
        recommendedProgram = 'Combat Strike & Hybrid Athleticism';
      }

      // Safe render
      const resultContainer = $('#calc-result-box');
      if (resultContainer) {
        resultContainer.classList.remove('hidden');

        const bmiValEl = $('#res-bmi-val');
        const calValEl = $('#res-cal-val');
        const programEl = $('#res-program-name');
        const adviceEl = $('#res-advice');

        if (bmiValEl) bmiValEl.textContent = bmi;
        if (calValEl) calValEl.textContent = `${targetCalories.toLocaleString()} kcal/day`;
        if (programEl) programEl.textContent = recommendedProgram;
        if (adviceEl) adviceEl.textContent = goalAdvice;

        // Smooth scroll result into view if needed
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Highlight animation
        gsap.fromTo(resultContainer, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
      }
    });
  }

  // --- INTERACTIVE BOOKING & PASS MODAL ---
  function setupModals() {
    const modal = $('#action-modal');
    const modalBackdrop = $('#modal-backdrop');
    const modalClose = $('#modal-close-btn');
    const modalForm = $('#modal-booking-form');
    const modalTitle = $('#modal-title');
    const modalSubtitle = $('#modal-subtitle');
    const modalConfirmation = $('#modal-confirmation-state');

    let currentModalConfig = { type: 'vip', name: '7-Day All Access VIP Pass' };

    window.openBookingModal = function (config = {}) {
      if (!modal) return;
      initAudio();
      playSound('swoosh');
      currentModalConfig = config;

      // Reset states
      if (modalConfirmation) modalConfirmation.classList.add('hidden');
      if (modalForm) modalForm.classList.remove('hidden');

      if (config.title && modalTitle) {
        modalTitle.textContent = config.title;
      } else if (config.type === 'class') {
        if (modalTitle) modalTitle.textContent = 'RESERVE CLASS SPOT';
      } else if (config.type === 'membership') {
        if (modalTitle) modalTitle.textContent = 'ACTIVATE MEMBERSHIP';
      } else {
        if (modalTitle) modalTitle.textContent = 'CLAIM 7-DAY VIP PASS';
      }

      if (config.subtitle && modalSubtitle) {
        modalSubtitle.textContent = config.subtitle;
      } else if (config.type === 'class') {
        if (modalSubtitle) modalSubtitle.textContent = config.name ? `Selected: ${config.name} (${config.details || ''})` : 'Join the elite session';
      } else if (config.type === 'membership') {
        if (modalSubtitle) modalSubtitle.textContent = config.name ? `Selected: ${config.name} - ${config.details || ''}` : 'Begin your transformation';
      } else {
        if (modalSubtitle) modalSubtitle.textContent = 'Experience full unrestricted access to Apex Athletics';
      }

      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';

      gsap.fromTo('#modal-content-box',
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      );
    };

    function closeModal() {
      if (!modal) return;
      playSound('click');
      gsap.to('#modal-content-box', {
        scale: 0.95,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          modal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Escape key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Form submission with zero security vulnerability & safe validation
    if (modalForm) {
      modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playSound('success');

        const nameInput = $('#modal-input-name');
        const emailInput = $('#modal-input-email');
        const phoneInput = $('#modal-input-phone');

        const userName = (nameInput?.value || '').trim();
        const userEmail = (emailInput?.value || '').trim();
        const userPhone = (phoneInput?.value || '').trim() || '+1 (555) 000-0000';

        if (!userName || !userEmail) {
          showToast('Please fill in your name and a valid email', 'error');
          return;
        }

        // Email regex check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
          showToast('Please enter a valid email address', 'error');
          return;
        }

        // Generate synthetic membership pass badge code
        const passCode = 'APX-' + Math.floor(100000 + Math.random() * 900000);
        const passHolder = $('#confirm-pass-holder');
        const passCodeEl = $('#confirm-pass-code');

        if (passHolder) passHolder.textContent = userName.toUpperCase();
        if (passCodeEl) passCodeEl.textContent = passCode;

        const bookingType = currentModalConfig?.category || 
          (currentModalConfig?.type === 'class' ? 'Class Reservation' : (currentModalConfig?.type === 'membership' ? 'Membership' : 'VIP Pass'));
        const bookingTarget = currentModalConfig?.name || currentModalConfig?.plan || currentModalConfig?.title || '7-Day All Access VIP Pass';

        const newBooking = {
          id: 'BKG-' + Math.floor(100 + Math.random() * 900),
          name: userName,
          email: userEmail,
          phone: userPhone,
          type: bookingType,
          target: bookingTarget,
          status: 'Pending',
          code: passCode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Save to Supabase Cloud and localStorage
        if (window.ApexDB && window.ApexDB.saveBooking) {
          window.ApexDB.saveBooking(newBooking).catch(err => console.warn('Supabase booking sync error:', err));
        } else {
          try {
            const bookings = JSON.parse(localStorage.getItem('apex_bookings') || '[]');
            bookings.unshift(newBooking);
            localStorage.setItem('apex_bookings', JSON.stringify(bookings));
          } catch (err) {
            console.warn('Booking storage error:', err);
          }
        }

        // Transition to confirmation state
        modalForm.classList.add('hidden');
        if (modalConfirmation) {
          modalConfirmation.classList.remove('hidden');
          gsap.fromTo(modalConfirmation, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
        }
      });
    }

    // Connect VIP CTA triggers
    $$('.trigger-join-modal').forEach((btn) => {
      btn.addEventListener('click', () => {
        openBookingModal({ type: 'vip', name: '7-Day All Access VIP Pass' });
      });
    });

    // Connect program details modal buttons
    $$('.view-program-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const progTitle = btn.getAttribute('data-program') || 'Elite Training';
        openBookingModal({
          type: 'class',
          title: `ENROLL: ${progTitle.toUpperCase()}`,
          subtitle: `Program Enrollment: ${progTitle}. Reserve your introductory consultation.`,
          name: progTitle,
          category: 'Program Enrollment'
        });
      });
    });

    // Connect coach booking buttons
    $$('.book-coach-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const coachName = btn.getAttribute('data-coach') || 'Master Coach';
        openBookingModal({
          type: 'class',
          title: `BOOK 1-ON-1 WITH ${coachName.toUpperCase()}`,
          subtitle: `Private Athletic Coaching Consultation with ${coachName}.`,
          name: `1-on-1 Session: ${coachName}`,
          category: 'Coaching Consultation'
        });
      });
    });

    // Video Reel Modal
    const videoModal = $('#video-reel-modal');
    const openVideoBtn = $('#open-video-reel');
    const closeVideoBtn = $('#close-video-modal');

    if (openVideoBtn && videoModal) {
      openVideoBtn.addEventListener('click', () => {
        playSound('bass');
        videoModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      });
    }

    if (closeVideoBtn && videoModal) {
      closeVideoBtn.addEventListener('click', () => {
        playSound('click');
        videoModal.classList.add('hidden');
        document.body.style.overflow = '';
      });
    }
  }

  // --- MOBILE HAMBURGER MENU OVERLAY ---
  function setupMobileMenu() {
    const toggleBtn = $('#mobile-menu-toggle');
    const overlay = $('#mobile-menu-overlay');
    const links = $$('.mobile-nav-link');
    const line1 = $('#ham-line-1');
    const line2 = $('#ham-line-2');
    const line3 = $('#ham-line-3');

    let isOpen = false;

    function closeMenu() {
      if (!isOpen) return;
      isOpen = false;
      document.body.style.overflow = '';
      if (line1 && line2 && line3) {
        line1.style.transform = 'none';
        line2.style.opacity = '1';
        line3.style.transform = 'none';
      }

      if (typeof gsap !== 'undefined' && overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.22,
          onComplete: () => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
          }
        });
      } else if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
      }
    }

    function openMenu() {
      if (isOpen || !overlay) return;
      isOpen = true;
      playSound('click');
      overlay.classList.remove('hidden');
      overlay.classList.add('flex');
      document.body.style.overflow = 'hidden';

      // Animate hamburger to sharp symmetrical X
      if (line1 && line2 && line3) {
        line1.style.transform = 'translateY(7px) rotate(45deg)';
        line2.style.opacity = '0';
        line3.style.transform = 'translateY(-7px) rotate(-45deg)';
      }

      if (typeof gsap !== 'undefined') {
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        gsap.fromTo('.mobile-nav-link, .mobile-menu-item',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, delay: 0.05, ease: 'power3.out' }
        );
      }
    }

    function toggleMenu() {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleMenu);
    }

    const closeBtn = $('#mobile-menu-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }

    // Auto-close when clicking any nav link
    links.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Auto-close when clicking any modal trigger inside overlay
    if (overlay) {
      $$('.trigger-join-modal', overlay).forEach((btn) => {
        btn.addEventListener('click', closeMenu);
      });
    }

    // Auto reset if resized to desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1280 && isOpen) {
        closeMenu();
      }
    });
  }

  // --- NEWSLETTER FORM & TOAST NOTIFICATION ---
  function setupNewsletter() {
    const form = $('#newsletter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      playSound('success');

      const input = $('#newsletter-email');
      const email = (input?.value || '').trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      // Save to Supabase Cloud and LocalStorage
      if (window.ApexDB && window.ApexDB.saveNewsletter) {
        window.ApexDB.saveNewsletter(email).catch(err => console.warn('Supabase newsletter sync error:', err));
      } else {
        try {
          const list = JSON.parse(localStorage.getItem('apex_newsletter') || '[]');
          if (!list.includes(email)) {
            list.unshift(email);
            localStorage.setItem('apex_newsletter', JSON.stringify(list));
          }
        } catch (_) {}
      }

      showToast('Welcome to the Inner Circle. Workout intel dispatched.', 'success');
      if (input) input.value = '';
    });
  }

  // Toast Notification System
  function showToast(message, type = 'success') {
    let toast = $('#global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'fixed bottom-6 right-6 z-[10000] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none';
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.className = 'fixed bottom-6 right-6 z-[10000] flex items-center gap-3 px-5 py-3.5 rounded-xl border border-neon-lime/40 bg-neutral-900/95 text-neutral-100 shadow-[0_0_25px_rgba(204,255,0,0.2)] transition-all duration-300';
      toast.innerHTML = `<i class="fa-solid fa-circle-check text-neon-lime text-lg"></i> <span class="font-medium text-sm">${sanitizeText(message)}</span>`;
    } else {
      toast.className = 'fixed bottom-6 right-6 z-[10000] flex items-center gap-3 px-5 py-3.5 rounded-xl border border-red-500/40 bg-neutral-900/95 text-neutral-100 shadow-[0_0_25px_rgba(255,51,68,0.2)] transition-all duration-300';
      toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-neon-crimson text-lg"></i> <span class="font-medium text-sm">${sanitizeText(message)}</span>`;
    }

    // Animate in
    gsap.to(toast, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });

    // Auto dismiss after 3.5s
    setTimeout(() => {
      gsap.to(toast, {
        y: 20,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          toast.className += ' pointer-events-none';
        }
      });
    }, 3500);
  }

  // Safe string sanitization to prevent XSS
  function sanitizeText(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  // --- ACTIVE NAVBAR HIGHLIGHTER ---
  function setupActiveNav() {
    const rawPath = window.location.pathname.split('/').pop() || 'index.html';
    const path = rawPath.toLowerCase();
    const navLinks = $$('.nav-link');
    const mobileNavLinks = $$('.mobile-nav-link');

    // Highlight current page on desktop & mobile navigation
    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href === path || ((path === '' || path === 'index.html') && href === 'index.html')) {
        link.classList.add('text-neon-lime');
      }
    });

    mobileNavLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href === path || ((path === '' || path === 'index.html') && href === 'index.html')) {
        link.classList.add('text-neon-lime');
      }
    });

    // In-page scroll spy ONLY on index.html with section anchors
    if (path === 'index.html' || path === '') {
      const sections = $$('section[id]');
      if (sections.length > 0) {
        window.addEventListener('scroll', () => {
          let currentSectionId = '';
          const scrollPos = window.scrollY + 250;

          sections.forEach((sec) => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
              currentSectionId = sec.getAttribute('id');
            }
          });

          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
              link.classList.remove('active', 'text-neon-lime');
              if (href === `#${currentSectionId}`) {
                link.classList.add('active', 'text-neon-lime');
              }
            }
          });
        });
      }
    }
  }

  // --- INITIALIZE ALL MODULES ON DOM READY ---
  document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initCustomCursor();
    initMagneticButtons();
    init3DTilt();
    initAnimations();
    setupAudioToggle();
    renderTimetable();
    setupTimetableFilters();
    setupPricingToggle();
    setupCoachesCarousel();
    setupAthleticCalculator();
    setupModals();
    setupMobileMenu();
    setupNewsletter();
    setupActiveNav();
  });
})();
