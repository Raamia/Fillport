import React, { useState, useEffect } from 'react';
import './SettingsContent.css'; // We'll create this for styling
import { supabase } from '../../../lib/supabaseClient'; // Assuming supabase client is here for future use

// Mock user data (replace with actual props or context later)
const mockUser = {
  id: 'user123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  billing: {
    cardName: 'John Doe',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'United States',
  },
  subscription: {
    plan: 'pro',
  },
  preferences: {
      emailNotifications: true,
      formUpdates: true,
      newFeatures: true,
      deadlineReminders: true,
      // marketingEmails: false, // Uncomment if needed
  },
};

// Helper to get card type (very basic)
const getCardType = (number) => {
  const patterns = { visa: /^4/, mastercard: /^5[1-5]/, amex: /^3[47]/, discover: /^6(?:011|5)/ };
  for (const [type, pattern] of Object.entries(patterns)) { if (pattern.test(number)) { return type; } }
  return 'generic';
};

const SettingsContent = ({ /* user = mockUser, profile */ }) => {
  // Use mock user for now if props aren't fully wired
  const user = mockUser;

  const [activeTab, setActiveTab] = useState('Billing & Subscription');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Notification States
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailMaster: user?.preferences?.emailNotifications || true,
    formUpdates: user?.preferences?.formUpdates || true,
    deadlineReminders: user?.preferences?.deadlineReminders || true,
    newFeatures: user?.preferences?.newFeatures || true,
  });
  const [notificationMessage, setNotificationMessage] = useState({ type: '', text: '' });
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

  // -- NEW BILLING STATES --
  const [billingInfo, setBillingInfo] = useState({
    cardName: user?.billing?.cardName || "",
    cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    address1: user?.billing?.address1 || "", address2: user?.billing?.address2 || "",
    city: user?.billing?.city || "", state: user?.billing?.state || "",
    zipCode: user?.billing?.zipCode || "", country: user?.billing?.country || "United States",
  });
  const [currentPlan, setCurrentPlan] = useState(user?.subscription?.plan || "pro");
  const [savedCards, setSavedCards] = useState([
    { id: "card_1", cardName: "John Doe", last4: "4242", expiryMonth: "12", expiryYear: "2025", type: "visa", isDefault: true },
    { id: "card_2", cardName: "John Doe", last4: "1234", expiryMonth: "10", expiryYear: "2026", type: "mastercard", isDefault: false },
  ]);
  const [billingHistory, setBillingHistory] = useState([
      { id: 'inv1', date: '2023-04-01', amount: '$9.00', status: 'Paid' },
      { id: 'inv2', date: '2023-03-01', amount: '$9.00', status: 'Paid' },
  ]);
  const [saving, setSaving] = useState(false); // General saving state for billing actions
  const [successMessage, setSuccessMessage] = useState(""); // Success feedback message
  // -- END NEW BILLING STATES --

  // Plan definitions aligned with the NEW spec ($9/mo Basic)
  const availablePlans = [
      { id: 'basic', name: 'Basic', price: '$0', period: '/month', features: ['Up to 10 forms per month','Basic AI autofill','PDF export','Email support'] },
      { id: 'pro', name: 'Pro', price: '$19', period: '/month', features: ['Up to 50 forms per month','Advanced AI autofill','PDF export & editing','Priority support','Form templates'] },
      // Enterprise can be added back if needed
  ];

  useEffect(() => {
    setActiveTab('Billing & Subscription');
  }, []); // Run only once on mount

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setPasswordMessage({ type: '', text: '' }); 
    setNotificationMessage({ type: '', text: '' });
    setSuccessMessage(""); // Clear billing success message
  };

  // --- NEW BILLING HANDLERS ---
  const handleBillingInfoChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleBillingAddressChange = (e) => {
    const { name, value } = e.target;
    setBillingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPaymentMethod = (e) => {
    e.preventDefault();
    setSaving(true); setSuccessMessage("");
    // Basic validation (example)
    if (!billingInfo.cardNumber || billingInfo.cardNumber.length < 15 || !billingInfo.expiryMonth || !billingInfo.expiryYear || !billingInfo.cvv) {
        alert("Please fill in all card details."); // Replace with better UI feedback
        setSaving(false);
        return;
    }
    console.log("Simulating Add Payment Method:", billingInfo);
    setTimeout(() => {
      const newCard = {
        id: `card_${Date.now()}`,
        cardName: billingInfo.cardName,
        last4: billingInfo.cardNumber.slice(-4),
        expiryMonth: billingInfo.expiryMonth,
        expiryYear: billingInfo.expiryYear,
        type: getCardType(billingInfo.cardNumber),
        isDefault: savedCards.length === 0,
      };
      setSavedCards(prev => [...prev.map(c => ({...c, isDefault: newCard.isDefault ? false : c.isDefault})), newCard]); // Add new, ensuring only one default
      setBillingInfo({ cardName: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "" }); // Reset form
      setSuccessMessage("Payment method added successfully!");
      setSaving(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };
  
  const handleSetDefaultCard = (cardId) => {
    if (saving) return;
    console.log("Setting default card:", cardId);
    setSaving(true); setSuccessMessage("");
    setTimeout(() => {
        setSavedCards(prev => prev.map((card) => ({ ...card, isDefault: card.id === cardId })));
        setSuccessMessage("Default payment method updated!");
        setSaving(false);
        setTimeout(() => setSuccessMessage(""), 3000);
    }, 500);
  };
  
  const handleRemoveCard = (cardId) => {
    if (saving) return;
    // Prevent removing the default card if it's the only one?
    const cardToRemove = savedCards.find(c => c.id === cardId);
    if (cardToRemove && cardToRemove.isDefault && savedCards.length <= 1) {
        alert("You cannot remove your only default payment method."); // Replace alert
        return;
    }
    console.log("Removing card:", cardId);
    setSaving(true); setSuccessMessage("");
    setTimeout(() => {
        let newCards = savedCards.filter((card) => card.id !== cardId);
        // If the removed card was default, make the first remaining card default
        if (cardToRemove && cardToRemove.isDefault && newCards.length > 0) {
            newCards[0].isDefault = true;
        }
        setSavedCards(newCards);
        setSuccessMessage("Payment method removed successfully!");
        setSaving(false);
        setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };

  const handleChangePlan = (plan) => {
    if (saving || plan === currentPlan) return;
    console.log("Changing plan to:", plan);
    setSaving(true); setSuccessMessage("");
    setTimeout(() => {
      setCurrentPlan(plan);
      setSuccessMessage(`Your subscription has been changed to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`);
      setSaving(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };
  // --- END NEW BILLING HANDLERS ---

  // ... (handlePasswordUpdate, handleNotificationChange, handleSaveNotificationPreferences functions - simplified below for brevity) ...
  const handlePasswordUpdate = async (e) => { e.preventDefault(); console.log("Password update submitted"); /* Add full logic back */ };
  const handleNotificationChange = (e) => { const { name, checked } = e.target; setNotificationPreferences(prev => ({...prev, [name]:checked})); /* Add full logic back */ };
  const handleSaveNotificationPreferences = async (e) => { if(e) e.preventDefault(); console.log("Save notifications submitted"); /* Add full logic back */ };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'Profile':
        return <div><p>Profile settings content (Coming Soon)</p></div>;
      case 'Password':
        return (
          <form onSubmit={handlePasswordUpdate} className="settings-form password-form">
            <div className="settings-subsection">
              <h3>Change Password</h3>
              <p className="subsection-description">
                For your security, we recommend choosing a strong password that you don't use elsewhere.
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" name="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="newPassword">New Password</label>
                <input type="password" id="newPassword" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group half-width">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input type="password" id="confirmNewPassword" name="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
              </div>
            </div>
            {passwordMessage.text && (
              <div className={`form-message ${passwordMessage.type === 'error' ? 'error' : 'success'}`}>
                {passwordMessage.text}
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isPasswordLoading}>
                {isPasswordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        );
      case 'Notifications':
        return (
          <form className="settings-form notification-settings notification-settings-form" onSubmit={handleSaveNotificationPreferences}>
            <div className="settings-subsection">
                <h3>Notification Settings</h3>
                <p className="subsection-description">
                    Choose how you want to be notified about important activities and updates.
                </p>
            </div>

            {/* Master Toggle - if needed, or remove if individual toggles are enough */}
            {/* <div className="notification-option">
              <div className="notification-text">
                <span className="notification-label">Email Notifications</span>
                <p className="notification-description-small">Receive all email notifications.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="emailMaster" checked={notificationPreferences.emailMaster} onChange={handleNotificationChange} />
                <span className="toggle-slider"></span>
              </label>
            </div> */}

            <div className="notification-option">
              <div className="notification-text">
                <span className="notification-label">Form Updates & Submissions</span>
                <p className="notification-description-small">Get notified about activity on your forms, like new submissions or comments.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="formUpdates" checked={notificationPreferences.formUpdates} onChange={handleNotificationChange} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-option">
              <div className="notification-text">
                <span className="notification-label">Deadline Reminders</span>
                <p className="notification-description-small">Receive reminders for upcoming form deadlines.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="deadlineReminders" checked={notificationPreferences.deadlineReminders} onChange={handleNotificationChange} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-option">
              <div className="notification-text">
                <span className="notification-label">New Features & Announcements</span>
                <p className="notification-description-small">Stay informed about new Fillport features, tips, and important announcements.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="newFeatures" checked={notificationPreferences.newFeatures} onChange={handleNotificationChange} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            {/* Add other notification options here following the pattern */}

            {notificationMessage.text && (
              <div className={`form-message ${notificationMessage.type === 'error' ? 'error' : 'success'}`}>
                {notificationMessage.text}
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isNotificationLoading}>
                {isNotificationLoading ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        );
      
      // --- NEW BILLING & SUBSCRIPTION JSX --- 
      case 'Billing & Subscription':
        return (
          <div className="billing-section"> {/* Using new top-level class */} 
            {/* Subscription Plans Section */} 
            <div className="settings-subsection">
              <h3>Subscription Plan</h3>
              <div className="subscription-plans">
                {availablePlans.map(plan => (
                  <div key={plan.id} className={`plan-card ${currentPlan === plan.id ? "active" : ""}`}> {/* Updated class */} 
                    <div className="plan-header">
                      <h4>{plan.name}</h4>
                      <div className="plan-price">
                        <span className="price">{plan.price}</span>
                        <span className="period">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="plan-features">
                      {plan.features.map((feature, index) => <li key={index}>{feature}</li>)}
                    </ul>
                    {currentPlan === plan.id ? (
                      <button className="current-plan-button" disabled>Current Plan</button>
                    ) : (
                      <button className="change-plan-button" onClick={() => handleChangePlan(plan.id)} disabled={saving}>
                        {saving ? "Processing..." : `Switch to ${plan.name}`}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Section */} 
            <div className="payment-methods-section settings-subsection">
              <h3>Payment Methods</h3>
              <p className="section-description">Manage your payment methods for subscription billing</p>
              {savedCards.length > 0 && (
                <div className="saved-cards">
                  {savedCards.map((card) => (
                    <div key={card.id} className={`saved-card ${card.isDefault ? "default" : ""}`}>
                      <div className="card-info">
                        <span className="card-type">{card.type.charAt(0).toUpperCase() + card.type.slice(1)}</span>
                        <span className="card-last4">**** **** **** {card.last4}</span>
                        <span className="card-expiry">Expires {card.expiryMonth}/{card.expiryYear}</span>
                        {card.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <div className="card-actions">
                        {!card.isDefault && (
                          <button onClick={() => handleSetDefaultCard(card.id)} disabled={saving}>Set as Default</button>
                        )}
                        <button onClick={() => handleRemoveCard(card.id)} disabled={saving || (card.isDefault && savedCards.length <= 1)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="add-payment-method">
                <h4>Add Payment Method</h4>
                <form className="payment-form settings-form" onSubmit={handleAddPaymentMethod}>
                  <div className="form-group">
                      <label htmlFor="cardName">Name on Card</label>
                      <input type="text" id="cardName" name="cardName" value={billingInfo.cardName} onChange={handleBillingInfoChange} required />
                  </div>
                  <div className="form-group">
                      <label htmlFor="cardNumber">Card Number</label>
                      <input type="text" id="cardNumber" name="cardNumber" value={billingInfo.cardNumber} onChange={handleBillingInfoChange} pattern="[0-9]{13,16}" title="Enter a valid card number" required />
                  </div>
                  <div className="form-row three-columns"> {/* Example class for layout */} 
                      <div className="form-group">
                          <label htmlFor="expiryMonth">Expiry Month (MM)</label>
                          <input type="text" id="expiryMonth" name="expiryMonth" value={billingInfo.expiryMonth} onChange={handleBillingInfoChange} pattern="(0[1-9]|1[0-2])" title="Enter MM" required />
                      </div>
                      <div className="form-group">
                          <label htmlFor="expiryYear">Expiry Year (YYYY)</label>
                          <input type="text" id="expiryYear" name="expiryYear" value={billingInfo.expiryYear} onChange={handleBillingInfoChange} pattern="20[2-9][0-9]" title="Enter YYYY (e.g., 2025)" required />
                      </div>
                      <div className="form-group">
                          <label htmlFor="cvv">CVV</label>
                          <input type="text" id="cvv" name="cvv" value={billingInfo.cvv} onChange={handleBillingInfoChange} pattern="[0-9]{3,4}" title="Enter 3 or 4 digit CVV" required />
                      </div>
                  </div>
                  {/* Address fields can be added here if needed, or assumed to be same as profile */}
                  <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Adding..." : "Add Payment Method"}</button>
                  </div>
                </form>
              </div>
            </div>

            {/* Billing History Section */} 
            <div className="billing-history-section settings-subsection">
              <h3>Billing History</h3>
              <p className="section-description">View and download your past invoices</p>
              <div className="invoice-table">
                <div className="invoice-table-header">
                  <div className="invoice-cell">Invoice</div> <div className="invoice-cell">Date</div> <div className="invoice-cell">Amount</div> <div className="invoice-cell">Status</div> <div className="invoice-cell">Actions</div>
                </div>
                <div className="invoice-table-body">
                  {billingHistory.map(invoice => (
                    <div key={invoice.id} className="invoice-row">
                      <div className="invoice-cell" data-label="Invoice">#{invoice.id}</div>
                      <div className="invoice-cell" data-label="Date">{invoice.date}</div>
                      <div className="invoice-cell" data-label="Amount">{invoice.amount}</div>
                      <div className="invoice-cell" data-label="Status"><span className={`status-badge status-${invoice.status.toLowerCase()}`}>{invoice.status}</span></div>
                      <div className="invoice-cell" data-label="Actions"><button className="btn-text" disabled>Download</button></div>
                    </div>
                  ))}
                  {billingHistory.length === 0 && <p>No billing history found.</p>}
                </div>
              </div>
            </div>

            {/* Cancel Subscription Section */} 
            <div className="cancel-subscription-section settings-subsection">
                <h3>Cancel Subscription</h3>
                <p className="section-description">You can cancel your subscription at any time. Your plan will remain active until the end of your billing period.</p>
                <button className="cancel-subscription-button" disabled>Cancel Subscription</button>
            </div>

            {/* Success Message Area */} 
            {successMessage && ( <div className="success-message">{successMessage}</div> )}

          </div> // End billing-section
        );
        // --- END NEW BILLING & SUBSCRIPTION JSX ---
        
      default:
        return null;
    }
  };

  return (
    <section className="settings-page-content styled-settings">
      <header className="settings-header"><h1>Account Settings</h1><p>Manage your account information and preferences</p></header>
      <nav className="settings-tabs">
        {['Profile', 'Password', 'Notifications', 'Billing & Subscription'].map(tab => (
          <button key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => handleTabClick(tab)}>{tab}</button>
        ))}
      </nav>
      <div className="settings-tab-content">
        {renderTabContent()}
      </div>
    </section>
  );
};

export default SettingsContent; 

//Fillport acts like a "Common App" for common administrative and government forms. Enter your information once into a secure profile, and Fillport will automatically populate various standard forms for you, saving significant time and reducing mis
