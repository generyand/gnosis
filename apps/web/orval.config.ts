import { defineConfig } from "orval";

export default defineConfig({
  gnosis: {
    input: {
      target: "../api/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "./lib/api/generated",
      schemas: "./lib/api/schemas",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: "",
      override: {
        mutator: {
          path: "./lib/api/fetcher.ts",
          name: "customFetch",
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: false,
        },
      },
    },
  },
});
