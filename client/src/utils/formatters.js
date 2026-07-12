export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDistance = (km) => {
  if (km === null || km === undefined) return '0 km';
  return `${new Intl.NumberFormat('en-IN').format(km)} km`;
};

export const formatWeight = (kg) => {
  if (kg === null || kg === undefined) return '0 kg';
  return `${new Intl.NumberFormat('en-IN').format(kg)} kg`;
};

export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return date.toLocaleDateString('en-IN', options);
};

export const padZero = (num) => {
  return num < 10 ? `0${num}` : num.toString();
};
