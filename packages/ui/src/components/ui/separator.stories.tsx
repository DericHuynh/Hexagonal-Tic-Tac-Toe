import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    decorative: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-sm text-muted-foreground">
          An open-source UI component library.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="w-full">
      <p className="mb-4 text-sm">Content above</p>
      <Separator orientation="horizontal" />
      <p className="mt-4 text-sm">Content below</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center gap-4">
      <span>Item 1</span>
      <Separator orientation="vertical" className="h-10" />
      <span>Item 2</span>
      <Separator orientation="vertical" className="h-10" />
      <span>Item 3</span>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="w-64 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1">
          <p className="text-sm font-medium">User Name</p>
          <p className="text-xs text-muted-foreground">username@example.com</p>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="flex justify-between text-sm">
        <span>Settings</span>
        <span>Profile</span>
      </div>
    </div>
  ),
};
