import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container">
      <Navbar />
      <div className="wrapper">
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
