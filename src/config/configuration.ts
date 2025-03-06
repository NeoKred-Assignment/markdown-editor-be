export default () => ({
  PORT: parseInt(String(process.env.PORT || '8000'), 10),
  APP_NAME: process.env.APP_NAME,
  APP_VERSION: process.env.APP_VERSION,
  SWAGGER_PATH: process.env.SWAGGER_PATH,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});
