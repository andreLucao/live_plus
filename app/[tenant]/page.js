
// page.js
'use client'
import React from 'react';
import Sidebar from '../../components/Sidebar';



export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 pt-16 md:pt-8 md:ml-64">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Bem-vindo ao Live Plus
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Selecione uma opção no menu para começar.
        </p>
      </div>
    </div>
  );
}