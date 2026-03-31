import * as XLSX from 'xlsx';

/**
 * Get all sheet names from Excel file
 * @param {Buffer} buffer - Excel file buffer
 * @returns {string[]} Array of sheet names
 */
export function getExcelSheetNames(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames;
}

/**
 * Parse Excel file buffer and extract driver records from a specific sheet
 * Handles various column name formats and data normalization
 * @param {Buffer} buffer - Excel file buffer
 * @param {string} sheetName - Name of the sheet to parse (optional, defaults to first sheet)
 * @returns {Object} { drivers, errors, sheetName }
 */
export function parseDriverExcel(buffer, sheetName = null) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  
  // Use provided sheet name or default to first sheet
  const targetSheet = sheetName || workbook.SheetNames[0];
  
  if (!workbook.SheetNames.includes(targetSheet)) {
    return { 
      drivers: [], 
      errors: [{ row: 0, error: `Sheet "${targetSheet}" not found in Excel file` }],
      sheetName: targetSheet,
      availableSheets: workbook.SheetNames
    };
  }
  
  const sheet = workbook.Sheets[targetSheet];
  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const drivers = [];
  const errors = [];

  rawData.forEach((row, index) => {
    try {
      const driver = normalizeDriverRecord(row, index + 2); // +2 for header row and 0-index
      if (driver.email) {
        // Add city from sheet name
        driver.city = targetSheet;
        drivers.push(driver);
      } else {
        errors.push({ row: index + 2, error: 'Missing email address' });
      }
    } catch (err) {
      errors.push({ row: index + 2, error: err.message });
    }
  });

  return { drivers, errors, sheetName: targetSheet, availableSheets: workbook.SheetNames };
}

/**
 * Parse all sheets from Excel file
 * @param {Buffer} buffer - Excel file buffer
 * @returns {Object} { sheets: { [sheetName]: { drivers, errors } }, availableSheets }
 */
export function parseAllSheets(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheets = {};
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });
    
    const drivers = [];
    const errors = [];
    
    rawData.forEach((row, index) => {
      try {
        const driver = normalizeDriverRecord(row, index + 2);
        if (driver.email) {
          driver.city = sheetName;
          drivers.push(driver);
        } else {
          errors.push({ row: index + 2, error: 'Missing email address' });
        }
      } catch (err) {
        errors.push({ row: index + 2, error: err.message });
      }
    });
    
    sheets[sheetName] = { drivers, errors, recordCount: drivers.length };
  });
  
  return { sheets, availableSheets: workbook.SheetNames };
}

/**
 * Normalize a single driver record from Excel row
 * Handles various column name formats
 */
function normalizeDriverRecord(row, rowNumber) {
  // Column name mapping (case-insensitive, handles variations)
  const columnMappings = {
    // Full name
    'name': 'full_name',
    'full_name': 'full_name',
    'fullname': 'full_name',
    'driver name': 'full_name',
    'driver_name': 'full_name',
    
    // Date of birth
    'date of birth': 'date_of_birth',
    'dob': 'date_of_birth',
    'date_of_birth': 'date_of_birth',
    'dateofbirth': 'date_of_birth',
    'birth date': 'date_of_birth',
    
    // Phone
    'phone': 'phone',
    'phone number': 'phone',
    'phone_number': 'phone',
    'mobile': 'phone',
    'contact': 'phone',
    
    // Email
    'email': 'email',
    'email address': 'email',
    'email_address': 'email',
    
    // License
    'driving license number': 'driving_license_number',
    'license number': 'driving_license_number',
    'license_number': 'driving_license_number',
    'dl number': 'driving_license_number',
    'dl_number': 'driving_license_number',
    'driving_license_number': 'driving_license_number',
    
    // License class
    'license class': 'license_class',
    'license_class': 'license_class',
    'class': 'license_class',
    
    // Address
    'address': 'address',
    'full address': 'address',
    'full_address': 'address',
    
    // SGI Approved
    'approved from sgi ?': 'sgi_approved',
    'approved from sgi?': 'sgi_approved',
    'sgi approved': 'sgi_approved',
    'sgi_approved': 'sgi_approved',
    
    // Spinr Approved
    'spinr approved': 'spinr_approved',
    'spinr_approved': 'spinr_approved',
    
    // Vehicle plate
    'vehicle plate': 'vehicle_plate',
    'vehicle_plate': 'vehicle_plate',
    'plate': 'vehicle_plate',
    'plate number': 'vehicle_plate',
    'license plate': 'vehicle_plate',
    
    // VIN
    'vin': 'vin',
    'vehicle vin': 'vin',
    
    // Vehicle type
    'vehicle type': 'vehicle_type',
    'vehicle_type': 'vehicle_type',
    'type': 'vehicle_type',
    
    // Car year
    'car year': 'car_year',
    'car_year': 'car_year',
    'year': 'car_year',
    'vehicle year': 'car_year',
    
    // Car make
    'car make': 'car_make',
    'car_make': 'car_make',
    'make': 'car_make',
    
    // Car model
    'car model': 'car_model',
    'car_model': 'car_model',
    'model': 'car_model',
    
    // Criminal record check
    'crimininal record check': 'criminal_record_check_expiry',
    'criminal record check': 'criminal_record_check_expiry',
    'criminal_record_check': 'criminal_record_check_expiry',
    'crc expiry': 'criminal_record_check_expiry',
    
    // Car insurance
    'car insurance': 'car_insurance_expiry',
    'car_insurance': 'car_insurance_expiry',
    'insurance expiry': 'car_insurance_expiry',
    'insurance': 'car_insurance_expiry',
    
    // Vehicle inspection
    'vehicle inspection': 'vehicle_inspection_expiry',
    'vehicle inspection ': 'vehicle_inspection_expiry',
    'vehicle_inspection': 'vehicle_inspection_expiry',
    'inspection expiry': 'vehicle_inspection_expiry',
    
    // Drivers abstract
    'drivers abstract': 'drivers_abstract_status',
    'drivers_abstract': 'drivers_abstract_status',
    'abstract': 'drivers_abstract_status',
    
    // Work authorization
    'work authorization': 'work_authorization_expiry',
    'work_authorization': 'work_authorization_expiry',
    'work auth': 'work_authorization_expiry',
    
    // PR
    'pr': 'is_pr',
    'permanent resident': 'is_pr',
    
    // Citizen
    'citizen': 'is_citizen',
    'citizenship': 'is_citizen',
    
    // Profile complete
    'complete profile': 'profile_complete',
    'profile complete': 'profile_complete',
    'profile_complete': 'profile_complete',
    
    // Decals sent
    'decals sent': 'decals_sent',
    'decals_sent': 'decals_sent',
  };

  // Create normalized record
  const record = {};
  
  // Process each column in the row
  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();
    const mappedField = columnMappings[normalizedKey];
    
    if (mappedField) {
      record[mappedField] = normalizeValue(mappedField, value);
    }
  });

  // Ensure email is lowercase and trimmed
  if (record.email) {
    record.email = record.email.toString().toLowerCase().trim();
  }

  // Ensure phone is formatted
  if (record.phone) {
    record.phone = formatPhone(record.phone);
  }

  return record;
}

/**
 * Normalize value based on field type
 */
function normalizeValue(field, value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Boolean fields
  const booleanFields = ['sgi_approved', 'spinr_approved', 'is_pr', 'is_citizen', 'profile_complete', 'decals_sent'];
  if (booleanFields.includes(field)) {
    return parseBoolean(value);
  }

  // Date fields
  const dateFields = ['date_of_birth', 'criminal_record_check_expiry', 'car_insurance_expiry', 
                      'vehicle_inspection_expiry', 'work_authorization_expiry'];
  if (dateFields.includes(field)) {
    return parseDate(value);
  }

  // Number fields
  if (field === 'car_year') {
    const year = parseInt(value, 10);
    return isNaN(year) ? null : year;
  }

  // String fields - trim and return
  return String(value).trim();
}

/**
 * Parse boolean values from various formats
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  
  const strValue = String(value).toLowerCase().trim();
  const trueValues = ['y', 'yes', 'true', '1', 'approved'];
  const falseValues = ['n', 'no', 'false', '0', 'not approved'];
  
  if (trueValues.includes(strValue)) return true;
  if (falseValues.includes(strValue)) return false;
  
  return null;
}

/**
 * Parse date from various formats
 */
function parseDate(value) {
  if (!value) return null;
  
  // If already a Date object (from XLSX)
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  const strValue = String(value).trim();
  
  // Handle "Valid" or other text for abstract status
  if (strValue.toLowerCase() === 'valid') {
    return null; // This is status, not a date
  }

  // Try various date formats
  // DD-MMM-YY (e.g., 23-Oct-26)
  const ddMmmYy = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/;
  let match = strValue.match(ddMmmYy);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseMonth(match[2]);
    let year = parseInt(match[3], 10);
    // Assume 20xx for years 00-50, 19xx for 51-99
    year = year <= 50 ? 2000 + year : 1900 + year;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Try ISO format
  try {
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

/**
 * Parse month name to number
 */
function parseMonth(monthStr) {
  const months = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
  };
  return months[monthStr.toLowerCase()] || 1;
}

/**
 * Format phone number (basic formatting)
 */
function formatPhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = String(phone).replace(/\D/g, '');
  
  // Return as-is if valid length
  if (digits.length >= 10) {
    return digits;
  }
  
  return digits || null;
}
