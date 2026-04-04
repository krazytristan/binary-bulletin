import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔷 HEADER */}
      <section className="bg-primary text-white py-14 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          Contact Us
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Get in touch with The Binary Bulletin team
        </p>
      </section>

      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8">

        {/* 📝 CONTACT FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold text-dark mb-4">
            Send a Message
          </h2>

          <form className="space-y-4">

            <input
              type="text"
              placeholder="Your Name"
              className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />

            <input
              type="email"
              placeholder="Your Email"
              className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />

            <textarea
              rows="5"
              placeholder="Your Message"
              className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            ></textarea>

            <button
              type="submit"
              className="bg-secondary text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
            >
              Send Message
            </button>

          </form>
        </div>

        {/* 📍 CONTACT INFO */}
        <div className="bg-white p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold text-dark mb-4">
            Contact Information
          </h2>

          <div className="space-y-4 text-sm text-gray-600">

            <p>
              📍 AMA Computer College Lipa  
            </p>

            <p>
              📧 binarybulletin@ama.edu.ph
            </p>

            <p>
              📞 +63 900 000 0000
            </p>

            <p>
              🕒 Monday - Friday | 8:00 AM - 5:00 PM
            </p>

          </div>

          {/* 🌐 SOCIAL */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Follow Us</h3>

            <div className="flex gap-4 text-lg">
              <span>📘</span>
              <span className="text-gray-400 text-sm italic">
                more soon...
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 🗺 OPTIONAL MAP (PLACEHOLDER) */}
      <div className="max-w-6xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-card p-6 text-center text-gray-500">
          Map integration coming soon...
        </div>
      </div>

      <Footer />
    </div>
  );
}