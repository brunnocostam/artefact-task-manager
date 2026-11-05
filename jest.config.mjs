import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const jestConfig = async () => {
  const config = await createJestConfig({ testEnvironment: "node" })();
  // superjson and its deps ship ESM only, so they need to be transformed too
  config.transformIgnorePatterns = ["/node_modules/(?!(superjson|copy-anything|is-what)/)"];
  return config;
};

export default jestConfig;
