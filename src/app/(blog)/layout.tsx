import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container">
      <div className="wrapper">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
