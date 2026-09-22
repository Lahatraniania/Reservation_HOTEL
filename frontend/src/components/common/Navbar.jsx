import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import {
  Hotel, Bed, User, LogOut, LogIn, UserPlus,
  Menu, X, Home, Store, Shield,
  Calendar, Bell, UserCircle
} from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout, role, unreadCount, notifications, markNotificationAsRead } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // ✅ Nouveau

  // ✅ Ouvrir la modal
  const handleLogout = () => {
    setShowLogoutModal(true);
    setIsMenuOpen(false);
    setShowNotifications(false);
  };

  // ✅ Confirmer la déconnexion
  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/');
  };

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16">
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
              <Hotel className="w-8 h-8" />
              <span className="hidden sm:inline">Reservation_HOTEL</span>
              <span className="sm:hidden">RH</span>
            </Link>

            {/* NAVIGATION DESKTOP */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition">
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <Link to="/hotels" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition">
                <Store className="w-4 h-4" />
                Hôtels
              </Link>
              <Link to="/chambres" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition">
                <Bed className="w-4 h-4" />
                Chambres
              </Link>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-gray-700 hover:text-blue-600 transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold transition">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}

                  {role === 'proprietaire' && (
                    <Link to="/proprio" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold transition">
                      <Store className="w-4 h-4" />
                      Mes hôtels
                    </Link>
                  )}

                  {role === 'client' && (
                    <Link to="/my-reservations" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition">
                      <Calendar className="w-4 h-4" />
                      Mes réservations
                    </Link>
                  )}

                  <Link to="/profile" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition">
                    <UserCircle className="w-5 h-5" />
                    {user?.username || 'Mon compte'}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition">
                    <LogIn className="w-4 h-4" />
                    Connexion
                  </Link>
                  <Link to="/register" className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                    <UserPlus className="w-4 h-4" />
                    S'inscrire
                  </Link>
                </>
              )}
            </div>

            {/* MENU MOBILE */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* MENU MOBILE */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                  <Home className="w-4 h-4" />
                  Accueil
                </Link>
                <Link to="/hotels" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                  <Store className="w-4 h-4" />
                  Hôtels
                </Link>
                <Link to="/chambres" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                  <Bed className="w-4 h-4" />
                  Chambres
                </Link>

                {isAuthenticated ? (
                  <>
                    {role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 text-red-600 font-semibold">
                        <Shield className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    {role === 'proprietaire' && (
                      <Link to="/proprio" className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Store className="w-4 h-4" />
                        Mes hôtels
                      </Link>
                    )}
                    {role === 'client' && (
                      <Link to="/my-reservations" className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        Mes réservations
                      </Link>
                    )}
                    <Link to="/profile" className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      Mon profil
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-semibold">
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                      <LogIn className="w-4 h-4" />
                      Connexion
                    </Link>
                    <Link to="/register" className="flex items-center gap-2 px-4 py-2 text-center text-white bg-blue-600 rounded-lg">
                      <UserPlus className="w-4 h-4" />
                      S'inscrire
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* PANNEAU NOTIFICATIONS */}
          {showNotifications && isAuthenticated && (
            <div className="absolute right-4 top-16 w-80 bg-white rounded-lg shadow-xl border z-50">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm text-center">Aucune notification</p>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.est_lue ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm text-gray-800">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.date_creation).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ✅ MODAL DE DÉCONNEXION */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir vous déconnecter de votre compte ?"
        details={`Utilisateur : ${user?.username || ''}`}
        confirmText="Oui, se déconnecter"
        cancelText="Non, rester"
        type="logout"
      />
    </>
  );
};

export default Navbar;