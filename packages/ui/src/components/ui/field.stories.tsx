import type { Meta, StoryObj } from "@storybook/react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
  title: "Components/Field",
  component: Field,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <FieldContent>
        <Input placeholder="Enter your email" />
      </FieldContent>
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <FieldLabel>Email</FieldLabel>
      <FieldContent>
        <Input placeholder="Enter your email" />
      </FieldContent>
    </Field>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Field>
      <FieldLabel>Password</FieldLabel>
      <FieldContent>
        <Input type="password" placeholder="Enter your password" />
      </FieldContent>
      <FieldDescription>
        Must be at least 8 characters long
      </FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <FieldContent>
        <Input placeholder="Enter your email" aria-invalid />
      </FieldContent>
      <FieldError>
        <div>Please enter a valid email address</div>
      </FieldError>
    </Field>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <Field orientation="horizontal">
      <FieldLabel>
        <Checkbox id="terms" />
        <span className="ml-2">Accept terms and conditions</span>
      </FieldLabel>
    </Field>
  ),
};

export const WithRadioGroup: Story = {
  render: () => (
    <Field>
      <FieldLabel>Notification preference</FieldLabel>
      <FieldContent>
        <RadioGroup defaultValue="email">
          <Field orientation="horizontal">
            <FieldLabel>
              <RadioGroupItem value="email" id="email" />
              <span className="ml-2">Email</span>
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <FieldLabel>
              <RadioGroupItem value="sms" id="sms" />
              <span className="ml-2">SMS</span>
            </FieldLabel>
          </Field>
        </RadioGroup>
      </FieldContent>
    </Field>
  ),
};

export const FieldSetExample: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Account Settings</FieldLegend>
      <Field>
        <FieldLabel>Username</FieldLabel>
        <FieldContent>
          <Input placeholder="Enter username" />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldContent>
          <Input type="email" placeholder="Enter email" />
        </FieldContent>
      </Field>
    </FieldSet>
  ),
};

export const FieldSeparatorExample: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel>First Name</FieldLabel>
        <FieldContent>
          <Input placeholder="John" />
        </FieldContent>
      </Field>
      <FieldSeparator>OR</FieldSeparator>
      <Field>
        <FieldLabel>Last Name</FieldLabel>
        <FieldContent>
          <Input placeholder="Doe" />
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
};
