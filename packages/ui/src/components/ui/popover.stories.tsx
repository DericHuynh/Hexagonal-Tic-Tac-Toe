import type { Meta, StoryObj } from "@storybook/react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="width" className="text-sm font-medium">
                Width
              </label>
              <input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="maxWidth" className="text-sm font-medium">
                Max. width
              </label>
              <input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">With Header</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Notification Settings</PopoverTitle>
          <PopoverDescription>
            Configure how you receive notifications.
          </PopoverDescription>
        </PopoverHeader>
        <div className="mt-4 space-y-2">
          <p className="text-sm">Email notifications</p>
          <p className="text-sm">Push notifications</p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Top: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Top</Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-80">
        <p className="text-sm">This popover appears on top</p>
      </PopoverContent>
    </Popover>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Bottom</Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="w-80">
        <p className="text-sm">This popover appears on bottom</p>
      </PopoverContent>
    </Popover>
  ),
};

export const Left: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Left</Button>
      </PopoverTrigger>
      <PopoverContent side="left" className="w-80">
        <p className="text-sm">This popover appears on the left</p>
      </PopoverContent>
    </Popover>
  ),
};

export const Right: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Right</Button>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-80">
        <p className="text-sm">This popover appears on the right</p>
      </PopoverContent>
    </Popover>
  ),
};
