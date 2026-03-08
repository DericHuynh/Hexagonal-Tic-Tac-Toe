import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter your email",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter your password",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Email</label>
      <Input type="email" placeholder="Enter your email" />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Email</label>
      <Input type="email" placeholder="Enter your email" />
      <p className="text-xs text-muted-foreground">
        We'll never share your email with anyone else.
      </p>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Email</label>
      <Input type="email" placeholder="Enter your email" aria-invalid />
      <p className="text-xs text-destructive">Please enter a valid email</p>
    </div>
  ),
};

export const WithButton: Story = {
  render: () => (
    <div className="flex gap-2">
      <Input placeholder="Search..." className="flex-1" />
      <Input type="submit" value="Search" className="w-auto" />
    </div>
  ),
};
