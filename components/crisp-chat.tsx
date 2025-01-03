"use client";

import { Crisp } from "crisp-sdk-web";
import { useEffect } from "react";

export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("454bdd11-9a26-486d-9ae0-032a68efa5a5");
  }, []);

  return null;
};
