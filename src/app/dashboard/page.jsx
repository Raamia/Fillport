'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient' // Adjust path if needed

const DashboardPage = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error fetching user:', error)
          router.push('/login') // Redirect if error fetching user
          return
        }

        if (!currentUser) {
          // If no user is logged in, redirect to login page
          router.push('/login')
        } else {
          // If user is logged in, set the user state
          setUser(currentUser)
          setLoading(false)
        }
      } catch (err) {
        console.error('Unexpected error checking auth state:', err)
        router.push('/login') // Redirect on unexpected errors
      }
    }

    checkUser()

    // Optional: Listen for auth state changes (e.g., logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        if (!session?.user) {
           router.push('/login') // Redirect if somehow signed in without user data
        } else {
          setLoading(false) // Ensure loading is false if already on dashboard and state changes
        }
      } 
    });

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    setLoading(true) // Show loading state during logout
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // The onAuthStateChange listener should handle the redirect
    } catch (error) {
      console.error('Error logging out:', error)
      alert('Error logging out: ' + error.message)
      setLoading(false) // Reset loading state if logout fails
    }
  }

  // Display loading state while checking auth
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    )
  }

  // If user is loaded and exists, show the dashboard
  return (
    <div style={{ padding: '40px' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.email}!</p>
      {/* Add your dashboard content here */}
      <p>This is your protected dashboard content.</p>
      
      <button 
        onClick={handleLogout} 
        style={{
          marginTop: '20px', 
          padding: '10px 20px', 
          cursor: 'pointer',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
        disabled={loading}
      >
        {loading ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  )
}

export default DashboardPage 