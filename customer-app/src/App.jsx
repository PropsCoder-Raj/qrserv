import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './contexts/CartContext';
import Welcome from './pages/Welcome';
import Menu from './pages/Menu';
import MenuPdfSlideshow from './pages/MenuPdfSlideshow';
import Cart from './pages/Cart';
import OrderStatus from './pages/OrderStatus';
import OrderHistory from './pages/OrderHistory';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/restaurant/:restaurantId" element={<Menu />} />
          <Route path="/restaurant/:restaurantId/menu-pdf" element={<MenuPdfSlideshow />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order/:orderId" element={<OrderStatus />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
    </CartProvider>
  );
}
