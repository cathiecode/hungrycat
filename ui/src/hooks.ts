import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useRecoilValue } from "recoil";
import useSWR from "swr";
import { query } from "./api";
import { apiKeyState } from "./atoms";

export function useIsCapable(
  requiredCapabilities: string[]
): boolean | undefined {
  const apiKey = useRecoilValue(apiKeyState);
  const { data: capStatus } = useSWR(
    apiKey && [`/token/${apiKey}/capability`, apiKey],
    query
  );
  if (apiKey === null) {
    return false;
  }
  if (capStatus === undefined) {
    return undefined;
  }
  if (!capStatus.ok) {
    return false;
  }
  return requiredCapabilities.every((cap) =>
    capStatus?.capability.includes(cap)
  );
}

export function useSignInRoute() {
  const navigate = useNavigate();
  const loggingIn = useIsCapable([]);

  useEffect(() => {
    if (loggingIn === false) {
      navigate("/signin");
    }
  }, [loggingIn]);
}

export function useBack() {
  const navigate = useNavigate();
  return useCallback(() => {
    navigate(-1);
  }, [navigate]);
}
