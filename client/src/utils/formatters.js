// Small shared formatting helpers to avoid repeating date formatting logic
// across multiple list tables.

export const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

