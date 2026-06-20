function getMockUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('mock_user');
  return user ? JSON.parse(user) : null;
}

function setMockUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mock_user', JSON.stringify(user));
}

function clearMockUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mock_user');
}

module.exports = {
  getMockUser,
  setMockUser,
  clearMockUser
};
