import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import QueryState from '../src/components/ui/QueryState.jsx';

describe('QueryState', () => {
  test('shows a loading status and hides the content while loading', () => {
    render(
      <QueryState loading>
        <p>Course list</p>
      </QueryState>
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText('Course list')).not.toBeInTheDocument();
  });

  test('shows the error and a retry button that calls onRetry', () => {
    const onRetry = jest.fn();
    render(<QueryState error="Could not load courses" onRetry={onRetry} retryLabel="Try again" />);

    expect(screen.getByText('Could not load courses')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('shows no retry button when there is nothing to retry', () => {
    render(<QueryState error="Server is down" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows the empty title and text when there is nothing to show', () => {
    render(<QueryState empty emptyTitle="No courses yet" emptyText="Create the first one" />);
    expect(screen.getByText('No courses yet')).toBeInTheDocument();
    expect(screen.getByText('Create the first one')).toBeInTheDocument();
  });

  test('shows the children when the data is ready', () => {
    render(
      <QueryState>
        <p>Course list</p>
      </QueryState>
    );
    expect(screen.getByText('Course list')).toBeInTheDocument();
  });

  test('loading wins over an old error, so a retry shows the spinner again', () => {
    render(<QueryState loading error="old error" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('old error')).not.toBeInTheDocument();
  });
});
