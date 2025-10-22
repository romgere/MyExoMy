export default config;

/**
 * Type declarations for
 *    import config from 'my-app/config/environment'
 */
declare const config: {
  environment: string;
  modulePrefix: string;
  podModulePrefix: string;
  locationType: string;
  rootURL: string;
  APP: {
    roverDefaultAddress: string;
    roverDefault4gApiAddress: string;
    roverDefault4gCameraAddress: string;
  };
};
