import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ManageUsers from '../../pages/ManageUsers';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Mock the dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      })),
      insert: vi.fn(() => Promise.resolve({
        error: null
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
    })),
    auth: {
      signUp: vi.fn(),
    },
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
}));

describe('ManageUsers Component', () => {
  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  ];

  const mockCurrentUser = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mock
    (useAuth as any).mockReturnValue({
      isAdmin: true,
      user: mockCurrentUser,
    });

    // Default supabase mock for fetching users
    const mockOrderFn = vi.fn().mockResolvedValue({
      data: mockUsers,
      error: null,
    });

    const mockSelectFn = vi.fn().mockReturnValue({
      order: mockOrderFn
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelectFn
    });
  });

  it('renders user list correctly', async () => {
    render(<ManageUsers />);
    
    // Wait for the users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    // Mock the supabase response to delay
    const mockOrderFn = vi.fn().mockReturnValue(new Promise(() => {})); // Never resolves

    const mockSelectFn = vi.fn().mockReturnValue({
      order: mockOrderFn
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelectFn
    });

    render(<ManageUsers />);

    // The loading spinner has an animate-spin class
    const loadingElement = document.querySelector('.animate-spin');
    expect(loadingElement).toBeInTheDocument();
  });

  it('opens add user modal', async () => {
    render(<ManageUsers />);

    // Wait for loading to complete
    await waitFor(() => {
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).not.toBeInTheDocument();
    });

    // Find the "Add User" button in the header (not the modal title)
    const addUserButton = screen.getAllByRole('button').find(
      button => button.textContent === 'Add User'
    );
    expect(addUserButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(addUserButton!);

    // Check if modal is open by looking for the form elements
    expect(screen.getByText('Create')).toBeInTheDocument(); // Modal has a Create button
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('opens edit user modal', async () => {
    render(<ManageUsers />);

    // Wait for loading to complete
    await waitFor(() => {
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).not.toBeInTheDocument();
    });
    
    // Find and click the "Edit" button for the first user
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Check if modal is open with user data
    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Email')).toHaveValue('john@example.com');
    expect(screen.getByLabelText('New Password (leave blank to keep current)')).toHaveValue('');
    expect(screen.getByLabelText('Role')).toHaveValue('admin');
  });

  it('creates new user successfully', async () => {
    // Mock the auth signup response
    (supabase.auth.signUp as any).mockResolvedValue({
      data: { user: { id: '3' } },
      error: null,
    });

    // Mock the insert response
    const mockInsertFn = vi.fn().mockResolvedValue({
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        })
      }),
      insert: mockInsertFn
    });

    render(<ManageUsers />);

    // Wait for loading to complete
    await waitFor(() => {
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).not.toBeInTheDocument();
    });

    // Find the "Add User" button in the header (not the modal title)
    const addUserButton = screen.getAllByRole('button').find(
      button => button.textContent === 'Add User'
    );
    expect(addUserButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(addUserButton!);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'user' } });

    // Submit the form
    fireEvent.click(screen.getByText('Create'));

    // Check if the API was called correctly
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(mockInsertFn).toHaveBeenCalledWith({
        id: '3',
        name: 'New User',
        email: 'new@example.com',
        role: 'user',
      });

      expect(toast.success).toHaveBeenCalledWith('User created successfully');
    });
  });

  it('updates existing user successfully', async () => {
    // Mock the update response
    const mockEqFn = vi.fn().mockResolvedValue({
      error: null,
    });

    const mockUpdateFn = vi.fn().mockReturnValue({
      eq: mockEqFn
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        })
      }),
      update: mockUpdateFn
    });

    render(<ManageUsers />);

    // Wait for loading to complete
    await waitFor(() => {
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).not.toBeInTheDocument();
    });

    // Open the edit user modal for the first user
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Update the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Updated' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john.updated@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'user' } });

    // Submit the form
    fireEvent.click(screen.getByText('Update'));

    // Check if the API was called correctly
    await waitFor(() => {
      expect(mockUpdateFn).toHaveBeenCalledWith({
        name: 'John Updated',
        email: 'john.updated@example.com',
        role: 'user',
      });

      expect(mockEqFn).toHaveBeenCalledWith('id', '1');
      expect(toast.success).toHaveBeenCalledWith('User updated successfully');
    });
  });

  it('handles user deletion', async () => {
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Mock the delete response
    const mockEqFn = vi.fn().mockResolvedValue({
      error: null,
    });

    const mockDeleteFn = vi.fn().mockReturnValue({
      eq: mockEqFn
    });

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        })
      }),
      delete: mockDeleteFn
    });

    render(<ManageUsers />);

    // Wait for loading to complete
    await waitFor(() => {
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).not.toBeInTheDocument();
    });

    // Find and click the "Delete" button for the second user
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[1]); // Delete Jane Smith (not the current user)

    // Check if the API was called correctly
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
      expect(mockDeleteFn).toHaveBeenCalled();
      expect(mockEqFn).toHaveBeenCalledWith('id', '2');
      expect(toast.success).toHaveBeenCalledWith('User deleted successfully');
    });
  });
});