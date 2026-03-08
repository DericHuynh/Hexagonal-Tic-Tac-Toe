import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
    rows: {
      control: "number",
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter your message...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "This is some pre-filled text in the textarea.",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "This textarea is disabled",
  },
};

export const WithRows: Story = {
  args: {
    rows: 6,
    placeholder: "This textarea has 6 rows",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Message</label>
      <Textarea placeholder="Enter your message..." />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Message</label>
      <Textarea placeholder="Enter your message..." />
      <p className="text-xs text-muted-foreground">
        Your message should be at least 10 characters
      </p>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Message</label>
      <Textarea aria-invalid placeholder="This field is invalid" />
      <p className="text-xs text-destructive">This field is required</p>
    </div>
  ),
};
