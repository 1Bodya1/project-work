import { Link } from 'react-router';
import { Check, Package, PenTool, ShoppingCart, Truck, Upload } from 'lucide-react';

const steps = [
  { title: 'Choose product', description: 'Pick a clothing item from the catalog.', icon: Package },
  { title: 'Upload design', description: 'Add your own image in a supported format.', icon: Upload },
  { title: 'Customize', description: 'Adjust position, size, and rotation on the product preview.', icon: PenTool },
  { title: 'Add to cart', description: 'Save the design and add the customized item to cart.', icon: ShoppingCart },
  { title: 'Order and track delivery', description: 'Checkout and follow Nova Poshta tracking in mock mode.', icon: Truck },
];

const benefits = [
  'Simple product customization flow',
  'Visual preview before adding to cart',
  'Support for base and customized products',
  'Mock online payment flow for MVP testing',
  'User profile, orders, and delivery tracking',
  'Admin tools for products, orders, and support',
];

export default function About() {
  return (
    <div className="bg-white">
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-wide text-[#7A1F2A] mb-3">
            Fashion-tech customization platform
          </p>
          <h1 className="text-4xl md:text-5xl mb-6">About Solution</h1>
          <p className="text-lg text-[#1A1A1A] mb-8">
            Solution is an e-commerce clothing customization platform created for a diploma MERN
            project. It helps users choose clothing items, upload their own designs, preview the
            result, add products to cart, place orders, and track delivery.
          </p>
          <Link
            to="/catalog"
            className="inline-block px-8 py-4 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Go to catalog
          </Link>
        </div>
      </section>

      <section className="border-y border-black/10 bg-[#F5F5F5]">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <h2 className="text-3xl mb-4">What the platform does</h2>
              <p className="text-[#1A1A1A]">
                Solution combines a product catalog, a 2D customization experience, cart and
                checkout flows, mock payment states, order history, support requests, and admin
                management tools in one frontend MVP.
              </p>
            </div>
            <div>
              <h2 className="text-3xl mb-4">How customization works</h2>
              <p className="text-[#1A1A1A]">
                Users upload an image, place it inside a visible print area, adjust it with simple
                controls, save the design, and add the customized product to cart with a preview.
              </p>
            </div>
            <div>
              <h2 className="text-3xl mb-4">Diploma project</h2>
              <p className="text-[#1A1A1A]">
                This frontend is prepared for a future MERN backend with MongoDB, JWT auth, real
                payments, file uploads, and Nova Poshta API integration. Until then, it runs in mock
                mode.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-wide text-[#7A1F2A] mb-2">How it works</p>
            <h2 className="text-3xl md:text-4xl">From product to delivery</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="bg-white border border-black/10 rounded-lg p-5">
                <div className="w-11 h-11 rounded-full bg-[#7A1F2A]/10 text-[#7A1F2A] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-[#7A1F2A] mb-2">Step {index + 1}</p>
                <h3 className="mb-2">{step.title}</h3>
                <p className="text-sm text-[#1A1A1A]">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="bg-white border border-black/10 rounded-lg p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <p className="text-sm uppercase tracking-wide text-[#7A1F2A] mb-2">User benefits</p>
              <h2 className="text-3xl mb-4">Built for a clear MVP experience</h2>
              <p className="text-[#1A1A1A]">
                The goal is to keep the shopping and customization flow understandable, reliable,
                and ready for backend integration without adding features outside the MVP scope.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                  <Check className="w-4 h-4 text-[#7A1F2A] mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
