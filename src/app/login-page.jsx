"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "../lib/supabaseClient"
import toast from 'react-hot-toast'
import "./auth-pages.css"

const LoginPage = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // State for Forgot Password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password.")
        } else {
          throw signInError
        }
      } else {
         toast.success('Successfully logged in!')
         router.push("/dashboard") 
      }

    } catch (error) {
      console.error("Error signing in:", error)
      toast.error(error.message || "An unexpected error occurred during login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (oauthError) {
        throw oauthError
      }
    } catch (error) {
      console.error("Error logging in with Google:", error)
      toast.error(error.message || "Failed to initiate Google login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password', // URL for your password reset page
      });
      if (error) {
        throw error;
      }
      toast.success("Password reset email sent! Please check your inbox.");
      setShowForgotPassword(false); // Hide the form after success
      setResetEmail(""); // Clear the email field
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast.error(error.message || "Failed to send password reset email.");
    } finally {
      setIsResettingPassword(false);
    }
  };

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
          <h1>{showForgotPassword ? 'Reset Your Password' : 'Welcome back'}</h1>
          <p>{showForgotPassword ? 'Enter your email to receive a password reset link.' : 'Sign in to access your forms and documents'}</p>
        </div>

        {!showForgotPassword ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="your@email.com" 
                required 
                autoComplete="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                placeholder="••••••••" 
                required 
                autoComplete="current-password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <div className="auth-forgot">
                <button type="button" onClick={() => setShowForgotPassword(true)} className="auth-forgot-button">
                  Forgot password?
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading || isResettingPassword}>
              {isLoading ? "Logging in..." : "Log In"}
            </button>

            <div className="auth-divider">
              <span>Or continue with</span>
            </div>

            <div className="auth-social">
              <button 
                type="button" 
                className="auth-social-btn" 
                onClick={handleGoogleLogin}
                disabled={isLoading || isResettingPassword}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                {isLoading ? 'Redirecting...' : 'Google'}
              </button>
            </div>

            <div className="auth-switch">
              Don't have an account? <Link href="/signup">Sign up</Link>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleForgotPasswordRequest}>
            <div className="auth-form-group">
              <label htmlFor="reset-email">Email Address</label>
              <input 
                type="email" 
                id="reset-email" 
                placeholder="your.email@example.com" 
                required 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
              />
            </div>
            <button type="submit" className="auth-submit" disabled={isResettingPassword || isLoading}>
              {isResettingPassword ? "Sending Link..." : "Send Password Reset Link"}
            </button>
            <div className="auth-forgot">
              <button type="button" onClick={() => { setShowForgotPassword(false); setResetEmail(""); }} className="auth-forgot-button">
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
