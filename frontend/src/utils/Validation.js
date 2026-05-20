export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isOnlyLetters=(str)=>{
    return /^[A-Za-z\s]+$/.test(str.trim());
}

// 01xxxxxxxxx or 01xxxxxxxxx
export const phoneRegex = /^01\d{8,9}$/;

// min 6 characters, at least one letter and one number
export const isValidPassword = (password) =>
    password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

// Course validation functions
export const isValidCourseTitle = (title) => {
    return title.trim().length >= 3 && title.trim().length <= 100;
};

export const isValidDuration = (duration) => {
    const num = parseInt(duration, 10);
    return !isNaN(num) && num > 0 && num <= 52; // Max 52 weeks (1 year)
};

export const isValidExpiryWeeks = (weeks) => {
    const num = parseInt(weeks, 10);
    return !isNaN(num) && num > 0 && num <= 104; // Max 104 weeks (2 years)
};

export const isValidBadgeExpiry = (months) => {
    const num = parseInt(months, 10);
    return !isNaN(num) && num > 0 && num <= 60; // Max 60 months (5 years)
};

// IC (040506101234)
export const isValidIC = (ic) =>
  typeof ic === "string" && /^\d{12}$/.test(ic);

// ONE uppercase letter + EXACTLY 8 digits
// Example: A01234567
export const isValidPassport = (passport) =>
  typeof passport === "string" &&
  /^[A-Z]\d{8}$/.test(passport);

// combined IC/Passport validator
export const isValidIdentification = (identification) => {
  if (!identification || typeof identification !== "string") return false;
  const trimmed = identification.trim();
  // IC: exactly 12 digits
  if (/^\d{12}$/.test(trimmed)) return true;
  // passport: 1 uppercase letter + 8 digits
  if (/^[A-Z]\d{8}$/.test(trimmed)) return true;
  return false;
};