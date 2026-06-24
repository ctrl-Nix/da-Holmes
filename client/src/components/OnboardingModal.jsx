import React, { useState, useEffect } from 'react';
import styles from './OnboardingModal.module.css';

const SLIDES = [
  {
    icon: '🕵️',
    title: 'Welcome to Holmes',
    text: 'Your enterprise-grade OSINT platform for passive reconnaissance, threat intelligence, and digital footprint analysis.',
  },
  {
    icon: '🔍',
    title: 'Unified Scanner',
    text: 'Drop any target — username, domain, IP, email, or Bitcoin address — into the Unified Scanner and Holmes maps its entire digital surface in one pass.',
  },
  {
    icon: '',
    title: 'Deep Dive Tools',
    text: 'Use specialised modules for DNS history, dark web scans, SSL inspection, social footprinting, IoT exposure, metadata forensics, and 20+ more.',
  },
  {
    icon: '',
    title: 'Workspace & Reports',
    text: 'Save findings to your Workspace, add analyst notes, tag targets, and export professional PDF intelligence reports in one click.',
  },
];

const STORAGE_KEY = 'holmes-onboarding-seen';

const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
    setStep(0);
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleOpen = () => {
    setStep(0);
    setOpen(true);
  };

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <>
      {/* Floating help button — always visible */}
      <button
        className={styles.helpButton}
        onClick={handleOpen}
        title="Help / Tour"
        aria-label="Open onboarding tour"
      >
        ?
      </button>

      {/* Modal */}
      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Onboarding tour">
          <div className={styles.card}>
            {/* Skip */}
            <button className={styles.skipBtn} onClick={handleClose}>
              Skip
            </button>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.logo}></div>
              <h1 className={styles.mainTitle}>Holmes OSINT</h1>
              <p className={styles.mainSubtitle}>Open Source Intelligence Platform</p>
            </div>

            {/* Slide body */}
            <div className={styles.slideBody} key={step}>
              <div className={styles.slideIcon}>{slide.icon}</div>
              <h2 className={styles.slideTitle}>{slide.title}</h2>
              <p className={styles.slideText}>{slide.text}</p>
            </div>

            {/* Footer: dots + nav */}
            <div className={styles.footer}>
              {/* Back */}
              <button
                className={`${styles.navBtn} ${styles.backBtn}`}
                onClick={handleBack}
                disabled={step === 0}
                style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
              >
                ← Back
              </button>

              {/* Dots */}
              <div className={styles.dotsContainer} aria-label="Slide progress">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === step ? styles.activeDot : ''}`}
                    onClick={() => setStep(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Next / Get Started */}
              <button
                className={`${styles.navBtn} ${isLast ? styles.startBtn : styles.nextBtn}`}
                onClick={handleNext}
              >
                {isLast ? 'Get Started →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnboardingModal;
