export const metadata = {
  title: "About Us",
  description: "Learn about YOLO Real Estate — your trusted partner in finding the perfect property.",
};

export default function AboutPage() {
  const values = [
    {
      title: "Transparency",
      description: "We believe in honest, clear communication throughout every transaction.",
      icon: "🔍",
    },
    {
      title: "Excellence",
      description: "We strive for the highest standards in service and property quality.",
      icon: "⭐",
    },
    {
      title: "Innovation",
      description: "We leverage technology to make property search faster and easier.",
      icon: "💡",
    },
    {
      title: "Community",
      description: "We build lasting relationships with clients and communities we serve.",
      icon: "🤝",
    },
  ];

  const team = [
    { name: "Sarah Mitchell", role: "CEO & Founder", image: "SM" },
    { name: "James Chen", role: "Head of Sales", image: "JC" },
    { name: "Maria Garcia", role: "Senior Agent", image: "MG" },
    { name: "David Thompson", role: "Commercial Director", image: "DT" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <h1 className="text-3xl lg:text-4xl font-bold">About YOLO Real Estate</h1>
          <p className="text-brand-100 mt-3 max-w-2xl text-lg">
            Making real estate simple, transparent, and exciting since 2016.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                YOLO Real Estate was founded with a simple mission: to make finding and listing properties
                an enjoyable experience. We believe that everyone deserves a place they can call home,
                and we&apos;re here to help make that happen.
              </p>
              <p>
                With over a decade of experience in the real estate industry, our team has helped hundreds
                of families find their dream homes, investors discover profitable opportunities, and
                businesses locate the perfect commercial spaces.
              </p>
              <p>
                Our name reflects our philosophy — You Only Live Once, so why settle for anything less
                than the perfect property? We combine cutting-edge technology with personalized service
                to deliver results that exceed expectations.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 lg:p-10 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "500+", label: "Properties Sold" },
                { value: "10+", label: "Years Experience" },
                { value: "50+", label: "Expert Agents" },
                { value: "98%", label: "Client Satisfaction" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4">
                  <div className="text-3xl font-bold text-brand-500">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <span className="text-4xl block mb-4">{value.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-brand-600 font-bold text-xl">{member.image}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
