import type { Meta, StoryObj } from "@storybook/react";
import { LoginPage } from "./login-page";
import { AuthProvider } from "../context";

/**
 * LoginPage Component
 *
 * Full-featured authentication page with split-screen layout capability.
 * Supports Phone OTP (primary) and Google OAuth.
 */
const meta: Meta<typeof LoginPage> = {
  title: "Auth/LoginPage",
  component: LoginPage,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AuthProvider>
        <Story />
      </AuthProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    showLeftPanel: {
      control: "boolean",
      description: "Toggle split-screen layout",
    },
    productName: {
      control: "text",
      description: "Product name displayed in marketing panel",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

/**
 * The standard QGEN login page with split-screen marketing panel.
 */
export const QGENDefault: Story = {
  args: {
    productName: "QGEN",
    showLeftPanel: true,
  },
};

/**
 * Custom branding with split-screen enabled.
 */
export const SplitScreenCustom: Story = {
  args: {
    productName: "AI TUTOR",
    productTagline: "Learn smarter, not harder",
    showLeftPanel: true,
  },
};

/**
 * Centered card layout (similar to legacy behavior) without the left panel.
 */
export const CenteredMinimal: Story = {
  args: {
    showLeftPanel: false,
    title: "Welcome Back",
    description: "Please sign in to continue",
  },
};

/**
 * Demonstrating different enabled auth methods (e.g. Google only).
 */
export const GoogleOnly: Story = {
  args: {
    showLeftPanel: false,
    enabledMethods: ["google"],
  },
};
