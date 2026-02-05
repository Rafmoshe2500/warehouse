export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 3;
};

export const validateDeletePassword = (password) => {
  return password && password.trim().length > 0;
};

export const validateDeleteConfirmation = (confirmation) => {
  return confirmation && confirmation.toLowerCase() === 'delete';
};
