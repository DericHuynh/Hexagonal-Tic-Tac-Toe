import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Button } from "./button";
import { CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "Components/HoverCard",
  component: HoverCard,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    openDelay: {
      control: "number",
    },
    closeDelay: {
      control: "number",
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nextjs</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Top: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover for top card</Button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80">
        <p className="text-sm">This hover card appears on top</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Bottom: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover for bottom card</Button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" className="w-80">
        <p className="text-sm">This hover card appears on bottom</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Left: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover for left card</Button>
      </HoverCardTrigger>
      <HoverCardContent side="left" className="w-80">
        <p className="text-sm">This hover card appears on the left</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Right: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover for right card</Button>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-80">
        <p className="text-sm">This hover card appears on the right</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const WithDelay: Story = {
  render: () => (
    <HoverCard openDelay={500} closeDelay={300}>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover with delay</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <p className="text-sm">
          This hover card has a 500ms open delay and 300ms close delay
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};
