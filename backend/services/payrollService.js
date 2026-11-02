// Default Payroll Policy (Isko baad me settings se link kar sakte hain)
const PAYROLL_POLICY = {
  totalDaysInMonth: 30, // Fixed 30 days for calculation (as per your plan example)
  paidLeavesAllowed: 1, // Example: 1 paid leave per month
};

/**
 * Calculate Salary based on Attendance
 * @param {Number} monthlySalary - Base salary of employee
 * @param {Array} attendanceRecords - Array of attendance objects for the month
 * @returns {Object} Calculated payroll details
 */
const calculatePayroll = (monthlySalary, attendanceRecords) => {
  // Initialize counters
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let paidLeaves = 0;
  let unpaidLeaves = 0;
  let weeklyOffs = 0;
  let holidays = 0;

  // Loop through attendance and count
  attendanceRecords.forEach(record => {
    switch (record.status) {
      case 'Present':
        presentDays++;
        break;
      case 'Half-Day':
        halfDays++;
        break;
      case 'Absent':
        absentDays++;
        break;
      case 'Paid Leave':
        paidLeaves++;
        break;
      case 'Unpaid Leave':
        unpaidLeaves++;
        break;
      case 'Weekly Off':
        weeklyOffs++;
        break;
      case 'Holiday':
        holidays++;
        break;
      default:
        break;
    }
  });

  // Calculation Logic (As per your example: Salary / 30 * Payable Days)
  const totalDays = PAYROLL_POLICY.totalDaysInMonth;
  const perDayRate = monthlySalary / totalDays;

  // Payable days calculation: 
  // Present + WeeklyOffs + Holidays + (Paid Leaves up to allowed limit)
  // Half-days count as 0.5
  const effectivePaidLeaves = Math.min(paidLeaves, PAYROLL_POLICY.paidLeavesAllowed);
  const extraUnpaidLeaves = paidLeaves > PAYROLL_POLICY.paidLeavesAllowed ? (paidLeaves - PAYROLL_POLICY.paidLeavesAllowed) : 0;
  
  const payableDays = presentDays + (halfDays * 0.5) + weeklyOffs + holidays + effectivePaidLeaves;

  // Calculate amounts
  const basicPayable = parseFloat((perDayRate * payableDays).toFixed(2));
  
  // Deductions (Only Unpaid Leaves + Extra Unpaid Leaves)
  const totalUnpaidDays = unpaidLeaves + extraUnpaidLeaves;
  const deductions = parseFloat((perDayRate * totalUnpaidDays).toFixed(2));
  
  // Net Payable
  const netPayable = parseFloat((basicPayable).toFixed(2)); // Note: deductions already excluded by not counting them in payable days

  return {
    monthlySalary,
    totalDaysInMonth: totalDays,
    perDayRate: parseFloat(perDayRate.toFixed(2)),
    presentDays,
    halfDays,
    absentDays,
    paidLeaves: effectivePaidLeaves,
    unpaidLeaves: totalUnpaidDays,
    weeklyOffs,
    holidays,
    payableDays,
    basicPayable,
    additions: 0, // Can be added later
    deductions,
    netPayable
  };
};

module.exports = {
  calculatePayroll,
  PAYROLL_POLICY
};