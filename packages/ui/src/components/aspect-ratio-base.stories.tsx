import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const meta: Meta<typeof AspectRatio> = {
  title: "ui/base/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-1/2">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

/**
 * Standard Story template using a standard img tag.
 * The AspectRatio component will handle the sizing container.
 */
const Template: Story = {
  render: (args) => (
    <AspectRatio {...args} className="bg-slate-50 dark:bg-slate-800">
      <img
        src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80"
        alt="Photo by Alvaro Pinot"
        className="h-full w-full rounded-md object-cover"
      />
    </AspectRatio>
  ),
};

export const Default: Story = {
  ...Template,
  args: { ratio: 16 / 9 },
};

export const Square: Story = {
  ...Template,
  args: { ratio: 1 },
};

export const Landscape: Story = {
  ...Template,
  args: { ratio: 4 / 3 },
};

export const Cinemascope: Story = {
  ...Template,
  args: { ratio: 2.35 / 1 },
};
