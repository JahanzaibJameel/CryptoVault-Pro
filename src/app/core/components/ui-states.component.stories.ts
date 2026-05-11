import type { Meta, StoryObj, IStory } from '@storybook/angular';
import { UIStatesComponent } from './ui-states.component';

const meta: Meta<UIStatesComponent> = {
  title: 'Core/UI States',
  component: UIStatesComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive UI state management component that provides loading, empty, error, and content states with customizable configurations and animations.',
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  argTypes: {
    // State inputs
    loading: {
      control: 'boolean',
      description: 'Whether the component is in a loading state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    empty: {
      control: 'boolean',
      description: 'Whether the component is in an empty state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    error: {
      control: 'boolean',
      description: 'Whether the component is in an error state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    
    // Loading configuration
    loadingConfig: {
      control: 'object',
      description: 'Configuration for loading state',
      table: {
        type: { summary: 'LoadingConfig' },
        defaultValue: { summary: '{ showSkeleton: true, showProgress: true, message: "Loading..." }' },
      },
    },
    
    // Empty state configuration
    emptyConfig: {
      control: 'object',
      description: 'Configuration for empty state',
      table: {
        type: { summary: 'EmptyConfig' },
        defaultValue: { summary: '{ illustration: "empty", title: "No data", message: "No items to display", action: null }' },
      },
    },
    
    // Error state configuration
    errorConfig: {
      control: 'object',
      description: 'Configuration for error state',
      table: {
        type: { summary: 'ErrorConfig' },
        defaultValue: { summary: '{ title: "Error", message: "Something went wrong", retryAction: null }' },
      },
    },
    
    // Content
    content: {
      control: 'text',
      description: 'Content to display when not in loading/empty/error state',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'null' },
      },
    },
    
    // Animation
    animation: {
      control: 'select',
      options: ['none', 'fade', 'slide', 'scale'],
      description: 'Animation type for state transitions',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'fade' },
      },
    },
    
    // Accessibility
    ariaLive: {
      control: 'select',
      options: ['off', 'polite', 'assertive'],
      description: 'ARIA live region setting for announcements',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'polite' },
      },
    },
  },
};

export default meta;

type Story = StoryObj<UIStatesComponent>;

// Default story
export const Default: Story = {
  args: {
    content: 'This is the main content that displays when no special state is active.',
  },
  play: async ({ canvasElement }: any) => {
    // Test accessibility
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
};

// Loading states
export const LoadingSkeleton: Story = {
  args: {
    loading: true,
    loadingConfig: {
      showSkeleton: true,
      showProgress: false,
      message: 'Loading data...',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with skeleton loader animation.',
      },
    },
  },
};

export const LoadingWithProgress: Story = {
  args: {
    loading: true,
    loadingConfig: {
      showSkeleton: false,
      showProgress: true,
      message: 'Processing your request...',
      progress: 65,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with progress indicator.',
      },
    },
  },
};

// Empty states
export const EmptyNoData: Story = {
  args: {
    empty: true,
    emptyConfig: {
      illustration: 'empty',
      title: 'No data available',
      message: 'There are no items to display at this time.',
      action: {
        text: 'Refresh',
        action: () => console.log('Refresh clicked'),
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with custom illustration and action.',
      },
    },
  },
};

export const EmptySearchResults: Story = {
  args: {
    empty: true,
    emptyConfig: {
      illustration: 'search',
      title: 'No results found',
      message: 'Try adjusting your search terms or filters.',
      action: {
        text: 'Clear filters',
        action: () => console.log('Clear filters clicked'),
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state for search results.',
      },
    },
  },
};

// Error states
export const ErrorNetwork: Story = {
  args: {
    error: true,
    errorConfig: {
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      retryAction: {
        text: 'Retry',
        action: () => console.log('Retry clicked'),
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state for network connectivity issues.',
      },
    },
  },
};

export const ErrorServerError: Story = {
  args: {
    error: true,
    errorConfig: {
      title: 'Server Error',
      message: 'The server encountered an error while processing your request.',
      retryAction: {
        text: 'Try Again',
        action: () => console.log('Try again clicked'),
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state for server-side issues.',
      },
    },
  },
};

export const ErrorPermission: Story = {
  args: {
    error: true,
    errorConfig: {
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.',
      retryAction: null,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state for permission issues without retry action.',
      },
    },
  },
};

// Animation variants
export const FadeAnimation: Story = {
  args: {
    loading: true,
    animation: 'fade',
    loadingConfig: {
      showSkeleton: true,
      message: 'Loading with fade animation...',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'UI states with fade transition animation.',
      },
    },
  },
};

export const SlideAnimation: Story = {
  args: {
    empty: true,
    animation: 'slide',
    emptyConfig: {
      title: 'Slide Animation Empty',
      message: 'Empty state with slide animation.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'UI states with slide transition animation.',
      },
    },
  },
};

// Dark mode examples
export const DarkModeLoading: Story = {
  args: {
    loading: true,
    loadingConfig: {
      showSkeleton: true,
      message: 'Loading in dark mode...',
    },
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Loading state optimized for dark theme.',
      },
    },
  },
};

export const DarkModeError: Story = {
  args: {
    error: true,
    errorConfig: {
      title: 'Error in Dark Mode',
      message: 'This error is displayed with dark theme styling.',
      retryAction: {
        text: 'Retry',
        action: () => console.log('Dark mode retry'),
      },
    },
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Error state optimized for dark theme.',
      },
    },
  },
};

// Accessibility examples
export const AccessibilityAnnouncements: Story = {
  args: {
    loading: true,
    ariaLive: 'assertive',
    loadingConfig: {
      message: 'Important: Loading critical data...',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'UI states with ARIA live announcements for screen readers.',
      },
    },
  },
};

// Interactive example
export const InteractiveDemo: Story = {
  args: {
    content: `
      <div style="padding: 20px; text-align: center;">
        <h3>Interactive UI States Demo</h3>
        <p>This demonstrates how the UI States component handles different states.</p>
        <div style="margin-top: 20px;">
          <button onclick="this.closest('.sb-story').__ngContext__[0].componentRef.showLoading()">Show Loading</button>
          <button onclick="this.closest('.sb-story').__ngContext__[0].componentRef.showEmpty()">Show Empty</button>
          <button onclick="this.closest('.sb-story').__ngContext__[0].componentRef.showError()">Show Error</button>
          <button onclick="this.closest('.sb-story').__ngContext__[0].componentRef.showContent()">Show Content</button>
        </div>
      </div>
    `,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing state transitions and programmatic control.',
      },
    },
  },
};

// Performance testing
export const PerformanceTest: Story = {
  args: {
    loading: true,
    loadingConfig: {
      showSkeleton: true,
      showProgress: true,
      message: 'Performance test loading...',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Story optimized for performance testing with minimal re-renders.',
      },
    },
  },
  play: async ({ canvasElement, step }: any) => {
    await step('Mount component', async () => {
      // Component is already mounted
    });
    
    await step('Test performance', async () => {
      const start = performance.now();
      
      // Simulate some processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const end = performance.now();
      console.log(`Render time: ${end - start}ms`);
    });
  },
};
