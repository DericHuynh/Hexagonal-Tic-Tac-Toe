import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This is the main content area.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  render: () => (
    <Card size="sm" className="w-[350px]">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>A more compact card.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Compact content area.</p>
      </CardContent>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card className="w-[350px]">
      <img
        src="https://picsum.photos/seed/card/350/200"
        alt="Card header"
        className="w-full object-cover"
      />
      <CardHeader>
        <CardTitle>Card with Image</CardTitle>
        <CardDescription>Card with a header image.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card has an image at the top.</p>
      </CardContent>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card with Action</CardTitle>
        <CardDescription>Card with an action button in header.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Content with an action button.</p>
      </CardContent>
    </Card>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Card className="flex w-[400px] flex-row">
      <img
        src="https://picsum.photos/seed/horizontal/150/150"
        alt="Card thumbnail"
        className="w-[150px] object-cover"
      />
      <div className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle>Horizontal Card</CardTitle>
          <CardDescription>Side-by-side layout.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p>Content next to image.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Learn More</Button>
        </CardFooter>
      </div>
    </Card>
  ),
};

export const FooterWithBorder: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Add your payment information.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Card Number</label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              placeholder="1234 5678 9012 3456"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Pay Now</Button>
      </CardFooter>
    </Card>
  ),
};
