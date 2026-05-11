import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/angular',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
    }
  },
  viteFinal: async (config, { configType }) => {
    if (configType === 'DEVELOPMENT') {
      // Enable HMR for development
      config.server = {
        ...config.server,
        hmr: true
      };
    }

    // Add custom CSS variables for theming
    config.css = {
      ...config.css,
      postcss: {
        plugins: [
          // Add any PostCSS plugins here
        ]
      }
    };

    return config;
  }
};

export default config;
