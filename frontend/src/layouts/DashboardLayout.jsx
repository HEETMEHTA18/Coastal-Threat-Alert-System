import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DashboardLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-cyan-700 to-green-400 dark:from-gray-900 dark:via-blue-900 dark:to-cyan-700 transition-all duration-700">
    <Navbar />
    <main className="flex-1 px-4 py-8 md:px-12 lg:px-24">
      {children}
    </main>
    <Footer />
  </div>
);

export default DashboardLayout;
