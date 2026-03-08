import type { Meta, StoryObj } from "@storybook/react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import { Button } from "./button";
import { Inbox, Search } from "lucide-react";

const meta = {
  title: "Components/Empty",
  component: Empty,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof Empty>;

export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <Inbox className="size-10 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>No messages</EmptyTitle>
        <EmptyDescription>
          You don't have any messages in your inbox yet.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Start a new message</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const WithSearch: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filter to find what you're looking for.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">Clear filters</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const Simple: Story = {
  render: () => (
    <Empty>
      <EmptyTitle>No data available</EmptyTitle>
      <EmptyDescription>
        There is no data to display at the moment.
      </EmptyDescription>
    </Empty>
  ),
};

export const WithCustomIcon: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-6" />
          </div>
        </EmptyMedia>
        <EmptyTitle>Folder is empty</EmptyTitle>
        <EmptyDescription>
          Upload files to this folder to see them here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Upload files</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const Minimal: Story = {
  render: () => (
    <Empty>
      <EmptyDescription>Nothing to see here yet</EmptyDescription>
    </Empty>
  ),
};

export const WithMultipleActions: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <Inbox className="size-10 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Get started</EmptyTitle>
        <EmptyDescription>
          Create your first project to begin tracking your work.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Create project</Button>
          <Button variant="outline">Import</Button>
        </div>
      </EmptyContent>
    </Empty>
  ),
};
