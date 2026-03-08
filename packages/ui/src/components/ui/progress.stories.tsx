import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    value: {
      control: "number",
      min: 0,
      max: 100,
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

export const Full: Story = {
  args: {
    value: 100,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Progress</label>
        <span className="text-sm text-muted-foreground">75%</span>
      </div>
      <Progress value={75} />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Uploading</label>
        <span className="text-sm text-muted-foreground">45%</span>
      </div>
      <Progress value={45} />
      <p className="text-xs text-muted-foreground">
        45 MB of 100 MB uploaded
      </p>
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span>Storage</span>
          <span>80%</span>
        </div>
        <Progress value={80} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span>Memory</span>
          <span>45%</span>
        </div>
        <Progress value={45} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span>CPU</span>
          <span>25%</span>
        </div>
        <Progress value={25} />
      </div>
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => <Progress />,
};
