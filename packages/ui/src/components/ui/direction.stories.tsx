import type { Meta, StoryObj } from "@storybook/react";
import { DirectionProvider, useDirection } from "./direction";

const meta = {
  title: "Components/Direction",
  component: DirectionProvider,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DirectionProvider>;

export default meta;
type Story = StoryObj<typeof DirectionProvider>;

export const Default: Story = {
  render: () => (
    <DirectionProvider dir="ltr">
      <div className="flex flex-col gap-4">
        <p className="text-sm">Current direction: LTR (Left to Right)</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Button
          </button>
          <span className="text-sm">Text content</span>
        </div>
      </div>
    </DirectionProvider>
  ),
};

export const RTL: Story = {
  render: () => (
    <DirectionProvider dir="rtl">
      <div className="flex flex-col gap-4">
        <p className="text-sm">Current direction: RTL (Right to Left)</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Button
          </button>
          <span className="text-sm">Text content</span>
        </div>
      </div>
    </DirectionProvider>
  ),
};

export const WithHook: Story = {
  render: () => {
    function DirectionDisplay() {
      const direction = useDirection();
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Current direction from hook: {direction || "not set"}
          </p>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              Button
            </button>
            <span className="text-sm">Text content</span>
          </div>
        </div>
      );
    }

    return (
      <DirectionProvider dir="rtl">
        <DirectionDisplay />
      </DirectionProvider>
    );
  },
};

export const Nested: Story = {
  render: () => (
    <DirectionProvider dir="ltr">
      <div className="flex flex-col gap-4">
        <p className="text-sm">Outer: LTR</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Outer Button
          </button>
        </div>
        <DirectionProvider dir="rtl">
          <div className="mt-4 flex flex-col gap-4 rounded-lg border p-4">
            <p className="text-sm">Inner: RTL</p>
            <div className="flex items-center gap-2">
              <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
                Inner Button
              </button>
            </div>
          </div>
        </DirectionProvider>
      </div>
    </DirectionProvider>
  ),
};
