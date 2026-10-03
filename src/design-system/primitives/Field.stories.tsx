import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fieldset, TextArea, TextField } from "./Field";
import { RadioCard } from "./RadioCard";

const meta: Meta = { title: "Primitives/Form" };
export default meta;

export const Fields: StoryObj = {
  render: () => (
    <form className="flex w-120 flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      <TextField label="YOUR NAME" placeholder="Who's stepping up?" />
      <TextField
        label="EMAIL"
        type="email"
        placeholder="you@club.com"
        hint="I reply within a day."
      />
      <TextField
        label="EMAIL (ERROR)"
        type="email"
        defaultValue="not-an-email"
        error="Enter a valid email address."
      />
      <TextArea label="THE CHALLENGE" placeholder="What are we building?" />
    </form>
  ),
};

export const FormatCards: StoryObj = {
  render: () => (
    <Fieldset legend="CHOOSE YOUR FORMAT" className="w-200">
      <div className="grid grid-cols-3 gap-2.5">
        <RadioCard
          name="format"
          value="sign"
          title="Sign a player"
          description="A full-time role on your team."
          defaultChecked
          data-testid="radio-sign"
        />
        <RadioCard
          name="format"
          value="doubles"
          title="Doubles"
          description="Pair up on a project."
        />
        <RadioCard
          name="format"
          value="friendly"
          title="Friendly rally"
          description="Just a conversation."
        />
        <RadioCard
          name="format"
          value="booked"
          title="Fully booked"
          description="Not taking new work."
          disabled
        />
      </div>
    </Fieldset>
  ),
};
