import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="option-three" />
        <Label htmlFor="option-three">Option Three</Label>
      </div>
    </RadioGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" orientation="vertical">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one-v" />
        <Label htmlFor="option-one-v">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two-v" />
        <Label htmlFor="option-two-v">Option Two</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="option-three-v" />
        <Label htmlFor="option-three-v">Option Three</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one-d" />
        <Label htmlFor="option-one-d">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two-d" disabled />
        <Label htmlFor="option-two-d">Option Two (Disabled)</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="option-three-d" />
        <Label htmlFor="option-three-d">Option Three</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="comfortable" id="comfortable" />
        <div className="flex flex-col">
          <Label htmlFor="comfortable">Comfortable</Label>
          <p className="text-xs text-muted-foreground">
            Best for everyday use
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="compact" id="compact" />
        <div className="flex flex-col">
          <Label htmlFor="compact">Compact</Label>
          <p className="text-xs text-muted-foreground">
            Easy to carry around
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="rounded-lg border p-4">
      <h4 className="mb-4 text-sm font-medium">Shipping Method</h4>
      <RadioGroup defaultValue="standard">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="standard" id="standard" />
          <Label htmlFor="standard">Standard (5-7 days)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="express" id="express" />
          <Label htmlFor="express">Express (2-3 days)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="overnight" id="overnight" />
          <Label htmlFor="overnight">Overnight (1 day)</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};
