import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="p-4 text-sm">
          Make changes to your account here. Click save when you're done.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="p-4 text-sm">
          Change your password here. After saving, you'll be logged out.
        </p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="p-4 text-sm">
          Manage your account settings here.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="account" orientation="vertical" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="p-4 text-sm">
          Make changes to your account here.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="p-4 text-sm">
          Change your password here.
        </p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="p-4 text-sm">
          Manage your settings here.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList variant="line">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="p-4 text-sm">Content for tab 1</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="p-4 text-sm">Content for tab 2</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="p-4 text-sm">Content for tab 3</p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="messages" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="messages">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Messages
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
        </TabsTrigger>
      </TabsList>
      <TabsContent value="messages">
        <p className="p-4 text-sm">You have 3 unread messages.</p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="p-4 text-sm">No new notifications.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const TwoTabs: Story = {
  render: () => (
    <Tabs defaultValue="list" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="grid">Grid</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <p className="p-4 text-sm">List view content</p>
      </TabsContent>
      <TabsContent value="grid">
        <p className="p-4 text-sm">Grid view content</p>
      </TabsContent>
    </Tabs>
  ),
};
