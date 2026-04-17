import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from '../../components/SearchBar';
import { TagFilter } from '../../components/TagFilter';
import { useImageStore } from '../imageStore';
import { imageApi } from '../../lib/api';
import { act } from 'react';

vi.mock('../../lib/api', () => ({
  imageApi: {
    list: vi.fn().mockResolvedValue({
      data: [], meta: { total: 0, page: 1, limit: 50, hasMore: false }
    })
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str: string) => str })
}));

describe('Search and Filter Fetch Triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useImageStore.setState({
      images: [], total: 0, page: 1, isLoading: false, hasMore: true,
      selectedIds: new Set(), activeTagFilter: [], searchQuery: ''
    });
  });

  it('Updates search query and triggers one fetch when typing', async () => {
    await act(async () => {
      render(<SearchBar />);
      // mount wait
      await new Promise(r => setTimeout(r, 500));
    });

    // Should not have called imageApi.list on mount
    expect(vi.mocked(imageApi.list)).toHaveBeenCalledTimes(0);
    
    // Type in search bar
    await act(async () => {
      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'cat' } });
      // wait for debounce
      await new Promise(r => setTimeout(r, 500));
    });
    
    // Should have called list API once for the search
    expect(vi.mocked(imageApi.list)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(imageApi.list)).toHaveBeenCalledWith(1, 50, undefined, 'cat');
  });

  it('Updates filter tags and triggers one fetch when clicking a tag', async () => {
    useImageStore.setState({
      images: [
        {
          id: 'img-1',
          filename: 'cat.png',
          originalName: 'cat.png',
          mimeType: '',
          size: 0,
          width: 0,
          height: 0,
          hash: '',
          storagePath: '',
          thumbnailPath: null,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
          tags: [{ id: 'character:cat', name: 'character:cat', category: 'character' }]
        }
      ]
    });

    await act(async () => {
      render(<TagFilter />);
    });

    expect(vi.mocked(imageApi.list)).toHaveBeenCalledTimes(0);
    
    // Click tag
    await act(async () => {
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
    });
    
    // Should have called list API once for the tag filter
    expect(vi.mocked(imageApi.list)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(imageApi.list)).toHaveBeenCalledWith(1, 50, ['character:cat'], undefined);
  });
});
