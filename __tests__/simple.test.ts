import { describe, it, expect } from 'vitest';

describe('Simple Test Suite', () => {
  it('should verify that basic testing works', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify that objects work', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });

  it('should verify that arrays work', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe(1);
  });
}); 