import React from 'react';
import Link from 'next/link';

interface UserInfo {
  email: string;
  role: string;
  name: string;
}

interface NavbarProps {
  onAuthClick: () => void;
  loggedIn?: boolean;
  onLogout?: () => void;
  user?: UserInfo | null;
}

const Navbar: React.FC<NavbarProps> = ({ onAuthClick, loggedIn, onLogout, user }) => {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="text-2xl font-bold text-blue-700">PawMart</div>
      <div className="flex items-center gap-4">
        {loggedIn && (
          <>
            {user && (user.role === 'ADMIN' || user.role === 'STAFF') && (
              <Link href="/dashboard" className="text-blue-800 font-semibold hover:underline text-base">
                Dashboard
              </Link>
            )}
            {user && user.role === 'BUYER' && (
              <span className="text-gray-900 text-base font-medium">Welcome, {user.name}</span>
            )}
            {user && (user.role === 'ADMIN' || user.role === 'STAFF') && (
              <span className="text-gray-900 text-base font-medium">{user.email} ({user.role})</span>
            )}
          </>
        )}
        {loggedIn ? (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-base font-semibold"
            onClick={onLogout}
          >
            Logout
          </button>
        ) : (
          <button
            className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition text-base font-semibold"
            onClick={onAuthClick}
          >
            Login / Register
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 