import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
    },
    collapsible: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components'
          aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>React</AccordionTrigger>
        <AccordionContent>
          A JavaScript library for building user interfaces.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Vue</AccordionTrigger>
        <AccordionContent>
          The Progressive JavaScript Framework.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Angular</AccordionTrigger>
        <AccordionContent>
          The modern web developer's platform.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const WithoutCollapsible: Story = {
  render: () => (
    <Accordion type="single" className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>Question 1</AccordionTrigger>
        <AccordionContent>
          Answer to question 1. This accordion cannot be collapsed.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Question 2</AccordionTrigger>
        <AccordionContent>
          Answer to question 2. This accordion cannot be collapsed.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const WithCustomContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </span>
            Getting Started
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <p className="mb-2">Learn the basics of our platform.</p>
          <ul className="list-inside list-disc text-sm">
            <li>Create an account</li>
            <li>Set up your profile</li>
            <li>Explore features</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              2
            </span>
            Advanced Usage
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <p className="mb-2">Dive deeper into advanced features.</p>
          <p className="text-sm">
            Learn about integrations, automation, and customization options.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
