import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    disabled: {
      control: "boolean",
    },
    checked: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" defaultChecked />
      <label
        htmlFor="checked"
        className="text-sm font-medium leading-none"
      >
        Already checked
      </label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" disabled />
      <label
        htmlFor="disabled"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Disabled checkbox
      </label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled-checked" disabled defaultChecked />
      <label
        htmlFor="disabled-checked"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Disabled and checked
      </label>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex items-start space-x-2">
      <Checkbox id="notifications" />
      <div className="flex flex-col">
        <Label htmlFor="notifications">Email notifications</Label>
        <p className="text-xs text-muted-foreground">
          Receive daily digest emails
        </p>
      </div>
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center space-x-2">
        <Checkbox id="email" />
        <label
          htmlFor="email"
          className="text-sm font-medium leading-none"
        >
          Email
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="sms" defaultChecked />
        <label
          htmlFor="sms"
          className="text-sm font-medium leading-none"
        >
          SMS
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="push" />
        <label
          htmlFor="push"
          className="text-sm font-medium leading-none"
        >
          Push notifications
        </label>
      </div>
    </div>
  ),
};
