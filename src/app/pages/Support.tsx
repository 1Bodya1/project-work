import { useEffect, useState } from 'react';
import { Mail, Package } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/StatusBadge';
import { supportService } from '../services/supportService';
import { useAuth } from '../store/AuthContext';
import type { SupportTicket } from '../types';

type SupportForm = {
  subject: string;
  orderNumber: string;
  message: string;
};

export default function Support() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SupportForm>({
    subject: '',
    orderNumber: '',
    message: '',
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof SupportForm | 'form', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadTickets() {
      const nextTickets = await supportService.getMyTickets();
      setTickets(nextTickets);
    }

    loadTickets();
  }, []);

  const handleFieldChange = (field: keyof SupportForm, value: string) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: '' }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const nextErrors: Partial<Record<keyof SupportForm, string>> = {};
    if (!formData.subject.trim()) nextErrors.subject = 'Subject is required';
    if (!formData.message.trim()) nextErrors.message = 'Message is required';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const ticket = await supportService.createTicket({
        subject: formData.subject.trim(),
        orderNumber: formData.orderNumber.trim() || undefined,
        message: formData.message.trim(),
        userId: user?.id,
        userEmail: user?.email || 'customer@example.com',
        customer: {
          name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Solution customer',
          email: user?.email || 'customer@example.com',
        },
      });

      setTickets((currentTickets) => [ticket, ...currentTickets]);
      setFormData({ subject: '', orderNumber: '', message: '' });
      toast.success('Your support request has been created');
    } catch {
      setErrors({ form: 'Unable to create support request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl mb-2">Support</h1>
      <p className="text-[#1A1A1A] mb-8">
        Need help? Send us a message and we'll get back to you as soon as possible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Submit a Support Request</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

              <div>
                <label className="block mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(event) => handleFieldChange('subject', event.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="Brief description of your issue"
                />
                {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject}</p>}
              </div>

              <div>
                <label className="block mb-2">Order Number (optional)</label>
                <input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(event) => handleFieldChange('orderNumber', event.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="Order number"
                />
              </div>

              <div>
                <label className="block mb-2">Message</label>
                <textarea
                  rows={6}
                  value={formData.message}
                  onChange={(event) => handleFieldChange('message', event.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] resize-none"
                  placeholder="Please describe your issue in detail..."
                />
                {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit request'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Your Support Requests</h3>

            {tickets.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <h4 className="mb-2">No support requests yet</h4>
                <p className="text-[#1A1A1A]">
                  Your support requests will appear here after you submit a ticket.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border border-black/10 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h4 className="mb-1">{ticket.subject}</h4>
                        <p className="text-sm text-[#1A1A1A]">
                          {ticket.orderNumber ? `Order: ${ticket.orderNumber}` : 'No order number'}
                        </p>
                        <p className="text-sm text-[#1A1A1A]">{ticket.date}</p>
                        <p className="text-sm text-[#1A1A1A] mt-2 line-clamp-2">{ticket.message}</p>
                      </div>
                      <StatusBadge status={ticket.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#7A1F2A]" />
              </div>
              <div>
                <h4 className="mb-1">Email Us</h4>
                <p className="text-sm text-[#1A1A1A]">support@solution.ua</p>
              </div>
            </div>
            <p className="text-sm text-[#1A1A1A]">
              We typically respond within 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
