// ============================================
// UTILITY FUNCTIONS
// ============================================

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const parseDateValue = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return new Date(dateValue.getTime());

  if (typeof dateValue === 'string' && DATE_ONLY_REGEX.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number);
    // Use local noon to avoid timezone rollbacks when rendering date-only values.
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  return new Date(dateValue);
};

export const formatDate = (
  dateValue,
  options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
) => {
  const parsedDate = parseDateValue(dateValue);
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleDateString('en-US', options);
};

export const formatTime = (timeString, timezone = 'EST') => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  // Convert timezone to short format
  const tzMap = {
    'America/New_York': 'EST',
    'America/Chicago': 'CST',
    'America/Denver': 'MST',
    'America/Los_Angeles': 'PST',
    'Europe/London': 'GMT',
    'Asia/Tokyo': 'JST',
    'EST': 'EST',
    'CST': 'CST',
    'MST': 'MST',
    'PST': 'PST',
  };
  const tzDisplay = tzMap[timezone] || timezone;
  
  return `${hour12}:${minutes} ${ampm} ${tzDisplay}`;
};

export const getTimeUntil = (dateString) => {
  const date = parseDateValue(dateString);
  if (!date || Number.isNaN(date.getTime())) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diff = targetDate - today;
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};
