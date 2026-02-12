import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterBar } from './FilterBar';
import type { FilterConfig } from '../../types';

const filters: FilterConfig[] = [
  { field: 'category', type: 'select', options: ['All', 'Accessories', 'Kitchen', 'Home'] },
  { field: '_search', type: 'text', placeholder: 'Search…' },
];

function FilterBarDemo() {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <div>
      <FilterBar
        filters={filters}
        values={values}
        onChange={(f, v) => setValues((p) => ({ ...p, [f]: v }))}
      />
      <pre style={{ fontSize: 10, marginTop: 8 }}>{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}

const meta = {
  title: 'Widgets/FilterBar',
  component: FilterBarDemo,
} satisfies Meta<typeof FilterBarDemo>;

export default meta;

export const Default: StoryObj = {};
