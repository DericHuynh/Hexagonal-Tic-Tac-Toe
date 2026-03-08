import type { Meta, StoryObj } from "@storybook/react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";

const meta = {
  title: "Components/InputOTP",
  component: InputOTP,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    maxLength: {
      control: "number",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof InputOTP>;

export const Default: Story = {
  render: () => (
    <InputOTP maxLength={6}>
      {Array.from({ length: 6 }).map((_, index) => (
        <InputOTPSlot key={index} index={index} />
      ))}
    </InputOTP>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        {Array.from({ length: 3 }).map((_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {Array.from({ length: 3 }).map((_, index) => (
          <InputOTPSlot key={index} index={index + 3} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const Disabled: Story = {
  render: () => (
    <InputOTP maxLength={6} disabled>
      {Array.from({ length: 6 }).map((_, index) => (
        <InputOTPSlot key={index} index={index} />
      ))}
    </InputOTP>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Verification Code</label>
      <InputOTP maxLength={6}>
        {Array.from({ length: 6 }).map((_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTP>
    </div>
  ),
};

export const FourDigits: Story = {
  args: {
    maxLength: 4
  },

  render: () => (
    <InputOTP maxLength={4}>
      {Array.from({ length: 4 }).map((_, index) => (
        <InputOTPSlot key={index} index={index} />
      ))}
    </InputOTP>
  )
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Verification Code</label>
      <InputOTP maxLength={6}>
        {Array.from({ length: 6 }).map((_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTP>
      <p className="text-xs text-muted-foreground">
        We sent a 6-digit code to your email
      </p>
    </div>
  ),
};
