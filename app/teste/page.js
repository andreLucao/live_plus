'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import HospitalBillManager from '../contas/page';
import HospitalIncomeManager from '../receita/page';

const ComponentSelector = () => {
  const [activeComponent, setActiveComponent] = useState('HospitalBillManager');

  return (
    <div className="space-y-4 flex flex-col items-center justify-center mt-4">
      <div className="flex gap-4 justify-center w-full">
        <Button
          className={`${
            activeComponent === 'HospitalBillManager'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
          } text-white hover:text-white transition-all duration-300`}
          onClick={() => setActiveComponent('HospitalBillManager')}
        >
          Show Component HospitalBillManager
        </Button>
        <Button
          className={`${
            activeComponent === 'HospitalIncomeManager'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
          } text-white hover:text-white transition-all duration-300`}
          onClick={() => setActiveComponent('HospitalIncomeManager')}
        >
          Show Component HospitalIncomeManager
        </Button>
      </div>

      <div className="mt-4 w-full">
        {activeComponent === 'HospitalBillManager' ? <HospitalBillManager /> : <HospitalIncomeManager />}
      </div>
    </div>
  );
};

export default ComponentSelector;