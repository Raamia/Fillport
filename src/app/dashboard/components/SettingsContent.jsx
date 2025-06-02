import React, { useState, useEffect } from 'react';
import './SettingsContent.css'; // We'll create this for styling
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient'; // Corrected path to supabaseClient

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
    plan: 'Pro',
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

const SettingsContent = ({ user, profile }) => {
  // Use mock user for now if props aren't fully wired
  // const userData = user || mockUser; // Let's try to use user and profile directly

  console.log("Render SettingsContent - User:", user); // ADDED FOR DEBUGGING
  console.log("Render SettingsContent - Profile:", profile); // ADDED FOR DEBUGGING

  const STRIPE_PAYMENT_LINK_PRO = "https://buy.stripe.com/test_8x228r114fJA0Mp1SBcjS00";

  const availablePlans = [
      { id: 'basic', name: 'Basic', price: '$0', period: '/month', features: ['Up to 10 forms per month','Basic AI autofill','PDF export','Email support'] },
      { id: 'Pro', name: 'Pro', price: '$19', period: '/month', features: ['Up to 50 forms per month','Advanced AI autofill','PDF export & editing','Priority support','Form templates'] },
  ];

  const [activeTab, setActiveTab] = useState('Billing & Subscription');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Notification States - Initialized empty, to be populated by useEffect
  const [notificationPreferences, setNotificationPreferences] = useState({});
  const [notificationMessage, setNotificationMessage] = useState({ type: '', text: '' });
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

  // Billing States - Initialized with defaults, to be populated by useEffect
  const [billingInfo, setBillingInfo] = useState({ cardName: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "" });
  const [billingAddress, setBillingAddress] = useState({ address1: "", address2: "", city: "", state: "", zipCode: "", country: "United States" });
  const [currentPlan, setCurrentPlan] = useState("basic"); // Default, will be updated from profile
  const [savedCards, setSavedCards] = useState([]); // Default, will be updated from profile
  const [billingHistory, setBillingHistory] = useState([]); // Default, will be updated from profile
  const [saving, setSaving] = useState(false); 
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    console.log("useEffect [user, profile] triggered in SettingsContent.");
    console.log("useEffect - User:", user);
    console.log("useEffect - Profile:", profile);

    if (user && profile) {
        setNotificationPreferences({
            emailMaster: profile.preferences?.emailNotifications !== undefined ? profile.preferences.emailNotifications : true,
            formUpdates: profile.preferences?.formUpdates !== undefined ? profile.preferences.formUpdates : true,
            deadlineReminders: profile.preferences?.deadlineReminders !== undefined ? profile.preferences.deadlineReminders : true,
            newFeatures: profile.preferences?.newFeatures !== undefined ? profile.preferences.newFeatures : true,
        });
        setBillingInfo(prev => ({
            ...prev,
            cardName: profile.billing?.cardName || "",
        }));
        setBillingAddress(prev => ({
            ...prev,
            address1: profile.billing?.address1 || "", 
            address2: profile.billing?.address2 || "",
            city: profile.billing?.city || "", 
            state: profile.billing?.state || "",
            zipCode: profile.billing?.zipCode || "", 
            country: profile.billing?.country || "United States",
        }));
        setCurrentPlan(profile.current_subscription_plan || "basic");
        setSavedCards(profile.billing?.savedCards || []); 
        setBillingHistory(profile.billing?.billingHistory || []);
    } else {
        // Fallback if user/profile is not available (e.g., initial load, or if not logged in)
        setCurrentPlan("basic");
        setNotificationPreferences({ emailMaster: true, formUpdates: true, deadlineReminders: true, newFeatures: true});
        setBillingInfo({ cardName: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "" });
        setBillingAddress({ address1: "", address2: "", city: "", state: "", zipCode: "", country: "United States" });
        setSavedCards([]);
        setBillingHistory([]);
    }
  }, [user, profile]);

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

  const handleChangePlan = async (planId) => {
    if (saving || planId === currentPlan || (planId === 'Pro' && currentPlan === 'Pro')) return;
    
    if (planId === 'Pro') {
        handleUpgradeToProViaPaymentLink();
        return;
    }

    // Handle downgrade to Basic
    if (planId === 'basic' && currentPlan === 'Pro') {
      setSaving(true);
      setSuccessMessage("");

      try {
        const response = await fetch('/api/stripe/cancel-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to cancel subscription');
        }

        setSuccessMessage("Your subscription will be canceled at the end of the billing period.");
        // Don't update currentPlan yet - it will be updated by the webhook when the cancellation takes effect
      } catch (error) {
        console.error('Error canceling subscription:', error);
        toast.error(error.message || 'Failed to cancel subscription');
      } finally {
        setSaving(false);
      }
      return;
    }

    // Handle other plan changes if needed
    console.log("Changing plan to:", planId);
    setSaving(true); 
    setSuccessMessage("");
    setTimeout(() => {
      setCurrentPlan(planId);
      setSuccessMessage(`Your subscription has been changed to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan`);
      setSaving(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };
  // --- END NEW BILLING HANDLERS ---

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'All password fields are required.' });
      setIsPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      setIsPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      setIsPasswordLoading(false);
      return;
    }

    if (!user || !user.email) {
        setPasswordMessage({ type: 'error', text: 'User email not found. Cannot verify current password.' });
        setIsPasswordLoading(false);
        return;
    }

    try {
      // Step 1: Verify current password by attempting to sign in with it.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        // Check for specific invalid credentials error, though Supabase might return a generic one.
        // For now, any error here implies the current password was incorrect.
        console.error("Current password verification failed:", signInError);
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect. Please try again.' });
        setIsPasswordLoading(false);
        return;
      }

      // Step 2: If current password verification is successful, update to the new password.
      // The session is already refreshed by the successful signInWithPassword.
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        throw updateError; // Let the generic catch block handle this.
      }

      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password updated successfully!');

    } catch (error) {
      console.error("Error during password update process:", error);
      // More specific error for the update itself if it failed after successful verification
      const errorMessage = error.message.includes('AuthApiError') || error.message.includes('credentials incorrect') 
                           ? 'Current password is incorrect. Please try again.' 
                           : error.message || 'Failed to update password. Please try again.';
      setPasswordMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleNotificationChange = (e) => { 
    const { name, checked } = e.target; 
    setNotificationPreferences(prev => ({...prev, [name]:checked})); 
    // No immediate save, relies on Save Preferences button
  };
  
  const handleSaveNotificationPreferences = async (e) => { 
    if(e) e.preventDefault(); 
    if (!user || !profile) {
      setNotificationMessage({ type: 'error', text: 'User profile not loaded.' });
      return;
    }
    setIsNotificationLoading(true);
    setNotificationMessage({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: notificationPreferences })
        .eq('id', user.id);
      if (error) throw error;
      setNotificationMessage({ type: 'success', text: 'Notification preferences saved!' });
      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setNotificationMessage({ type: 'error', text: error.message || 'Failed to save preferences.' });
      toast.error(error.message || 'Failed to save preferences.');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const handleUpgradeToProViaPaymentLink = () => {
    if (!user || !user.id || !user.email) {
      alert("User information not available. Please ensure you are logged in and try again.");
      setSaving(false);
      return;
    }
    setSaving(true); 
    setSuccessMessage("Redirecting to Stripe...");

    const params = new URLSearchParams({
      client_reference_id: user.id,
      prefilled_email: user.email,
    });
    const paymentLinkUrl = `${STRIPE_PAYMENT_LINK_PRO}?${params.toString()}`;
    window.location.href = paymentLinkUrl; 
  };

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
                  <div key={plan.id} className={`plan-card ${currentPlan === plan.id ? "active" : ""} ${plan.id === 'Pro' && currentPlan !== 'Pro' ? "pro-upgrade-card" : ""}`}> {/* Updated class */} 
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
                      <button className="current-plan-button" disabled>{plan.id === 'Pro' ? 'Pro Plan Active' : 'Current Plan'}</button>
                    ) : (
                      <button 
                        className={`change-plan-button ${plan.id === 'Pro' ? 'btn-primary' : ''}`} 
                        onClick={() => handleChangePlan(plan.id)} 
                        disabled={saving || (plan.id === 'Pro' && currentPlan === 'Pro')}
                      >
                        {plan.id === 'Pro' ? 
                            (saving ? "Redirecting to Stripe..." : "Upgrade to Pro") : 
                            (saving ? "Processing..." : `Switch to ${plan.name}`)
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Success Message Area */} 
            {successMessage && ( <div className={`form-message ${saving ? 'neutral' : 'success'}`}>{successMessage}</div> )}

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
 