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

  const refreshWallet = async () => {
    const response = await getWallet();
    setWallet(response.wallet);
  };

  const handleDeposit = async (event) => {
    event.preventDefault();
    setDepositing(true);
    setMessage("");
    setError("");

    try {
      if (!canUseRazorpay) {
        const response = await depositCoins({ rupeesAmount: Number(depositRupees) });
        setMessage(response.message);
        await refreshWallet();
        return;
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
      const response = await withdrawCoins({ coinsAmount: Number(withdrawCoinsValue) });
      setMessage(response.message);
      await refreshWallet();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="arena-panel grid gap-6 p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-paper-200/45">Wallet</div>
          <h1 className="mt-3 text-3xl font-bold">Coin Wallet</h1>
          <p className="mt-2 text-paper-200/65">Deposit rupees into coins, request withdrawals, and track your wallet activity.</p>
        </div>

        <div className="rounded-3xl border border-arena-500/20 bg-gradient-to-br from-arena-500/12 to-flame-500/10 p-6">
          <div className="flex items-center gap-3 text-paper-100">
            <Coins className="text-yellow-300" size={22} />
            <span className="text-sm uppercase tracking-[0.22em] text-paper-200/55">Current Balance</span>
          </div>
          <div className="mt-5 text-5xl font-black">{user?.coinBalance ?? wallet?.coinBalance ?? 0}</div>
          <div className="mt-3 text-paper-200/65">Conversion: Rs 10 = 100 coins</div>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-arena-500/25 bg-arena-500/10 px-4 py-3 text-sm text-arena-400">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <form className="arena-panel p-8" onSubmit={handleDeposit}>
          <div className="flex items-center gap-3">
            <ArrowDownLeft className="text-arena-400" size={20} />
            <div className="text-lg font-semibold">Add Coins</div>
          </div>
          <div className="mt-6">
            <label className="mb-2 block text-sm text-paper-200/60">Amount in Rupees</label>
            <input className="arena-input" type="number" min="1" step="1" value={depositRupees} onChange={(event) => setDepositRupees(event.target.value)} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-paper-200/70">
            <IndianRupee size={16} className="mb-2 text-paper-200/50" />
            You will receive approximately <span className="font-semibold text-arena-400">{depositPreview} coins</span>.
            <div className="mt-2 text-paper-200/55">
              {canUseRazorpay ? "Secure checkout via Razorpay with server-side verification." : "Using local deposit mode. Add Razorpay keys to enable live payments."}
            </div>
          </div>
          <button className="arena-button-primary mt-6" type="submit" disabled={depositing}>
            {depositing ? "Depositing..." : "Add Coins"}
          </button>
        </form>

        <form className="arena-panel p-8" onSubmit={handleWithdraw}>
          <div className="flex items-center gap-3">
            <ArrowUpRight className="text-flame-400" size={20} />
            <div className="text-lg font-semibold">Withdraw Coins</div>
          </div>
          <div className="mt-6">
            <label className="mb-2 block text-sm text-paper-200/60">Coins to Withdraw</label>
            <input className="arena-input" type="number" min="100" step="100" value={withdrawCoinsValue} onChange={(event) => setWithdrawCoinsValue(event.target.value)} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-paper-200/70">
            Minimum withdrawal: <span className="font-semibold text-flame-400">100 coins</span>.
            <div className="mt-2">Estimated payout: <span className="font-semibold text-paper-100">Rs {withdrawPreview}</span></div>
          </div>
          <button className="arena-button-secondary mt-6" type="submit" disabled={withdrawing}>
            {withdrawing ? "Submitting..." : "Request Withdrawal"}
          </button>
        </form>
      </section>

      <section className="arena-panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="text-xs uppercase tracking-[0.24em] text-paper-200/45">Transactions</div>
          <h2 className="mt-2 text-2xl font-bold">Wallet History</h2>
        </div>

        {loading ? (
          <div className="p-6 text-paper-200/60">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-paper-200/45">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Coins</th>
                  <th className="px-6 py-4">Rupees</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {(wallet?.transactions || []).map((transaction) => (
                  <tr key={transaction.id} className="border-t border-white/5">
                    <td className="px-6 py-4 capitalize">{transaction.type.replace("_", " ")}</td>
                    <td className="px-6 py-4">{transaction.coinsAmount}</td>
                    <td className="px-6 py-4">Rs {transaction.rupeesAmount ?? 0}</td>
                    <td className="px-6 py-4 capitalize">{transaction.status}</td>
                    <td className="px-6 py-4 text-paper-200/65">{transaction.note || "-"}</td>
                    <td className="px-6 py-4">{new Date(transaction.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!wallet?.transactions?.length ? <div className="p-6 text-paper-200/60">No wallet activity yet.</div> : null}
          </div>
        )}
      </section>
    </div>
  );
}

export default WalletPage;
