import type { Meta, StoryObj } from "@storybook/react";
import { Kbd, KbdGroup } from "./kbd";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = {
  render: () => <Kbd>⌘K</Kbd>,
};

export const Single: Story = {
  render: () => <Kbd>Enter</Kbd>,
};

export const Multiple: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const Complex: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  ),
};

export const InTooltip: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm">
      <span>Search</span>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </div>
  ),
};

export const ArrowKeys: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-2">
      <Kbd>↑</Kbd>
      <div className="flex gap-2">
        <Kbd>←</Kbd>
        <Kbd>↓</Kbd>
        <Kbd>→</Kbd>
      </div>
    </div>
  ),
};

export const FunctionKeys: Story = {
  render: () => (
    <div className="flex gap-2">
      <Kbd>F1</Kbd>
      <Kbd>F2</Kbd>
      <Kbd>F3</Kbd>
    </div>
  ),
};
