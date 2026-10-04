import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import * as authApi from '../../api/auth';
import { ApiError } from '../../api/client';
import { AuthProvider } from './AuthProvider';

vi.mock('../../api/auth');

const parent = { id: 1, email: 'priya@example.com', full_name: 'Priya Sharma', role: 'parent' };
const admin = { id: 2, email: 'rekha@school.in', full_name: 'Rekha Menon', role: 'school_admin' };

function renderApp(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('auth flows', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authApi.restoreSession.mockResolvedValue(null);
    authApi.logout.mockResolvedValue();
  });

  it('redirects anonymous visitors from /dashboard to the login page', async () => {
    renderApp('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('logs a parent in and lands on the dashboard', async () => {
    authApi.login.mockResolvedValue(parent);
    renderApp('/login');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Email'), 'priya@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Priya' })).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith('priya@example.com', 'correct-horse');
  });

  it('sends an admin to /admin after login', async () => {
    authApi.login.mockResolvedValue(admin);
    renderApp('/login');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Email'), 'rekha@school.in');
    await user.type(screen.getByLabelText('Password'), 'admin-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome, Rekha Menon' }),
    ).toBeInTheDocument();
  });

  it('shows the server error for wrong credentials and stays on login', async () => {
    authApi.login.mockRejectedValue(new ApiError(401, 'Incorrect email or password'));
    renderApp('/login');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Email'), 'priya@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });

  it('hides the register link on the Teacher / Admin tab', async () => {
    renderApp('/login');
    const user = userEvent.setup();
    expect(
      await screen.findByRole('link', { name: 'Create a parent account' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Teacher / Admin' }));

    expect(screen.queryByRole('link', { name: 'Create a parent account' })).not.toBeInTheDocument();
    expect(screen.getByText(/created by your school/i)).toBeInTheDocument();
  });

  it('restores an existing session on load', async () => {
    authApi.restoreSession.mockResolvedValue(parent);
    renderApp('/login');
    expect(await screen.findByRole('heading', { name: 'Welcome, Priya' })).toBeInTheDocument();
  });

  it('blocks a parent from the admin route', async () => {
    authApi.restoreSession.mockResolvedValue(parent);
    renderApp('/admin');
    expect(await screen.findByRole('heading', { name: 'Welcome, Priya' })).toBeInTheDocument();
  });

  it('validates the register form before calling the API', async () => {
    renderApp('/register');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Full name'), 'Priya Sharma');
    await user.type(screen.getByLabelText('Email'), 'priya@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('at least 8 characters');
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('registers a parent and lands on the dashboard', async () => {
    authApi.register.mockResolvedValue(parent);
    renderApp('/register');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Full name'), 'Priya Sharma');
    await user.type(screen.getByLabelText('Email'), 'priya@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Priya' })).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledWith(
      'Priya Sharma',
      'priya@example.com',
      'correct-horse',
    );
  });

  it('shows "email already exists" from the server on register', async () => {
    authApi.register.mockRejectedValue(
      new ApiError(409, 'An account with this email already exists'),
    );
    renderApp('/register');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Full name'), 'Priya Sharma');
    await user.type(screen.getByLabelText('Email'), 'priya@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });

  it('logs out and returns to the login page', async () => {
    authApi.restoreSession.mockResolvedValue(parent);
    renderApp('/dashboard');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(authApi.logout).toHaveBeenCalled();
  });
});
