import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../features/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
