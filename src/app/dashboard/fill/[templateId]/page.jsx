'use client'

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient'; // Adjusted path
import { formTemplates } from '../../../../lib/forms'; // Adjusted path
import { PDFDocument } from 'pdf-lib'; // Import PDFDocument
import * as pdfjsLib from 'pdfjs-dist'; // Import pdf.js
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Import icons
import '../../dashboard.css'; // Corrected path: Go up two levels to dashboard directory
import './fill-form.css'; // Specific styles for this page

// Setup pdf.js worker
// IMPORTANT: You MUST manually copy pdf.worker.min.mjs from node_modules/pdfjs-dist/build/ to your /public folder
if (typeof window !== 'undefined') { // Ensure this runs only in the browser
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // Corrected to .mjs extension
}

const FillFormPage = () => {
  const router = useRouter();
  const params = useParams(); // To get templateId from URL
  const templateId = params?.templateId;

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null); // For pdf-lib document
  const [renderedPdfPages, setRenderedPdfPages] = useState([]); // For data URLs of rendered pages
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // State for current page number

  useEffect(() => {
    if (!templateId) {
      setError('No template ID provided.');
      setLoading(false);
      // router.push('/dashboard/templates'); // Optionally redirect
      return;
    }

    const template = formTemplates.find(t => t.id === templateId);
    if (!template) {
      setError('Form template not found.');
      setLoading(false);
      return;
    }
    setSelectedTemplate(template);
    // Reset states when templateId changes
    setUser(null);
    setProfile(null);
    setPdfDoc(null);
    setRenderedPdfPages([]); // Reset rendered pages
    setCurrentPage(1); // Reset current page
    setError(null);
    setLoading(true);

    const fetchData = async () => {
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !currentUser) {
          throw new Error(userError?.message || 'User not authenticated. Please log in.');
        }
        setUser(currentUser);

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (profileError) {
          throw new Error(profileError.message || 'Failed to fetch user profile.');
        }
        setProfile(userProfile);

        // Fetch and load the PDF
        if (template.filePath) {
          console.log(`Fetching PDF from: ${template.filePath}`);
          const pdfBytes = await fetch(template.filePath).then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
            }
            return res.arrayBuffer();
          });
          const loadedPdfDoc = await PDFDocument.load(pdfBytes);
          setPdfDoc(loadedPdfDoc);
          console.log('PDF (pdf-lib) loaded successfully for auto-filling');
        } else {
          throw new Error('No file path specified for this template.');
        }

      } catch (err) {
        console.error('Error loading form data or PDF:', err);
        setError(err.message);
      } finally {
        // setLoading(false); // Loading will be set to false after auto-fill and rendering
      }
    };

    fetchData();

  }, [templateId, router]); // Dependency array includes templateId and router

  // Auto-fill logic (to be called after pdfDoc and profile are set)
  useEffect(() => {
    if (pdfDoc && profile && selectedTemplate && selectedTemplate.fieldMappings) {
      const autoFillForm = async () => {
        try {
          const form = pdfDoc.getForm();
          const mappings = selectedTemplate.fieldMappings;
          let fieldsFilledCount = 0;

          console.log("Starting auto-fill process...");
          console.log("Profile data:", profile);
          console.log("Field mappings:", mappings);

          // Helper function to get profile value, handling special cases
          const getProfileValueForMapping = (key) => {
            if (key === 'w9_line1_full_name') {
              return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            }
            if (key === 'w9_line6_city_state_zip') {
              return `${profile.city || ''} ${profile.state_province_region || ''} ${profile.postal_code || ''}`.trim().replace(/^, | , $|, ,/g, ', ').replace(/,$/, ''); // Basic cleanup
            }
            // For I-9, if state_province_region is mapped to "State" dropdown,
            // ensure it's the value pdf-lib expects (usually the option text itself)
            // No special handling needed here if profile.state_province_region already holds the correct option string.
            return profile[key];
          };

          for (const profileKey in mappings) {
            const pdfFieldName = mappings[profileKey];
            const profileValue = getProfileValueForMapping(profileKey);

            // Check if profileValue is not null or undefined, and not an empty string for text fields
            // For checkboxes, any value (even empty string if coerced to false) is fine.
            if (pdfFieldName && (profileValue !== null && profileValue !== undefined)) {
              try {
                const field = form.getField(pdfFieldName);
                if (field) {
                  const fieldType = field.constructor.name;
                  
                  if (fieldType === 'PDFTextField') {
                    if (String(profileValue).trim() !== '') { // Only fill if there's actual text
                      field.setText(String(profileValue));
                      fieldsFilledCount++;
                      console.log(`Filled text field '${pdfFieldName}' with '${profileValue}'`);
                    } else {
                      console.log(`Skipped text field '${pdfFieldName}' due to empty profile value.`);
                    }
                  } else if (fieldType === 'PDFCheckBox') {
                    if (Boolean(profileValue)) {
                      field.check();
                    } else {
                      field.uncheck();
                    }
                    fieldsFilledCount++;
                    console.log(`Set checkbox '${pdfFieldName}' to '${Boolean(profileValue)}'`);
                  } else if (fieldType === 'PDFDropdown') {
                    // Ensure profileValue is a string for dropdowns
                    const optionToSelect = String(profileValue || '');
                    if (optionToSelect) {
                      // Check if the option exists
                      const options = field.getOptions();
                      if (options.includes(optionToSelect)) {
                        field.select(optionToSelect);
                        fieldsFilledCount++;
                        console.log(`Selected option '${optionToSelect}' for dropdown '${pdfFieldName}'`);
                      } else {
                        console.warn(`Option '${optionToSelect}' not found for dropdown '${pdfFieldName}'. Available options: ${options.join(', ')}`);
                      }
                    } else {
                       console.log(`Skipped dropdown '${pdfFieldName}' due to empty profile value.`);
                    }
                  }
                  // Add more field types like PDFRadioGroup etc. if needed
                } else {
                  console.warn(`PDF field '${pdfFieldName}' not found in the form.`);
                }
              } catch (fieldError) {
                console.warn(`Could not fill field '${pdfFieldName}' with value '${profileValue}'. Error: ${fieldError.message}`);
              }
            } else if (pdfFieldName) {
                console.log(`Skipped field '${pdfFieldName}' for profile key '${profileKey}' due to null, undefined, or unsuitable empty profile value.`);
            }
          }
          console.log(`Auto-fill complete. ${fieldsFilledCount} fields attempted and potentially filled.`);
          // Here, pdfDoc has been modified. We might need to re-render or save it.
          // For now, the modified pdfDoc is in state.

        } catch (fillError) {
          console.error("Error during auto-fill process:", fillError);
          setError(prevError => prevError ? `${prevError}\nFailed to auto-fill form.` : 'Failed to auto-fill form.');
        } finally {
          // Trigger PDF rendering after auto-fill is complete
          // The actual rendering will happen in the next useEffect hook that depends on pdfDoc
        }
      };
      autoFillForm();
    }
  }, [pdfDoc, profile, selectedTemplate]); // This effect runs when pdfDoc, profile, or template changes

  // PDF.js rendering logic
  useEffect(() => {
    if (!pdfDoc || !pdfjsLib.GlobalWorkerOptions.workerSrc) return; // pdfDoc is the one from pdf-lib

    const renderPdf = async () => {
      console.log("Starting PDF rendering with pdf.js...");
      setIsRenderingPdf(true);
      setRenderedPdfPages([]); // Clear previous pages
      setCurrentPage(1); // Reset to first page on new PDF render
      try {
        const pdfBytes = await pdfDoc.save(); // Save the (potentially modified) pdf-lib document to bytes
        const pdfJsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const numPages = pdfJsDoc.numPages;
        const pageDataUrls = [];

        for (let i = 1; i <= numPages; i++) {
          const page = await pdfJsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport: viewport }).promise;
          pageDataUrls.push(canvas.toDataURL());
          console.log(`Rendered page ${i} of ${numPages}`);
        }
        setRenderedPdfPages(pageDataUrls);
        console.log("PDF.js rendering complete.");
      } catch (renderError) {
        console.error('Error rendering PDF with pdf.js:', renderError);
        setError(prevError => prevError ? `${prevError}\nFailed to render PDF.` : 'Failed to render PDF.');
      } finally {
        setIsRenderingPdf(false);
        setLoading(false); // All loading (fetch, auto-fill, render) is done
      }
    };

    renderPdf();
  }, [pdfDoc]); // Re-run when pdfDoc (from pdf-lib, after auto-fill) is updated

  const handleDownloadPdf = useCallback(async () => {
    if (!pdfDoc || !selectedTemplate || !user) {
      alert('Cannot complete action: Missing critical data (PDF, template, or user).');
      return;
    }
    try {
      console.log(`Attempting to mark form ${selectedTemplate.id} as completed for user ${user.id}`);
      // Step 1: Update status in Supabase to 'completed'
      const { error: updateError } = await supabase
        .from('user_form_activity')
        .update({ 
          status: 'completed',
          last_accessed_at: new Date().toISOString() // Also update last access time
        })
        .eq('user_id', user.id)
        .eq('form_template_id', selectedTemplate.id);

      if (updateError) {
        console.error('Error updating form status to completed:', updateError.message);
        // Decide if we should stop or allow download anyway. For now, let's allow download but warn.
        alert('Could not update form status to completed, but you can still download. Error: ' + updateError.message);
      } else {
        console.log(`Form ${selectedTemplate.id} marked as completed successfully.`);
      }

      // Step 2: Proceed with PDF download
      console.log('Saving PDF for download...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fileName = selectedTemplate.name.toLowerCase().replace(/\s+/g, '_') + '_filled.pdf';
      link.download = fileName;
      document.body.appendChild(link); 
      link.click(); 
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      console.log('PDF download initiated as', fileName);

      // Optional: Navigate back to dashboard or show success message
      // router.push('/dashboard'); // Example redirect

    } catch (e) { 
      console.error('Error in mark as complete and download process:', e.message); 
      alert('Failed to mark as complete or download PDF. See console for details.');
    }
  }, [pdfDoc, selectedTemplate, user, supabase, router]); // Added supabase to dependencies

  // Overall loading state considers initial data fetching and PDF rendering
  if (loading || isRenderingPdf) {
    let message = 'Loading form and profile...';
    if (profile && pdfDoc && !isRenderingPdf && !renderedPdfPages.length) message = 'Processing PDF...' // After auto-fill, before rendering starts
    if (isRenderingPdf) message = 'Rendering PDF preview...';
    return <div className="loading-container">{message}</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error} <button onClick={() => router.reload()}>Try again</button></div>;
  }

  if (!selectedTemplate || !profile || !pdfDoc) {
    return <div className="loading-container">Preparing form...</div>;
  }

  // Placeholder for the actual form filling UI
  return (
    <div className="fill-form-page-container">
      <header className="fill-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div> {/* Wrapper for title and description */}
          <h1>Fill: {selectedTemplate.name}</h1>
          <p>Review your information and the auto-filled fields. Make corrections as needed.</p>
        </div>
        <Link href="/dashboard" passHref>
          <button className="btn-secondary" style={{ marginTop: '0' }}> {/* Use existing btn-secondary style, remove top margin */}
            Back to Dashboard
          </button>
        </Link>
      </header>
      
      <div className="fill-form-layout">
        <section className="form-viewer-section">
          <h2>Form Preview</h2>
          {renderedPdfPages.length > 0 ? (
            <div 
              className="pdf-render-area" 
              style={{ 
                display: 'block', // Changed from flex to block for natural image flow
                textAlign: 'center' // Center the content (image and controls)
              }}
            >
              <img 
                key={currentPage} 
                src={renderedPdfPages[currentPage - 1]} 
                alt={`Page ${currentPage} of ${selectedTemplate.name}`} 
                style={{ 
                  maxWidth: '100%', 
                  border: '1px solid #ccc', 
                  display: 'block', // Ensure image is block for margin auto to work
                  margin: '0 auto 10px auto' // Center image and add bottom margin
                }} 
              />
              {/* Page Navigation Controls - Moved below the image */}
              <div className="pdf-navigation-controls" style={{ marginTop: '10px', textAlign: 'center' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="btn-secondary"
                  style={{marginRight: '10px'}}
                >
                  <ChevronLeft size={18} />
                  <span>Previous</span>
                </button>
                <span>Page {currentPage} of {renderedPdfPages.length}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(renderedPdfPages.length, prev + 1))}
                  disabled={currentPage >= renderedPdfPages.length}
                  className="btn-secondary"
                  style={{marginLeft: '10px'}}
                >
                  <span>Next</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <p>No PDF preview to display. {isRenderingPdf ? 'Rendering...' : 'Please wait or check for errors.'} </p>
          )}
        </section>

        <aside className="profile-data-sidebar">
          <h2>Your Profile Data</h2>
          {/* Display relevant profile data for user reference and potential editing trigger */}
          <div className="profile-info-card">
            <p><strong>Name:</strong> {profile.first_name} {profile.middle_name || ''} {profile.last_name}</p>
            <p><strong>Date of Birth:</strong> {profile.date_of_birth}</p>
            <p><strong>Address:</strong> {profile.address_line1}, {profile.address_line2 || ''} {profile.city}, {profile.state_province_region} {profile.postal_code}, {profile.country}</p>
            {/* TODO: Add more profile fields as needed */}
          </div>
          <button className="btn-secondary">Edit Profile Data (Not Implemented)</button>
          <button 
            onClick={handleDownloadPdf} 
            className="btn-primary"
            disabled={!renderedPdfPages.length || isRenderingPdf || !user}
            style={{ width: '100%' }}
          >
            Mark as Complete and Download
          </button>
        </aside>
      </div>

      {/* TODO: Add a separate component for field-by-field review and editing if needed */}

    </div>
  );
};

export default FillFormPage; 