// This file is responsible for loading environment variables and validating them.

interface Config {
  port: number;
  mongodb: {
    uri: string;
  };
  apis: {
    openai: string;
  };
  jwtSecret: string;
}

const getConfig = (): Config => {
  const config: Config = {
    port: Number(process.env.PORT) || 3000,
    mongodb: {
      uri: process.env.MONGODB_URI || "",
    },
    apis: {
      openai: process.env.OPENAI_API_KEY || "",
    },
    jwtSecret: process.env.JWT_SECRET || "",
  };

  const required = [
    "mongodb.uri",
    "apis.openai",
  ];
  required.forEach((path) => {
    const value = path.split(".").reduce((obj, key) => obj[key], config as any);
    if (!value) throw new Error(`Missing required config value: ${path}`);
  });

  return config;
};

export default getConfig();
