'use client'

import { Toaster } from 'react-hot-toast'

export const ToastProvider = () => {
  return <Toaster 
    position="top-right" // You can customize position and other options
    toastOptions={{
      // Define default options for all toasts
      duration: 5000,
      style: {
        background: '#333', // Dark background for general toasts
        color: '#fff',
        fontSize: '15px',
        padding: '12px 18px',
        borderRadius: '8px'
      },
      // Default options for specific types
      success: {
        duration: 3000,
        iconTheme: {
          primary: '#28a745', // Green icon
          secondary: '#fff',   // White checkmark
        },
        style: {
            background: '#e6f9f0', // Light green background
            color: '#10703d',    // Dark green text
            border: '1px solid #a6eecb'
        }
      },
      error: {
        duration: 4000,
        iconTheme: {
          primary: '#dc3545', // Red icon
          secondary: '#fff',   // White cross
        },
        style: {
            background: '#fdecea', // Light red background
            color: '#c0341d',    // Dark red text
            border: '1px solid #f8c4bc'
        }
      }
    }}
  />
} 