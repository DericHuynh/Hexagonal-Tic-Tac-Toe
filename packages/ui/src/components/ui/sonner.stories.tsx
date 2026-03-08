import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "./sonner";
import { Button } from "./button";
import { toast } from "sonner";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-col gap-2">
        <Button
          onClick={() =>
            toast("Event has been created", {
              description: "Sunday, December 03, 2023 at 9:00 AM",
            })
          }
        >
          Show Toast
        </Button>
      </div>
    </>
  ),
};

export const Success: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          toast.success("Event created successfully", {
            description: "Your event has been created.",
          })
        }
      >
        Show Success Toast
      </Button>
    </>
  ),
};

export const Error: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          toast.error("Failed to create event", {
            description: "Please try again later.",
          })
        }
      >
        Show Error Toast
      </Button>
    </>
  ),
};

export const Warning: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          toast.warning("Warning", {
            description: "Your session is about to expire.",
          })
        }
      >
        Show Warning Toast
      </Button>
    </>
  ),
};

export const Info: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          toast.info("New message received", {
            description: "You have a new message from John.",
          })
        }
      >
        Show Info Toast
      </Button>
    </>
  ),
};

export const Loading: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() => {
          const loadingToast = toast.loading("Saving...");
          setTimeout(() => {
            toast.success("Saved!", {
              id: loadingToast,
              description: "Your changes have been saved.",
            });
          }, 2000);
        }}
      >
        Show Loading Toast
      </Button>
    </>
  ),
};

export const WithAction: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          toast.message("File uploaded", {
            description: "Your file has been uploaded successfully.",
            action: {
              label: "Undo",
              onClick: () => console.log("Undo"),
            },
          })
        }
      >
        Show Toast with Action
      </Button>
    </>
  ),
};
