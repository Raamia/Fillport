'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link' // Import Link for navigation
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import './dashboard.css' // Import the new dashboard styles
// Import specific icons from lucide-react
import {
  LayoutGrid, FileText, Layers, Settings, LogOut, Bell, Eye,
  CheckSquare, Loader2, Clock3, CalendarDays, Pencil,
  Sparkles, Activity // Added Activity icon
} from 'lucide-react';
import SettingsContent from './components/SettingsContent'; // Import the new component
import { formTemplates } from '../../lib/forms'; // Import form templates

// Sample data for recent forms (replace with actual data fetching)
const sampleRecentForms = [
  { id: 1, name: 'W-9 Form', status: 'Completed', lastUpdated: 'Apr 15, 2025' },
  { id: 2, name: '1099-MISC', status: 'In Progress', lastUpdated: 'Apr 12, 2025' },
  { id: 3, name: 'Business License Renewal', status: 'Pending Review', lastUpdated: 'Apr 10, 2025' },
];

const DashboardPage = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [activePage, setActivePage] = useState('Dashboard')

  const [recentForms, setRecentForms] = useState([]); // For actual display
  const [loadingRecentForms, setLoadingRecentForms] = useState(true);

  // State for dynamic summary counts
  const [summaryCounts, setSummaryCounts] = useState({
    completed: 0,
    inProgress: 0,
    pendingReview: 0, // Static for now
    upcomingDeadlines: 0, // Static for now
  });
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Helper function to capitalize status text
  const capitalizeStatus = (statusString) => {
    if (!statusString) return '';
    return statusString
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async (currentUserId) => {
      if (!isMounted) return;
      setLoadingRecentForms(true);
      setLoadingCounts(true);

      try {
        const { data: activity, error: activityError } = await supabase
          .from('user_form_activity')
          .select('form_template_id, last_accessed_at, status')
          .eq('user_id', currentUserId)
          .order('last_accessed_at', { ascending: false })
          .limit(5); // Get latest 5 accessed forms

        if (activityError) throw activityError;

        if (activity) {
          const enrichedForms = activity.map(act => {
            const template = formTemplates.find(t => t.id === act.form_template_id);
            return {
              ...act, // includes form_template_id, last_accessed_at, status
              name: template ? template.name : 'Unknown Form', // Get name from formTemplates
              // id for key can be form_template_id if unique enough for this list
            };
          });
          if (isMounted) setRecentForms(enrichedForms);
        }

        // Fetch form statuses to count them client-side
        const { data: statusData, error: countsError } = await supabase
          .from('user_form_activity')
          .select('status') // Only select status, we will count client-side
          .eq('user_id', currentUserId)
          .in('status', ['completed', 'in progress']); 
        
        if (countsError) throw countsError;

        let completedCount = 0;
        let inProgressCount = 0;
        if (statusData) { // Use statusData here
            statusData.forEach(item => {
                if (item.status === 'completed') completedCount++;
                if (item.status === 'in progress') inProgressCount++;
            });
        }

        if (isMounted) {
          setSummaryCounts(prev => ({
            ...prev,
            completed: completedCount,
            inProgress: inProgressCount,
          }));
        }

      } catch (error) {
        console.error('Error fetching dashboard data (activity/counts):', error.message);
      } finally {
        if (isMounted) {
          setLoadingRecentForms(false);
          setLoadingCounts(false);
        }
      }
    };

    const checkUserAndProfile = async () => {
      if (!isMounted) return;
      setAuthError(null)
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError || !currentUser) {
          if (userError) console.error('Error fetching user:', userError.message)
          if (isMounted) router.push('/') 
          return 
        }
        if (isMounted) setUser(currentUser)

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            if (isMounted) router.push('/onboarding')
            return 
          } else throw new Error('Profile fetch error: ' + profileError.message)
        }
        
        if (!userProfile?.has_completed_onboarding) {
           if (isMounted) router.push('/onboarding')
           return
        }

        if (isMounted) {
            setProfile(userProfile)
            setLoading(false) // Main page loading false
            fetchDashboardData(currentUser.id); // Fetch all dashboard specific data
        }

      } catch (err) {
        console.error('Dashboard setup error:', err.message)
        if (isMounted) {
            setAuthError(err.message || 'Unexpected error')
            // Consider if setLoading(false) should be here or if redirect implies loading is over
            router.push('/') 
        }
      }
    }
    checkUserAndProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT') {
           setLoading(true); 
           router.push('/') 
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
           setLoading(true); 
           checkUserAndProfile(); 
        }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    }
  }, [router])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error logging out:', error)
      alert('Error logging out: ' + error.message)
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (templateId) => {
    if (!user) {
      console.error('User not available to record form activity.');
      return;
    }
    try {
      const { data: existingActivity, error: fetchError } = await supabase
        .from('user_form_activity')
        .select('status')
        .eq('user_id', user.id)
        .eq('form_template_id', templateId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for a new form access
        console.error('Error fetching existing form activity status:', fetchError.message);
        // Proceed with navigation even if fetch fails, but don't upsert status blindly
      } else {
        // If the form is already 'completed', do not revert its status to 'in progress' when just viewing.
        // If it's not completed, or doesn't exist, then set/update to 'in progress'.
        const currentStatus = existingActivity?.status;
        if (currentStatus !== 'completed') {
          const { error: activityError } = await supabase
            .from('user_form_activity')
            .upsert({
              user_id: user.id,
              form_template_id: templateId,
              last_accessed_at: new Date().toISOString(),
              status: 'in progress' // Set status to in progress
            }, {
              onConflict: 'user_id, form_template_id'
            });

          if (activityError) {
            console.error('Error recording/updating form activity to in progress:', activityError.message);
          }
        }
      }
    } catch (e) {
      console.error('Client-side error in handleSelectTemplate:', e.message);
    }
    router.push(`/dashboard/fill/${templateId}`);
  };

  const getAvatarInitial = () => {
    if (profile?.first_name) return profile.first_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U'; // Default
  }

  const renderSummaryIcon = (iconName) => {
    switch (iconName) {
      case 'CheckSquare': return <CheckSquare className="summary-card-icon" />;
      case 'Activity': return <Activity className="summary-card-icon" />;
      case 'Clock3': return <Clock3 className="summary-card-icon" />;
      case 'CalendarDays': return <CalendarDays className="summary-card-icon" />;
      default: return null;
    }
  };

  // ---- Dynamically create summaryData for rendering ----
  const dynamicSummaryData = [
    { id: 1, title: 'Completed Forms', value: summaryCounts.completed, iconName: 'CheckSquare', type: 'completed' },
    { id: 2, title: 'In Progress', value: summaryCounts.inProgress, iconName: 'Activity', type: 'in-progress' },
    { id: 3, title: 'Pending Review', value: summaryCounts.pendingReview, iconName: 'Clock3', type: 'pending-review' }, // Remains static for now
    { id: 4, title: 'Upcoming Deadlines', value: summaryCounts.upcomingDeadlines, iconName: 'CalendarDays', type: 'upcoming-deadlines' }, // Remains static for now
  ];

  if (loading) { // Simplified main loading check
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  if (authError) { // If authError is set, something went wrong during setup
    return <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}><h1>Error</h1><p>{authError}</p><Link href="/">Go Home</Link></div>;
  }
  // Display loading state while checking auth OR if authError and redirecting
  if (loading || (authError && !profile)) { // Show loading if genuinely loading, or if error means no profile to show
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' }}>
        Loading...
      </div>
    )
  }

  // If there was an error AFTER a profile might have been partially loaded, but something went wrong
  // This case is less likely if redirects happen promptly
  if (authError && profile) { // An error occurred, but we might have some stale profile data
    return (
       <div style={{ padding: '40px', color: 'red', textAlign: 'center' }}>
         <h1>Error</h1>
         <p>Could not fully load dashboard: {authError}</p>
         <p><Link href="/">Go to Homepage</Link></p>
       </div>
    )
  }
  
  // Only render the dashboard if loading is false AND user & profile are set AND no critical authError that prevented loading profile
  if (!loading && user && profile && !authError) {
    return (
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            {/* === UPDATED LOGO SOURCE === */}
            <img src="/weblogo.png" alt="Fillport Logo" onError={(e) => { e.target.style.display='none'; const s = document.createElement('span'); s.textContent='[Logo]'; e.target.parentNode.insertBefore(s, e.target); } } /> 
            <span>Fillport</span>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li><Link href="/dashboard" className={activePage === 'Dashboard' ? 'active' : ''} onClick={() => setActivePage('Dashboard')}><LayoutGrid className="sidebar-icon" /> Dashboard</Link></li>
              <li><Link href="/dashboard/templates" className={activePage === 'My Forms' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('My Forms'); }}><Layers className="sidebar-icon" /> My Forms</Link></li>
              <li><Link href="/dashboard/settings" className={activePage === 'Settings' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('Settings'); }}><Settings className="sidebar-icon" /> Settings</Link></li>
            </ul>
          </nav>
          <div className="sidebar-logout">
            <button onClick={handleLogout} disabled={loading /* Or a new isLoggingOut state */}>
              <LogOut className="sidebar-icon" /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Header Bar */}
          <header className="header-bar">
            <div className="search-bar">
              <input type="text" placeholder="Search forms..." />
            </div>
            <div className="user-dropdown">
              <div className="header-user">
                <div className="user-avatar">{getAvatarInitial()}</div>
                <div className="user-info">
                  <span className="user-name">{profile?.first_name || 'User'} {profile?.last_name || ''}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
              </div>
              <div className="dropdown-menu">
                <Link href="/profile/edit" className="dropdown-item">
                  <Pencil className="dropdown-icon" /> Edit Profile
                </Link>
                <button onClick={handleLogout} className="dropdown-item">
                  <LogOut className="dropdown-icon" /> Logout
                </button>
              </div>
            </div>
          </header>

          {/* Conditional Rendering based on activePage */}
          {activePage === 'Dashboard' && (
            <>
              <section className="welcome-section">
                <h1>Welcome to your dashboard</h1>
                <p>Track, manage, and complete your forms all in one place</p>
              </section>
              <section className="summary-cards">
                {loadingCounts ? <p>Loading counts...</p> : dynamicSummaryData.map(card => (
                  <div key={card.id} className={`summary-card ${card.type}`}>
                    <div className="icon-container">
                      {renderSummaryIcon(card.iconName)}
                    </div>
                    <div className="info">
                      <h3>{card.value}</h3>
                      <p>{card.title}</p>
                    </div>
                  </div>
                ))}
              </section>
              <section className="recent-forms">
                <div className="recent-forms-header">
                  <h2>Recent Forms</h2>
                  {/* View All link can be conditional or link to a new page later */}
                  {!loadingRecentForms && recentForms.length > 0 && <Link href="#" className="view-all-link">View All</Link>}
                </div>
                {loadingRecentForms ? (
                  <p>Loading recent forms...</p>
                ) : recentForms.length > 0 ? (
                  <div className="recent-forms-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Form Name</th>
                          <th>Status</th>
                          <th>Last Accessed</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentForms.map(form => (
                          <tr key={form.form_template_id}>
                            <td>{form.name}</td>
                            <td><span>{capitalizeStatus(form.status)}</span></td>
                            <td>{new Date(form.last_accessed_at).toLocaleDateString()}</td>
                            <td><Link href={`/dashboard/fill/${form.form_template_id}`} className="action-view"><Eye className="sidebar-icon" /> View</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>You have not accessed any forms yet. Select one from "My Forms" to get started.</p>
                )}
              </section>
            </>
          )}

          {activePage === 'Settings' && (
            <SettingsContent user={user} profile={profile} />
          )}

          {/* Content for the new "My Forms" tab (which was previously "Templates") */}
          {activePage === 'My Forms' && (
            <section className="templates-section"> {/* Use existing class for styling */}
              <div className="templates-header">
                <h1>My Forms</h1> {/* Changed title text */}
                <p>Select a form to begin auto-filling with your profile information.</p>
              </div>
              <div className="templates-grid">
                {formTemplates.map(template => (
                  <div key={template.id} className="template-card">
                    <div className="template-card-header">
                      <Layers className="template-icon" /> {/* Generic icon for now */}
                      <h3>{template.name}</h3>
                    </div>
                    <p className="template-description">{template.description}</p>
                    <button 
                      className="btn-primary template-select-button"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      Start Form
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>
    )
  }
  
  // Fallback for any other state (should ideally not be reached if logic is correct)
  // or if authError occurred but we decided not to render a specific error message above.
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' }}>
        Checking authentication...
    </div>
  );
}

export default DashboardPage