import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    className: {
      control: "text",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    className: "size-3",
  },
};

export const Large: Story = {
  args: {
    className: "size-8",
  },
};

export const WithText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Spinner />
      <span>Loading...</span>
    </div>
  ),
};

export const CustomColor: Story = {
  args: {
    className: "text-primary",
  },
};

export const InButton: Story = {
  render: () => (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      disabled
    >
      <Spinner />
      Loading...
    </button>
  ),
};
