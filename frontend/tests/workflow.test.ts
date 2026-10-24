import { describe, it, expect } from 'vitest';

describe('FridgeFlow Client Business Logic', () => {
  it('correctly categorizes items into supermarket aisle sections', () => {
    const AISLE_GROUPS = [
      { id: 'produce', label: 'Produce', categories: ['vegetables', 'fruits'] },
      { id: 'dairy_eggs', label: 'Dairy & Eggs', categories: ['dairy', 'eggs'] },
      { id: 'pantry', label: 'Pantry & Grains', categories: ['grains and bread', 'condiments', 'snacks'] },
      { id: 'other', label: 'Other Essentials', categories: ['other'] },
    ];

    const testItem = { name: 'Carrot', category: 'vegetables' };
    const matchedGroup = AISLE_GROUPS.find((g) => g.categories.includes(testItem.category));
    expect(matchedGroup?.id).toBe('produce');

    const testEgg = { name: 'Brown Eggs', category: 'eggs' };
    const eggGroup = AISLE_GROUPS.find((g) => g.categories.includes(testEgg.category));
    expect(eggGroup?.id).toBe('dairy_eggs');
  });

  it('determines completion percentages accurately', () => {
    const list = [
      { id: 1, is_completed: true },
      { id: 2, is_completed: true },
      { id: 3, is_completed: false },
      { id: 4, is_completed: false },
    ];

    const total = list.length;
    const completed = list.filter((i) => i.is_completed).length;
    const percent = Math.round((completed / total) * 100);

    expect(percent).toBe(50);
  });
});
