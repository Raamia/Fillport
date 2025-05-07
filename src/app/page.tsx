'use client' // Make this a client component

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient' // Adjust path if necessary
import HomePage from "./HomePage"

const Page = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsAuthenticated(true)
          router.replace('/dashboard') // Use replace to avoid adding to history stack
        } else {
          setIsAuthenticated(false)
          setLoading(false) // Only stop loading if not redirecting immediately
        }
      } catch (error) {
        console.error("Error checking auth status on home page:", error)
        setIsAuthenticated(false)
        setLoading(false)
      }
      // setLoading(false) // Moved up for non-authenticated case
    }

    checkAuth()
  }, [router])

  // Optional: Listen for auth state changes to handle login/logout while on page
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true)
        router.replace('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setLoading(false) // Ensure page content shows if user logs out
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);


  if (loading || isAuthenticated) {
    // Show a loading indicator or null while checking/redirecting
    // to prevent HomePage from flashing if user is authenticated
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Loading...
        </div>
    );
  }

  // If not loading and not authenticated, show the HomePage
  return <HomePage />
}

export default Page
