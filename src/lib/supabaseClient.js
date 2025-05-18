import { createClient } from '@supabase/supabase-js'

// Ensure you have these environment variables set in your .env.local file
// NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Profile Helper Functions ---

/**
 * Fetches a user's profile data.
 * @param {string} userId The ID of the user.
 * @returns {Promise<{ data: object | null, error: Error | null }>} The user's profile data or an error.
 */
export const getProfile = async (userId) => {
  if (!userId) {
    console.error("getProfile: userId is required.");
    return { data: null, error: new Error("User ID is required to fetch profile.") };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        middle_name,
        date_of_birth,
        phone_number,
        address_line1,
        address_line2,
        city,
        state_province_region,
        postal_code,
        country,
        has_completed_onboarding
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // Don't throw here, let the caller handle it, but return the error clearly
    }
    return { data, error };
  } catch (catchError) {
    console.error('Unexpected error in getProfile:', catchError);
    return { data: null, error: catchError };
  }
};

/**
 * Updates a user's profile data.
 * @param {string} userId The ID of the user.
 * @param {object} profileData An object containing the profile fields to update.
 * @returns {Promise<{ data: object | null, error: Error | null }>} The updated profile data or an error.
 */
export const updateProfile = async (userId, profileData) => {
  if (!userId) {
    console.error("updateProfile: userId is required.");
    return { data: null, error: new Error("User ID is required to update profile.") };
  }
  if (!profileData || Object.keys(profileData).length === 0) {
    console.error("updateProfile: profileData is required and cannot be empty.");
    return { data: null, error: new Error("Profile data is required to update profile.") };
  }

  try {
    const dataToUpsert = {
      id: userId, // Ensure the ID is part of the upsert data for matching
      ...profileData,
      updated_at: new Date().toISOString(), // Always update the timestamp
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(dataToUpsert, { onConflict: 'id' })
      .select() // Important to select after upsert to get the updated/inserted row back
      .single(); // Assuming upsert affects one row and we want it back

    if (error) {
      console.error('Error updating profile:', error);
    }
    return { data, error };
  } catch (catchError) {
    console.error('Unexpected error in updateProfile:', catchError);
    return { data: null, error: catchError };
  }
}; 