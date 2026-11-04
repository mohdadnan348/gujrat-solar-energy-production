import API from './api';

const unwrap = (response) => {
  let payload = response?.data;

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
    }

    return stats;
  },

  // Admin dashboard: Admin-only global endpoint.
  getAdminStats: async () => {
    const stats = unwrap(await API.get('/dashboard/stats'));

    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      throw new Error('Admin dashboard API returned an invalid response.');
    }

    return stats;
  },

  // Employee dashboard data.
  getEmployeeDashboardData: async () => {
    const [tasksRes, leadsRes, attendanceRes, payrollRes] =
      await Promise.all([
        API.get('/tasks'),
        API.get('/leads'),
        API.get('/attendance/my'),
        API.get('/payroll/my'),
      ]);

    const tasksPayload = unwrap(tasksRes);
    const leadsPayload = unwrap(leadsRes);
    const attendancePayload = unwrap(attendanceRes);
    const payrollPayload = unwrap(payrollRes);

    const tasks = toArray(tasksPayload, ['tasks', 'results', 'items']);
    const leads = toArray(leadsPayload, ['leads', 'results', 'items']);
    const attendance = toArray(attendancePayload, [
      'attendance',
      'records',
      'results',
      'items',
    ]);
    const payroll = toArray(payrollPayload, [
      'payroll',
      'records',
      'results',
      'items',
    ]);

    return {
      // Completed tasks are excluded from open-task widgets.
      tasks: tasks.filter((task) => task?.status !== 'Completed'),
      leads,
      attendance,
      payroll,
    };
  },
};

export default dashboardService;