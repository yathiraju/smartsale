import PageHeader from "../components/PageHeader";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800">
      <PageHeader title="Privacy Policy" />

      <div className="space-y-4 bg-white p-6 rounded shadow text-sm leading-relaxed">
        <p>
          This Privacy Policy describes how <strong>smartsales.in</strong> collects,
          uses, and protects your personal information when you use our website
          and services.
        </p>

        <h2 className="font-semibold text-base">1. Information We Collect</h2>
        <p>
          We may collect personal information such as your name, phone number,
          email address, delivery address, and payment-related details when you
          place an order or contact us.
        </p>

        <h2 className="font-semibold text-base">2. How We Use Your Information</h2>
        <p>
          The information collected is used to:
        </p>
        <ul className="list-disc pl-6">
          <li>Process and deliver your orders</li>
          <li>Provide customer support</li>
          <li>Communicate order and service updates</li>
          <li>Improve our products and services</li>
        </ul>

        <h2 className="font-semibold text-base">3. Payment Security</h2>
        <p>
          Payments on smartsales.in are securely processed by trusted payment
          gateways such as Razorpay. We do not store your card, UPI, or banking
          details on our servers.
        </p>

        <h2 className="font-semibold text-base">4. Data Sharing</h2>
        <p>
          We do not sell, trade, or rent your personal information to third
          parties. Information may be shared only with logistics and payment
          partners strictly for order fulfillment.
        </p>

        <h2 className="font-semibold text-base">5. Cookies</h2>
        <p>
          Our website may use cookies to enhance user experience and analyze
          website traffic. You can choose to disable cookies through your browser
          settings.
        </p>

        <h2 className="font-semibold text-base">6. Data Protection</h2>
        <p>
          We implement reasonable security practices to protect your personal
          data from unauthorized access, misuse, or disclosure.
        </p>

        <h2 className="font-semibold text-base">7. Your Consent</h2>
        <p>
          By using our website, you consent to our Privacy Policy and agree to
          its terms.
        </p>

        <h2 className="font-semibold text-base">8. Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page.
        </p>

        <h2 className="font-semibold text-base">9. Contact Information</h2>
        <p>
          If you have any questions regarding this Privacy Policy, please contact
          us:
        </p>

        <p>
          <strong>Business Name:</strong> smartsales.in <br />
          <strong>Contact Person:</strong> Yathiraju Kolli <br />
          <strong>Phone:</strong>{" "}
          <a href="tel:+919701178791" className="text-blue-600 hover:underline">
            +91 97011 78791
          </a>
        </p>
      </div>
    </div>
  );
}
