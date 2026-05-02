export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isOnlyLetters=(str)=>{
    return /^[A-Za-z\s]+$/.test(str.trim());
}

export const phoneRegex = /^(01[0-9]{1}-?[0-9]{7,8}|0[1-9]{1}-?[0-9]{6,7})$/;