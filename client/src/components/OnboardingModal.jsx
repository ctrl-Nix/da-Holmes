import React, { useState, useEffect } from 'react';
import styles from './OnboardingModal.module.css';

const SLIDES = [
  {
    title: "What is this?",
    text: "da Holmes is an open-source intelligence platform. Paste any target — domain, username, email, IP address, or Bitcoin wallet — and we investigate it using 100% public data sources.",
    icon: "🔍"
  },
  {
    title: "How to use",
    text: "Type anything into the search bar. da Holmes automatically detects what you entered and runs the right investigation modules. Try: google.com or your own username.",
    icon: "⌨️"
  },
  {
    title: "What you'll see",
    text: "Results stream in real time — subdomains, social profiles, email security, SSL certificates, breach history and more. Export any report as PDF.",
    icon: "📊"
  },
  {
    title: "Stay ethical",
    text: "This tool uses only public data. Only investigate targets you have permission to investigate or that are your own. Misuse is your responsibility.",
    icon: "⚖️"
  }
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const visited = localStorage.getItem("holmes-visited");
    if (!visited) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("holmes-visited", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const reopenOnboarding = () => {
    setCurrentSlide(0);
    setIsOpen(true);
  };

  return (
    <>
      {/* Help Circle Button fixed bottom right */}
      <button 
        className={styles.helpButton} 
        onClick={reopenOnboarding}
        title="Open Onboarding Guide"
      >
        ?
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            {/* Skip Button top-right */}
            <button className={styles.skipBtn} onClick={handleSkip}>
              Skip
            </button>

            {/* Logo and Static Header */}
            <div className={styles.header}>
              <span className={styles.logo}>🕵️‍♂️</span>
              <h2 className={styles.mainTitle}>Welcome to da Holmes</h2>
              <p className={styles.mainSubtitle}>Your OSINT Investigation Platform</p>
            </div>

            {/* Slide Body */}
            <div className={styles.slideBody}>
              <div className={styles.slideIcon}>{SLIDES[currentSlide].icon}</div>
              <h3 className={styles.slideTitle}>{SLIDES[currentSlide].title}</h3>
              <p className={styles.slideText}>{SLIDES[currentSlide].text}</p>
            </div>

            {/* Footer Navigation */}
            <div className={styles.footer}>
              {/* Back Button */}
              <button 
                className={`${styles.navBtn} ${styles.backBtn}`} 
                onClick={handleBack}
                style={{ visibility: currentSlide === 0 ? 'hidden' : 'visible' }}
              >
                Back
              </button>

              {/* Dot Indicators */}
              <div className={styles.dotsContainer}>
                {SLIDES.map((_, index) => (
                  <span 
                    key={index} 
                    className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>

              {/* Next / Get Started Button */}
              <button 
                className={`${styles.navBtn} ${currentSlide === SLIDES.length - 1 ? styles.startBtn : styles.nextBtn}`} 
                onClick={handleNext}
              >
                {currentSlide === SLIDES.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
