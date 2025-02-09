export interface UIIDConfig {
  packages: {
    [key: string]: {
      version: string;
      path: string;
      options: {
        stories: boolean;
        tests: boolean;
        [key: string]: unknown;
      };
    };
  };
  // Add other configuration options as needed
  tokens?: {
    [key: string]: unknown;
  };
}
