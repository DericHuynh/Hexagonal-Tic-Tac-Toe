import type { Meta, StoryObj } from "@storybook/react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";
import { Button } from "./button";
import { Mail, Star } from "lucide-react";

const meta = {
  title: "Components/Item",
  component: Item,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "muted"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "xs"],
    },
  },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof Item>;

export const Default: Story = {
  render: () => (
    <Item>
      <ItemContent>
        <ItemTitle>Item Title</ItemTitle>
        <ItemDescription>Item description goes here</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Item>
      <ItemMedia variant="icon">
        <Mail />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Inbox</ItemTitle>
        <ItemDescription>128 unread messages</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Item>
      <ItemMedia variant="image">
        <img
          src="https://via.placeholder.com/40"
          alt="Avatar"
          className="rounded-full"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>John Doe</ItemTitle>
        <ItemDescription>john@example.com</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Item>
      <ItemMedia variant="icon">
        <Mail />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Meeting Notes</ItemTitle>
        <ItemDescription>Last updated 2 hours ago</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="icon-sm">
          <Star />
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const Outline: Story = {
  render: () => (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>Outline Variant</ItemTitle>
        <ItemDescription>This item has an outline border</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const Small: Story = {
  render: () => (
    <Item size="sm">
      <ItemContent>
        <ItemTitle>Small Item</ItemTitle>
        <ItemDescription>Compact item with less padding</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const InGroup: Story = {
  render: () => (
    <ItemGroup>
      <Item>
        <ItemMedia variant="icon">
          <Mail />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Inbox</ItemTitle>
          <ItemDescription>128 unread</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <Star />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Starred</ItemTitle>
          <ItemDescription>24 items</ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <Mail />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Sent</ItemTitle>
          <ItemDescription>512 sent</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
