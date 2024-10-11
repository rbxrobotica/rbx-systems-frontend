// src/app/dashboard/page.tsx

'use client'

import { useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout';

export default function Dashboard() {
  const { isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  // Verificação de autenticação
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    // Se não estiver carregando e não estiver autenticado, redirecione para login
    if (!loading && !isAuthenticated && !token) {
      console.log("NÃO PASSOU A AUTH");
      router.push('/login');
    }
  }, [isAuthenticated, loading]);

  // Exibe mensagem de carregamento enquanto verifica autenticação
  if (loading) {
    return <p>Verificando autenticação...</p>;
  }

  return (
    <Layout title="Dashboard">
      <h1>Dashboard</h1>
      <ul>
        <li>teste dashboard</li>
      </ul>
      <button onClick={logout}>Logout</button>
    </Layout>
  );
}
