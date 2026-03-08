import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    min: {
      control: "number",
    },
    max: {
      control: "number",
    },
    step: {
      control: "number",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
  },
};

export const Range: Story = {
  args: {
    defaultValue: [25, 75],
    min: 0,
    max: 100,
    step: 1,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    disabled: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-2">
      <label className="text-sm font-medium">Volume</label>
      <Slider defaultValue={[70]} min={0} max={100} />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Price</label>
        <span className="text-sm text-muted-foreground">$50</span>
      </div>
      <Slider defaultValue={[50]} min={0} max={100} />
    </div>
  ),
};

export const SmallStep: Story = {
  args: {
    defaultValue: [0.5],
    min: 0,
    max: 1,
    step: 0.1,
  },
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-48 items-center justify-center">
      <Slider defaultValue={[50]} min={0} max={100} className="h-full w-1" />
    </div>
  ),
};
