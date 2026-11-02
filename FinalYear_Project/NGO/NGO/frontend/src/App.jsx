import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import Donate from "./pages/Donate";
import Store from "./pages/Store";
import Beneficiaries from "./pages/Beneficiaries";
import Utilization from "./pages/Utilization";
import Transparency from "./pages/Transparency";
import Impact from "./pages/Impact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Receipt from "./pages/Receipt";
import Contact from "./pages/Contact";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminCampaigns from "./pages/admin/Campaigns";
import AdminDonations from "./pages/admin/Donations";
import AdminBeneficiaries from "./pages/admin/Beneficiaries";
import AdminStore from "./pages/admin/Store";
import AdminExpenses from "./pages/admin/Expenses";
import AdminReports from "./pages/admin/Reports";
import AdminMessages from "./pages/admin/Messages";
import AdminNotifications from "./pages/admin/Notifications";
import NotFound from "./pages/NotFound";

function Guard({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-16 text-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:slug" element={<CampaignDetail />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/store" element={<Store />} />
        <Route path="/beneficiaries" element={<Beneficiaries />} />
        <Route path="/utilization" element={<Utilization />} />
        <Route path="/transparency" element={<Transparency />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <Guard>
              <Profile />
            </Guard>
          }
        />
        <Route
          path="/receipts/:receiptNo"
          element={
            <Guard>
              <Receipt />
            </Guard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="/admin"
        element={
          <Guard admin>
            <AdminLayout />
          </Guard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="donations" element={<AdminDonations />} />
        <Route path="beneficiaries" element={<AdminBeneficiaries />} />
        <Route path="store" element={<AdminStore />} />
        <Route path="expenses" element={<AdminExpenses />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>
    </Routes>
  );
}
