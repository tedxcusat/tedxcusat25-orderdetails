"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus, EmailStatus } from "./types/order";
import { useRefresh } from "./context/RefreshContext";

// Helper function to convert R2 URL to proxy URL
const getProxyImageUrl = (r2Url: string) => {
  const urlParts = r2Url.split("/");
  const receiptsIndex = urlParts.findIndex(part => part === "receipts");
  if (receiptsIndex !== -1) {
    const key = urlParts.slice(receiptsIndex).join("/");
    return `/api/image?key=${encodeURIComponent(key)}`;
  }
  const match = r2Url.match(/\/tedx\/(.+)$/);
  if (match) {
    return `/api/image?key=${encodeURIComponent(match[1])}`;
  }
  return r2Url;
};

// Icons as SVG components
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" x2="12" y1="22" y2="12" />
  </svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);



// Confirmation Dialog Component
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor = "red"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmColor?: "red" | "green" | "yellow";
}) {
  if (!isOpen) return null;

  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
    yellow: "bg-yellow-600 hover:bg-yellow-700"
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 max-w-md w-full mx-4 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-[var(--muted)] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 ${colorClasses[confirmColor]} text-white rounded-lg font-medium transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Order Detail Modal Component
function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onStatusChange,
  isUpdating,
  onResendEmail
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isUpdating: boolean;
  onResendEmail: (orderId: string) => Promise<{ success: boolean; message: string }>;
}) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "accept" | "reject";
  }>({ isOpen: false, type: "accept" });
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmDialog.isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, confirmDialog.isOpen]);

  // Clear resend message when modal closes or order changes
  useEffect(() => {
    setResendMessage(null);
  }, [order?.orderId, isOpen]);

  if (!isOpen || !order) return null;

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage(null);
    try {
      const result = await onResendEmail(order.orderId);
      setResendMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
    } catch {
      setResendMessage({
        type: 'error',
        text: 'Failed to resend email. Please try again.'
      });
    } finally {
      setIsResending(false);
    }
  };

  const getEmailStatusDisplay = () => {
    if (!order.email) {
      return { label: 'Not Sent', color: 'bg-zinc-500/20 text-zinc-400' };
    }
    switch (order.email.status) {
      case 'sent':
        return { label: 'Sent', color: 'bg-green-500/20 text-green-400' };
      case 'failed':
        return { label: 'Failed', color: 'bg-red-500/20 text-red-400' };
      default:
        return { label: 'Not Sent', color: 'bg-zinc-500/20 text-zinc-400' };
    }
  };

  const canResendEmail = order.status === 'accepted' &&
    order.email?.status !== 'sent' &&
    (order.email?.attempts || 0) < 5;

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const handleConfirm = () => {
    if (confirmDialog.type === "accept") {
      onStatusChange(order.orderId, "accepted");
    } else if (confirmDialog.type === "reject") {
      onStatusChange(order.orderId, "rejected");
    }
  };

  const getConfirmDialogProps = () => {
    switch (confirmDialog.type) {
      case "accept":
        return {
          title: "Accept Order",
          message: `Are you sure you want to accept order #${order.orderId}? This confirms the payment screenshot is valid.`,
          confirmText: "Accept Order",
          confirmColor: "green" as const
        };
      case "reject":
        return {
          title: "Reject Order",
          message: `Are you sure you want to reject order #${order.orderId}? This marks the payment as invalid.`,
          confirmText: "Reject Order",
          confirmColor: "red" as const
        };
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
            <div>
              <h2 className="text-xl font-semibold text-white">Order Details</h2>
              <p className="text-sm text-[var(--muted)]">Order #{order.orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Details */}
              <div className="space-y-4">
                {/* Product Info */}
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">Product Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Product</span>
                      <span className="text-white font-medium">{order.product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Size</span>
                      <span className="text-white">{order.product.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Price</span>
                      <span className="text-[var(--tedx-red)] font-bold">{formatPrice(order.product.price)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Name</span>
                      <span className="text-white font-medium">{order.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Email</span>
                      <span className="text-white text-sm">{order.customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Phone</span>
                      <span className="text-white">{order.customer.phone}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block mb-1">Address</span>
                      <span className="text-white text-sm">{order.customer.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Transaction ID</span>
                      <span className="text-white font-mono text-sm">{order.payment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Order Date</span>
                      <span className="text-white text-sm">{formatDate(order.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.status === 'accepted' ? "bg-green-500/20 text-green-400" :
                        order.status === 'rejected' ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                        {order.status === 'accepted' ? "Accepted" : order.status === 'rejected' ? "Rejected" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Status - Only show for accepted orders */}
                {order.status === 'accepted' && (
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MailIcon />
                      Email Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEmailStatusDisplay().color}`}>
                          {getEmailStatusDisplay().label}
                        </span>
                      </div>
                      {order.email && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Attempts</span>
                            <span className="text-white text-sm">{order.email.attempts} / 5</span>
                          </div>
                          {order.email.lastAttempt && (
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Last Attempt</span>
                              <span className="text-white text-sm">{formatDate(order.email.lastAttempt)}</span>
                            </div>
                          )}
                          {order.email.error && order.email.status === 'failed' && (
                            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircleIcon />
                                <p className="text-xs text-red-400">{order.email.error}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Resend Button */}
                      {canResendEmail && (
                        <button
                          onClick={handleResendEmail}
                          disabled={isResending}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                          {isResending ? (
                            <>
                              <RefreshIcon className="animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <SendIcon />
                              Resend Email
                            </>
                          )}
                        </button>
                      )}

                      {/* Resend Message */}
                      {resendMessage && (
                        <div className={`mt-2 p-2 rounded-lg ${resendMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                          <p className={`text-xs ${resendMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {resendMessage.text}
                          </p>
                        </div>
                      )}

                      {/* Max attempts reached message */}
                      {order.status === 'accepted' && order.email && order.email.attempts >= 5 && order.email.status !== 'sent' && (
                        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-xs text-yellow-400">Maximum retry attempts reached. Please contact support.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Screenshot */}
              <div className="space-y-4">
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider">Payment Screenshot</h3>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-[var(--card-border)]">
                    <img
                      src={getProxyImageUrl(order.payment.screenshotUrl)}
                      alt="Payment screenshot"
                      className="w-full h-auto max-h-[400px] object-contain bg-zinc-950"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer - Action Buttons */}
          <div className="flex flex-wrap gap-3 p-4 border-t border-[var(--card-border)] bg-zinc-900/30">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, type: "accept" })}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  <CheckIcon />
                  {isUpdating ? "Updating..." : "Accept Order"}
                </button>
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, type: "reject" })}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  <XCircleIcon />
                  {isUpdating ? "Updating..." : "Reject Order"}
                </button>
              </>
            )}
            {order.status !== 'pending' && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${order.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                {order.status === 'accepted' ? <CheckIcon /> : <XCircleIcon />}
                Order {order.status === 'accepted' ? 'Accepted' : 'Rejected'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleConfirm}
        {...getConfirmDialogProps()}
      />
    </>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon,
  accent = false
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${accent ? "bg-[var(--tedx-red)]/10 border-[var(--tedx-red)]/30" : "bg-[var(--card-bg)] border-[var(--card-border)]"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent ? "bg-[var(--tedx-red)]/20 text-[var(--tedx-red)]" : "bg-zinc-800 text-zinc-400"}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{title}</p>
          <p className={`text-xl font-bold ${accent ? "text-[var(--tedx-red)]" : "text-white"}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function OrderDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedEmailStatus, setSelectedEmailStatus] = useState<string>("all");
  const { setRefreshHandler, setIsRefreshing } = useRefresh();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [setIsRefreshing]);

  // Register refresh handler
  useEffect(() => {
    setRefreshHandler(fetchOrders);
    return () => setRefreshHandler(null);
  }, [fetchOrders, setRefreshHandler]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customer.name.toLowerCase().includes(query) ||
          order.customer.phone.includes(query) ||
          order.orderId.toLowerCase().includes(query) ||
          order.payment.transactionId.toLowerCase().includes(query)
      );
    }

    if (selectedProduct !== "all") {
      filtered = filtered.filter((order) => order.product.id === selectedProduct);
    }

    if (selectedSize !== "all") {
      filtered = filtered.filter((order) => order.product.size === selectedSize);
    }

    if (selectedStatus !== "all") {
      if (selectedStatus === "accepted") {
        filtered = filtered.filter((order) => order.status === 'accepted');
      } else if (selectedStatus === "pending") {
        filtered = filtered.filter((order) => order.status === 'pending');
      } else if (selectedStatus === "rejected") {
        filtered = filtered.filter((order) => order.status === 'rejected');
      }
    }

    if (selectedEmailStatus !== "all") {
      if (selectedEmailStatus === "sent") {
        filtered = filtered.filter((order) => order.email?.status === 'sent');
      } else if (selectedEmailStatus === "failed") {
        filtered = filtered.filter((order) => order.email?.status === 'failed');
      } else if (selectedEmailStatus === "not_sent") {
        filtered = filtered.filter((order) => order.status === 'accepted' && (!order.email || order.email.status === 'not_sent'));
      }
    }

    // Sort by status: pending first, then rejected, then accepted
    filtered = [...filtered].sort((a, b) => {
      const getStatusPriority = (order: Order) => {
        if (order.status === 'pending') return 0;
        if (order.status === 'rejected') return 1;
        if (order.status === 'accepted') return 2;
        return 0;
      };
      return getStatusPriority(a) - getStatusPriority(b);
    });

    setFilteredOrders(filtered);
  }, [searchQuery, selectedProduct, selectedSize, selectedStatus, selectedEmailStatus, orders]);

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with the returned order (includes email status)
        setOrders(prev => prev.map(o =>
          o.orderId === orderId ? data.order : o
        ));
        // Update selected order if it's the one being modified
        setSelectedOrder(prev =>
          prev && prev.orderId === orderId ? data.order : prev
        );
      } else {
        alert(`Failed to update order: ${data.message}`);
      }
    } catch (err) {
      alert('Failed to update order status. Please try again.');
      console.error('Error updating order:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResendEmail = async (orderId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/email/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with new email status
        setOrders(prev => prev.map(o =>
          o.orderId === orderId
            ? {
              ...o,
              email: {
                status: 'sent' as EmailStatus,
                attempts: data.attempts || (o.email?.attempts || 0) + 1,
                lastAttempt: new Date().toISOString(),
                error: null
              }
            }
            : o
        ));
        // Update selected order
        setSelectedOrder(prev =>
          prev && prev.orderId === orderId
            ? {
              ...prev,
              email: {
                status: 'sent' as EmailStatus,
                attempts: data.attempts || (prev.email?.attempts || 0) + 1,
                lastAttempt: new Date().toISOString(),
                error: null
              }
            }
            : prev
        );
        return { success: true, message: data.message || 'Email sent successfully!' };
      } else {
        // Update failed attempt count
        setOrders(prev => prev.map(o =>
          o.orderId === orderId
            ? {
              ...o,
              email: {
                status: 'failed' as EmailStatus,
                attempts: data.attempts || (o.email?.attempts || 0) + 1,
                lastAttempt: new Date().toISOString(),
                error: data.error || 'Failed to send email'
              }
            }
            : o
        ));
        setSelectedOrder(prev =>
          prev && prev.orderId === orderId
            ? {
              ...prev,
              email: {
                status: 'failed' as EmailStatus,
                attempts: data.attempts || (prev.email?.attempts || 0) + 1,
                lastAttempt: new Date().toISOString(),
                error: data.error || 'Failed to send email'
              }
            }
            : prev
        );
        return {
          success: false,
          message: data.error || data.message || 'Failed to send email. Please try again.'
        };
      }
    } catch (err) {
      console.error('Error resending email:', err);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const products = Array.from(new Set(orders.map((o) => o.product.id)));
  const sizes = Array.from(new Set(orders.map((o) => o.product.size)));

  const acceptedCount = orders.filter((order) => order.status === 'accepted').length;
  const pendingCount = orders.filter((order) => order.status === 'pending').length;
  const rejectedCount = orders.filter((order) => order.status === 'rejected').length;

  const totalRevenue = orders
    .filter((order) => order.status === 'accepted')
    .reduce((sum, order) => sum + order.product.price, 0);
  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  // Show loading screen while checking session
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--tedx-red)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (sessionStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatsCard title="Total Orders" value={orders.length} icon={<PackageIcon />} accent />
          <StatsCard title="Accepted" value={acceptedCount} icon={<CheckIcon />} />
          <StatsCard title="Pending" value={pendingCount} icon={<PackageIcon />} />
          <StatsCard title="Rejected" value={rejectedCount} icon={<XCircleIcon />} />
          <StatsCard title="Revenue" value={formatRevenue(totalRevenue)} icon={<CreditCardIcon />} />
          <StatsCard title="Showing" value={filteredOrders.length} icon={<FilterIcon />} />
        </div>

        {/* Filters */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by name, phone, order ID, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-[var(--card-border)] rounded-lg text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--tedx-red)] transition-colors"
              />
            </div>

            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="appearance-none w-full lg:w-48 px-4 py-2.5 bg-zinc-900 border border-[var(--card-border)] rounded-lg text-white focus:outline-none focus:border-[var(--tedx-red)] transition-colors cursor-pointer"
              >
                <option value="all">All Products</option>
                {products.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="appearance-none w-full lg:w-32 px-4 py-2.5 bg-zinc-900 border border-[var(--card-border)] rounded-lg text-white focus:outline-none focus:border-[var(--tedx-red)] transition-colors cursor-pointer"
              >
                <option value="all">All Sizes</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none w-full lg:w-36 px-4 py-2.5 bg-zinc-900 border border-[var(--card-border)] rounded-lg text-white focus:outline-none focus:border-[var(--tedx-red)] transition-colors cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="accepted">Accepted</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedEmailStatus}
                onChange={(e) => setSelectedEmailStatus(e.target.value)}
                className="appearance-none w-full lg:w-40 px-4 py-2.5 bg-zinc-900 border border-[var(--card-border)] rounded-lg text-white focus:outline-none focus:border-[var(--tedx-red)] transition-colors cursor-pointer"
              >
                <option value="all">All Emails</option>
                <option value="sent">Email Sent</option>
                <option value="failed">Email Failed</option>
                <option value="not_sent">Not Sent</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--tedx-red)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--muted)]">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Orders</h3>
            <p className="text-[var(--muted)] mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-[var(--tedx-red)] hover:bg-[var(--tedx-red-dark)] text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <PackageIcon />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
            <p className="text-[var(--muted)]">
              {searchQuery || selectedProduct !== "all" || selectedSize !== "all" || selectedStatus !== "all" || selectedEmailStatus !== "all"
                ? "Try adjusting your filters"
                : "Orders will appear here once customers place them"}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-[var(--card-border)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.orderId}
                      className="hover:bg-zinc-900/30 transition-colors cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => handleRowClick(order)}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-white">{order.customer.name}</p>
                          <p className="text-sm text-[var(--muted)]">{order.customer.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-white">{order.product.name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--tedx-red)]/10 text-[var(--tedx-red)]">
                          {order.product.size}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-white">{formatPrice(order.product.price)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--muted)]">{formatDate(order.timestamp)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'accepted'
                          ? "bg-green-500/20 text-green-400"
                          : order.status === 'rejected'
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                          {order.status === 'accepted' ? "Accepted" : order.status === 'rejected' ? "Rejected" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {order.status === 'accepted' ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${order.email?.status === 'sent'
                            ? "bg-green-500/20 text-green-400"
                            : order.email?.status === 'failed'
                              ? "bg-red-500/20 text-red-400"
                              : "bg-zinc-500/20 text-zinc-400"
                            }`}>
                            <MailIcon />
                            {order.email?.status === 'sent' ? "Sent" : order.email?.status === 'failed' ? "Failed" : "—"}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(order);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <EyeIcon />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
        onResendEmail={handleResendEmail}
      />
    </div>
  );
}
