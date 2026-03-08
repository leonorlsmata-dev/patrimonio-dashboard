import type { EtfTransaction, CryptoTransaction } from "@/types/investment";

export function recalculatePosition(
  transactions: (EtfTransaction | CryptoTransaction)[]
) {
  let totalShares = 0;
  let totalCost = 0;
  let totalFees = 0;

  for (const tx of transactions) {
    if (tx.type === "buy") {
      totalShares += Number(tx.shares);
      totalCost += Number(tx.shares) * Number(tx.price_per_share);
      totalFees += Number(tx.fees);
    } else {
      totalShares -= Number(tx.shares);
    }
  }

  const avgBuyPrice = totalShares > 0 ? totalCost / totalShares : 0;
  const totalInvested = totalCost + totalFees;

  return {
    shares: totalShares,
    avg_buy_price: avgBuyPrice,
    total_invested: totalInvested,
  };
}
