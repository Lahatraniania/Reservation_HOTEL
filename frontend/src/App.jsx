import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { HotelProvider } from './contexts/HotelContext';

// ========== COMPOSANTS COMMUNS ==========
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// ========== PAGES PUBLIQUES ==========
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import RegisterProprioPage from './pages/public/RegisterProprioPage';
import HotelsPage from './pages/public/HotelsPage';
import ChambresPage from './pages/public/ChambresPage';
import HotelDetailPage from './pages/public/HotelDetailPage';
import ChambreDetailPage from './pages/public/ChambreDetailPage';
import AboutPage from './pages/public/AboutPage';
import ConditionsPage from './pages/public/ConditionsPage';

// ========== PAGES CLIENT ==========
import ProfilePage from './pages/client/ProfilePage';
import MyReservationsPage from './pages/client/MyReservationsPage';
import DashboardClientPage from './pages/client/DashboardClientPage';
import PaymentPage from './pages/client/PaymentPage';
import PaymentSuccessPage from './pages/client/PaymentSuccessPage';
import PaymentCancelPage from './pages/client/PaymentCancelPage';

// ========== PAGES PROPRIÉTAIRE ==========
import DashboardProprioPage from './pages/proprio/DashboardProprioPage';
import HotelFormPage from './pages/proprio/HotelFormPage';
import RoomFormPage from './pages/proprio/RoomFormPage';        // ✅ NOUVEAU
import GestionReservationsPage from './pages/proprio/GestionReservationsPage';

// ========== PAGES ADMIN ==========
import DashboardAdminPage from './pages/admin/DashboardAdminPage';
import DemandesListPage from './pages/admin/DemandesListPage';
import CommissionsPage from './pages/admin/CommissionsPage';

// ========== CONFIGURATION REACT QUERY ==========
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HotelProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              {/* Navbar */}
              <Navbar />

              {/* Contenu principal */}
              <main className="flex-grow">
                <Routes>
                  {/* ============================================== */}
                  {/* ========== ROUTES PUBLIQUES ================= */}
                  {/* ============================================== */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/conditions" element={<ConditionsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/register-proprio" element={<RegisterProprioPage />} />
                  <Route path="/hotels" element={<HotelsPage />} />
                  <Route path="/hotels/:id" element={<HotelDetailPage />} />
                  <Route path="/chambres" element={<ChambresPage />} />
                  <Route path="/chambres/:id" element={<ChambreDetailPage />} />

                  {/* ============================================== */}
                  {/* ========== ROUTES PAIEMENT =================== */}
                  {/* ============================================== */}
                  <Route path="/payment/:id" element={<PaymentPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  <Route path="/payment-cancel" element={<PaymentCancelPage />} />

                  {/* ============================================== */}
                  {/* ========== ROUTES PROTÉGÉES - CLIENT ========= */}
                  {/* ============================================== */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-reservations"
                    element={
                      <ProtectedRoute>
                        <MyReservationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardClientPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ============================================== */}
                  {/* ========== ROUTES PROTÉGÉES - PROPRIÉTAIRE === */}
                  {/* ============================================== */}
                  <Route
                    path="/proprio"
                    element={
                      <ProtectedRoute requiredRole="proprietaire">
                        <DashboardProprioPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/proprio/hotel/new"
                    element={
                      <ProtectedRoute requiredRole="proprietaire">
                        <HotelFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/proprio/hotel/:id"
                    element={
                      <ProtectedRoute requiredRole="proprietaire">
                        <HotelFormPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ✅ ROUTES POUR LES CHAMBRES (NOUVELLES) */}
                  <Route
                    path="/proprio/hotel/:hotelId/room/new"
                    element={
                      <ProtectedRoute requiredRole="proprietaire">
                        <RoomFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/proprio/hotel/:hotelId/room/:roomId"
                    element={
                      <ProtectedRoute requiredRole="proprietaire">
                        <RoomFormPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/proprio/reservations"
                    element={
                      <ProtectedRoute requiredRole="proprietaire">
                        <GestionReservationsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ============================================== */}
                  {/* ========== ROUTES PROTÉGÉES - ADMIN ========== */}
                  {/* ============================================== */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <DashboardAdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/demandes"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <DemandesListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/commissions"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CommissionsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ============================================== */}
                  {/* ========== REDIRECTION 404 =================== */}
                  {/* ============================================== */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Footer */}
              <Footer />
            </div>

            {/* Toaster pour les notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#22c55e',
                    color: '#fff',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                },
              }}
            />
          </Router>
        </HotelProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;