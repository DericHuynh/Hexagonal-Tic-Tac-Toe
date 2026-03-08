import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default"],
    },
    disabled: {
      control: "boolean",
    },
    checked: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "default",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
    size: "default",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    size: "default",
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
    size: "default",
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <label className="flex items-center gap-2">
      <Switch {...args} />
      <span className="text-sm">Enable notifications</span>
    </label>
  ),
  args: {
    size: "default",
  },
};
