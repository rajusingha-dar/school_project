import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SAMPLE_TEST } from '../features/diagnostics/sampleTest';
import Test from './Test';

const LETTERS = ['A', 'B', 'C', 'D'];

async function openTest() {
  render(
    <MemoryRouter>
      <Test />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Start mission' }));
  return user;
}

async function answer(user, questionIndex, choice, hints = 0) {
  const question = SAMPLE_TEST.questions[questionIndex];
  for (let i = 0; i < hints; i += 1) {
    await user.click(screen.getByRole('button', { name: /Need a hint/ }));
  }
  await user.click(
    screen.getByRole('button', { name: `${LETTERS[choice]} ${question.options[choice].text}` }),
  );
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
  const isLast = questionIndex === SAMPLE_TEST.questions.length - 1;
  await user.click(screen.getByRole('button', { name: isLast ? 'See results' : 'Next question' }));
}

describe('Test page', () => {
  it('shows an intro with the key facts, then starts on question 1', async () => {
    render(
      <MemoryRouter>
        <Test />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Mission Surveyor' })).toBeInTheDocument();
    expect(screen.getByText('155')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/aren’t saved/);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Start mission' }));
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Which side is opposite the angle θ?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Right triangle/ })).toBeInTheDocument();
  });

  it('requires choosing an option before checking', async () => {
    await openTest();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
  });

  it('awards points on a correct answer and shows the worked explanation', async () => {
    const user = await openTest();
    await user.click(screen.getByRole('button', { name: 'A Side a' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('status')).toHaveTextContent('Correct! +10 pts');
    expect(screen.getByLabelText('Points so far')).toHaveTextContent('10 pts');
    expect(screen.getByRole('button', { name: 'A Side a' })).toBeDisabled();
  });

  it('charges 5 points per hint', async () => {
    const user = await openTest();
    await user.click(screen.getByRole('button', { name: /Need a hint/ }));
    expect(screen.getByText(/Stand at the angle/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'A Side a' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Correct! +5 pts');
  });

  it('stops offering hints after the last one', async () => {
    const user = await openTest();
    await user.click(screen.getByRole('button', { name: /Need a hint/ }));
    await user.click(screen.getByRole('button', { name: /Need a hint/ }));
    expect(screen.getByRole('button', { name: 'No more hints' })).toBeDisabled();
  });

  it('explains the specific misconception on a wrong answer and shows 0 points', async () => {
    const user = await openTest();
    await answer(user, 0, 0);
    await answer(user, 1, 0);

    await user.click(screen.getByRole('button', { name: 'B 4/3' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('status')).toHaveTextContent('Not quite');
    expect(screen.getByRole('status')).toHaveTextContent('flipped tangent');
    expect(screen.getByLabelText('Points so far')).toHaveTextContent('20 pts');
  });

  it('reveals the angle explorer on question 4 only after taking a hint', async () => {
    const user = await openTest();
    for (let index = 0; index < 3; index += 1) await answer(user, index, 0);

    expect(screen.queryByLabelText('Angle in degrees')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Need a hint/ }));
    expect(screen.getByLabelText('Angle in degrees')).toBeInTheDocument();
  });

  it('shows a perfect run as 10 of 10 and 155 points', async () => {
    const user = await openTest();
    for (const [index, question] of SAMPLE_TEST.questions.entries()) {
      await answer(user, index, question.correctIndex);
    }

    expect(screen.getByRole('heading', { name: '10 of 10 correct' })).toBeInTheDocument();
    expect(screen.getByLabelText('Total points')).toHaveTextContent('155');
    expect(screen.getByText(/strong on every topic/)).toBeInTheDocument();
  });

  it('reproduces the design doc run: 95 of 155 points and tangent flagged', async () => {
    const user = await openTest();
    const choices = [0, 0, 1, 0, 2, 0, 1, 0, 0, 1];
    const hints = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0];
    for (const [index, choice] of choices.entries())
      await answer(user, index, choice, hints[index]);

    expect(screen.getByRole('heading', { name: '7 of 10 correct' })).toBeInTheDocument();
    expect(screen.getByLabelText('Total points')).toHaveTextContent('95');

    const mastery = screen.getByRole('region', { name: 'Mastery by topic' });
    expect(within(mastery).getByText('1 of 4 · 25%')).toBeInTheDocument();
    expect(screen.getByText(/Tangent needs attention: 1 of 4 correct/)).toBeInTheDocument();
    expect(screen.getByText('Practice: Tangent')).toBeInTheDocument();

    const rows = within(screen.getByRole('region', { name: 'Question by question' })).getAllByRole(
      'row',
    );
    expect(rows).toHaveLength(11); // header + 10
  });

  it('lets the player play again from the results screen', async () => {
    const user = await openTest();
    for (const [index, question] of SAMPLE_TEST.questions.entries()) {
      await answer(user, index, question.correctIndex);
    }
    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Points so far')).toHaveTextContent('0 pts');
  });
});
