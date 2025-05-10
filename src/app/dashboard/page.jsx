'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link' // Import Link for navigation
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import './dashboard.css' // Import the new dashboard styles
// Import specific icons from lucide-react
import {
  LayoutGrid, FileText, Layers, Settings, LogOut, Bell, Eye,
  CheckSquare, Loader2, Clock3, CalendarDays, Pencil
} from 'lucide-react';
import SettingsContent from './components/SettingsContent'; // Import the new component

// Sample data for recent forms (replace with actual data fetching)
const sampleRecentForms = [
  { id: 1, name: 'W-9 Form', status: 'Completed', lastUpdated: 'Apr 15, 2025' },
  { id: 2, name: '1099-MISC', status: 'In Progress', lastUpdated: 'Apr 12, 2025' },
  { id: 3, name: 'Business License Renewal', status: 'Pending Review', lastUpdated: 'Apr 10, 2025' },
];

// Updated sample data for summary cards with new icon names for reference
const summaryData = [
    { id: 1, title: 'Completed Forms', value: '12', iconName: 'CheckSquare', type: 'completed' },
    { id: 2, title: 'In Progress', value: '5', iconName: 'Loader2', type: 'in-progress' },
    { id: 3, title: 'Pending Review', value: '3', iconName: 'Clock3', type: 'pending-review' },
    { id: 4, title: 'Upcoming Deadlines', value: '2', iconName: 'CalendarDays', type: 'upcoming-deadlines' },
];

const DashboardPage = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [activePage, setActivePage] = useState('Dashboard')

  useEffect(() => {
    let isMounted = true
    const checkUserAndProfile = async () => {
      setAuthError(null)
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

        if (userError || !currentUser) {
          if (userError) console.error('Error fetching user for dashboard:', userError.message)
          if (isMounted) {
            router.push('/') 
          }
          return 
        }
        // User is present
        if (isMounted) setUser(currentUser)

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, has_completed_onboarding') 
          .eq('id', currentUser.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            if (isMounted) {
                router.push('/onboarding')
            }
            return 
          } else {
            throw new Error('Error fetching profile: ' + profileError.message)
          }
        }
        
        if (!userProfile?.has_completed_onboarding) {
           if (isMounted) {
               router.push('/onboarding')
           }
           return
        }

        // All checks passed, user is authenticated and onboarded
        if (isMounted) {
            setProfile(userProfile)
            setLoading(false) // NOW it's safe to show the dashboard
        }

      } catch (err) {
        console.error('Error during dashboard setup:', err)
        if (isMounted) {
            setAuthError(err.message || 'An unexpected error occurred.')
            router.push('/') // Example: redirect to home on critical errors
        }
      }
    }
    checkUserAndProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, _session) => {
        if (!isMounted) return;
        if (_event === 'SIGNED_OUT') {
           setLoading(true); // Set loading to true before redirect to hide content
           router.push('/') 
        } else if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED'){
           setLoading(true); // Re-check, so set loading
           checkUserAndProfile(); 
        }
    });

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
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

  const getAvatarInitial = () => {
    if (profile?.first_name) return profile.first_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U'; // Default
  }

  const renderSummaryIcon = (iconName) => {
    switch (iconName) {
      case 'CheckSquare': return <CheckSquare className="summary-card-icon" />;
      case 'Loader2': return <Loader2 className="summary-card-icon lucide-spin" />; // Add lucide-spin for animation
      case 'Clock3': return <Clock3 className="summary-card-icon" />;
      case 'CalendarDays': return <CalendarDays className="summary-card-icon" />;
      default: return null;
    }
  };

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
              <li><Link href="/dashboard/my-forms" className={activePage === 'My Forms' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('My Forms'); }}><FileText className="sidebar-icon" /> My Forms</Link></li>
              <li><Link href="/dashboard/templates" className={activePage === 'Templates' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActivePage('Templates'); }}><Layers className="sidebar-icon" /> Templates</Link></li>
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
                {summaryData.map(card => (
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
                  <Link href="#" className="view-all-link">View All</Link>
                </div>
                <div className="recent-forms-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Form Name</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRecentForms.map(form => (
                        <tr key={form.id}>
                          <td>{form.name}</td>
                          <td><span className={`status-badge ${form.status.toLowerCase().replace(' ', '-')}`}>{form.status}</span></td>
                          <td>{form.lastUpdated}</td>
                          <td><Link href="#" className="action-view"><Eye className="sidebar-icon" /> View</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activePage === 'Settings' && (
            <SettingsContent user={user} profile={profile} />
          )}

          {/* Placeholder for My Forms content */}
          {activePage === 'My Forms' && (
            <section>
              <h1>My Forms</h1>
              <p>This is where your forms will be listed. (Coming soon)</p>
            </section>
          )}

          {/* Placeholder for Templates content */}
          {activePage === 'Templates' && (
            <section>
              <h1>Templates</h1>
              <p>Browse and manage form templates here. (Coming soon)</p>
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