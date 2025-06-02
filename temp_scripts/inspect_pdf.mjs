    // File: Fillport/temp_scripts/inspect_pdf.mjs
    import { PDFDocument } from 'pdf-lib';
    import fs from 'fs/promises'; // Using promise-based fs
    import path from 'path';
    import { fileURLToPath } from 'url';

    // Helper to get __dirname in ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    async function listPdfFields(relativePdfPath) {
      // Construct absolute path from the script's location
      const pdfPath = path.resolve(__dirname, '../public/forms/', relativePdfPath);
      // Example: if relativePdfPath is 'fw9.pdf', pdfPath will be /path/to/Fillport/public/forms/fw9.pdf

      try {
        console.log(`\n--- Inspecting: ${relativePdfPath} ---`);
        console.log(`Full path: ${pdfPath}`);

        const pdfBytes = await fs.readFile(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        if (!form) {
          console.log('This PDF does not contain an AcroForm (no interactive form fields found by pdf-lib).');
          return;
        }

        const fields = form.getFields();
        if (fields.length === 0) {
          console.log('The AcroForm in this PDF has no fields.');
          return;
        }

        console.log('Fields found:');
        fields.forEach(field => {
          const type = field.constructor.name;
          const name = field.getName();
          // For more details, you can log other properties if needed
          // e.g., console.log(field.フラグS()); // pdf-lib specific flags
          console.log(`  Name: "${name}", Type: ${type}`);
        });
        console.log('--------------------');

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(`Error: PDF file not found at ${pdfPath}. Please check the path and filename.`);
        } else {
          console.error(`Error processing PDF ${relativePdfPath}:`, error.message);
        }
      }
    }

    // List of PDFs you want to inspect (filenames from your Fillport/public/forms/ directory)
    const pdfsToInspect = ['fw9.pdf', 'fi9.pdf'];

    async function main() {
      // Ensure pdf-lib is installed in your main project (npm install pdf-lib)
      console.log('Starting PDF field inspection...');
      for (const pdfFile of pdfsToInspect) {
        await listPdfFields(pdfFile);
      }
      console.log('\nInspection complete.');
    }

    main();