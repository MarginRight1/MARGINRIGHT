export type VehicleType = "Car" | "Van / Commercial" | "Pickup" | "Minibus";
export type VatStatus = "Margin Scheme" | "Plus VAT" | "VAT Inclusive";
export type VatRegistered = "Yes" | "No";
export type ValuationBasis = "CAP Clean" | "CAP Average" | "CAP Retail" | "Retail Market Average" | "Manual Retail Value";

export interface BuyingInputs {
  currentBid: number;
  retailValue: number;
  prepCosts: number;
  auctionFee: number;
  transportCost: number;
  desiredProfit: number;
  vatStatus: VatStatus;
  vatRegistered: VatRegistered;
  // selectedValuation kept for future advanced valuations; currently unused
  selectedValuation?: number;
}

export interface BuyingMetrics {
  vatOnBid: number;
  totalInvoice: number;
  recoverableVat: number;
  effectiveCost: number;
  projectedProfit: number;
  grossMargin: number;
  roi: number;
  maxBid: number;
}

export const computeBuyingMetrics = (inputs: BuyingInputs): BuyingMetrics => {
  const vatOnBid = (() => {
    if (inputs.vatStatus === "Margin Scheme") return 0;
    if (inputs.vatStatus === "Plus VAT") return inputs.currentBid * 0.2;
    return inputs.currentBid * 0.2 / 1.2;
  })();

  const totalInvoice = inputs.currentBid + vatOnBid + inputs.auctionFee + inputs.transportCost + inputs.prepCosts;
  const recoverableVat = inputs.vatRegistered === "Yes" ? vatOnBid : 0;
  const effectiveCost = totalInvoice - recoverableVat;
  const projectedProfit = inputs.retailValue - effectiveCost;
  const grossMargin = inputs.retailValue > 0 ? (projectedProfit / inputs.retailValue) * 100 : 0;
  const roi = effectiveCost > 0 ? (projectedProfit / effectiveCost) * 100 : 0;

  const maxBid = (() => {
  const fixedCosts = inputs.auctionFee + inputs.transportCost + inputs.prepCosts;
  // Use retailValue for valuation in the beta. selectedValuation reserved for advanced mode.
  const valuation = inputs.retailValue;
  const target = valuation - inputs.desiredProfit - fixedCosts;

    if (inputs.vatStatus === "Margin Scheme") return Math.max(0, target);

    if (inputs.vatStatus === "Plus VAT") {
      return inputs.vatRegistered === "Yes"
        ? Math.max(0, target)
        : Math.max(0, target / 1.2);
    }

    if (inputs.vatRegistered === "Yes") {
      return Math.max(0, target * 1.2);
    }

    return Math.max(0, target);
  })();

  return {
    vatOnBid,
    totalInvoice,
    recoverableVat,
    effectiveCost,
    projectedProfit,
    grossMargin,
    roi,
    maxBid,
  };
};
