const ContactSection = () => {
    return (
      <section id="contact" className="contact-section">
        <h2 className="contact-title scroll-trigger">Get in Touch</h2>
        <p className="contact-subtitle scroll-trigger">Have questions? We're here to help.</p>
  
        <div className="contact-container">
          <div className="contact-info scroll-trigger">
            <div className="contact-method">
              <div className="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="contact-details">
                <h3>Email Us</h3>
                <p>support@fillport.com</p>
              </div>
            </div>
  
            <div className="contact-method">
              <div className="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="contact-details">
                <h3>Call Us</h3>
                <p>(555) 123-4567</p>
              </div>
            </div>
  
          </div>
  
          <form className="contact-form scroll-trigger">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Your name" />
            </div>
  
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="Your email" />
            </div>
  
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" rows={4} placeholder="How can we help?"></textarea>
            </div>
  
            <button type="submit" className="contact-submit">
              Send Message
            </button>
          </form>
        </div>
      </section>
    )
  }
  
  export default ContactSection
  