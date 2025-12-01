import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingBag } from "lucide-react";

const CartPage = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("cart_items")
      .select("*, products(*)")
      .eq("user_id", user.id);

    setCartItems(data || []);
  };

  const removeFromCart = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    fetchCart();
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    await supabase.from("cart_items").update({ quantity }).eq("id", id);
    fetchCart();
  };

  const handleCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const total = cartItems.reduce((sum, item) => sum + item.products.price * item.quantity, 0);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: total,
        status: "pending",
        payment_method: "bank_transfer",
        bank_name: bankName,
        shipping_address: shippingAddress,
        phone,
      })
      .select()
      .single();

    if (error || !order) {
      toast({ title: "Error", description: "Gagal membuat pesanan", variant: "destructive" });
      return;
    }

    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products.price,
    }));

    await supabase.from("order_items").insert(orderItems);
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    toast({ title: "Berhasil", description: "Pesanan berhasil dibuat!" });
    navigate("/");
  };

  const total = cartItems.reduce((sum, item) => sum + item.products.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Keranjang Belanja</h1>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl mb-4">Keranjang kosong</p>
              <Link to="/products">
                <Button>Mulai Belanja</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex gap-4">
                    <img src={item.products.image_url} alt={item.products.name} className="w-24 h-24 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-bold">{item.products.name}</h3>
                      <p className="text-sm text-muted-foreground">Rp {item.products.price.toLocaleString("id-ID")} / {item.products.unit}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                        <Input value={item.quantity} className="w-16 text-center" readOnly />
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rp {(item.products.price * item.quantity).toLocaleString("id-ID")}</p>
                      <Button size="sm" variant="destructive" className="mt-2" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold">Checkout</h2>
                  <div className="space-y-2">
                    <Label>Alamat Pengiriman</Label>
                    <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Telepon</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Bank</Label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA, Mandiri, dll" required />
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-xl">Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                    <Button className="w-full" onClick={handleCheckout}>Buat Pesanan</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;