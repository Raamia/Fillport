"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
// Import the CSS files directly from the project
import "./HomePage.css"
import "./AdditionalStyles.css"
import PricingSection from "./PricingSection"
import ContactSection from "./ContactSection"

const HomePage = () => {
  const router = useRouter()

  const navigateToLogin = () => {
    router.push("/login")
  }

  const navigateToSignup = () => {
    router.push("/signup")
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate")
            observer.unobserve(entry.target) // Stop observing once animated
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      },
    )

    // Observe all elements with scroll-trigger class
    document.querySelectorAll(".scroll-trigger").forEach((element) => {
      observer.observe(element)
    })

    // Handle the scroll arrow fade effect
    const handleScroll = () => {
      const scrollArrow = document.querySelector(".scroll-arrow")
      if (scrollArrow) {
        const scrollPosition = window.scrollY
        const opacity = Math.max(0.3, 1 - scrollPosition / 500)
        scrollArrow.style.opacity = opacity
      }
    }

    // Add smooth scrolling for anchor links
    const handleNavClick = (e) => {
      const href = e.currentTarget.getAttribute("href")
      if (href && href.startsWith("#")) {
        e.preventDefault()
        const targetElement = document.querySelector(href)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" })
        }
      }
    }

    // Add click event listeners to all navigation links
    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", handleNavClick)
    })

    window.addEventListener("scroll", handleScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
      document.querySelectorAll(".nav-links a").forEach((link) => {
        link.removeEventListener("click", handleNavClick)
      })
    }
  }, [])

  return (
    <div className="home-container">
      {/* Header / Navigation */}
      <header className="nav-header">
        <div className="nav-left">
          <div className="logo">
            <img src="weblogo.png" alt="Fillport Logo" className="logo-img" />
            Fillport
          </div>
          <nav>
            <ul className="nav-links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#process-section">How It Works</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="nav-right">
          <button className="sign-in-btn" onClick={navigateToLogin}>
            Log in
          </button>
          <button className="demo-btn header-demo-btn" onClick={navigateToSignup}>
            Try It Now
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="hero-section">
        <div className="hero-text">
          <h1 className="hero-title">
            The forms that <span className="highlight">fill themselves</span>
            <span className="highlight">.</span>
          </h1>
          <p className="hero-subtitle">
            The fastest way to handle government forms. AI-powered autofill, seamless PDFs, and one-click submissions
            with zero hassle.
          </p>
          <div className="hero-cta">
            <button className="try-btn" onClick={navigateToSignup}>
              Try it Now <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </main>

      <div className="boost-section">
        <h2 className="boost-title scroll-trigger">
          Spend <span className="highlight">80%</span> less time on government paperwork
        </h2>
        <p className="boost-subtitle scroll-trigger">Automate, reduce errors, and finalize forms in minutes.</p>
      </div>

      <div className="scroll-indicator">
        <svg className="scroll-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="features-title scroll-trigger">If there's a form, there's a faster way</h2>
        <p className="features-subtitle scroll-trigger">
          Use Fillport's AI to eliminate busywork and get your paperwork done in record time.
        </p>

        <div className="features-grid">
          <div className="feature-card scroll-trigger">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>One-Click Autofill</h3>
            <p>
              Stop typing the same details over and over. Our AI populates every relevant field from your stored data.
            </p>
          </div>

          <div className="feature-card scroll-trigger">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>Smart PDF Parsing</h3>
            <p>No more wrestling with clunky government PDFs. We handle all formatting so you can focus on accuracy.</p>
          </div>

          <div className="feature-card scroll-trigger">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3>Compliance Checks</h3>
            <p>
              Prevent rejections and penalties. Our system flags missing fields or mismatched data before you submit.
            </p>
          </div>

          <div className="feature-card scroll-trigger">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3>Secure E-Sign</h3>
            <p>No printing, no scanning, no hassle. Sign forms digitally and send them off in seconds.</p>
          </div>

          <div className="feature-card scroll-trigger">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3>Data Vault</h3>
            <p>
              Safely store personal and business info in an encrypted profile, ready for quick reuse on future forms.
            </p>
          </div>

          <div className="feature-card scroll-trigger">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Deadline Alerts</h3>
            <p>
              Never miss a filing date again. Get automated reminders and notifications for every important submission.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section id="process-section" className="process-section">
        <h2 className="process-title scroll-trigger">Simple 3-Step Process</h2>
        <p className="process-subtitle scroll-trigger">Get started with Fillport in just 3 days</p>

        <div className="process-steps">
          <div className="process-step scroll-trigger">
            <div className="step-number">01</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3>Account Setup</h3>
            <p>Create your secure profile and store all personal or business details for effortless reuse</p>
          </div>

          <div className="process-step scroll-trigger">
            <div className="step-number">02</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>AI Autofill</h3>
            <p>Upload or pick any government form. We identify each field and fill it automatically</p>
          </div>

          <div className="process-step scroll-trigger">
            <div className="step-number">03</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Easy Submission</h3>
            <p>Quickly confirm your data, ensure accuracy, and finalize forms directly from your dashboard</p>
          </div>
        </div>
      </section>

      {/* Add the Pricing and Contact sections */}
      <PricingSection />
      <ContactSection />
    </div>
  )
}

export default HomePage
