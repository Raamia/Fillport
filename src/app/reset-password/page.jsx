'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient' // Adjust path as needed
import toast from 'react-hot-toast'
import '../auth-pages.css' // Reuse existing auth page styles

const ResetPasswordPage = () => {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [canReset, setCanReset] = useState(false) // To control if the form is shown

  useEffect(() => {
    // Supabase handles the password recovery token from the URL fragment internally
    // when the onAuthStateChange listener is set up.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This event means Supabase has successfully processed the token from the URL.
        // The user is now in a temporary authenticated state allowing password update.
        setCanReset(true)
        toast.success('You can now set your new password.', { duration: 4000 });
      } else if (event === 'SIGNED_IN' && session && session.user && canReset) {
        // This might happen if the user was already signed in and then clicked the recovery link
        // or if the session got established immediately after PASSWORD_RECOVERY.
        // We still want to allow password reset in this specific flow.
        setCanReset(true);
      } else if (!session && !canReset) {
        // If there's no session and PASSWORD_RECOVERY event hasn't fired,
        // it might mean an invalid or expired token, or the user landed here directly.
        // However, Supabase usually redirects if the token is invalid before this page loads.
        // For safety, we can guide the user if they somehow land here without a valid state.
        // setError('Invalid or expired password reset link. Please request a new one.');
        // toast.error('Invalid or expired link.');
        // Consider redirecting to login or forgot-password page after a delay.
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Run once on mount

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      toast.error('Passwords do not match.');
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw updateError
      }

      setMessage('Password updated successfully! You can now log in with your new password.')
      toast.success('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      // Optionally redirect to login after a delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err) {
      console.error("Error updating password:", err)
      setError(err.message || "Failed to update password.")
      toast.error(err.message || "Failed to update password.")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial check if user is already in a password recovery state without useEffect delay
  // This is less reliable than onAuthStateChange but can provide quicker feedback
  // if Supabase client has already processed the URL hash.
  // However, relying on onAuthStateChange is generally more robust.
  // if (supabase.auth.session() && supabase.auth.session().user && !canReset) {
  //   // This is a tricky condition. If a session exists but it's not from PASSWORD_RECOVERY,
  //   // we might not want to show the form. Let's rely on onAuthStateChange primarily.
  // }

  if (!canReset && !error && !message) {
    // If not yet in recovery mode, show a loading/waiting message.
    // Supabase client is processing the URL hash in the background.
    // If it's invalid, Supabase usually redirects or the listener will set an error.
    return (
        <div className="auth-page">
            <div className="auth-container" style={{ textAlign: 'center' }}>
                <h1>Verifying Reset Link</h1>
                <p>Please wait while we verify your password reset link...</p>
                {/* You could add a spinner here */}
                <div style={{ marginTop: '20px' }}>
                    <Link href="/login" className="auth-forgot-button">Back to Login</Link>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link href="/" className="auth-logo-link">
            <div className="auth-logo">
                <img src="/weblogo.png" alt="Fillport Logo" className="auth-logo-img" />
                Fillport
            </div>
          </Link>
          <h1>Set Your New Password</h1>
          <p>Please enter and confirm your new password below.</p>
        </div>

        {message && <div className="form-message success" style={{ marginBottom: '15px', textAlign: 'center' }}>{message}</div>}
        {error && <div className="form-message error" style={{ marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
        
        {canReset && !message && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="new-password">New Password</label>
              <input 
                type="password" 
                id="new-password" 
                placeholder="Enter new password" 
                required 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </div>
            <div className="auth-form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                placeholder="Confirm new password" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? "Updating Password..." : "Set New Password"}
            </button>
          </form>
        )}

        {(!canReset && (error || message)) && (
             <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link href="/login" className="auth-forgot-button">Back to Login</Link>
            </div>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage 