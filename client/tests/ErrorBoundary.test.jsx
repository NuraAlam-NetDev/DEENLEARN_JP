import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../src/components/ErrorBoundary.jsx';

function Broken() {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
  let consoleError;
  beforeEach(() => {
    // React logs caught errors; keep the test output clean
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  test('renders the children when nothing breaks', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  test('shows a message instead of a blank page when a child crashes', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
  });
});
