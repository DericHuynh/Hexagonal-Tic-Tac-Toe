import type { Meta, StoryObj } from "@storybook/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";
import { Button } from "./button";
import { Search, Mail, DollarSign } from "lucide-react";

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Default: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput placeholder="Enter your email" />
      <InputGroupButton>Subscribe</InputGroupButton>
    </InputGroup>
  ),
};

export const WithTextAddon: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <DollarSign className="size-4" />
      </InputGroupAddon>
      <InputGroupInput type="number" placeholder="0.00" />
    </InputGroup>
  ),
};

export const WithSuffix: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput placeholder="Enter website" />
      <InputGroupAddon align="inline-end">.com</InputGroupAddon>
    </InputGroup>
  ),
};

export const WithBothAddons: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Mail className="size-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="username" />
      <InputGroupAddon align="inline-end">@example.com</InputGroupAddon>
    </InputGroup>
  ),
};

export const SearchBar: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." className="flex-1" />
      <InputGroupButton variant="ghost" size="icon-xs">
        Clear
      </InputGroupButton>
    </InputGroup>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="block-start">Note:</InputGroupAddon>
      <InputGroupTextarea placeholder="Enter your message..." />
    </InputGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Disabled..." disabled />
    </InputGroup>
  ),
};
