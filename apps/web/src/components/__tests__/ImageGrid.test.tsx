import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageGrid } from '../ImageGrid';
import { useImageStore } from '../../stores/imageStore';
import { imageApi } from '../../lib/api';
import { act } from 'react';

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: vi.fn(),
  })
}));

vi.mock('../../lib/api', () => ({
  imageApi: {
    list: vi.fn().mockResolvedValue({
      data: [], meta: { total: 0, page: 1, limit: 50, hasMore: false }
    }),
    getFullUrl: vi.fn(),
    getThumbnailUrl: vi.fn()
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (str: string) => str })
}));

describe('ImageGrid empty results mount fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useImageStore.setState({
      images: [], total: 0, page: 1, isLoading: false, hasMore: true,
      selectedIds: new Set(), activeTagFilter: [], searchQuery: '',
      isInitialized: false,
    });

    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any;
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} } as any;
  });

  it('does not refetch on mount if already initialized but has zero results (e.g. empty search)', async () => {
    useImageStore.setState({ images: [], isInitialized: true, searchQuery: 'nomatch' });
    
    await act(async () => {
      render(<ImageGrid onImageClick={() => {}} />);
      await new Promise(r => setTimeout(r, 100));
    });

    expect(vi.mocked(imageApi.list)).toHaveBeenCalledTimes(0);
  });

  it('triggers exactly one initial fetch on mount when uninitialized and empty', async () => {
    useImageStore.setState({ images: [], isInitialized: false, isLoading: false });
    
    await act(async () => {
      render(<ImageGrid onImageClick={() => {}} />);
      await new Promise(r => setTimeout(r, 100));
    });

    expect(vi.mocked(imageApi.list)).toHaveBeenCalledTimes(1);
  });

  it('does not retry indefinitely if the initial fetch fails', async () => {
    // Mock the API to reject
    vi.mocked(imageApi.list).mockRejectedValueOnce(new Error('Network error'));
    useImageStore.setState({ images: [], isInitialized: false, isLoading: false });
    
    await act(async () => {
      render(<ImageGrid onImageClick={() => {}} />);
      // Wait for a short duration to let any retry loops execute
      await new Promise(r => setTimeout(r, 150));
    });

    // Should only have been called once, no auto-retries
    expect(vi.mocked(imageApi.list)).toHaveBeenCalledTimes(1);
  });
});
