export const ROLE_HOME = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
  super_admin: '/admin',
};

// Where a logged-in user "lives"
export const homeFor = (role) => ROLE_HOME[role] ?? '/';