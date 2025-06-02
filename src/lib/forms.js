export const formTemplates = [
  {
    id: 'w9',
    name: 'W-9 Request for Taxpayer Identification Number and Certification',
    description: 'Official IRS form for providing your TIN to a requester.',
    filePath: '/forms/fw9.pdf', // Path relative to /public
    fieldMappings: {
      // Profile key: PDF Field Name
      // For W-9, Line 1 is "Name (as shown on your income tax return)"
      // We'll use a custom key and concatenate first_name + last_name in the component
      'w9_line1_full_name': "topmostSubform[0].Page1[0].f1_01[0]",
      // Line 2 "Business name/disregarded entity name, if different from above"
      // Assuming 'company' from profile maps here, if applicable.
      'company': "topmostSubform[0].Page1[0].f1_02[0]",
      // Line 5 "Address (number, street, and apt. or suite no.)"
      'address_line1': "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]",
      // Line 6 "City, state, and ZIP code"
      // We'll use a custom key and concatenate city, state, zip in the component
      'w9_line6_city_state_zip': "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]",
      // Other W-9 fields like checkboxes for tax classification, SSN, EIN are not mapped
      // as the current profile doesn't have this data.
      // Example: 'tax_classification_individual_checkbox': "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[0]",
      // 'ssn_part1': "topmostSubform[0].Page1[0].f1_11[0]",
    }
  },
  {
    id: 'i9',
    name: 'I-9 Employment Eligibility Verification',
    description: 'Form for verifying the identity and employment authorization of individuals hired for employment in the United States.',
    filePath: '/forms/fi9.pdf',
    fieldMappings: {
      // Section 1: Employee Information and Attestation
      'last_name': "Last Name (Family Name)",
      'first_name': "First Name Given Name from Section 1",
      // 'middle_initial': "Employee Middle Initial (if any)", // Profile doesn't have middle_initial
      // 'other_last_names': "Employee Other Last Names Used (if any)", // Profile doesn't have this
      'address_line1': "Address Street Number and Name",
      'address_line2': "Apt Number (if any)", // map address_line2 to Apt Number
      'city': "City or Town",
      'state_province_region': "State", // This is a PDFDropdown, needs special handling
      'postal_code': "ZIP Code",
      // 'date_of_birth': "Date of Birth mmddyyyy", // Profile doesn't have DOB
      // 'ssn': "US Social Security Number", // Profile doesn't have SSN
      'email': "Employees E-mail Address",
      // 'phone_number': "Telephone Number", // Profile doesn't have phone_number

      // Attestation checkboxes and related fields are not mapped due to missing profile data
      // e.g. 'attestation_citizen_checkbox': "CB_1",
      // 'uscis_a_number': "USCIS ANumber",
    }
  },
  // ... add more forms here ...
]; 