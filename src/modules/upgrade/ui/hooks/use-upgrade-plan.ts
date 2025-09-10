"use client";

import { useState } from "react";
import { useTRPC } from "@/app/api/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUpgradePlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const trpc = useTRPC();
  const upgradePlanMutation = useMutation(
    trpc.user.upgradePlan.mutationOptions()
  );

  const upgradePlan = async (plan: "monthly" | "yearly") => {
    try {
      setIsLoading(true);
      await upgradePlanMutation.mutateAsync({ plan });
      toast.success(`Successfully upgraded to ${plan} plan!`);
    } catch (error) {
      console.error("Failed to upgrade plan:", error);
      toast.error("Failed to upgrade plan. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upgradePlan,
    isLoading: isLoading || upgradePlanMutation.isPending,
  };
};
