import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../lib/api';

describe('Frontend API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly constructs scan image URLs', () => {
    expect(api.getScanImageUrl(null)).toBeNull();
    const url = api.getScanImageUrl('fridge_123456.jpg');
    expect(url).toContain('/api/scans/image/fridge_123456.jpg');
  });

  it('correctly constructs export URLs', () => {
    expect(api.getExportGroceryUrl('csv')).toContain('/api/grocery-list/export?format=csv');
    expect(api.getExportGroceryUrl('text')).toContain('/api/grocery-list/export?format=text');
    expect(api.getExportInventoryUrl('json')).toContain('/api/export/inventory?format=json');
  });

  it('handles API error payloads appropriately', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Invalid image format uploaded.' }),
    } as any);

    await expect(api.getHealth()).rejects.toThrow('Invalid image format uploaded.');
  });
});
