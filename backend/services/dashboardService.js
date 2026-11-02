import API from './api';

const dashboardService = {
  // Employee ke liye dashboard data fetch karna
  getEmployeeDashboardData: async () => {
    try {
      // Ek saath multiple APIs call kar rahe hain
      const [tasksRes, leadsRes, attendanceRes, payrollRes] = await Promise.all([
        API.get('/tasks?status=To Do'), // Pending tasks
        API.get('/leads'), // Assigned leads
        API.get('/attendance/my'), // Attendance records
        API.get('/payroll/my'), // Salary slips
      ]);

      return {
        tasks: tasksRes.data.data || [],
        leads: leadsRes.data.data || [],
        attendance: attendanceRes.data.data || [],
        payroll: payrollRes.data.data || [],
      };
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
      throw error;
    }
  },
};

export default dashboardService;