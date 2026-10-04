import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSampleData } from '../api/sampleData';
import { AuthContext } from '../features/auth/AuthContext';
import Dashboard from './Dashboard';

const priya = { id: 1, email: 'priya@example.com', full_name: 'Priya Sharma', role: 'parent' };
const rahul = { id: 2, email: 'rahul@example.com', full_name: 'Rahul Verma', role: 'parent' };

function renderDashboard(user, logout = vi.fn()) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user, status: 'authenticated', logout }}>
        <Dashboard />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => resetSampleData());

  it('shows the sample-data banner and a time-of-day greeting', async () => {
    renderDashboard(priya);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /^Good (morning|afternoon|evening), Priya$/,
    );
    expect(screen.getByRole('note')).toHaveTextContent(/sample data/i);
  });

  it('renders the stat cards, curve, mentor, topics and recent tests for a child with data', async () => {
    renderDashboard(priya);

    expect(await screen.findByText('Overall mastery')).toBeInTheDocument();
    expect(screen.getByText('74%')).toBeInTheDocument();
    expect(screen.getByText('↑ 18% this term')).toBeInTheDocument();
    expect(screen.getByText('Last test')).toBeInTheDocument();
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Aarav’s learning curve/ })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Mastery rose from 38% in week 1 to 74% in week 10/ }),
    ).toBeInTheDocument();

    expect(screen.getByText(/mixed-number subtraction/)).toBeInTheDocument();

    const topics = screen.getByRole('region', { name: 'Topic-wise standing' });
    expect(within(topics).getByText('Algebra basics')).toBeInTheDocument();
    expect(within(topics).getByText('44% mastery')).toBeInTheDocument();
    expect(within(topics).getAllByText('Strong')).toHaveLength(2);
    expect(within(topics).getByText('Needs work')).toBeInTheDocument();

    const recent = screen.getByRole('region', { name: 'Recent tests' });
    expect(within(recent).getAllByRole('row')).toHaveLength(5); // header + 4 tests
    expect(within(recent).getByText('8 Sep 2026')).toBeInTheDocument();
  });

  it('only offers Mathematics (no Science/English tabs)', async () => {
    renderDashboard(priya);
    await screen.findByText('Overall mastery');
    expect(screen.queryByText('Science')).not.toBeInTheDocument();
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('marks unbuilt sidebar pages as coming soon and links the test entry points', async () => {
    renderDashboard(priya);
    await screen.findByText('Overall mastery');
    expect(screen.getAllByText('Soon')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/test');
    expect(screen.getByRole('link', { name: 'Take a test' })).toHaveAttribute('href', '/test');
  });

  it('logs out from the sidebar', async () => {
    const logout = vi.fn();
    renderDashboard(priya, logout);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Log out' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('asks a parent with no children to add one, then shows the no-tests state', async () => {
    renderDashboard(rahul);
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: 'Add your child' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add child' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your child/i);

    await user.type(screen.getByLabelText("Child's name"), 'Kabir Verma');
    await user.click(screen.getByRole('button', { name: 'Add child' }));

    expect(
      await screen.findByRole('heading', { name: 'No tests yet for Kabir' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Kabir · Class 7')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start first diagnostic' })).toHaveAttribute(
      'href',
      '/test',
    );
  });

  it('lets a parent add a second child and switch between them', async () => {
    renderDashboard(priya);
    const user = userEvent.setup();
    await screen.findByText('Overall mastery');

    await user.click(screen.getByRole('button', { name: '+ Add child' }));
    await user.type(screen.getByLabelText("Child's name"), 'Meera Sharma');
    await user.click(screen.getByRole('button', { name: 'Add child' }));
    expect(
      await screen.findByRole('heading', { name: 'No tests yet for Meera' }),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Switch child'), 'sample-aarav');
    expect(await screen.findByText('Overall mastery')).toBeInTheDocument();
  });

  it('can cancel adding a child', async () => {
    renderDashboard(priya);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: '+ Add child' }));
    expect(screen.getByRole('heading', { name: 'Add another child' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Overall mastery')).toBeInTheDocument();
  });
});
