import { useCallback, useState } from "react";
import type { BodyProfile } from "../types";

const STORAGE_KEY = "fyndmate_body_profile";

export const useBodyProfile = () => {
  const [profile, setProfile] = useState<BodyProfile | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as BodyProfile) : null;
  });

  const saveProfile = useCallback((newProfile: BodyProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);
  }, []);

  return { profile, saveProfile, hasProfile: Boolean(profile) };
};
