"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";
import { PaymentSimulation } from "../components/payment-simulation";
import { useUpgradePlan } from "../hooks/use-upgrade-plan";
import { useTRPC } from "@/app/api/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: 0,
    period: "forever",
    description: "Perfect for trying out AutoMentor",
    features: [
      "Limited meetings",
      "Basic transcripts", 
      "Limited recording storage",
      "Limited agents",
      "Community support"
    ],
    popular: false,
    icon: Check
  },
  {
    id: "monthly",
    name: "Monthly Plan",
    price: 30,
    period: "month",
    description: "Perfect for getting started",
    features: [
      "Unlimited meetings",
      "Unlimited transcripts", 
      "Unlimited recording storage",
      "Unlimited agents",
      "Priority support",
      "Advanced analytics"
    ],
    popular: false,
    icon: Zap
  },
  {
    id: "yearly", 
    name: "Yearly Plan",
    price: 260,
    period: "year",
    description: "Best value for power users",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Early access to new features",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% uptime SLA"
    ],
    popular: true,
    icon: Star
  }
];

export const UpgradeView = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { upgradePlan, isLoading } = useUpgradePlan();
  const trpc = useTRPC();
  const { data: userData } = useSuspenseQuery(
    trpc.user.getCurrentUser.queryOptions()
  );

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (planId: string) => {
    try {
      await upgradePlan(planId as "monthly" | "yearly");
      setShowPayment(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Failed to upgrade plan:", error);
    }
  };

  if (showPayment && selectedPlan) {
    const plan = plans.find(p => p.id === selectedPlan);
    return (
      <PaymentSimulation
        plan={plan!}
        onSuccess={() => handlePaymentSuccess(selectedPlan)}
        onCancel={() => {
          setShowPayment(false);
          setSelectedPlan(null);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upgrade Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock unlimited meetings, transcripts, recordings, and agents with our premium plans
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = userData?.plan === plan.id;
          const isFreePlan = userData?.plan === 'free';
          
          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              } ${
                isCurrentPlan ? 'ring-2 ring-green-500 bg-green-50' : ''
              }`}
            >
            {plan.popular && !isCurrentPlan && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                Most Popular
              </Badge>
            )}
            {isCurrentPlan && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Current Plan
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <plan.icon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-lg">{plan.description}</CardDescription>
              <div className="mt-4">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-gray-900">Free</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => plan.id !== 'free' && handleSelectPlan(plan.id)}
                className={`w-full py-3 text-lg font-semibold ${
                  isCurrentPlan ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
                size="lg"
                disabled={isLoading || isCurrentPlan || plan.id === 'free'}
              >
                {isLoading ? "Processing..." : 
                 isCurrentPlan ? "Current Plan" : 
                 plan.id === 'free' ? "Current Plan" :
                 `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">
          All plans include a 30-day money-back guarantee
        </p>
        <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>No setup fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>24/7 support</span>
          </div>
        </div>
      </div>
    </div>
  );
};
