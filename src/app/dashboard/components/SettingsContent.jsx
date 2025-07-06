import React, { useState, useEffect } from 'react';
import './SettingsContent.css'; // We'll create this for styling
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient'; // Corrected path to supabaseClient

const SettingsContent = ({ user, profile }) => {
  console.log("Render SettingsContent - User:", user); // ADDED FOR DEBUGGING
  console.log("Render SettingsContent - Profile:", profile); // ADDED FOR DEBUGGING

  const [activeTab, setActiveTab] = useState('Profile');

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
    } else {
        // Fallback if user/profile is not available (e.g., initial load, or if not logged in)
        setNotificationPreferences({ emailMaster: true, formUpdates: true, deadlineReminders: true, newFeatures: true});
    }
  }, [user, profile]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setPasswordMessage({ type: '', text: '' }); 
    setNotificationMessage({ type: '', text: '' });
  };

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
      

        
      default:
        return null;
    }
  };

  return (
    <section className="settings-page-content styled-settings">
      <header className="settings-header"><h1>Account Settings</h1><p>Manage your account information and preferences</p></header>
      <nav className="settings-tabs">
        {['Profile', 'Password', 'Notifications'].map(tab => (
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
 