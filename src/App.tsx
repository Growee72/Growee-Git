import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  MapPin, 
  History, 
  ChevronRight, 
  Plus, 
  LogOut, 
  LogIn, 
  Trash2, 
  Edit, 
  X,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  User, 
  UserRole, 
  Product, 
  CartItem, 
  Order, 
  OrderStatus 
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_USERS, 
  DEFAULT_MAP_URL 
} from './constants';

type AppView = 'menu' | 'checkout' | 'profile' | 'seller' | 'qris' | 'history';

export default function App() {
  // --- State ---
  const [view, setView] = useState<AppView>('menu');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('hc_currentUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('hc_allUsers');
    return stored ? JSON.parse(stored) : INITIAL_USERS;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem('hc_products');
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('hc_cart');
    return stored ? JSON.parse(stored) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem('hc_orders');
    return stored ? JSON.parse(stored) : [];
  });

  // UI States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tempOrder, setTempOrder] = useState<Order | null>(null);
  const [userMapUrl, setUserMapUrl] = useState(DEFAULT_MAP_URL);
  const [locationStatus, setLocationStatus] = useState("Menunggu deteksi lokasi...");

  // Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '', error: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', contact: '', address: '', error: '' });
  const [profileForm, setProfileForm] = useState({ name: '', contact: '', address: '', password: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'qris'>('cod');

  // Load Profile Form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        contact: currentUser.contact || '',
        address: currentUser.address || '',
        password: ''
      });
    }
  }, [currentUser]);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('hc_currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('hc_allUsers', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('hc_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('hc_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('hc_orders', JSON.stringify(orders)); }, [orders]);

  // --- Logic ---
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const recommendedProducts = useMemo(() => products.filter(p => p.umkm_address_text.trim() !== ''), [products]);

  const getLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus("Mendeteksi lokasi...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocationStatus("Lokasi ditemukan ✔");
          setUserMapUrl(`${DEFAULT_MAP_URL}&q=${lat},${lon}`);
        },
        (error) => {
          setLocationStatus("Akses lokasi ditolak. Menampilkan area default.");
          setUserMapUrl(DEFAULT_MAP_URL);
        }
      );
    } else {
      setLocationStatus("Browser tidak mendukung GPS.");
    }
  };

  const handleLogin = () => {
    const user = allUsers.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setIsLoginModalOpen(false);
      setLoginForm({ email: '', password: '', error: '' });
      setView('menu');
    } else {
      setLoginForm(prev => ({ ...prev, error: 'Email atau password salah.' }));
    }
  };

  const handleRegister = () => {
    const { name, email, password, contact, address } = registerForm;
    if (!name || !email || !password || !contact || !address) {
      setRegisterForm(prev => ({ ...prev, error: 'Semua kolom wajib diisi.' }));
      return;
    }
    if (allUsers.find(u => u.email === email)) {
      setRegisterForm(prev => ({ ...prev, error: 'Email sudah terdaftar.' }));
      return;
    }
    const newUser: User = { name, email, password, contact, address, role: UserRole.BUYER };
    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsRegisterModalOpen(false);
    setRegisterForm({ name: '', email: '', password: '', contact: '', address: '', error: '' });
    setView('menu');
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const handlePlaceOrder = () => {
    if (!currentUser || currentUser.role !== UserRole.BUYER) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!currentUser.name || !currentUser.contact || !currentUser.address) {
      setView('profile');
      alert('Lengkapi profil Anda sebelum checkout.');
      return;
    }

    const orderData: Order = {
      id: `ord-${Math.random().toString(36).substr(2, 9)}`,
      buyerName: currentUser.name,
      contact: currentUser.contact || '',
      address: currentUser.address || '',
      email: currentUser.email,
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      status: OrderStatus.PENDING,
      date: new Date().toLocaleString()
    };

    if (paymentMethod === 'qris') {
      setTempOrder(orderData);
      setView('qris');
    } else {
      finalizeOrder(orderData);
    }
  };

  const finalizeOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
    setProducts(prev => prev.map(p => {
      const bought = order.items.find(item => item.id === p.id);
      return bought ? { ...p, stock: Math.max(0, p.stock - bought.qty) } : p;
    }));
    setCart([]);
    setView('history');
    alert('Pesanan berhasil dibuat!');
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct?.id || `p-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.get('name') as string,
      price: parseInt(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string),
      img: formData.get('img') as string,
      umkm_address_text: formData.get('address') as string,
      recommended: (formData.get('address') as string).trim() !== ''
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      setProducts(prev => [...prev, productData]);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleUpdateProfile = () => {
    if (!currentUser) return;
    const updatedUser = { 
      ...currentUser, 
      name: profileForm.name, 
      contact: profileForm.contact, 
      address: profileForm.address,
      password: profileForm.password || currentUser.password
    };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
    alert('Profil diperbarui!');
  };

  // --- Views ---

  const renderNavbar = () => (
    <header className="bg-growee-purple sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform group"
            onClick={() => setView('menu')}
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-growee-purple shadow-sm group-hover:rotate-12 transition-transform">
              <Leaf size={24} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display uppercase tracking-tight">
              GROWEE
            </h1>
          </div>
          <nav className="hidden md:flex gap-1 items-center">
            <button 
              onClick={() => setView('menu')}
              className={cn(
                "px-4 py-2 rounded-full font-semibold transition-colors",
                view === 'menu' ? "bg-white text-growee-purple" : "text-white hover:bg-white/10"
              )}
            >
              Menu
            </button>
            <button 
              disabled={cartCount === 0}
              onClick={() => setView('checkout')}
              className={cn(
                "px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2",
                view === 'checkout' ? "bg-growee-pink text-white" : "bg-growee-purple text-white hover:bg-white/10",
                cartCount === 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              <ShoppingBag size={18} />
              <span>Cart ({cartCount})</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-medium hidden sm:block">
                Hai, {currentUser.name}
              </span>
              <button 
                onClick={() => setView(currentUser.role === UserRole.SELLER ? 'seller' : 'profile')}
                className="p-2 bg-white rounded-full text-growee-purple hover:bg-gray-100 transition-colors"
                title="Profil"
              >
                <UserIcon size={20} />
              </button>
              <button 
                 onClick={() => setView('history')}
                 className="p-2 bg-white rounded-full text-growee-purple hover:bg-gray-100 transition-colors"
                 title="Riwayat"
              >
                <History size={20} />
              </button>
              <button 
                onClick={() => {
                  setCurrentUser(null);
                  setView('menu');
                }}
                className="p-2 bg-growee-pink text-white rounded-full hover:bg-growee-pink/90 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 bg-growee-pink text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-growee-pink/90 transition-all active:scale-95"
            >
              <LogIn size={20} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );

  const renderFooter = () => (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <Leaf className="text-growee-pink" fill="currentColor" />
               <h3 className="text-xl font-bold text-growee-purple">GROWEE</h3>
            </div>
            <p className="text-gray-600">Menghubungkan rasa lokal ke pintu rumah Anda.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Link Cepat</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="hover:text-growee-purple cursor-pointer">Tentang Kami</li>
              <li className="hover:text-growee-purple cursor-pointer">Syarat & Ketentuan</li>
              <li className="hover:text-growee-purple cursor-pointer">Kebijakan Privasi</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Dukungan</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="hover:text-growee-purple cursor-pointer">Hubungi Kami</li>
              <li className="hover:text-growee-purple cursor-pointer">FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Social</h4>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-growee-pink hover:text-white cursor-pointer transition-colors font-bold">IG</div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-growee-pink hover:text-white cursor-pointer transition-colors font-bold">FB</div>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-400">
          © 2026 GROWEE Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {renderNavbar()}

      <main className="container mx-auto px-4 py-8 flex-grow">
        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Hero */}
              <div className="gradient-bg rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-md rounded-2xl mb-2">
                    <Leaf size={48} className="text-growee-purple" fill="currentColor" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 drop-shadow-sm font-display">Rasa Lokal, Kualitas Global</h2>
                  <p className="text-gray-800 text-lg max-w-2xl mx-auto font-medium">Pilihan makanan UMKM terbaik: Soto, Sate, Nasi Goreng & Jajanan Tradisional.</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              </div>

              {/* Recommendations */}
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-growee-pink flex items-center gap-2 font-display">
                       <MapPin size={24} /> UMKM Sekitar
                    </h3>
                    <button 
                      onClick={getLocation}
                      className="text-sm bg-growee-pink text-white px-4 py-2 rounded-full font-bold hover:bg-growee-pink/90 transition-all active:scale-95"
                    >
                      Dapatkan Lokasi
                    </button>
                  </div>
                  <p className="text-xs font-medium text-gray-500">{locationStatus}</p>
                  <div className="aspect-video rounded-xl overflow-hidden border">
                    <iframe 
                      src={userMapUrl} 
                      className="w-full h-full" 
                      loading="lazy" 
                      allowFullScreen
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-growee-purple font-display">Rekomendasi Menu</h3>
                  <div className="grid gap-3">
                    {recommendedProducts.map(p => (
                      <div 
                        key={p.id}
                        className="bg-white p-4 rounded-xl border flex items-center justify-between hover:border-growee-pink transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <img src={p.img} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <h4 className="font-bold text-sm">{p.name}</h4>
                            <p className="text-xs text-growee-pink font-bold">{formatRupiah(p.price)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 rounded-full bg-growee-light text-growee-purple opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold font-display">Semua Menu</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map(p => (
                    <motion.div 
                      key={p.id} 
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col animate-fade-in"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        {p.recommended && (
                          <div className="absolute top-2 left-2 bg-growee-pink text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                            Recommended
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <h4 className="font-bold text-lg mb-1 truncate">{p.name}</h4>
                        <p className="text-growee-pink font-bold text-xl mb-2">{formatRupiah(p.price)}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Truck size={14} />
                          <span>Ready Stock: {p.stock}</span>
                        </div>
                        
                        <div className="mt-auto space-y-2">
                          {p.umkm_address_text && (
                            <button 
                              onClick={() => {
                                setSelectedProduct(p);
                                setIsDetailModalOpen(true);
                              }}
                              className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                              <MapPin size={16} />
                              Alamat UMKM
                            </button>
                          )}
                          <button 
                            disabled={p.stock <= 0}
                            onClick={() => handleAddToCart(p)}
                            className={cn(
                              "w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95 shadow-md flex items-center justify-center gap-2",
                              p.stock > 0 ? "bg-growee-purple hover:bg-growee-purple/90" : "bg-gray-300 cursor-not-allowed"
                            )}
                          >
                            <ShoppingBag size={18} />
                            {p.stock > 0 ? 'Tambah Keranjang' : 'Habis'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'checkout' && (
            <motion.div 
               key="checkout"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="max-w-5xl mx-auto space-y-8"
            >
              <h2 className="text-3xl font-bold font-display">Checkout</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  {/* Cart Items */}
                  <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-growee-pink" />
                      Keranjang Anda
                    </h3>
                    <div className="divide-y">
                      {cart.map((item, idx) => (
                        <div key={item.id} className="py-4 flex justify-between items-center">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border">
                              <img src={products.find(p => p.id === item.id)?.img} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold">{item.name}</h4>
                                <p className="text-sm text-gray-500">{item.qty} x {formatRupiah(item.price)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-growee-purple">{formatRupiah(item.price * item.qty)}</p>
                            <button 
                              onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                              className="text-xs text-red-500 font-bold hover:underline mt-1"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center">
                        <span className="font-bold text-xl">Total</span>
                        <span className="font-bold text-2xl text-growee-pink">{formatRupiah(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Truck size={20} className="text-growee-purple" />
                      Informasi Pengiriman
                    </h3>
                    {!currentUser || currentUser.role !== UserRole.BUYER ? (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 text-sm font-medium">
                        Silakan login sebagai Pembeli untuk melanjutkan.
                      </div>
                    ) : (
                      <div className="grid gap-4 bg-gray-50 p-4 rounded-xl border">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Penerima</p>
                          <p className="font-bold">{currentUser.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Kontak</p>
                          <p className="font-bold">{currentUser.contact || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Alamat</p>
                          <p className="font-bold">{currentUser.address || 'N/A'}</p>
                        </div>
                        {(!currentUser.name || !currentUser.contact || !currentUser.address) && (
                          <p className="text-xs text-red-500 font-bold">Harap lengkapi profil di halaman pengaturan.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Payment Method */}
                  <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6 sticky top-24">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <CreditCard size={20} className="text-growee-purple" />
                      Metode Pembayaran
                    </h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setPaymentMethod('cod')}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 flex items-center justify-between font-bold transition-all",
                          paymentMethod === 'cod' ? "border-growee-purple bg-growee-purple/5" : "border-gray-100 bg-white"
                        )}
                      >
                        <span>Cash on Delivery</span>
                        <div className={cn("w-4 h-4 rounded-full border-2", paymentMethod === 'cod' ? "bg-growee-purple border-growee-purple" : "border-gray-300")} />
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('qris')}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 flex items-center justify-between font-bold transition-all",
                          paymentMethod === 'qris' ? "border-growee-purple bg-growee-purple/5" : "border-gray-100 bg-white"
                        )}
                      >
                        <span>QRIS (Bayar Sekarang)</span>
                        <div className={cn("w-4 h-4 rounded-full border-2", paymentMethod === 'qris' ? "bg-growee-purple border-growee-purple" : "border-gray-300")} />
                      </button>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>{formatRupiah(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Biaya Layanan</span>
                        <span>Rp 2.000</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total Bayar</span>
                        <span className="text-growee-pink">{formatRupiah(cartTotal + 2000)}</span>
                      </div>
                      <button 
                         disabled={!currentUser || cartCount === 0 || (!currentUser.name || !currentUser.contact || !currentUser.address)}
                         onClick={handlePlaceOrder}
                         className={cn(
                           "w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95",
                           (!currentUser || cartCount === 0 || (!currentUser.name || !currentUser.contact || !currentUser.address)) 
                            ? "bg-gray-300 cursor-not-allowed" 
                            : "bg-growee-pink hover:bg-growee-pink/90"
                         )}
                      >
                         Bayar Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'qris' && (
            <motion.div 
               key="qris"
               className="max-w-md mx-auto text-center space-y-8 bg-white p-8 rounded-3xl border shadow-2xl"
            >
              <h2 className="text-3xl font-bold text-growee-pink font-display">Pembayaran QRIS</h2>
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">Scan kode di bawah untuk menyelesaikan transaksi Anda.</p>
                <div className="bg-white p-4 rounded-2xl border shadow-inner mx-auto max-w-[280px]">
                   <img src="https://i.imgur.com/qCS0VXd.jpeg" alt="QRIS Code" className="w-full h-auto rounded-lg" />
                </div>
                <div className="font-bold text-2xl text-gray-800">
                  Total: {formatRupiah((tempOrder?.total || 0) + 2000)}
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-xs text-left">
                  <strong>Simulasi:</strong> Ini adalah QRIS demo. Klik tombol di bawah setelah melakukan scan untuk konfirmasi.
                </div>
                <button 
                  onClick={() => {
                    if (tempOrder) {
                      const finalized = { ...tempOrder, status: OrderStatus.PROCESSING };
                      finalizeOrder(finalized);
                      setTempOrder(null);
                    }
                  }}
                  className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 transition-all active:scale-95"
                >
                  Selesai Bayar
                </button>
                <button 
                  onClick={() => setView('checkout')}
                  className="w-full text-gray-400 text-sm font-bold hover:text-gray-600"
                >
                  Ganti Metode Pembayaran
                </button>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <h2 className="text-3xl font-bold flex items-center gap-3 font-display">
                <History className="text-growee-pink" /> 
                Riwayat Pesanan
              </h2>
              <div className="space-y-4">
                {orders
                  .filter(o => currentUser?.role === UserRole.SELLER ? true : o.email === currentUser?.email)
                  .slice().reverse()
                  .map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Order ID</p>
                            <h4 className="font-bold text-lg text-growee-purple">{order.id}</h4>
                            <p className="text-xs text-gray-500">{order.date}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-xl text-growee-pink">{formatRupiah(order.total)}</p>
                             <div className={cn(
                               "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-1",
                               order.status === OrderStatus.PENDING ? "bg-yellow-100 text-yellow-700" :
                               order.status === OrderStatus.DELIVERED ? "bg-green-100 text-green-700" :
                               order.status === OrderStatus.CANCELLED ? "bg-red-100 text-red-700" :
                               "bg-blue-100 text-blue-700"
                             )}>
                               {order.status}
                             </div>
                          </div>
                       </div>
                       <div className="pt-4 border-t grid gap-2">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                               <span className="text-gray-700">{item.name} x {item.qty}</span>
                               <span className="font-bold">{formatRupiah(item.price * item.qty)}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                ))}
                {orders.length === 0 && (
                   <div className="text-center py-20 text-gray-400">
                      <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Belum ada riwayat pesanan.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'seller' && (
            <motion.div 
               key="seller"
               className="space-y-8"
            >
              <h2 className="text-3xl font-bold flex items-center gap-3 font-display">
                <Edit className="text-growee-pink" /> 
                Seller Dashboard
              </h2>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Pesanan Aktif', val: orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length, icon: Clock },
                  { label: 'Total Produk', val: products.length, icon: ShoppingBag },
                  { label: 'Total Omzet', val: formatRupiah(orders.reduce((sum, o) => o.status === OrderStatus.DELIVERED ? sum + o.total : sum, 0)), icon: CreditCard },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-growee-purple/10 flex items-center justify-center text-growee-purple">
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{stat.label}</p>
                      <p className="text-2xl font-bold text-growee-purple">{stat.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Orders List */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
                  <h3 className="font-bold text-xl">Daftar Pesanan</h3>
                  <div className="space-y-4">
                    {orders
                      .filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED)
                      .slice().reverse()
                      .map(o => (
                        <div key={o.id} className="p-4 rounded-2xl border bg-gray-50 space-y-3">
                           <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold">{o.buyerName}</h4>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{o.address}</p>
                              </div>
                              <select 
                                value={o.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as OrderStatus;
                                  setOrders(prev => prev.map(order => order.id === o.id ? { ...order, status: newStatus } : order));
                                }}
                                className="text-xs font-bold p-1 bg-white border rounded-lg focus:ring-1 ring-growee-pink outline-none"
                              >
                                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                              </select>
                           </div>
                           <div className="grid gap-1">
                              {o.items.map(it => <div key={it.id} className="text-[10px] text-gray-600">• {it.name} x {it.qty}</div>)}
                           </div>
                           <div className="flex justify-between items-center pt-2 border-t mt-2">
                             <span className="text-sm font-bold text-growee-pink">{formatRupiah(o.total)}</span>
                             <button 
                               onClick={() => setOrders(prev => prev.filter(order => order.id !== o.id))}
                               className="text-red-500 p-1 hover:bg-red-50 rounded-lg"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                        </div>
                      ))}
                    {orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length === 0 && (
                      <p className="text-center py-10 text-gray-400 text-sm">Tidak ada pesanan aktif.</p>
                    )}
                  </div>
                </div>

                {/* Management Products */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">Stok Produk</h3>
                    <button 
                       onClick={() => {
                         setEditingProduct(null);
                         setIsProductModalOpen(true);
                       }}
                       className="bg-growee-pink text-white p-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {products.map(p => (
                      <div key={p.id} className="p-3 border rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <img src={p.img} className="w-10 h-10 rounded-lg object-cover" />
                           <div>
                              <p className="font-bold text-sm">{p.name}</p>
                              <p className="text-xs text-gray-400">Stok: {p.stock} | {p.umkm_address_text ? '✅ Ada Alamat' : '❌ Tanpa Alamat'}</p>
                           </div>
                        </div>
                        <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                           >
                             <Edit size={16} />
                           </button>
                           <button 
                             onClick={() => {
                               if (confirm('Hapus produk?')) setProducts(prev => prev.filter(pr => pr.id !== p.id));
                             }}
                             className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h2 className="text-3xl font-bold flex items-center gap-3 font-display">
                <UserIcon className="text-growee-pink" /> 
                Profil Pembeli
              </h2>
              <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
                <p className="text-sm text-gray-500">Perbarui informasi pengiriman Anda. Data ini akan otomatis digunakan saat checkout.</p>
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={profileForm.name} 
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 ring-growee-pink outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Kontak/HP</label>
                    <input 
                      type="tel" 
                      value={profileForm.contact} 
                      onChange={e => setProfileForm({ ...profileForm, contact: e.target.value })}
                      className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 ring-growee-pink outline-none font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Alamat Lengkap</label>
                    <textarea 
                      rows={4}
                      value={profileForm.address} 
                      onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 ring-growee-pink outline-none font-bold resize-none" 
                    />
                  </div>
                  <div className="pt-4 border-t space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Password Baru (Kosongkan jika tetap)</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={profileForm.password} 
                      onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                      className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 ring-growee-pink outline-none font-bold" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleUpdateProfile}
                  className="w-full py-4 bg-growee-purple text-white rounded-2xl font-bold shadow-xl hover:bg-growee-purple/90 transition-all active:scale-95 text-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {renderFooter()}

      {/* --- Modals --- */}
      
      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsLoginModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-sm w-full rounded-3xl p-8 relative z-10 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-growee-purple font-display">Selamat Datang</h3>
                <p className="text-sm text-gray-500">Masuk untuk menikmati kuliner UMKM terbaik.</p>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-growee-pink font-medium"
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-growee-pink font-medium"
                />
                {loginForm.error && <p className="text-xs text-red-500 font-bold">{loginForm.error}</p>}
                <button 
                  onClick={handleLogin}
                  className="w-full py-4 bg-growee-pink text-white rounded-2xl font-bold shadow-lg hover:bg-growee-pink/90 transition-all active:scale-95"
                >
                  MASUK
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-500">
                Belum punya akun? <button onClick={() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); }} className="text-growee-purple font-bold hover:underline">Daftar Sekarang</button>
              </p>
              <div className="pt-4 border-t text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Demo Account</p>
                <div className="bg-gray-50 p-2 rounded-xl text-[10px] font-mono text-gray-600">
                  Seller: growee@gmail.com / 123456
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Register Modal */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
               onClick={() => setIsRegisterModalOpen(false)}
             />
             <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-md w-full rounded-3xl p-8 relative z-10 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]"
            >
               <h3 className="text-2xl font-bold text-center font-display">Daftar Akun Baru</h3>
               <div className="space-y-4">
                  <input 
                    placeholder="Nama Lengkap" 
                    value={registerForm.name}
                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 border rounded-2xl" 
                  />
                  <input 
                    placeholder="Email" 
                    value={registerForm.email}
                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full p-4 bg-gray-50 border rounded-2xl" 
                  />
                  <input 
                    type="password"
                    placeholder="Password" 
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full p-4 bg-gray-50 border rounded-2xl" 
                  />
                  <input 
                    placeholder="Nomor HP" 
                    value={registerForm.contact}
                    onChange={e => setRegisterForm({ ...registerForm, contact: e.target.value })}
                    className="w-full p-4 bg-gray-50 border rounded-2xl" 
                  />
                  <textarea 
                    placeholder="Alamat Lengkap" 
                    rows={3}
                    value={registerForm.address}
                    onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })}
                    className="w-full p-4 bg-gray-50 border rounded-2xl resize-none" 
                  />
                  {registerForm.error && <p className="text-xs text-red-500 font-bold">{registerForm.error}</p>}
                  <button 
                     onClick={handleRegister}
                     className="w-full py-4 bg-growee-pink text-white rounded-2xl font-bold shadow-lg"
                  >
                     DAFTAR
                  </button>
               </div>
               <p className="text-center text-sm">
                  Sudah punya akun? <button onClick={() => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); }} className="text-growee-purple font-bold">Login</button>
               </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
               onClick={() => setIsDetailModalOpen(false)}
             />
             <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-lg w-full rounded-3xl p-8 relative z-10 shadow-2xl space-y-6"
            >
               <div className="flex justify-between items-start">
                 <h3 className="text-2xl font-bold text-growee-purple font-display">Detail UMKM</h3>
                 <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
               </div>
               <div className="flex gap-4 items-center p-4 bg-growee-light rounded-2xl">
                 <img src={selectedProduct.img} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
                 <div>
                    <h4 className="text-xl font-bold">{selectedProduct.name}</h4>
                    <p className="text-growee-pink font-bold">{formatRupiah(selectedProduct.price)}</p>
                 </div>
               </div>
               <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MapPin size={12} /> Alamat Fisik
                    </h5>
                    <p className="text-gray-800 font-medium bg-gray-50 p-4 rounded-xl border italic">
                      "{selectedProduct.umkm_address_text || "Alamat tidak tersedia."}"
                    </p>
                  </div>
                  <div className="space-y-1">
                     <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Visual Map (Area Balunijuk)</h5>
                     <div className="aspect-video rounded-2xl overflow-hidden border">
                        <iframe src={DEFAULT_MAP_URL} title="Map" className="w-full h-full" referrerPolicy="no-referrer" />
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seller Product Edit Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
               onClick={() => setIsProductModalOpen(false)}
             />
             <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-md w-full rounded-3xl p-8 relative z-10 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]"
            >
               <h3 className="text-2xl font-bold font-display">{editingProduct ? 'Edit' : 'Tambah'} Produk</h3>
               <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Nama Produk</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-growee-pink" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Harga</label>
                      <input name="price" type="number" defaultValue={editingProduct?.price} required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-growee-pink" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Stok</label>
                      <input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-growee-pink" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">URL Gambar</label>
                    <input name="img" defaultValue={editingProduct?.img} required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-growee-pink" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Alamat UMKM (Teks)</label>
                    <textarea name="address" defaultValue={editingProduct?.umkm_address_text} rows={3} className="w-full p-4 bg-gray-50 border rounded-2xl resize-none outline-none focus:ring-2 ring-growee-pink" />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="flex-grow py-4 bg-growee-purple text-white rounded-2xl font-bold shadow-lg text-lg">SIMPAN</button>
                    <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-6 py-4 border rounded-2xl font-bold text-gray-500">BATAL</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
