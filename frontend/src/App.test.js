import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login form', () => {
  render(<App />);
  const loginButton = screen.getByRole('button', { name: /giriş yap/i });
  expect(loginButton).toBeInTheDocument();
});
