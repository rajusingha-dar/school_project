import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../features/auth/RegisterForm';

export default function Register() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
