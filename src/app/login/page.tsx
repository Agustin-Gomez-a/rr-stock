import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accedé a tu cuenta de Repuesto Control',
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }
  return <LoginForm />;
}
