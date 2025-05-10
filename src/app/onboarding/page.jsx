'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient' // Adjust path if needed
import "../auth-pages.css" // Reuse some auth styles
import "./onboarding.css" // Add specific onboarding styles

const OnboardingPage = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState(null)

  // Check auth state and fetch initial profile data if exists
  useEffect(() => {
    const checkSessionAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.error('No active session or error:', sessionError)
          router.push('/login')
          return
        }

        const currentUser = session.user
        setUser(currentUser)

        // Fetch more profile fields
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, middle_name, date_of_birth, has_completed_onboarding')
          .eq('id', currentUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') { 
            console.error("Error fetching profile:", profileError)
            setError("Could not load profile data. Please try again later.")
        }

        if (profile?.has_completed_onboarding) {
            console.log('Onboarding already completed, redirecting to dashboard.')
            router.push('/dashboard')
            return
        }

        // Pre-fill fields if they exist from a previous attempt or partial save
        if (profile) {
            setFirstName(profile.first_name || '')
            setLastName(profile.last_name || '')
            setMiddleName(profile.middle_name || '')
            setDob(profile.date_of_birth || '') // Assuming DOB is stored as YYYY-MM-DD
        }

      } catch (err) {
        console.error('Unexpected error during setup:', err)
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    checkSessionAndProfile()

    // Listen for logout
    const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router])

  // Handle form submission
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault()
    // Add validation for required fields
    if (!user || !firstName.trim() || !lastName.trim() || !dob) {
      setError('Please fill in all required fields (First Name, Last Name, Date of Birth).')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Prepare data for upsert
      const profileData = {
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || null, // Store null if empty
        date_of_birth: dob, // Assumes dob state is in 'YYYY-MM-DD' format
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (upsertError) {
        // Handle potential DB constraints or other errors
        if (upsertError.message.includes('violates check constraint')) {
             setError("Please ensure all data is valid (e.g., correct date format).")
        } else if (upsertError.message.includes('violates not-null constraint')) {
             setError("First Name and Last Name cannot be empty.")
        } else {
            throw upsertError
        }
        setSaving(false)
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')

    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile.')
      setSaving(false)
    }
  }

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="loading-container">
        Loading...
      </div>
    )
  }

  return (
    <div className="auth-page onboarding-page">
      <div className="auth-container onboarding-container">
        <div className="auth-header">
          <h1>Welcome to Fillport!</h1>
          <p>Let's get your profile set up.</p>
        </div>

        {error && <p className="auth-message error">Error: {error}</p>}

        <form className="auth-form" onSubmit={handleOnboardingSubmit}>
          {/* First Name */}
          <div className="auth-form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              placeholder="Enter your first name"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Middle Name (Optional) */}
          <div className="auth-form-group">
            <label htmlFor="middleName">Middle Name (Optional)</label>
            <input
              type="text"
              id="middleName"
              placeholder="Enter your middle name"
              autoComplete="additional-name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Last Name */}
          <div className="auth-form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              placeholder="Enter your last name"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Date of Birth */}
          <div className="auth-form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date" // Use date input type
              id="dob"
              required
              autoComplete="bday"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={saving}
              max={new Date().toISOString().split("T")[0]} // Prevent future dates
            />
          </div>

          <button type="submit" className="auth-submit" disabled={saving}>
            {saving ? "Saving..." : "Complete Setup & Go to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default OnboardingPage 