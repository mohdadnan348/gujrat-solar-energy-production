import API from './api';

const unwrap = (response) => {
  let payload = response?.data;
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
    }
    return stats;
  },

  getEmployeeDashboardData: async () => {
    const [tasksRes, leadsRes, attendanceRes, payrollRes] = await Promise.all([
      API.get('/tasks?status=To Do'),
      API.get('/leads'),
      API.get('/attendance/my'),
      API.get('/payroll/my'),
    ]);
    return {
      tasks: unwrap(tasksRes) || [],
      leads: unwrap(leadsRes) || [],
      attendance: unwrap(attendanceRes) || [],
      payroll: unwrap(payrollRes) || [],
    };
  },
};

export default dashboardService;
