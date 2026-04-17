import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkspaceLayout } from './WorkspaceLayout';

vi.mock('@/stores/imageStore', () => ({
  useImageStore: vi.fn().mockImplementation((selector) => {
    const store = {
      images: [],
      selectedIds: new Set(),
      isLoading: false,
      hasMore: false,
      fetchImages: vi.fn(),
      fetchMore: vi.fn(),
      searchQuery: '',
      setSearchQuery: vi.fn(),
      activeTagFilter: []
    };
    return selector ? selector(store) : store;
  })
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className, 'data-testid': testId }: any) => <a href={to} className={className} data-testid={testId}>{children}</a>
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe('WorkspaceLayout Mobile Settings', () => {
  it('provides a mobile-visible settings link in the center pane', () => {
    render(<WorkspaceLayout />);
    const link = screen.getByTestId('mobile-settings-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/settings');
    expect(link).toHaveClass('header-settings-mobile');
  });
});
