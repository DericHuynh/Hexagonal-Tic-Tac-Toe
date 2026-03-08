import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Components/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    htmlFor: {
      control: "text",
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div>
      <Label htmlFor="email">Email</Label>
      <input
        id="email"
        type="email"
        placeholder="Enter your email"
        className="mt-2 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      />
    </div>
  ),
};

export const WithRequired: Story = {
  render: () => (
    <div>
      <Label htmlFor="name">
        Name <span className="text-destructive">*</span>
      </Label>
      <input
        id="name"
        type="text"
        placeholder="Enter your name"
        className="mt-2 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const WithRadio: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <input type="radio" id="option1" name="options" />
      <Label htmlFor="option1">Option 1</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div>
      <Label htmlFor="disabled">Disabled Label</Label>
      <input
        id="disabled"
        type="text"
        placeholder="Disabled input"
        disabled
        className="mt-2 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="password">Password</Label>
      <input
        id="password"
        type="password"
        placeholder="Enter your password"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Password must be at least 8 characters long
      </p>
    </div>
  ),
};
