import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, IndianRupee } from "lucide-react";

import { useAuth } from "../context/AuthContext";

async function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function WalletPage() {
  const { user, getWallet, createDepositOrder, depositCoins, verifyDepositOrder, withdrawCoins } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [depositRupees, setDepositRupees] = useState("10");
  const [withdrawCoinsValue, setWithdrawCoinsValue] = useState("100");
  const [upiId, setUpiId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const hasLoadedWalletRef = useRef(false);

  useEffect(() => {
    if (hasLoadedWalletRef.current) {
      return;
    }

    hasLoadedWalletRef.current = true;

    getWallet()
      .then((response) => setWallet(response.wallet))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [getWallet]);

  const depositPreview = useMemo(() => Math.round((Number(depositRupees || 0) / 10) * 100), [depositRupees]);
  const withdrawPreview = useMemo(() => Number(((Number(withdrawCoinsValue || 0) / 100) * 10).toFixed(2)), [withdrawCoinsValue]);
  const canUseRazorpay = Boolean(wallet?.razorpayKeyId);
  const isManualMode = !canUseRazorpay;
  const payoutsEnabled = Boolean(wallet?.payoutsEnabled);

  const refreshWallet = async () => {
    const response = await getWallet();
    setWallet(response.wallet);
  };

  useEffect(() => {
    if (!wallet?.upiId && !user?.upiId) {
      return;
    }
    setUpiId(wallet?.upiId || user?.upiId || "");
  }, [user?.upiId, wallet?.upiId]);

  const handleDeposit = async (event) => {
    event.preventDefault();
    setDepositing(true);
    setMessage("");
    setError("");

    try {
      if (!canUseRazorpay) {
        throw new Error("Razorpay is not configured. Add keys in server/.env and restart the server.");
      }

      const checkoutLoaded = await loadRazorpayCheckout();

      if (!checkoutLoaded) {
        throw new Error("Unable to load Razorpay checkout");
      }

      const orderResponse = await createDepositOrder({ rupeesAmount: Number(depositRupees) });

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: orderResponse.order.keyId,
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          order_id: orderResponse.order.id,
          name: "CodeCamp Arena",
          description: "Wallet coin deposit",
          handler: async (paymentResult) => {
            try {
              const verifyResponse = await verifyDepositOrder({
                razorpayOrderId: paymentResult.razorpay_order_id,
                razorpayPaymentId: paymentResult.razorpay_payment_id,
                razorpaySignature: paymentResult.razorpay_signature,
              });
              setMessage(verifyResponse.message);
              await refreshWallet();
              resolve();
            } catch (verificationError) {
              reject(verificationError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled")),
          },
          prefill: {
            name: user?.username,
            email: user?.email,
          },
          theme: {
            color: "#3dd9b8",
          },
        });

        razorpay.open();
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    setWithdrawing(true);
    setMessage("");
    setError("");

    try {
      if (!canUseRazorpay) {
        throw new Error("Withdrawals require Razorpay configuration. Add keys in server/.env and restart the server.");
      }

      if (!payoutsEnabled) {
        throw new Error("Razorpay payouts are not enabled. Set RAZORPAYX_ACCOUNT_NUMBER in server/.env.");
      }

      if (!upiId.trim()) {
        throw new Error("Please enter a valid UPI ID for payout.");
      }

      const response = await withdrawCoins({
        coinsAmount: Number(withdrawCoinsValue),
        upiId: upiId.trim(),
      });
      setMessage(response.message);
      await refreshWallet();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <section className="arena-panel grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr] items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.1)_0%,transparent_70%)] pointer-events-none" />
        
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-paper-200/45 font-bold mb-2">Wallet</div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-paper-200/50">Coin Balance</h1>
          <p className="mt-3 text-paper-200/65 max-w-sm">Deposit rupees into coins to participate in matches, request withdrawals, and track your wallet activity.</p>
        </div>

        <div className="rounded-[2.5rem] border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-8 flex flex-col items-center justify-center relative shadow-[inset_0_0_50px_rgba(234,179,8,0.1)]">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-[30px] opacity-40 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)] overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite_linear]" />
              <Coins className="text-yellow-100 drop-shadow-md z-10" size={40} />
            </div>
          </div>
          
          <div className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            {user?.coinBalance ?? wallet?.coinBalance ?? 0}
          </div>
          <div className="mt-2 text-sm font-bold uppercase tracking-[0.22em] text-yellow-500">Total Coins</div>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-arena-500/25 bg-arena-500/10 px-4 py-3 text-sm text-arena-400 font-bold">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200 font-bold">{error}</div> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <form className="arena-panel p-8 relative overflow-hidden" onSubmit={handleDeposit}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <ArrowDownLeft size={100} />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-arena-500/20 flex items-center justify-center text-arena-400">
              <ArrowDownLeft size={20} />
            </div>
            <div className="text-xl font-bold">Add Coins</div>
          </div>
          <div className="mt-8 relative z-10">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-paper-200/60">Amount in Rupees</label>
            <input className="arena-input text-lg font-mono" type="number" min="1" step="1" value={depositRupees} onChange={(event) => setDepositRupees(event.target.value)} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-paper-200/70 relative z-10 box-shadow-inner">
            <div className="flex items-center gap-2 mb-2 font-bold text-white">
              <IndianRupee size={16} className="text-paper-200/50" /> Estimated Value
            </div>
            You will receive <span className="font-bold text-arena-400 tracking-wider">+{depositPreview} coins</span>.
            <div className="mt-3 pt-3 border-t border-white/5 text-[10px] uppercase tracking-widest text-paper-200/40 font-bold">
              {canUseRazorpay
                ? "Secure checkout via Razorpay with server-side verification."
                : "Razorpay keys are missing. Configure .env."}
            </div>
          </div>
          <button className="arena-button-primary mt-8 w-full text-lg shadow-[0_0_20px_rgba(61,217,184,0.2)] hover:shadow-[0_0_30px_rgba(61,217,184,0.4)] relative z-10" type="submit" disabled={depositing || isManualMode}>
            {depositing ? "Depositing..." : "Continue to Payment"}
          </button>
        </form>

        <form className="arena-panel p-8 relative overflow-hidden" onSubmit={handleWithdraw}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <ArrowUpRight size={100} />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-flame-500/20 flex items-center justify-center text-flame-400">
              <ArrowUpRight size={20} />
            </div>
            <div className="text-xl font-bold">Withdraw Coins</div>
          </div>
          <div className="mt-8 relative z-10">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-paper-200/60">Coins to Withdraw</label>
            <input className="arena-input text-lg font-mono" type="number" min="100" step="100" value={withdrawCoinsValue} onChange={(event) => setWithdrawCoinsValue(event.target.value)} />
          </div>
          <div className="mt-4 relative z-10">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-paper-200/60">UPI ID</label>
            <input
              className="arena-input font-mono"
              type="text"
              placeholder="name@bank"
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-paper-200/70 relative z-10">
            Minimum withdrawal: <span className="font-bold text-flame-400">100 coins</span>.
            <div className="mt-2 font-bold text-white flex items-center gap-2">Payout: <span className="text-paper-100 font-mono tracking-wider">Rs {withdrawPreview}</span></div>
            <div className="mt-3 pt-3 border-t border-white/5 text-[10px] uppercase tracking-widest text-paper-200/40 font-bold">
              {payoutsEnabled
                ? "Payouts are processed via Razorpay UPI."
                : "Razorpay payouts are not configured."}
            </div>
          </div>
          <button className="arena-button bg-flame-500 hover:bg-flame-400 text-arena-950 font-bold mt-8 w-full text-lg shadow-[0_0_20px_rgba(255,138,61,0.2)] hover:shadow-[0_0_30px_rgba(255,138,61,0.4)] relative z-10" type="submit" disabled={withdrawing || isManualMode || !payoutsEnabled}>
            {withdrawing ? "Submitting..." : "Request Payout"}
          </button>
        </form>
      </section>

      <section className="arena-panel overflow-hidden">
        <div className="border-b border-white/10 px-8 py-6 flex items-center gap-3">
          <div className="w-2 h-6 bg-yellow-500 rounded-full" />
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </div>

        {loading ? (
          <div className="p-8 text-paper-200/60 font-mono animate-pulse">Loading data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-black/30 text-[10px] font-bold uppercase tracking-[0.2em] text-paper-200/50 border-b border-white/5">
                <tr>
                  <th className="px-8 py-4">Status & Type</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Equivalent</th>
                  <th className="px-8 py-4">Details</th>
                  <th className="px-8 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(wallet?.transactions || []).map((transaction) => {
                  const isIncoming = transaction.type === "deposit" || transaction.type === "match_reward";
                  const isOutgoing = transaction.type === "withdrawal" || transaction.type === "match_entry";
                  const StatusIcon = isIncoming ? ArrowDownLeft : isOutgoing ? ArrowUpRight : Coins;
                  const statusColor = isIncoming ? "text-arena-400" : isOutgoing ? "text-flame-400" : "text-yellow-400";
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${statusColor}`}>
                            <StatusIcon size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-white capitalize">{transaction.type.replace("_", " ")}</div>
                            <div className="text-[10px] uppercase tracking-widest text-paper-200/50 capitalize">{transaction.status}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`font-mono text-lg font-bold ${statusColor}`}>
                          {isIncoming ? '+' : isOutgoing ? '-' : ''}{transaction.coinsAmount}
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono text-paper-200/70 text-sm">
                        Rs {transaction.rupeesAmount ?? 0}
                      </td>
                      <td className="px-8 py-5 text-paper-200/50 text-sm max-w-[200px] truncate">
                        {transaction.note || "-"}
                      </td>
                      <td className="px-8 py-5 text-right font-mono text-[10px] uppercase tracking-widest text-paper-200/40">
                        {new Date(transaction.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!wallet?.transactions?.length ? <div className="p-16 text-center text-paper-200/40 uppercase tracking-widest text-sm font-bold">No transactions found</div> : null}
          </div>
        )}
      </section>
    </div>
  );
}

export default WalletPage;
