import React, { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { billingAPI, paymentAPI, extractData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Smartphone, Banknote, CheckCircle, Clock, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

const Payments = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'doctor';
  const [pendingBills, setPendingBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [method, setMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment form fields
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [step, setStep] = useState('list'); // 'list' | 'details' | 'confirm' | 'success'

  const fetchPending = useCallback(async () => {
    try {
      const res = isAdmin ? await billingAPI.getAll() : await billingAPI.getMine();
      setPendingBills((extractData(res, 'billings') || []).filter(b => b.status === 'pending'));
    } catch (err) {
      console.error(err);
      setPendingBills([]);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const selectBill = (bill) => {
    setSelectedBill(bill);
    setStep('details');
    setMethod('upi');
    resetFormFields();
  };

  const resetFormFields = () => {
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
  };

  const goToConfirm = (e) => {
    e.preventDefault();
    setStep('confirm');
  };

  const handlePay = async () => {
    if (!selectedBill) return;
    setProcessing(true);
    try {
      const res = await paymentAPI.process({ billing_id: selectedBill.id, method });
      setSuccess(res.data?.data?.payment || res.data?.payment || null);
      setStep('success');
      fetchPending();
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
    }
    setProcessing(false);
  };

  const handleDone = () => {
    setSuccess(null);
    setSelectedBill(null);
    setStep('list');
    resetFormFields();
  };

  const methods = [
    { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Pay via UPI ID' },
    { id: 'card', label: 'Card', icon: CreditCard, desc: 'Debit / Credit Card' },
    { id: 'cash', label: 'Cash', icon: Banknote, desc: 'Pay at counter' },
  ];

  // Format card number with spaces
  const formatCardNumber = (val) => {
    const v = val.replace(/\s/g, '').replace(/\D/g, '').substring(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) return v.substring(0, 2) + '/' + v.substring(2);
    return v;
  };

  return (
    <div className="animate-fade-in">
      <TopBar title="Payments" subtitle="Process payments for pending bills" />

      {/* Step: Success */}
      {step === 'success' && success && (
        <div className="max-w-md mx-auto animate-slide-up">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-500 mb-8">Your payment has been processed successfully.</p>

            <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-left mb-8 border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-mono font-semibold text-primary-600">{success.transaction_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-semibold text-lg">₹{success.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-semibold capitalize">{success.method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="badge-success">{success.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{new Date(success.created_at).toLocaleString()}</span>
              </div>
            </div>

            <button onClick={handleDone} className="btn-primary w-full py-3">Done</button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selectedBill && (
        <div className="max-w-md mx-auto animate-slide-up">
          <button onClick={() => setStep('details')} className="flex items-center gap-1 text-sm text-primary-600 font-medium mb-4 cursor-pointer hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to details
          </button>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <div className="text-center mb-6">
              <Lock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-900">Confirm Payment</h3>
              <p className="text-sm text-gray-500">Please review and confirm your payment</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-6 border border-gray-100">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Bill</span><span className="font-medium">#{selectedBill.id}</span></div>
              {selectedBill.patient_name && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">Patient</span><span className="font-medium">{selectedBill.patient_name}</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-gray-500">Items</span><span className="font-medium">{selectedBill.items.length} items</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Method</span><span className="font-medium capitalize">{method}</span></div>
              {method === 'upi' && <div className="flex justify-between text-sm"><span className="text-gray-500">UPI ID</span><span className="font-medium">{upiId}</span></div>}
              {method === 'card' && <div className="flex justify-between text-sm"><span className="text-gray-500">Card</span><span className="font-medium">•••• {cardNumber.replace(/\s/g, '').slice(-4)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span><span className="text-primary-600">₹{selectedBill.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 justify-center">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure payment processing</span>
            </div>

            <button onClick={handlePay} disabled={processing}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 text-base">
              {processing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Pay ₹{selectedBill.total.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Payment Details Form */}
      {step === 'details' && selectedBill && (
        <div className="max-w-md mx-auto animate-slide-up">
          <button onClick={() => { setSelectedBill(null); setStep('list'); }} className="flex items-center gap-1 text-sm text-primary-600 font-medium mb-4 cursor-pointer hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to bills
          </button>

          {/* Amount Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Bill #{selectedBill.id}</h3>
                {selectedBill.patient_name && (
                  <p className="text-sm text-gray-500">{selectedBill.patient_name}</p>
                )}
              </div>
              <span className="badge-warning">pending</span>
            </div>
            <div className="text-center py-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Amount Due</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">₹{selectedBill.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-semibold text-gray-700">Select Payment Method</p>
            {methods.map((m) => (
              <button key={m.id} onClick={() => { setMethod(m.id); resetFormFields(); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  method === m.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${method === m.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Payment Form */}
          <form onSubmit={goToConfirm} className="space-y-4">
            {method === 'upi' && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm">UPI Details</h4>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">UPI ID *</label>
                  <input required type="text" value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    placeholder="yourname@upi" />
                </div>
              </div>
            )}

            {method === 'card' && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm">Card Details</h4>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">Cardholder Name *</label>
                  <input required type="text" value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">Card Number *</label>
                  <input required type="text" value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all font-mono tracking-wider"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">Expiry *</label>
                    <input required type="text" value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all font-mono"
                      placeholder="MM/YY"
                      maxLength={5} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">CVV *</label>
                    <input required type="password" value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all font-mono"
                      placeholder="•••"
                      maxLength={3} />
                  </div>
                </div>
              </div>
            )}

            {method === 'cash' && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">Cash Payment</h4>
                {isAdmin ? (
                  <p className="text-sm text-gray-500">
                    Confirm that you have collected <strong className="text-gray-900">₹{selectedBill.total.toFixed(2)}</strong> in cash from the patient.
                    Click proceed to record this payment.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Please visit the billing counter to make a cash payment of <strong className="text-gray-900">₹{selectedBill.total.toFixed(2)}</strong>. 
                    Click proceed to record this payment.
                  </p>
                )}
              </div>
            )}

            <button type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
              Proceed to Pay <CreditCard className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Step: Bill List */}
      {step === 'list' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : pendingBills.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="font-semibold text-gray-700 text-lg">No pending payments</p>
              <p className="text-sm text-gray-400 mt-1">All bills are paid! You're all set.</p>
            </div>
          ) : (
            <div className="grid gap-4 max-w-2xl">
              {pendingBills.map((bill, i) => (
                <div key={bill.id} onClick={() => selectBill(bill)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer animate-slide-up flex items-center justify-between"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Bill #{bill.id}</p>
                      <p className="text-sm text-gray-500">
                        {bill.patient_name && <span className="font-medium text-gray-700">{bill.patient_name} • </span>}
                        {bill.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">₹{bill.total.toFixed(2)}</p>
                    <span className="badge-warning">pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payments;
