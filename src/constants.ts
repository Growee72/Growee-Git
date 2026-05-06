import { Product, User, UserRole } from './types';

export const INITIAL_PRODUCTS: Product[] = [
    { id: "makanan-1", name: "Mie Ayam Balunijuk", price: 10000, img: "https://images.pexels.com/photos/31087591/pexels-photo-31087591.jpeg", stock: 25, umkm_address_text: "Jl. Balunijuk Permai No. 12, Pangkalpinang, Bangka", recommended: true },
    { id: "makanan-2", name: "Nasi Goreng Komplit", price: 16000, img: "https://images.pexels.com/photos/5409019/pexels-photo-5409019.jpeg", stock: 30, umkm_address_text: "Depan Kantor Gubernur, Air Itam, Pangkalpinang", recommended: true },
    { id: "makanan-3", name: "Bakso Bangka", price: 15000, img: "https://images.pexels.com/photos/6146323/pexels-photo-6146323.jpeg", stock: 20, umkm_address_text: "Jl. Solan, Belakang Kampus UBB", recommended: false },
    { id: "makanan-4", name: "Ayam Geprek Sambal Matah", price: 10000, img: "https://images.pexels.com/photos/28732304/pexels-photo-28732304.jpeg", stock: 20, umkm_address_text: "", recommended: false },
    { id: "makanan-5", name: "Nasi Uduk Mantap", price: 17000, img: "https://images.pexels.com/photos/5963873/pexels-photo-5963873.jpeg", stock: 35, umkm_address_text: "", recommended: false },
    { id: "makanan-6", name: "Soto Ayam Paling Enak", price: 18000, img: "https://images.pexels.com/photos/10066715/pexels-photo-10066715.jpeg", stock: 40, umkm_address_text: "", recommended: false }
];

export const INITIAL_USERS: User[] = [
    { email: "growee@gmail.com", password: "123456", role: UserRole.SELLER, name: "Admin Seller Growee" },
    { email: "songraebin475@gmail.com", password: "123456", role: UserRole.BUYER, name: "Buyer Demo", contact: "081234567890", address: "Jl. Demo No. 1, Jakarta" }
];

export const DEFAULT_MAP_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.970514123514!2d106.11295287429188!3d-2.1434914980749026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e22c1598585671d%3A0xc3d5b001a1c43734!2sBalunijuk%2C%20Kec.%20Merawang%2C%20Kabupaten%20Bangka%2C%20Kepulauan%20Bangka%20Belitung!5e0!3m2!1sid!2sid!4v1709289139366!5m2!1sid!2sid';
