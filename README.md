# APEX ATHLETICS // High-Performance Kinetic Gym Website

A modern, high-energy, fully animated gym and athletic performance sanctuary website built with **HTML5**, **Tailwind CSS**, and **JavaScript** featuring **GSAP (GreenSock)**, **ScrollTrigger**, **Lenis Smooth Scroll**, and custom **Web Audio API** sound effects.

---

## ⚡ Visual Identity & Aesthetic
- **Theme:** "Dark High-Performance Athleticism"
- **Color Palette:**
  - Deep Carbon Black (`#0b0b0b`)
  - Dark Slate Surface (`#141414` / `#191919`)
  - Electric Neon Lime (`#ccff00`)
  - Energetic Crimson (`#ff3344`)
  - Cryo Cyan (`#00f0ff`)
- **Typography:** Display aggressive headers (`Syne`, `Anton`, `Bebas Neue`) paired with high-legibility body fonts (`Inter`).
- **Atmosphere:** Kinetic, sleek, premium, and motivational.

---

## 🚀 Key Features & Interactive Architecture

### 1. Interactive Navigation Bar
- Sticky glassmorphism header with scroll-reactive blur backdrop and height transition.
- Brand logo with kinetic glowing lightning badge.
- Navigation links with glowing neon underline slide effects on hover and active section tracking.
- Audio SFX toggle button (Web Audio API synth effects).
- Magnetic glowing "Join Now" CTA button.
- Full-screen mobile menu overlay with staggered entrance animations.

### 2. Kinetic Hero Section
- Dynamic staggered headline reveal (`FORGE YOUR UNSTOPPABLE APEX PHYSIQUE`) powered by GSAP.
- Subtle continuous Ken-Burns zoom on dark high-res athletic background.
- Floating kinetic pill badge (`⚡ TRANSFORM YOUR LIMITS • 2026 APEX PROTOCOL`).
- Primary magnetic CTA (`CLAIM 7-DAY VIP PASS`), Secondary Program explorer CTA, and cinematic video trailer reel modal.
- Live facility athlete counter with pulsing beacon.
- Animated scroll-down mouse wheel indicator.

### 3. Scroll-Triggered Social Proof & Metrics
- Dynamic counter numbers that animate into position when scrolled into view:
  - **15,000+** Active Athletes
  - **50+** Elite Master Coaches
  - **24/7** Biometric Smart Key Access
  - **99.4%** Goal Attainment Rate

### 4. 3D Tilt Program Cards
- Realistic 3D perspective tilt on mouse movement (`rotateX`, `rotateY`, `scale3d`).
- 5 comprehensive disciplines:
  1. *Iron Forge: Heavy Strength & Powerlifting*
  2. *Hypersonic HIIT Conditioning*
  3. *Anabolic Hypertrophy Lab*
  4. *Apex Combat & Striking (Boxing / MMA)*
  5. *Cryo & Cellular Reset (Mobility / Contrast)*
  6. *Biometric Athletic Assessment*
- Image scale transitions, intensity badges, and "View Protocol" interactive triggers.

### 5. Facility Arsenal Highlights
- Pinned feature cards showcasing:
  - Olympic Calibrated Eleiko Gear
  - InBody 770 Biometric Lab
  - Sub-Zero Cryotherapy & Finnish Rock Saunas
  - 24/7 Facial / NFC Biometric Access

### 6. Interactive Timetable / Class Schedule
- Filter tabs for each day of the week (**Mon–Sun + All Days**).
- Category filter pills (**All, Strength, HIIT, Combat, Recovery**).
- Smooth GSAP enter/exit transitions.
- "Reserve" button on each class slot that pre-fills and opens the booking modal.

### 7. Membership & Pricing Tiers
- **Monthly / Annual** toggle switch with animated price number tweens and 20% discount badge.
- 3 distinct tiers:
  - **Iron Starter** ($49/mo)
  - **Apex Pro** ($89/mo) - Elevated with an animated neon gradient border and "MOST POPULAR" badge.
  - **Titan VIP** ($149/mo) - Unlimited cryo, personal coaching, and macro shake bar.
- Interactive "Select Plan" buttons connected to the checkout modal.

### 8. Master Coaches Showcase Carousel
- Horizontal carousel featuring headshots, specializations, credentials, years of experience, and expanding social links.
- Previous / Next navigation controls with smooth snap scroll.

### 9. Diagnostic Macro & Athletic Calculator
- Interactive clinical utility for athletes:
  - Inputs: Height, Weight, Age, Gender, Objective (Hypertrophy / Fat Loss / Recomp), and Training Frequency.
  - Generates calculated BMI, targeted daily caloric requirement (Mifflin-St Jeor formula), and automatically recommends the exact matching training protocol.

### 10. Transformations & Athlete Testimonials
- Real athlete case studies with 5-star ratings and verified member badges.

### 11. High-Tech Footer
- Brand manifesto, newsletter signup with client-side regex sanitization and animated success toast, location coordinates with stylized radar map, and operating hours.

### 12. Security & Faultless Execution
- **Zero XSS risks:** User inputs are sanitized; strictly uses safe DOM node manipulation (`textContent` & sanitization routines).
- **No external MP3 dependencies:** Web Audio API oscillator generates clicks, sweeps, and chimes procedurally.
- **Touch-Friendly:** Custom cursor automatically hides on touch / coarse-pointer devices to ensure natural mobile UX.
- **Smooth Scrolling:** Lenis engine synced with GSAP ticker; respects `prefers-reduced-motion`.

---

## 🛠 How to Run

### Method 1: Direct Browser Launch
Simply double click or open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Method 2: Local Server (Node.js)
```bash
# In the project directory:
npx serve . -l 3000
```
Then visit `http://localhost:3000`.
