import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// ================= AUTH PAGES =================
import Login from "./pages/Auth/Login";

// ================= ADMIN PAGES =================
import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard";
import CustomerList from "./pages/Admin/Customers/CustomerList";
import LeadList from "./pages/Admin/Leads/LeadList";
import LeadDetails from "./pages/Admin/Leads/LeadDetails";
import QuotationList from "./pages/Admin/Quotations/QuotationList";
import CreateQuotation from "./pages/Admin/Quotations/CreateQuotation";
import QuotationView from "./pages/Admin/Quotations/QuotationView";
import EditQuotation from "./pages/Admin/Quotations/EditQuotation";
import InvoiceList from "./pages/Admin/Invoices/InvoiceList";
import CreateInvoice from "./pages/Admin/Invoices/CreateInvoice";
import InvoiceView from "./pages/Admin/Invoices/InvoiceView";
import TaskList from "./pages/Admin/Tasks/TaskList";
import EmployeeList from "./pages/Admin/Employees/EmployeeList";
import AllAttendance from "./pages/Admin/Attendance/AllAttendance";
import PayrollList from "./pages/Admin/Payroll/PayrollList";
import GeneratePayroll from "./pages/Admin/Payroll/GeneratePayroll";
import Reports from "./pages/Admin/Reports/Reports";
import Settings from "./pages/Admin/Settings/Settings";

// ================= EMPLOYEE PAGES =================
import EmployeeDashboard from "./pages/Employee/Dashboard/EmployeeDashboard";
import MyLeads from "./pages/Employee/MyLeads/MyLeads";
import MyTasks from "./pages/Employee/MyTasks/MyTasks";
import MyAttendance from "./pages/Employee/MyAttendance/MyAttendance";
import MyLeaves from "./pages/Employee/MyLeaves/MyLeaves";
import LeaveList from "./pages/Admin/Leaves/LeaveList";
import MySalary from "./pages/Employee/MySalary/MySalary";
import Profile from "./pages/Employee/Profile/Profile";

// ================= COMMON PAGES =================
import Notifications from "./pages/Admin/Notifications/Notifications";

// ================= LAYOUTS =================
import AdminLayout from "./components/Layout/AdminLayout";
import EmployeeLayout from "./components/Layout/EmployeeLayout";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          {/* ================= ADMIN ROUTES ================= */}
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/customers" element={<AdminLayout><CustomerList /></AdminLayout>} />
          <Route path="/admin/leads" element={<AdminLayout><LeadList /></AdminLayout>} />
          <Route path="/admin/leads/:id" element={<AdminLayout><LeadDetails /></AdminLayout>} />
          <Route path="/admin/quotations" element={<AdminLayout><QuotationList /></AdminLayout>} />
          <Route path="/admin/quotations/create" element={<AdminLayout><CreateQuotation /></AdminLayout>} />
          <Route path="/admin/quotations/:id" element={<AdminLayout><QuotationView /></AdminLayout>} />
          <Route path="/admin/quotations/edit/:id" element={<AdminLayout><EditQuotation /></AdminLayout>} />
          <Route path="/admin/invoices" element={<AdminLayout><InvoiceList /></AdminLayout>} />
          <Route path="/admin/invoices/create" element={<AdminLayout><CreateInvoice /></AdminLayout>} />
          <Route path="/admin/invoices/:id" element={<AdminLayout><InvoiceView /></AdminLayout>} />
          <Route path="/admin/tasks" element={<AdminLayout><TaskList /></AdminLayout>} />
          <Route path="/admin/employees" element={<AdminLayout><EmployeeList /></AdminLayout>} />
          <Route path="/admin/attendance" element={<AdminLayout><AllAttendance /></AdminLayout>} />
          <Route path="/admin/payroll" element={<AdminLayout><PayrollList /></AdminLayout>} />
          <Route path="/admin/payroll/generate" element={<AdminLayout><GeneratePayroll /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><Settings /></AdminLayout>} />
          <Route path="/admin/notifications" element={<AdminLayout><Notifications /></AdminLayout>} />

          {/* ================= EMPLOYEE ROUTES ================= */}
          <Route path="/employee/dashboard" element={<EmployeeLayout><EmployeeDashboard /></EmployeeLayout>} />
          <Route path="/employee/notifications" element={<EmployeeLayout><Notifications /></EmployeeLayout>} />
          <Route path="/employee/leads" element={<EmployeeLayout><MyLeads /></EmployeeLayout>} />
          <Route path="/employee/tasks" element={<EmployeeLayout><MyTasks /></EmployeeLayout>} />
          <Route path="/employee/attendance" element={<EmployeeLayout><MyAttendance /></EmployeeLayout>} />
          <Route path="/employee/leaves" element={<EmployeeLayout><MyLeaves /></EmployeeLayout>} />
          {/* Admin - Leave Management */}
          <Route path="/admin/leaves" element={<AdminLayout><LeaveList /></AdminLayout>} />
          <Route path="/employee/salary" element={<EmployeeLayout><MySalary /></EmployeeLayout>} />
          <Route path="/employee/profile" element={<EmployeeLayout><Profile /></EmployeeLayout>} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;