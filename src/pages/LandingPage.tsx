import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-rice-field.jpg";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  unit: string;
}

const LandingPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCartCount();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat produk",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
  };

  const fetchCartCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setCartCount(count || 0);
    }
  };

  const addToCart = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu untuk menambah ke keranjang",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .upsert(
        { user_id: user.id, product_id: productId, quantity: 1 },
        { onConflict: "user_id,product_id" }
      );

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan ke keranjang",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Produk ditambahkan ke keranjang",
      });
      fetchCartCount();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              🌾 Petani Maju
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Beranda
              </Link>
              <Link to="/products" className="text-foreground hover:text-primary transition-colors">
                Produk
              </Link>
              <Link to="/about" className="text-foreground hover:text-primary transition-colors">
                Tentang
              </Link>
              <Link to="/cart" className="relative">
                <Button variant="outline" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-in slide-in-from-top">
              <Link to="/" className="block py-2 text-foreground hover:text-primary transition-colors">
                Beranda
              </Link>
              <Link to="/products" className="block py-2 text-foreground hover:text-primary transition-colors">
                Produk
              </Link>
              <Link to="/about" className="block py-2 text-foreground hover:text-primary transition-colors">
                Tentang
              </Link>
              <div className="flex gap-2 pt-2">
                <Link to="/cart" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Keranjang ({cartCount})
                  </Button>
                </Link>
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-5 w-5" />
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Rice fields" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Hasil Panen Segar Langsung dari Petani
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Produk organik berkualitas tinggi, langsung dari sawah ke meja Anda
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg" className="text-lg px-8 shadow-strong">
                  Belanja Sekarang
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 text-white border-white hover:bg-white hover:text-primary">
                  Pelajari Lebih Lanjut
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Produk Unggulan Kami
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pilihan terbaik hasil panen segar dari petani lokal kami
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card 
              key={product.id} 
              className="overflow-hidden hover:shadow-strong transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6">
                <span className="text-sm font-medium text-primary uppercase tracking-wide">
                  {product.category}
                </span>
                <h3 className="text-2xl font-bold mt-2 mb-2 text-card-foreground">
                  {product.name}
                </h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      Rp {product.price.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-muted-foreground">per {product.unit}</p>
                  </div>
                  <Button
                    onClick={() => addToCart(product.id)}
                    size="lg"
                    className="shadow-soft"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Beli
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/products">
            <Button size="lg" variant="outline" className="text-lg">
              Lihat Semua Produk
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center animate-in fade-in slide-in-from-bottom duration-700">
              <div className="w-16 h-16 bg-hero-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold mb-2">100% Organik</h3>
              <p className="text-muted-foreground">
                Semua produk kami ditanam tanpa pestisida kimia
              </p>
            </div>
            <div className="text-center animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: "100ms" }}>
              <div className="w-16 h-16 bg-hero-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-3xl">🚜</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Langsung dari Petani</h3>
              <p className="text-muted-foreground">
                Tanpa perantara, harga terbaik untuk semua
              </p>
            </div>
            <div className="text-center animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: "200ms" }}>
              <div className="w-16 h-16 bg-hero-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Pengiriman Cepat</h3>
              <p className="text-muted-foreground">
                Produk segar sampai di rumah Anda dalam 1-2 hari
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">🌾 Petani Maju</h3>
              <p className="text-primary-foreground/80">
                Menghubungkan petani dengan konsumen untuk hasil panen segar dan berkualitas.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Tautan</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><Link to="/products" className="hover:text-primary-foreground transition-colors">Produk</Link></li>
                <li><Link to="/about" className="hover:text-primary-foreground transition-colors">Tentang Kami</Link></li>
                <li><Link to="/auth" className="hover:text-primary-foreground transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Kontak</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Email: info@petanimaju.id</li>
                <li>Telepon: (021) 1234-5678</li>
                <li>Alamat: Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60">
            <p>&copy; 2025 Petani Maju. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;