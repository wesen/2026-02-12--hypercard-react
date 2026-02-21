import type { Meta, StoryObj } from '@storybook/react';
import { Btn } from './Btn';

const meta = {
  title: 'Engine/Widgets/Btn',
  component: Btn,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'primary', 'danger'] },
    active: { control: 'boolean' },
  },
} satisfies Meta<typeof Btn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: '📋 Browse Items' } };
export const Primary: Story = { args: { children: '✏️ Save', variant: 'primary' } };
export const Danger: Story = { args: { children: '🗑 Delete', variant: 'danger' } };
export const Active: Story = { args: { children: '🏠', active: true } };
