'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import HospitalBillManager from '../contas/page';
import HospitalIncomeManager from '../receita/page';
import { Menu, X, FileText, PiggyBank } from 'lucide-react';

const ComponentSelector = () => {
  const [activeComponent, setActiveComponent] = useState('HospitalBillManager');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div 
        className={`
          fixed h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Toggle Button - Updated positioning */}
        <button
          onClick={toggleSidebar}
          className="absolute right-[-20px] top-4 bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition-colors duration-200 cursor-pointer z-50"
        >
          {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Sidebar Content */}
        <div className="flex flex-col h-full">
          {/* Logo/Header Area */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`font-bold text-xl text-purple-600 dark:text-purple-400 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              Hospital Manager
            </h2>
          </div>

          {/* Navigation Items - Updated with dark mode styles */}
          <nav className="flex-1 pt-6 px-2 space-y-2">
            <Button
              variant="ghost"
              className={`w-full flex items-center gap-3 justify-start px-3 py-2 rounded-lg transition-all duration-200
                ${activeComponent === 'HospitalBillManager' 
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
              `}
              onClick={() => setActiveComponent('HospitalBillManager')}
            >
              <FileText size={20} />
              <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                Hospital Bills
              </span>
            </Button>

            <Button
              variant="ghost"
              className={`w-full flex items-center gap-3 justify-start px-3 py-2 rounded-lg transition-all duration-200
                ${activeComponent === 'HospitalIncomeManager' 
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
              `}
              onClick={() => setActiveComponent('HospitalIncomeManager')}
            >
              <PiggyBank size={20} />
              <span className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                Hospital Income
              </span>
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-64' : 'ml-16'}
        `}
      >
        <div className="p-8">
          {activeComponent === 'HospitalBillManager' ? <HospitalBillManager /> : <HospitalIncomeManager />}
        </div>
      </div>
    </div>
  );
};

export default ComponentSelector;