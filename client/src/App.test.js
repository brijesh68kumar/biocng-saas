import { render, screen } from '@testing-library/react';
import App from './App';

// Basic render check for new auth-first app shell.
test('renders login heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/BioCNG SaaS Login/i);
  expect(headingElement).toBeInTheDocument();
});
