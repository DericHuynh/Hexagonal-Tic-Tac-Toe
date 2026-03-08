import type { Meta, StoryObj } from "@storybook/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";
import { Button } from "./button";
import { Home, Settings, User, Mail, Bell } from "lucide-react";

const meta = {
  title: "Components/Sidebar",
  component: SidebarProvider,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SidebarProvider>;

export default meta;
type Story = StoryObj<typeof SidebarProvider>;

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-8 items-center gap-2 px-2 text-sm font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
              A
            </div>
            Acme Inc
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <User />
                    <span>Profile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Bell />
                <span>Notifications</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Main Content</span>
        </header>
        <main className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            This is the main content area.
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex h-8 items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
              A
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Home">
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Collapsible Sidebar</span>
        </header>
        <main className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            Click the sidebar trigger to expand/collapse.
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
};

export const WithSubmenu: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-8 items-center gap-2 px-2 text-sm font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
              A
            </div>
            Acme Inc
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarSeparator />
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Mail />
                    <span>Messages</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Bell />
                    <span>Notifications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">With Separator</span>
        </header>
        <main className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            Sidebar with separator between menu items.
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
};

export const RightSide: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex h-8 items-center gap-2 px-2 text-sm font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
              A
            </div>
            Right Sidebar
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Right Side Sidebar</span>
        </header>
        <main className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            This sidebar is positioned on the right side.
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
};
