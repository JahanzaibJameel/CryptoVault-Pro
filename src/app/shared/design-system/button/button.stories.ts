import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, ButtonVariant, ButtonSize } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Design System/Button',
  component: ButtonComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: 'A versatile button component with multiple variants, sizes, and states.'
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'ghost', 'link'],
      description: 'Button variant for different visual styles',
      defaultValue: 'primary'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size for different use cases',
      defaultValue: 'md'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
      defaultValue: false
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state with spinner',
      defaultValue: false
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button take full width of container',
      defaultValue: false
    },
    icon: {
      control: 'text',
      description: 'Icon to display (emoji or SVG string)',
      defaultValue: undefined
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of icon relative to text',
      defaultValue: 'left'
    }
  }
};

export default meta;

type Story = StoryObj<ButtonComponent>;

// Default story
export const Default: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Click me'
  }
};

// All variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Action'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Action'
  }
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success'
  }
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning'
  }
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete'
  }
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Learn More'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Style'
  }
};

// All sizes
export const Small: Story = {
  args: {
    variant: 'primary',
    size: 'sm',
    children: 'Small Button'
  }
};

export const Large: Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: 'Large Button'
  }
};

export const ExtraLarge: Story = {
  args: {
    variant: 'primary',
    size: 'xl',
    children: 'Extra Large'
  }
};

// States
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button'
  }
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading...'
  }
};

export const FullWidth: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Full Width Button'
  }
};

// With icons
export const WithIconLeft: Story = {
  args: {
    variant: 'primary',
    icon: '🔍',
    iconPosition: 'left',
    children: 'Search'
  }
};

export const WithIconRight: Story = {
  args: {
    variant: 'primary',
    icon: '→',
    iconPosition: 'right',
    children: 'Continue'
  }
};

// Interactive examples
export const Interactive: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Interactive Demo'
  },
  parameters: {
    docs: {
      description: 'Interactive button with click handling and state tracking.'
    }
  }
};

// Accessibility examples
export const Accessibility: Story = {
  args: {
    variant: 'primary',
    ariaLabel: 'Submit form',
    children: 'Accessible Button'
  },
  parameters: {
    docs: {
      description: 'Button with proper ARIA attributes for screen readers.'
    }
  }
};

// Error states
export const ErrorStates: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; padding: 20px;">
        <h3 style="margin: 0 0 16px 0;">Button Error States</h3>
        
        <div style="display: flex; gap: 12px; align-items: center;">
          <ui-button variant="danger" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h2v-2H13v2zm0-4h2v2H13v-2z"/>
            </svg>
            Error State
          </ui-button>
          <ui-button variant="secondary" disabled>
            Cancel
          </ui-button>
        </div>
        
        <div style="display: flex; gap: 12px; align-items: center;">
          <ui-button variant="warning" loading>
            Processing...
          </ui-button>
          <ui-button variant="ghost">
            Cancel
          </ui-button>
        </div>
      </div>
    `
  })
};
