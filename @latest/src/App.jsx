import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/login";
import Signup from "./components/auth/signup";
import ForgotPassword from "./components/auth/forgot";
import ResetPassword from "./components/auth/reset";
import EmailSent from "./components/auth/mail";
import SmartSearchBar from "./components/common/searchbar";
import Navbar from "./components/common/navbar";
import AboutUs from "./components/pages/Aboutus";
import Layout from "./components/pages/ui_layout";
import GoLiveLayout from "./components/pages/ui_layout_go";
import ExploreLayout from "./components/pages/ui_layout_explore";
import ProfileLayout from "./components/pages/ui_layout_profile";
import StreamLayout from "./components/pages/ui_layout_stream";
import StreamPage from "./components/profile/stream";
import Profile from "./components/pages/profile";
import Settings from "./components/pages/settings";
import AnalyticsDashboard from "./components/pages/analyticsDashboard";
import PaymentForm from "./components/payment/PaymentForm";
import PaymentHistory from "./components/payment/PaymentHistory";
import PaymentStats from "./components/payment/PaymentStats";
import Payment from "./components/pages/payment";
import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setClerkTokenProvider } from "./services/apiClient";

export function ClerkTokenProviderSetup() {
  const { getToken } = useAuth();

  useEffect(() => {
    if (getToken) {
      setClerkTokenProvider(getToken);
    }
  }, [getToken]);

  return null;
}
export default function App() {
  return (
    <>
    <ClerkTokenProviderSetup/>
    <Routes>
      <Route path="/" element={<AboutUs/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-sent" element={<EmailSent />} />
      <Route path="/dashboard" element={<Layout/>} />
      <Route path="/Live" element={<GoLiveLayout/>}/>
      <Route path="/profile" element={<Profile/>}/>
      <Route path="/settings" element={<Settings/>}/>
      <Route path="/analytics" element={<AnalyticsDashboard/>}/>
      <Route path="/Profile" element={<ProfileLayout/>}/>
      <Route path="/Explore" element={<ExploreLayout/>}/>
      <Route path="/Watch" element={<StreamLayout/>}/>
      <Route path="/stream/:id" element={<StreamPage/>} />
      <Route path="/Payment" element={<Payment/>}/>
      <Route path="/Payment/form" element={<PaymentForm/>}/>
      <Route path="/Payment/form" element={<PaymentForm/>}/>
      <Route path="/Payment/History" element={<PaymentHistory/>}/>
      <Route path="/payment/stats" element={<PaymentStats/>}/>
      <Route path="*" element={<div>404 Page</div>} />
    </Routes>
    </>
  );
}