import API from './api';

const unwrap = (response) => {
  let payload = response?.data;
<<<<<<< HEAD

  while (
    payload &&
    !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    payload = payload.data;
  }

  return payload;
};

const toArray = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }

  return [];
};

const dashboardService = {
  // HR dashboard: HR-scoped endpoint only.
  getHRStats: async () => {
    const stats = unwrap(await API.get('/dashboard/hr-stats'));

    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      throw new Error('HR dashboard API returned an invalid response.');
=======
  while (payload && !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, 'data')) {
    payload = payload.data;
  }
  return payload;
};

const dashboardService = {
  // HR must call /dashboard/hr-stats, never the Admin-only /dashboard/stats endpoint.
  getHRStats: async () => {
    const stats = unwrap(await API.get('/dashboard/hr-stats'));
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      throw new Error('HR dashboard API returned an invalid response.');
    }
    return stats;
  },

  // Admin-only global dashboard.
  getAdminStats: async () => {
    const stats = unwrap(await API.get('/dashboard/stats'));
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      throw new Error('Admin dashboard API returned an invalid response.');
>>>>>>> b1916d9 (create hr role)
    }

    return stats;
  },

  // Admin dashboard: global Admin-only endpoint.
  getAdminStats: async () => {
    const stats = unwrap(await API.get('/dashboard/stats'));

    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      throw new Error('Admin dashboard API returned an invalid response.');
    }

    return stats;
  },

  // Employee dashboard: fetch the employee's assigned tasks without
  // filtering by "To Do", so In Progress and other open tasks are included.
  getEmployeeDashboardData: async () => {
    const [tasksRes, leadsRes, attendanceRes, payrollRes] = await Promise.all([
      API.get('/tasks'),
      API.get('/leads'),
      API.get('/attendance/my'),
      API.get('/payroll/my'),
    ]);
<<<<<<< HEAD

    const tasksPayload = unwrap(tasksRes);
    const leadsPayload = unwrap(leadsRes);
    const attendancePayload = unwrap(attendanceRes);
    const payrollPayload = unwrap(payrollRes);

    const tasks = toArray(tasksPayload, ['tasks', 'results', 'items']);
    const leads = toArray(leadsPayload, ['leads', 'results', 'items']);
    const attendance = toArray(attendancePayload, ['attendance', 'records', 'results', 'items']);
    const payroll = toArray(payrollPayload, ['payroll', 'records', 'results', 'items']);

    return {
      // Completed tasks are excluded from the dashboard's open-task widgets.
      tasks: tasks.filter((task) => task?.status !== 'Completed'),
      leads,
      attendance,
      payroll,
=======
    return {
      tasks: unwrap(tasksRes) || [],
      leads: unwrap(leadsRes) || [],
      attendance: unwrap(attendanceRes) || [],
      payroll: unwrap(payrollRes) || [],
>>>>>>> b1916d9 (create hr role)
    };
  },
};

export default dashboardService;
