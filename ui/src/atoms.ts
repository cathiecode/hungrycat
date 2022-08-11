import { atom, AtomEffect } from "recoil";

const localStorageEffect: (key: string) => AtomEffect<string | null> =
  (key: string) =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, JSON.stringify(newValue));
    });
  };

export const apiKeyState = atom<string | null>({
  key: "ApiKey",
  default: null,
  effects: [localStorageEffect("ApiKey")],
});
