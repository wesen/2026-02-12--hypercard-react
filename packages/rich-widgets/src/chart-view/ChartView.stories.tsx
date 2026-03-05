import type { Meta, StoryObj } from '@storybook/react';
import { ChartView } from './ChartView';
import { SAMPLE_DATASETS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof ChartView> = {
  title: 'RichWidgets/ChartView',
  component: ChartView,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ChartView>;

export const LineChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    initialChartType: 'line',
    title: 'Quarterly Revenue',
  },
};

export const BarChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    initialChartType: 'bar',
    title: 'Quarterly Revenue',
  },
};

export const PieChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Disk Usage'],
    initialChartType: 'pie',
    title: 'Disk Usage',
  },
};

export const ScatterChart: Story = {
  args: {
    data: SAMPLE_DATASETS['System Performance'],
    initialChartType: 'scatter',
    title: 'System Performance',
  },
};

export const WithDatasetSwitcher: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    datasets: SAMPLE_DATASETS,
    title: 'Multi-Dataset View',
  },
};

export const BugTracker: Story = {
  args: {
    data: SAMPLE_DATASETS['Bug Tracker'],
    initialChartType: 'bar',
    title: 'Bug Tracker',
  },
};

export const SmallChart: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    initialChartType: 'line',
    width: 320,
    height: 200,
    title: 'Small Chart',
  },
};

export const LargeChart: Story = {
  args: {
    data: SAMPLE_DATASETS['System Performance'],
    initialChartType: 'line',
    width: 800,
    height: 500,
    title: 'Large Chart',
  },
};

export const LimitedTypes: Story = {
  args: {
    data: SAMPLE_DATASETS['Quarterly Revenue'],
    availableTypes: ['line', 'bar'],
    title: 'Line & Bar Only',
  },
};
