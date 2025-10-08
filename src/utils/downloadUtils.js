export const downloadReportAsImage = async (elementId, filename) => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`)
    }

    // Use print-based approach which is more reliable
    await downloadUsingPrint(element, filename)

  } catch (error) {
    console.error('Error downloading report:', error)
    // Show user-friendly instructions
    showDownloadInstructions()
  }
}

const downloadUsingPrint = async (element, filename) => {
  // Create a new window with just the report content
  const printWindow = window.open('', '_blank', 'width=1200,height=900,scrollbars=yes')
  
  if (!printWindow) {
    throw new Error('পপআপ ব্লক করা হয়েছে। পপআপ অনুমতি দিন এবং আবার চেষ্টা করুন।')
  }

  // Get the current page's CSS
  const stylesheets = Array.from(document.styleSheets)
  let cssText = ''
  
  try {
    stylesheets.forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            cssText += rule.cssText + '\n'
          })
        }
      } catch (e) {
        // Skip external stylesheets that can't be accessed
      }
    })
  } catch (e) {
    console.warn('Could not extract all CSS rules')
  }

  // Clone the element
  const clonedElement = element.cloneNode(true)
  
  // Remove modal-specific styling and constraints to show full content
  const modalContent = clonedElement.querySelector('[id*="report-content"]')
  if (modalContent) {
    // Remove height constraints and overflow settings
    modalContent.style.maxHeight = 'none'
    modalContent.style.height = 'auto'
    modalContent.style.overflow = 'visible'
    modalContent.classList.remove('max-h-[60vh]', 'overflow-y-auto')
  }
  
  // Remove scrollable containers and height limits
  const scrollableElements = clonedElement.querySelectorAll('[class*="overflow"], [class*="max-h"]')
  scrollableElements.forEach(el => {
    el.style.overflow = 'visible'
    el.style.maxHeight = 'none'
    el.style.height = 'auto'
  })
  
  // Remove any problematic elements (buttons, close icons)
  const problematicElements = clonedElement.querySelectorAll('button, .ignore-print')
  problematicElements.forEach(el => {
    if (el.textContent.includes('×') || 
        el.textContent.includes('Download') || 
        el.querySelector('svg') ||
        el.title?.includes('ডাউনলোড') ||
        el.title?.includes('বন্ধ')) {
      el.style.display = 'none'
    }
  })
  
  // Remove navigation arrows and modal controls
  const navigationElements = clonedElement.querySelectorAll('[class*="ChevronLeft"], [class*="ChevronRight"], .ignore-print')
  navigationElements.forEach(el => el.style.display = 'none')

  // Create a complete HTML document for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        ${cssText}
        
        /* Additional print-specific styles */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white !important;
        }
        
        .print-container {
          max-width: none !important;
          width: 100% !important;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: visible !important;
          max-height: none !important;
          height: auto !important;
        }
        
        /* Remove all height and overflow constraints */
        [class*="max-h"], [class*="overflow"], .overflow-y-auto, .max-h-\\[60vh\\] {
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* Hide download buttons and close buttons */
        button:has(svg),
        button[title*="ডাউনলোড"],
        button[title*="বন্ধ"],
        .ignore-print,
        [title*="ডাউনলোড"],
        [title*="বন্ধ"],
        svg[class*="ChevronLeft"],
        svg[class*="ChevronRight"],
        svg[class*="Download"],
        svg[class*="X"] {
          display: none !important;
        }
        
        /* Ensure full content is visible */
        .report-content, [id*="report-content"] {
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
          padding-bottom: 0 !important;
        }
        
        /* Ensure colors are preserved */
        .bg-green-50 { background-color: #f0fdf4 !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-purple-50 { background-color: #faf5ff !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }
        .bg-yellow-50 { background-color: #fffbeb !important; }
        .bg-orange-50 { background-color: #fff7ed !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .text-green-600 { color: #16a34a !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-purple-600 { color: #9333ea !important; }
        .text-red-600 { color: #dc2626 !important; }
        .text-yellow-600 { color: #d97706 !important; }
        .text-orange-600 { color: #ea580c !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-700 { color: #374151 !important; }
        .text-gray-800 { color: #1f2937 !important; }
        .text-gray-900 { color: #111827 !important; }
        
        /* Ensure grid layouts work properly */
        .grid { display: grid !important; }
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr) !important; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
        .grid-cols-7 { grid-template-columns: repeat(7, 1fr) !important; }
        
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            background: white !important;
          }
          
          .print-container { 
            box-shadow: none; 
            margin: 0; 
            border-radius: 0;
            max-width: none !important;
            width: 100% !important;
          }
          
          /* Force all content to be visible in print */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            max-height: none !important;
            overflow: visible !important;
          }
          
          /* Prevent page breaks in important sections */
          .grid > div, .space-y-6 > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${clonedElement.innerHTML}
      </div>
      

      
      <script>
        window.onload = function() {
          // Auto-trigger print dialog after a short delay
          setTimeout(function() {
            window.print();
          }, 1000);
        }
        
        // Close window after printing (optional)
        window.onafterprint = function() {
          setTimeout(function() {
            window.close();
          }, 2000);
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Focus the new window
  printWindow.focus()
}

const showDownloadInstructions = () => {
  const message = `
রিপোর্ট ডাউনলোড করার উপায়:

📄 প্রিন্ট/PDF:
• Ctrl+P চাপুন
• "Save as PDF" নির্বাচন করুন
• ফাইল সেভ করুন

📸 স্ক্রিনশট:
• Windows: Win+Shift+S
• Mac: Cmd+Shift+4
• রিপোর্ট এলাকা নির্বাচন করুন

একটি নতুন উইন্ডো খোলা হবে যেখানে আপনি প্রিন্ট করতে পারবেন।
  `
  
  alert(message)
}

export const formatDateForFilename = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatWeekForFilename = (startDate, endDate) => {
  const start = formatDateForFilename(startDate)
  const end = formatDateForFilename(endDate)
  return `week-${start}-to-${end}`
}

export const formatMonthForFilename = (year, month) => {
  const monthStr = String(month + 1).padStart(2, '0')
  return `month-${year}-${monthStr}`
}