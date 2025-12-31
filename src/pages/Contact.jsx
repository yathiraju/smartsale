import PageHeader from "../components/PageHeader";

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800">
      <PageHeader title="Contact Us" />

      <p className="mb-6">
        If you have any questions, concerns, or need assistance with your order,
        feel free to contact us using the details below.
      </p>

      <div className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <h2 className="font-semibold">Business Name</h2>
          <p>smartsales.in</p>
        </div>

        <div>
          <h2 className="font-semibold">Contact Person</h2>
          <p>Yathiraju Kolli</p>
        </div>

        <div>
          <h2 className="font-semibold">Phone</h2>
          <p>
            <a href="tel:+919701178791" className="text-blue-600 hover:underline">
              +91 97011 78791
            </a>
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Email</h2>
          <p>
            <a
              href="mailto:support@smartsales.in"
              className="text-blue-600 hover:underline"
            >
              support@smartsales.in
            </a>
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Operating Hours</h2>
          <p>Monday – Saturday: 9:00 AM to 6:00 PM</p>
        </div>
      </div>
    </div>
  );
}
