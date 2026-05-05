import { Mail, MessageSquare, HelpCircle } from 'lucide-react';

export default function Support() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl mb-2">Support</h1>
      <p className="text-[#1A1A1A] mb-8">
        Need help? Send us a message and we'll get back to you as soon as possible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="mb-6">Submit a Support Request</h3>

            <form className="space-y-4">
              <div>
                <label className="block mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block mb-2">Order Number (optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="ORD-001"
                />
              </div>

              <div>
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A]"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block mb-2">Message</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded border-none focus:outline-none focus:ring-2 focus:ring-[#7A1F2A] resize-none"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
              >
                Submit request
              </button>
            </form>
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

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#7A1F2A]" />
              </div>
              <div>
                <h4 className="mb-1">Live Chat</h4>
                <p className="text-sm text-[#1A1A1A]">Mon-Fri 9AM-6PM</p>
              </div>
            </div>
            <button className="w-full py-2.5 border border-black rounded hover:bg-black hover:text-white transition-colors">
              Start chat
            </button>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-[#7A1F2A]" />
              </div>
              <div>
                <h4 className="mb-1">FAQ</h4>
                <p className="text-sm text-[#1A1A1A]">Find quick answers</p>
              </div>
            </div>
            <button className="w-full py-2.5 border border-black rounded hover:bg-black hover:text-white transition-colors">
              View FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
