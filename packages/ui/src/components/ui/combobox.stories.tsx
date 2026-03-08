import type { Meta, StoryObj } from "@storybook/react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  useComboboxAnchor,
} from "./combobox";
import { useState } from "react";

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof Combobox>;

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onChange={setValue}>
        <ComboboxInput showClear={!!value} showTrigger>
          Select framework...
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxList>
            {frameworks.map((framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
                {framework.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};

export const WithGroups: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onChange={setValue}>
        <ComboboxInput showClear={!!value} showTrigger>
          Select package manager...
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxList>
            <ComboboxGroup>
              <ComboboxLabel>JavaScript</ComboboxLabel>
              <ComboboxItem value="npm">npm</ComboboxItem>
              <ComboboxItem value="yarn">Yarn</ComboboxItem>
              <ComboboxItem value="pnpm">pnpm</ComboboxItem>
            </ComboboxGroup>
            <ComboboxSeparator />
            <ComboboxGroup>
              <ComboboxLabel>Other</ComboboxLabel>
              <ComboboxItem value="bun">Bun</ComboboxItem>
              <ComboboxItem value="deno">Deno</ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};

export const WithChips: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["next.js", "remix"]);
    return (
      <Combobox value={value} onChange={setValue} multiple>
        <ComboboxChips>
          {value.map((v) => (
            <ComboboxChip key={v} value={v}>
              {frameworks.find((f) => f.value === v)?.label}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput placeholder="Select frameworks..." />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxList>
            {frameworks.map((framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
                {framework.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};

export const WithEmptyState: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onChange={setValue}>
        <ComboboxInput showClear={!!value} showTrigger>
          Search...
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>No results found</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onChange={setValue} disabled>
        <ComboboxInput showClear={!!value} showTrigger disabled>
          Disabled...
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxList>
            {frameworks.map((framework) => (
              <ComboboxItem key={framework.value} value={framework.value}>
                {framework.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};
