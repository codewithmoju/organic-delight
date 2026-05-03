import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationCenter from '../../components/ui/NotificationCenter';
import { useNotifications, notify } from '../../lib/hooks/useNotifications';

const renderNC = () =>
  render(
    <MemoryRouter>
      <NotificationCenter />
    </MemoryRouter>
  );

describe('NotificationCenter', () => {
  beforeEach(() => {
    useNotifications.getState().clearAll();
  });

  it('renders the bell button', () => {
    renderNC();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('shows no badge when no unread notifications', () => {
    renderNC();
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('shows unread badge count', () => {
    notify('info', 'Test', 'Message');
    notify('warning', 'Alert', 'Warning message');
    renderNC();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens panel on bell click', async () => {
    renderNC();
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    renderNC();
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('displays notification titles', async () => {
    notify('success', 'Sale Completed', 'Transaction TRX-001');
    renderNC();
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => {
      expect(screen.getByText('Sale Completed')).toBeInTheDocument();
    });
  });

  it('marks all as read when panel opens with unread', async () => {
    notify('info', 'Test', 'msg');
    renderNC();
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => {
      const state = useNotifications.getState();
      expect(state.notifications.every(n => n.read)).toBe(true);
    });
  });

  it('clears all notifications', async () => {
    notify('info', 'A', 'msg');
    notify('info', 'B', 'msg');
    renderNC();
    fireEvent.click(screen.getByLabelText('Notifications'));
    await waitFor(() => screen.getByTitle('Clear all'));
    fireEvent.click(screen.getByTitle('Clear all'));
    expect(useNotifications.getState().notifications).toHaveLength(0);
  });
});
