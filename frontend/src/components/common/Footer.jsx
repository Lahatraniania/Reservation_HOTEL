import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="w-8 h-8 text-blue-400" />
              <h3 className="text-xl font-bold">Reservation_HOTEL</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Plateforme de réservation d'hôtels à Madagascar.
              Découvrez les meilleurs hébergements à travers l'île.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white transition">Accueil</Link></li>
              <li><Link to="/hotels" className="hover:text-white transition">Hôtels</Link></li>
              <li><Link to="/chambres" className="hover:text-white transition">Chambres</Link></li>
              <li><Link to="/about" className="hover:text-white transition">À propos</Link></li>
            </ul>
          </div>

          {/* Pour les propriétaires */}
          <div>
            <h4 className="font-semibold mb-4">Pour les propriétaires</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/register-proprio" className="hover:text-white transition">Déposer mon hôtel</Link></li>
              <li><Link to="/proprio" className="hover:text-white transition">Espace propriétaire</Link></li>
              <li><Link to="/conditions" className="hover:text-white transition">Conditions générales</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                contact@reservation-hotel.mg
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +261 34 12 345 67
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Antananarivo, Madagascar
              </li>
            </ul>
            {/* Réseaux sociaux */}
            <div className="flex gap-4 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">...</svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">...</svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">...</svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
              >
                <span className="sr-only">YouTube</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">...</svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p className="flex items-center justify-center gap-1">
            &copy; 2026 Reservation_HOTEL. Tous droits réservés.
            <Heart className="w-4 h-4 text-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;