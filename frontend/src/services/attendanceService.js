import API from './api';

const attendanceService = {
  checkIn: async () => {
    const response = await API.post('/attendance/check-in');
    return response.data.data;
  },
  checkOut: async () => {
    const response = await API.put('/attendance/check-out');
    return response.data.data;
  },
  // YAHAN FIX KIYA HAI (month aur year optional hain)
  getMyAttendance: async (month, year) => {
    let url = '/attendance/my';
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    const response = await API.get(url);
    return response.data.data;
  },
  getAllAttendance: async (date, employeeId) => {
    let query = '';
    if (date) query += `date=${date}&`;
    if (employeeId) query += `employeeId=${employeeId}`;
    const response = await API.get(`/attendance?${query}`);
    return response.data.data;
  },
  correctAttendance: async (id, data) => {
    const response = await API.put(`/attendance/${id}/correct`, data);
    return response.data.data;
  },
};

export default attendanceService;