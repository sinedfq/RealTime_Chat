const trimStr = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
};

exports.trimStr = trimStr;