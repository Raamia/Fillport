'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// import Link from 'next/link' // No longer needed if logo is removed
import { supabase } from '../../lib/supabaseClient'
import "../auth-pages.css"; // For reusable auth styles (forms, buttons, etc.)
import "./onboarding.css"; // For specific onboarding layout overrides

// TODO: Create and import a dedicated CSS file e.g., import "./onboarding.css";

const countryList = [
  { name: 'United States', code: 'US' },
  { name: 'Canada', code: 'CA' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Australia', code: 'AU' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Japan', code: 'JP' },
  // Add more countries as needed
];

const usStates = [
  { name: 'Alabama', code: 'AL' }, { name: 'Alaska', code: 'AK' }, { name: 'Arizona', code: 'AZ' },
  { name: 'Arkansas', code: 'AR' }, { name: 'California', code: 'CA' }, { name: 'Colorado', code: 'CO' },
  { name: 'Connecticut', code: 'CT' }, { name: 'Delaware', code: 'DE' }, { name: 'Florida', code: 'FL' },
  { name: 'Georgia', code: 'GA' }, { name: 'Hawaii', code: 'HI' }, { name: 'Idaho', code: 'ID' },
  { name: 'Illinois', code: 'IL' }, { name: 'Indiana', code: 'IN' }, { name: 'Iowa', code: 'IA' },
  { name: 'Kansas', code: 'KS' }, { name: 'Kentucky', code: 'KY' }, { name: 'Louisiana', code: 'LA' },
  { name: 'Maine', code: 'ME' }, { name: 'Maryland', code: 'MD' }, { name: 'Massachusetts', code: 'MA' },
  { name: 'Michigan', code: 'MI' }, { name: 'Minnesota', code: 'MN' }, { name: 'Mississippi', code: 'MS' },
  { name: 'Missouri', code: 'MO' }, { name: 'Montana', code: 'MT' }, { name: 'Nebraska', code: 'NE' },
  { name: 'Nevada', code: 'NV' }, { name: 'New Hampshire', code: 'NH' }, { name: 'New Jersey', code: 'NJ' },
  { name: 'New Mexico', code: 'NM' }, { name: 'New York', code: 'NY' }, { name: 'North Carolina', code: 'NC' },
  { name: 'North Dakota', code: 'ND' }, { name: 'Ohio', code: 'OH' }, { name: 'Oklahoma', code: 'OK' },
  { name: 'Oregon', code: 'OR' }, { name: 'Pennsylvania', code: 'PA' }, { name: 'Rhode Island', code: 'RI' },
  { name: 'South Carolina', code: 'SC' }, { name: 'South Dakota', code: 'SD' }, { name: 'Tennessee', code: 'TN' },
  { name: 'Texas', code: 'TX' }, { name: 'Utah', code: 'UT' }, { name: 'Vermont', code: 'VT' },
  { name: 'Virginia', code: 'VA' }, { name: 'Washington', code: 'WA' }, { name: 'West Virginia', code: 'WV' },
  { name: 'Wisconsin', code: 'WI' }, { name: 'Wyoming', code: 'WY' }
];

const NewOnboardingPage = () => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Personal Details
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [dob, setDob] = useState('')
  
  // Step 2: Address Details
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('US') // Store country code, default to US
  const [stateProvinceRegion, setStateProvinceRegion] = useState('')
  const [postalCode, setPostalCode] = useState('')

  useEffect(() => {
    const checkSessionAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.error('Onboarding: No active session or error:', sessionError)
          router.push('/login')
          return
        }

        const currentUser = session.user
        setUser(currentUser)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('has_completed_onboarding') // Only need this to check if already done
          .eq('id', currentUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') { 
            console.error("Onboarding: Error fetching profile status:", profileError)
            setError("Could not load profile data. Please try refreshing.")
            setLoading(false)
            return
        }

        if (profile?.has_completed_onboarding) {
            console.log('Onboarding already completed, redirecting to dashboard.')
            router.push('/dashboard')
            return
        }
      } catch (err) {
        console.error('Onboarding: Unexpected error during setup:', err)
        setError('An unexpected error occurred. Please try refreshing.')
      } finally {
        setLoading(false)
      }
    }

    checkSessionAndProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [router])

  const handleNextStep = () => {
    setError(null) // Clear previous errors
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim() || !dob) {
        setError('First Name, Last Name, and Date of Birth are required.')
        return
      }
    }
    setCurrentStep(currentStep + 1)
  }

  const handlePreviousStep = () => {
    setError(null) // Clear previous errors
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Find full country name for storage, if needed, or just store the code.
    // For now, profileData will store the country code in `country` and selected state in `state_province_region`
    const selectedCountryName = countryList.find(c => c.code === country)?.name || country;

    if (currentStep === 2 && (!addressLine1.trim() || !city.trim() || (country === 'US' && !stateProvinceRegion.trim()) || (country !== 'US' && !stateProvinceRegion.trim()) || !postalCode.trim() || !country.trim())) {
        let specificError = 'Please fill in all required address fields.';
        if (country === 'US' && !stateProvinceRegion.trim()) {
            specificError = 'Please select a state for the United States.';
        } else if (country !== 'US' && !stateProvinceRegion.trim()) {
            specificError = 'State/Province is required for the selected country.'; // Or make it optional based on policy
        }
        setError(specificError);
        return;
    }

    if (!user) {
      setError('User session not found. Please try logging in again.')
      return
    }

    setSaving(true)

    try {
      const profileData = {
        id: user.id,
        // Step 1 data
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || null,
        date_of_birth: dob,
        // Step 2 data
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        city: city.trim(),
        state_province_region: stateProvinceRegion.trim(),
        postal_code: postalCode.trim(),
        country: selectedCountryName,
        // Completion flag
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()

      if (upsertError) {
        console.error('Error saving profile:', upsertError)
        if (upsertError.message.includes('violates not-null constraint')) {
          setError('Failed to save: A required field was unexpectedly empty for the database. This might be an issue with initial profile creation. Please contact support or try again later.')
        } else if (upsertError.message.includes('check constraint')) {
          setError('Failed to save: Please ensure Date of Birth and other fields are valid.')
        } else {
          setError(`Failed to save profile: ${upsertError.message}`)
        }
        setSaving(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      console.error('Unexpected error submitting onboarding form:', err)
      setError('An unexpected error occurred while saving your profile.')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="auth-page"><div className="loading-container">Loading...</div></div>
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          {/* Logo removed as per request */}
          <h1>Setup Your Profile</h1>
          <p>Step {currentStep} of 2: {currentStep === 1 ? 'Personal Details' : 'Address Information'}</p>
        </div>

        {error && <p className="auth-message error">Error: {error}</p>}

        <form className="auth-form" onSubmit={currentStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
          {currentStep === 1 && (
            <>
              <div className="auth-form-group">
                <label htmlFor="firstName">First Name <span style={{color: 'red'}}>*</span></label>
                <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={saving} autoComplete="given-name" />
              </div>
              <div className="auth-form-group">
                <label htmlFor="middleName">Middle Name</label>
                <input type="text" id="middleName" value={middleName} onChange={(e) => setMiddleName(e.target.value)} disabled={saving} autoComplete="additional-name" />
              </div>
              <div className="auth-form-group">
                <label htmlFor="lastName">Last Name <span style={{color: 'red'}}>*</span></label>
                <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={saving} autoComplete="family-name" />
              </div>
              <div className="auth-form-group">
                <label htmlFor="dob">Date of Birth <span style={{color: 'red'}}>*</span></label>
                <input type="date" id="dob" value={dob} onChange={(e) => setDob(e.target.value)} required disabled={saving} max={new Date().toISOString().split("T")[0]} autoComplete="bday" />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="auth-form-group">
                <label htmlFor="addressLine1">Address Line 1 <span style={{color: 'red'}}>*</span></label>
                <input type="text" id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required disabled={saving} autoComplete="address-line1" />
              </div>
              <div className="auth-form-group">
                <label htmlFor="addressLine2">Address Line 2</label>
                <input type="text" id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} disabled={saving} autoComplete="address-line2" />
              </div>
              <div className="auth-form-group">
                <label htmlFor="city">City <span style={{color: 'red'}}>*</span></label>
                <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} required disabled={saving} autoComplete="address-level2" />
              </div>
              <div className="auth-form-group">
                <label htmlFor="country">Country <span style={{color: 'red'}}>*</span></label>
                <select 
                  id="country" 
                  value={country} 
                  onChange={(e) => {
                    setCountry(e.target.value);
                    // Reset state/province if country changes, especially if changing from US
                    if (e.target.value !== 'US') setStateProvinceRegion(''); 
                    else setStateProvinceRegion(''); // Also reset if changing TO US, to force selection
                  }}
                  required 
                  disabled={saving} 
                  autoComplete="country-name"
                >
                  {countryList.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="auth-form-group">
                <label htmlFor="stateProvinceRegion">State/Province/Region <span style={{color: 'red'}}>*</span></label>
                {country === 'US' ? (
                  <select 
                    id="stateProvinceRegion" 
                    value={stateProvinceRegion} 
                    onChange={(e) => setStateProvinceRegion(e.target.value)} 
                    required 
                    disabled={saving} 
                    autoComplete="address-level1"
                  >
                    <option value="">Select State...</option>
                    {usStates.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    id="stateProvinceRegion" 
                    value={stateProvinceRegion} 
                    onChange={(e) => setStateProvinceRegion(e.target.value)} 
                    required 
                    disabled={saving} 
                    autoComplete="address-level1"
                    placeholder="Enter state/province/region"
                  />
                )}
              </div>
              <div className="auth-form-group">
                <label htmlFor="postalCode">Postal Code <span style={{color: 'red'}}>*</span></label>
                <input type="text" id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required disabled={saving} autoComplete="postal-code" />
              </div>
            </>
          )}

          <div className="auth-form-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: currentStep === 1 ? 'flex-end' : 'space-between', alignItems: 'center' }}>
              {currentStep === 2 && (
                <button 
                  type="button" 
                  onClick={handlePreviousStep} 
                  disabled={saving} 
                  className="auth-submit auth-button-secondary" 
                >
                  Previous
                </button>
              )}
              {currentStep === 1 && <div style={{flexGrow: 1}}></div>}
              <button 
                type="submit" 
                disabled={saving} 
                className="auth-submit"
              >
                {currentStep === 1 ? 'Next' : (saving ? 'Saving...' : 'Complete Setup')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewOnboardingPage 