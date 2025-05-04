const PricingSection = () => {
    return (
      <section id="pricing" className="pricing-section">
        <h2 className="pricing-title scroll-trigger">Simple, Transparent Pricing</h2>
        <p className="pricing-subtitle scroll-trigger">Choose the plan that works best for you</p>
  
        <div className="pricing-cards">
          <div className="pricing-card scroll-trigger">
            <div className="pricing-header">
              <h3>Free</h3>
              <div className="pricing-amount">
                <span className="currency">$</span>
                <span className="amount">0</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>Up to 10 forms per month</li>
              <li>Basic AI autofill</li>
              <li>PDF export</li>
              <li>Email support</li>
            </ul>
            <button className="pricing-cta">Get Started</button>
          </div>
  
          <div className="pricing-card featured scroll-trigger">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-header">
              <h3>Pro</h3>
              <div className="pricing-amount">
                <span className="currency">$</span>
                <span className="amount">19</span>
                <span className="period">/month</span>
              </div>
              <div className="free-trial-badge">14-day free trial</div>
            </div>
            <ul className="pricing-features">
              <li>Up to 50 forms per month</li>
              <li>Advanced AI autofill</li>
              <li>PDF export & editing</li>
              <li>Priority support</li>
              <li>Form templates</li>
            </ul>
            <button className="pricing-cta">Start Free Trial</button>
          </div>
        </div>
      </section>
    )
  }
  
  export default PricingSection
  