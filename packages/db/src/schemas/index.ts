import * as auth from "./auth";
import * as match from "./match";

export const schema = {
  ...auth,
  ...match,
};

export * from "./auth";
export * from "./match";
