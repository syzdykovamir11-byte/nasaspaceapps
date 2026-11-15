"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
