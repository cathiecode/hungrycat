import { atom } from "recoil";

export const apiKeyState = atom<string | null>({
  key: "ApiKey",
  default: null,
});
