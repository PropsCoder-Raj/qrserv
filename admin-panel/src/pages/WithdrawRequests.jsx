import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineCash, HiOutlineCheckCircle } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import withdrawRequestService from '../services/withdrawRequestService';

const STATUS_OPTIONS = ['pending', 'approved', 'paid'];
const BANK_DETAIL_TYPES = ['personal', 'other'];

const statusClasses = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

const initialCreateForm = {
  amount: '',
  bankDetailId: '',
  bankDetailType: 'personal',
  customBankDetailLabel: '',
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  note: '',
};

const initialApproveForm = {
  approvalNote: '',
};

const initialPayForm = {
  paymentReference: '',
  paymentNote: '',
  paymentProofFile: null,
};

const getBankDetailLabel = (detail) => {
  if (!detail) return 'Bank Details';
  if (detail.bankDetailType === 'other') {
    return detail.customBankDetailLabel?.trim() || 'Other';
  }
  if (detail.bankDetailType === 'personal') {
    return 'Personal';
  }
  return 'Bank Details';
};

const normalizeBankDetail = (detail) => ({
  bankDetailId: detail._id || detail.bankDetailId || '',
  bankDetailType: detail.bankDetailType || 'personal',
  customBankDetailLabel: detail.customBankDetailLabel || '',
  accountHolderName: detail.accountHolderName || '',
  bankName: detail.bankName || '',
  accountNumber: detail.accountNumber || '',
  ifscCode: detail.ifscCode || '',
});

const createEmptyBankDetailForm = (currentForm = initialCreateForm) => ({
  ...initialCreateForm,
  amount: currentForm.amount || '',
  note: currentForm.note || '',
});

export default function WithdrawRequests() {
  const { user } = useAuth();
  const isAllowed = ['super_admin', 'org_admin', 'restaurant_owner'].includes(
    user?.role,
  );
  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState({
    razorpayCollectedAmount: 0,
    paidWithdrawAmount: 0,
    availableAmount: 0,
    withdrawChargePercentage: 2.5,
    withdrawChargeGstPercentage: 18,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [approveModal, setApproveModal] = useState({ open: false, request: null });
  const [payModal, setPayModal] = useState({ open: false, request: null });
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [savedBankDetails, setSavedBankDetails] = useState([]);
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [approveForm, setApproveForm] = useState(initialApproveForm);
  const [payForm, setPayForm] = useState(initialPayForm);
  const [submitting, setSubmitting] = useState(false);
  const availableAmount = Number(summary.availableAmount || 0);
  const withdrawChargePercentage = Number(summary.withdrawChargePercentage || 0);
  const withdrawChargeGstPercentage = Number(
    summary.withdrawChargeGstPercentage ?? 18,
  );
  const canRaiseRequest = availableAmount > 0;
  const raiseRequestTooltip = canRaiseRequest
    ? 'Raise a withdraw request'
    : 'Withdraw request is disabled because available request amount is0';
  const requestedAmount = Number(createForm.amount || 0);
  const withdrawChargeBaseAmount = Number(
    ((requestedAmount * withdrawChargePercentage) / 100).toFixed(2),
  );
  const withdrawChargeGstAmount = Number(
    ((withdrawChargeBaseAmount * withdrawChargeGstPercentage) / 100).toFixed(2),
  );
  const withdrawChargeAmount = Number(
    (withdrawChargeBaseAmount + withdrawChargeGstAmount).toFixed(2),
  );
  const withdrawNetAmount = Number(
    Math.max(0, requestedAmount - withdrawChargeAmount).toFixed(2),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await withdrawRequestService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        sortBy: sortBy || undefined,
        sortOrder,
        status: statusFilter || undefined,
      });
      const result = res.data.data;
      setRequests(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load withdraw requests');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, statusFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await withdrawRequestService.getSummary();
      setSummary(
        res.data.data || {
          razorpayCollectedAmount: 0,
          paidWithdrawAmount: 0,
          availableAmount: 0,
          withdrawChargePercentage: 2.5,
          withdrawChargeGstPercentage: 18,
        },
      );
    } catch {
      setSummary({
        razorpayCollectedAmount: 0,
        paidWithdrawAmount: 0,
        availableAmount: 0,
        withdrawChargePercentage: 2.5,
        withdrawChargeGstPercentage: 18,
      });
    }
  }, []);

  const loadBankDetails = useCallback(async () => {
    if (!isOrgAdmin) {
      setSavedBankDetails([]);
      return;
    }

    setBankDetailsLoading(true);
    try {
      const res = await withdrawRequestService.getBankDetails();
      setSavedBankDetails(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load saved bank details');
    } finally {
      setBankDetailsLoading(false);
    }
  }, [isOrgAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAllowed) {
      loadSummary();
    }
  }, [isAllowed, loadSummary]);

  useEffect(() => {
    if (isOrgAdmin) {
      loadBankDetails();
    }
  }, [isOrgAdmin, loadBankDetails]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const openCreate = () => {
    setCreateForm(initialCreateForm);
    setCreateOpen(true);
    loadSummary();
  };

  const selectSavedBankDetail = (detail) => {
    setCreateForm((prev) => ({
      ...prev,
      ...normalizeBankDetail(detail),
    }));
  };

  const startNewBankDetail = () => {
    setCreateForm((prev) => createEmptyBankDetailForm(prev));
  };

  const saveCurrentBankDetail = async ({ silent = false } = {}) => {
    const normalizedDetail = normalizeBankDetail(createForm);
    const requiredFields = [
      normalizedDetail.accountHolderName,
      normalizedDetail.bankName,
      normalizedDetail.accountNumber,
      normalizedDetail.ifscCode,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      if (!silent) toast.error('Fill all bank detail fields before saving');
      return null;
    }

    if (
      normalizedDetail.bankDetailType === 'other' &&
      !normalizedDetail.customBankDetailLabel.trim()
    ) {
      if (!silent) toast.error('Enter a label for Other bank details');
      return null;
    }

    try {
      const payload = {
        bankDetailType: normalizedDetail.bankDetailType,
        customBankDetailLabel: normalizedDetail.customBankDetailLabel.trim(),
        accountHolderName: normalizedDetail.accountHolderName.trim(),
        bankName: normalizedDetail.bankName.trim(),
        accountNumber: normalizedDetail.accountNumber.trim(),
        ifscCode: normalizedDetail.ifscCode.toUpperCase().trim(),
      };
      const res = normalizedDetail.bankDetailId
        ? await withdrawRequestService.updateBankDetail(
            normalizedDetail.bankDetailId,
            payload,
          )
        : await withdrawRequestService.createBankDetail(payload);
      const savedDetail = res.data.data;

      setSavedBankDetails((prev) => {
        const next = [
          savedDetail,
          ...prev.filter((detail) => detail._id !== savedDetail._id),
        ];
        return next;
      });
      setCreateForm((prev) => ({
        ...prev,
        ...normalizeBankDetail(savedDetail),
      }));

      if (!silent) {
        toast.success(`${getBankDetailLabel(savedDetail)} bank details saved`);
      }

      return savedDetail;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bank details');
      return null;
    }
  };

  const removeSavedBankDetail = async (detailToRemove) => {
    try {
      await withdrawRequestService.deleteBankDetail(detailToRemove._id);
      setSavedBankDetails((prev) =>
        prev.filter((detail) => detail._id !== detailToRemove._id),
      );
      setCreateForm((prev) =>
        prev.bankDetailId === detailToRemove._id
          ? {
              ...initialCreateForm,
              amount: prev.amount,
              note: prev.note,
            }
          : prev,
      );
      toast.success(`${getBankDetailLabel(detailToRemove)} bank details removed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove bank details');
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    const savedDetail = await saveCurrentBankDetail({ silent: true });
    if (!savedDetail) return;

    setSubmitting(true);
    try {
      await withdrawRequestService.create({
        amount: Number(createForm.amount),
        bankDetailId: savedDetail._id,
        accountHolderName: createForm.accountHolderName.trim(),
        bankName: createForm.bankName.trim(),
        accountNumber: createForm.accountNumber.trim(),
        ifscCode: createForm.ifscCode.toUpperCase().trim(),
        note: createForm.note.trim(),
      });
      toast.success('Withdraw request submitted');
      setCreateOpen(false);
      setCreateForm(initialCreateForm);
      loadBankDetails();
      load();
      loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const submitApprove = async (e) => {
    e.preventDefault();
    if (!approveModal.request?._id) return;
    setSubmitting(true);
    try {
      await withdrawRequestService.approve(approveModal.request._id, approveForm);
      toast.success('Withdraw request approved');
      setApproveModal({ open: false, request: null });
      setApproveForm(initialApproveForm);
      load();
      loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPaid = async (e) => {
    e.preventDefault();
    if (!payModal.request?._id) return;
    setSubmitting(true);
    try {
      if (!payForm.paymentProofFile) {
        toast.error('Upload payment proof before marking as paid');
        setSubmitting(false);
        return;
      }

      await withdrawRequestService.markPaid(
        payModal.request._id,
        payForm,
        payForm.paymentProofFile,
      );
      toast.success('Withdraw request marked as paid');
      setPayModal({ open: false, request: null });
      setPayForm(initialPayForm);
      load();
      loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'organizationId',
      label: 'Organization',
      render: (item) => item.organizationId?.name || '-',
    },
    {
      key: 'amount',
      label: isOrgAdmin ? 'You Receive' : 'Payout Details',
      sortable: true,
      render: (item) => (
        <div className="space-y-1 rounded-lg bg-slate-50 p-2">
          <div className="text-xs text-slate-500">
            {isOrgAdmin ? 'Requested Amount' : 'Requested Amount'}: Rs{' '}
            {Number(item.amount || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500">
            {isOrgAdmin ? 'Total Charge' : 'Charge'}: Rs{' '}
            {Number(item.chargeAmount || 0).toLocaleString('en-IN')}
          </div>
          {Number(item.chargeBaseAmount || 0) > 0 && (
            <div className="text-xs text-slate-400">
              Razorpay{Number(item.chargeBaseAmount || 0).toLocaleString('en-IN')}
              {' + '}
              GST{Number(item.chargeGstAmount || 0).toLocaleString('en-IN')}
            </div>
          )}
          <div className="text-sm font-bold text-slate-800">
            {isOrgAdmin ? 'Net Amount' : 'Payable Amount'}: Rs{' '}
            {Number(item.netAmount || item.amount || 0).toLocaleString('en-IN')}
          </div>
        </div>
      ),
    },
    {
      key: 'requestedByUserId',
      label: 'Requested By',
      render: (item) => item.requestedByUserId?.name || '-',
    },
    {
      key: 'bankName',
      label: 'Bank',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs text-slate-500">Holder: {item.accountHolderName}</div>
          <div className="text-xs text-slate-500">Account: {item.accountNumber}</div>
          <div className="text-xs text-slate-500">Bank: {item.bankName}</div>
          <div className="text-xs text-slate-500">IFSC: {item.ifscCode}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <div className="text-center">
          <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[item.status] || statusClasses.pending}`}>
            {item.status}
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Requested',
      sortable: true,
      render: (item) => new Date(item.createdAt).toLocaleString(),
    },
    {
      key: 'paymentProof',
      label: 'Payment Proof',
      render: (item) => {
        if (item.status !== 'paid' || !item.paymentProofUrl) {
          return <span className="text-xs text-slate-400">-</span>;
        }

        return (
          <a
            href={`${import.meta.env.VITE_API_URL || ''}${item.paymentProofUrl}`}
            target="_blank"
            rel="noreferrer"
            download={item.paymentProofName || true}
            className="inline-flex items-center rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
          >
            View / Download Proof
          </a>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          {isSuperAdmin && item.status === 'pending' && (
            <button
              onClick={() => {
                setApproveForm(initialApproveForm);
                setApproveModal({ open: true, request: item });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
            >
              <HiOutlineCheckCircle size={14} /> Approve
            </button>
          )}
          {isSuperAdmin && item.status === 'approved' && (
            <button
              onClick={() => {
                setPayForm(initialPayForm);
                setPayModal({ open: true, request: item });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 cursor-pointer"
            >
              <HiOutlineCash size={14} /> Mark Paid
            </button>
          )}
          {!isSuperAdmin && (
            <span className="text-xs text-slate-400">View only</span>
          )}
        </div>
      ),
    },
  ];

  if (!isAllowed) return <Navigate to="/" replace />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Withdraw Requests</h2>
          <p className="text-sm text-slate-500">
            Org admin can raise requests. Super admin can approve and mark them paid.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-stroke px-3 py-2 text-sm outline-none"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {isOrgAdmin && (
            <div className="group relative inline-flex">
              <button
                type="button"
                onClick={openCreate}
                disabled={!canRaiseRequest}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  canRaiseRequest
                    ? 'bg-primary hover:bg-primary-dark cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed text-slate-600'
                }`}
              >
                Raise Request
              </button>
              {!canRaiseRequest && (
                <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  {raiseRequestTooltip}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isOrgAdmin &&
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Razorpay Collected</div>
            <div className="mt-2 text-2xl font-bold text-slate-800">
             {Number(summary.razorpayCollectedAmount || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Withdraw Paid</div>
            <div className="mt-2 text-2xl font-bold text-slate-800">
             {Number(summary.paidWithdrawAmount || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">Available Request Amount</div>
            <div className="mt-2 text-2xl font-bold text-emerald-800">
             {Number(summary.availableAmount || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      }

      
      <div className="rounded-xl border border-stroke bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          searchValue={search}
          onSearchChange={handleSearch}
          searchPlaceholder="Search by bank, account, IFSC, payment ref..."
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Raise Withdraw Request"
      >
        <form onSubmit={submitCreate} className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Total Available Request Amount
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-800">
             {Number(summary.availableAmount || 0).toLocaleString('en-IN')}
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Calculation: Razorpay paid orders - paid withdraw requests
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount *</label>
            <input
              type="number"
              min="1"
              max={Number(summary.availableAmount || 0)}
              step="0.01"
              required
              value={createForm.amount}
              onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-slate-500">
              You can request up to{Number(summary.availableAmount || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Withdraw Calculation
            </div>
            <div className="mt-2 space-y-1 text-sm text-amber-900">
              <div>Requested Amount:{requestedAmount.toLocaleString('en-IN')}</div>
              <div>
                Razorpay Charge ({withdrawChargePercentage}%): Rs{' '}
                {withdrawChargeBaseAmount.toLocaleString('en-IN')}
              </div>
              <div>
                GST on Razorpay Charge ({withdrawChargeGstPercentage}%): Rs{' '}
                {withdrawChargeGstAmount.toLocaleString('en-IN')}
              </div>
              <div>
                Total Deduction:{withdrawChargeAmount.toLocaleString('en-IN')}
              </div>
              <div className="font-semibold">
                Withdraw Amount:{withdrawNetAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <p className="mt-2 text-xs text-amber-700">
              Example: if you request1000, Razorpay charge is25 and GST is4.5,
              then you will receive970.5.
            </p>
          </div>
          <div className="space-y-3 rounded-lg border border-stroke p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Bank Details</h3>
                <p className="text-xs text-slate-500">
                  Save multiple bank accounts with personal or other type.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startNewBankDetail}
                  disabled={submitting}
                  className="rounded-lg border border-stroke px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  New Bank Detail
                </button>
                <button
                  type="button"
                  onClick={saveCurrentBankDetail}
                  disabled={submitting}
                  className="rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 cursor-pointer"
                >
                  {createForm.bankDetailId ? 'Update Bank Detail' : 'Save Bank Detail'}
                </button>
              </div>
            </div>
            {bankDetailsLoading && (
              <div className="text-xs text-slate-500">Loading saved bank details...</div>
            )}
            {savedBankDetails.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {savedBankDetails.map((detail) => {
                  const isSelected = createForm.bankDetailId === detail._id;

                  return (
                    <div
                      key={detail._id}
                      className={`rounded-lg border p-3 ${isSelected ? 'border-primary bg-primary/5' : 'border-stroke bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => selectSavedBankDetail(detail)}
                          className="text-left"
                        >
                          <div className="text-sm font-semibold text-slate-800">
                            {getBankDetailLabel(detail)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Holder: {detail.accountHolderName}
                          </div>
                          <div className="text-xs text-slate-500">
                            Account: {detail.accountNumber}
                          </div>
                          <div className="text-xs text-slate-500">Bank: {detail.bankName}</div>
                          <div className="text-xs text-slate-500">IFSC: {detail.ifscCode}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSavedBankDetail(detail)}
                          disabled={submitting}
                          className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Detail Type *</label>
                <select
                  value={createForm.bankDetailType}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, bankDetailType: e.target.value })
                  }
                  className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {BANK_DETAIL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === 'personal' ? 'Personal' : 'Other'}
                    </option>
                  ))}
                </select>
              </div>
              {createForm.bankDetailType === 'other' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Custom Label *</label>
                  <input
                    required
                    value={createForm.customBankDetailLabel}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        customBankDetailLabel: e.target.value,
                      })
                    }
                    placeholder="Branch, Personal, Partner..."
                    className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Account Holder Name *</label>
            <input
              required
              value={createForm.accountHolderName}
              onChange={(e) => setCreateForm({ ...createForm, accountHolderName: e.target.value })}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Bank Name *</label>
              <input
                required
                value={createForm.bankName}
                onChange={(e) => setCreateForm({ ...createForm, bankName: e.target.value })}
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">IFSC Code *</label>
              <input
                required
                value={createForm.ifscCode}
                onChange={(e) => setCreateForm({ ...createForm, ifscCode: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm uppercase outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Account Number *</label>
            <input
              required
              value={createForm.accountNumber}
              onChange={(e) => setCreateForm({ ...createForm, accountNumber: e.target.value })}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Note</label>
            <textarea
              rows={3}
              value={createForm.note}
              onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={approveModal.open}
        onClose={() => setApproveModal({ open: false, request: null })}
        title="Approve Withdraw Request"
      >
        <form onSubmit={submitApprove} className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Approving payable amount of Rs{' '}
            {Number(
              approveModal.request?.netAmount || approveModal.request?.amount || 0,
            ).toLocaleString('en-IN')}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Approval Note</label>
            <textarea
              rows={3}
              value={approveForm.approvalNote}
              onChange={(e) => setApproveForm({ approvalNote: e.target.value })}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setApproveModal({ open: false, request: null })}
              className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={payModal.open}
        onClose={() => setPayModal({ open: false, request: null })}
        title="Mark Withdraw Request As Paid"
      >
        <form onSubmit={submitPaid} className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Payment for Rs{' '}
            {Number(
              payModal.request?.netAmount || payModal.request?.amount || 0,
            ).toLocaleString('en-IN')}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment Reference</label>
            <input
              value={payForm.paymentReference}
              onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment Note</label>
            <textarea
              rows={3}
              value={payForm.paymentNote}
              onChange={(e) => setPayForm({ ...payForm, paymentNote: e.target.value })}
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment Proof (PNG, JPG, PDF, DOC, DOCX) *
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  paymentProofFile: e.target.files?.[0] || null,
                })
              }
              className="w-full rounded-lg border border-stroke px-4 py-2.5 text-sm outline-none focus:border-primary file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Upload screenshot or payment document. Max size 10MB.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPayModal({ open: false, request: null })}
              className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Mark Paid'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
