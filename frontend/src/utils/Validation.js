export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isOnlyLetters=(str)=>{
    return /^[A-Za-z\s]+$/.test(str.trim());
}

export const phoneRegex = /^(01[0-9]{1}-?[0-9]{7,8}|0[1-9]{1}-?[0-9]{6,7})$/;

// min 6 characters, at least one letter and one number
export const isValidPassword = (password) =>
    password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);