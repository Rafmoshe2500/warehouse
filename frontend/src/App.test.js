import { render } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  // App contains AuthProvider which makes API calls
  // This test just verifies the component tree renders
  const { container } = render(<App />);
  expect(container).toBeInTheDocument();
});
