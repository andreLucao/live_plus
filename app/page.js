// page.js
'use client'
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Bem-vindo ao Live Plus</h1>
        <p className="text-xl text-gray-600 mb-8">
          Sua plataforma completa para gerenciamento de serviços de saúde
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Acessar Suas Contas
          </Link>
          
        </div>
        
        <p className="text-gray-500 text-sm">
          Não sabe qual é o seu tenant? Use nosso login global para encontrar todas as suas contas.
        </p>
      </div>
      
      <div className="mt-12 text-center text-gray-600">
        <p className="mb-2">© {new Date().getFullYear()} Live Plus. Todos os direitos reservados.</p>
        
      </div>
    </div>
  );
}