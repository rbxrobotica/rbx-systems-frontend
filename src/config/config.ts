export interface Config {
  urlBackend: string | undefined;
}

const config: Config = {
  urlBackend: process.env.NEXT_PUBLIC_BACKEND_URL,
};

export default config;