
import { PremiumHeader } from "@/components/premium/PremiumHeader";
import { PremiumTitle } from "@/components/premium/PremiumTitle";
import { PlansDisplay } from "@/components/premium/PlansDisplay";
import { SubscriptionInfo } from "@/components/premium/SubscriptionInfo";
import { PaymentDialog } from "@/components/premium/PaymentDialog";
import { usePremiumSubscription } from "@/hooks/usePremiumSubscription";

const Premium = () => {
  const {
    plans,
    selectedPlan,
    isLoading,
    isRefreshing,
    showPaymentDialog,
    subscription,
    selectedPlanDetails,
    handleSelectPlan,
    handlePurchase,
    handlePaymentSuccess,
    setShowPaymentDialog
  } = usePremiumSubscription();

  return (
    <div className="min-h-screen">
      <PremiumHeader isRefreshing={isRefreshing} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PremiumTitle />
        <SubscriptionInfo subscription={subscription} />

        <PlansDisplay 
          isLoading={isLoading}
          plans={plans}
          selectedPlan={selectedPlan}
          onSelectPlan={handleSelectPlan}
          onPurchase={handlePurchase}
          isProcessing={false}
        />
      </main>

      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        selectedPlan={selectedPlanDetails}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Premium;
