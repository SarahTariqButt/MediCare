/**
 * Gender detection and avatar generation utilities
 */

// Department to visual theme mapping
const departmentImageMap: Record<string, string> = {
  'cardiology': 'cardiology-heart-medical',
  'neurology': 'neurology-brain-medical',
  'orthopedics': 'orthopedics-bones-joints',
  'pediatrics': 'pediatrics-child-care',
  'dermatology': 'dermatology-skin-care',
  'psychiatry': 'psychiatry-mental-health',
  'psychology': 'psychology-mind-health',
  'ent': 'ent-ear-nose-throat',
  'ophthalmology': 'ophthalmology-eye-vision',
  'dentistry': 'dentistry-teeth-oral',
  'urology': 'urology-medical-specialist',
  'oncology': 'oncology-cancer-medical',
  'radiology': 'radiology-xray-imaging',
  'pathology': 'pathology-laboratory-medical',
  'anesthesiology': 'anesthesiology-medical-surgery',
  'general medicine': 'general-medicine-medical',
  'nutrition': 'nutrition-diet-health',
  'endocrinology': 'endocrinology-hormones-medical',
  'gastroenterology': 'gastroenterology-digestive',
  'gynecology': 'gynecology-womens-health',
};

// Common male names (in English and Urdu)
const maleNames = [
  'ahmad', 'ali', 'hassan', 'usman', 'ahmed', 'mohammed', 'abdul', 'abd', 'omar', 'khan',
  'muhammad', 'mike', 'john', 'david', 'james', 'robert', 'william', 'richard', 'charles', 'thomas',
  'henry', 'andrew', 'mark', 'donald', 'george', 'kenneth', 'joseph', 'christopher', 'peter', 'ryan',
  'tariq', 'hussain', 'ibrahim', 'ismail', 'aziz', 'karim', 'nasir', 'rahim', 'rashid', 'samir',
  'sameer', 'sohail', 'suleman', 'taha', 'waleed', 'yasir', 'zain', 'saad', 'haider', 'imran',
  'kamran', 'adnan', 'arif', 'asif', 'bilal', 'faisal', 'farooq', 'ghulam', 'hamid', 'haris',
];

// Common female names (in English and Urdu)
const femaleNames = [
  'fatima', 'aisha', 'ayesha', 'noor', 'sana', 'sara', 'riaz', 'malik', 'hana', 'rana',
  'zara', 'aliza', 'amina', 'bushra', 'dina', 'eshta', 'gina', 'hadia', 'iffat', 'jahnara',
  'khadija', 'laila', 'maryam', 'nasreen', 'omeya', 'palwasha', 'qadira', 'rabia', 'saba', 'talat',
  'uma', 'veda', 'wardah', 'yasmin', 'zahra', 'zainab',
  'mary', 'patricia', 'jennifer', 'linda', 'barbara', 'elizabeth', 'susan', 'jessica', 'sarah', 'karen',
  'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley', 'dorothy', 'kimberly', 'emily', 'donna',
  'michelle', 'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia',
];


/**
 * Detect gender from a person's name
 * @param name - The person's full name
 * @returns 'male', 'female', or 'other' (default)
 */
export function detectGenderFromName(name: string): 'male' | 'female' | 'other' {
  const nameLower = name.toLowerCase().trim();
  
  // Extract first name
  const firstName = nameLower.split(/\s+/)[0];
  
  // Remove common titles
  const cleanFirstName = firstName.replace(/^(dr\.|dr|mr\.|mr|mrs\.|mrs|miss|ms|ms\.)/, '').trim();
  
  // Check against known names
  if (maleNames.some(name => cleanFirstName.includes(name) || name.includes(cleanFirstName))) {
    return 'male';
  }
  
  if (femaleNames.some(name => cleanFirstName.includes(name) || name.includes(cleanFirstName))) {
    return 'female';
  }
  
  // Default based on last character
  return 'other';
}

/**
 * Get department-based image seed
 * @param department - Doctor's department
 * @returns Image seed keyword
 */
export function getDepartmentImageSeed(department: string): string {
  const departmentLower = department.toLowerCase();
  
  // Check for exact or partial matches
  for (const [key, value] of Object.entries(departmentImageMap)) {
    if (departmentLower.includes(key) || key.includes(departmentLower)) {
      return value;
    }
  }
  
  // Default to medical theme
  return 'medical-healthcare-doctor';
}

/**
 * Generate a department-related illustration URL
 * Uses DiceBear API with medical-themed styles based on department
 * @param department - Doctor's department
 * @returns Illustration URL string
 */
export function generateDepartmentImage(department: string, gender?: 'male' | 'female' | 'other', name?: string): string {
  const departmentSeed = getDepartmentImageSeed(department);
  // Incorporate gender and name into the seed so avatars vary by gender/name
  const seedParts = [gender || 'other', departmentSeed, (name || '').toLowerCase().replace(/\s+/g, '-')].filter(Boolean);
  const combinedSeed = seedParts.join('-');
  const encodedSeed = encodeURIComponent(combinedSeed);

  // Use DiceBear illustration style; seed variation creates gender-specific results
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodedSeed}&scale=100&backgroundColor=random`;
}

/**
 * Generate a complete doctor object with department-based image
 * @param doctorData - Partial doctor data with at least name and department
 * @returns Complete doctor data with generated department-based image
 */
export function generateDoctorWithAvatar(doctorData: any) {
  // Determine gender: prefer explicit field, otherwise detect from name
  const genderFromName = typeof doctorData.name === 'string' ? detectGenderFromName(doctorData.name) : 'other';
  const gender = doctorData.gender || genderFromName || 'other';

  // Use department for image generation (preferred), fall back to specialty
  const departmentOrSpecialty = doctorData.department || doctorData.specialty || 'medical';
  const image = generateDepartmentImage(departmentOrSpecialty, gender, doctorData.name || '');

  return {
    ...doctorData,
    gender,
    image,
  };
}
