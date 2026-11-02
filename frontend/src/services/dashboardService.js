import API from './api';

const dashboardService = {
  getAdminStats: async () => {
    const response = await API.get('/dashboard/stats');
    const payload = response?.data;

    // Supports the project's ApiResponse shape: { statusCode, data, success }.
    const stats = payload?.data ?? payload;
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      throw new Error('Dashboard API returned an invalid response.');
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
      tasks: tasksRes?.data?.data || [],
      leads: leadsRes?.data?.data || [],
      attendance: attendanceRes?.data?.data || [],
      payroll: payrollRes?.data?.data || [],
    };
  },
};

export default dashboardService;
