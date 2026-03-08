import type { Meta, StoryObj } from "@storybook/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Button } from "./button";
import { ChevronDown } from "lucide-react";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>Toggle Content</span>
          <ChevronDown className="h-4 w-4 transition-transform" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border p-4">
          <p className="text-sm">
            This is the collapsible content. It can contain any content you
            want.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-[350px] space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>Open by Default</span>
          <ChevronDown className="h-4 w-4 transition-transform" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border p-4">
          <p className="text-sm">
            This content is open by default.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const WithAnimation: Story = {
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>Click to expand</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border bg-muted p-4">
          <p className="text-sm">
            This content has a smooth animation when expanding and collapsing.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You can add multiple paragraphs or any other content here.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const MultipleSections: Story = {
  render: () => (
    <div className="flex w-[350px] flex-col gap-2">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Section 1</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-md border p-4">
            <p className="text-sm">Content for section 1</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Section 2</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-md border p-4">
            <p className="text-sm">Content for section 2</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Section 3</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-md border p-4">
            <p className="text-sm">Content for section 3</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};
