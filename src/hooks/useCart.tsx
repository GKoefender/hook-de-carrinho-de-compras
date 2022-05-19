import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider ({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)

      const response = await api.get(`stock/${productId}`)
      const productStock = response.data.amount

      if (productExists) {
        if (productExists.amount + 1 > productStock) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart.map(product =>
          product.id === productId ? {
            ...product,
            amount: product.amount + 1
          } : product
        )

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        if (productStock === 0) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const response = await api.get(`products/${productId}`)
        const productInStock = response.data
        const newProduct = {
          ...productInStock,
          amount: 1
        }

        const newCart = [...cart, newProduct]
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)
      if (!productExists) {
        toast.error('Erro na remoção do produto');
        return
      }

      const newCart = cart.filter(product => product.id !== productId)
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get<Stock>(`stock/${productId}`)
      const productStock = response.data.amount

      if (amount > productStock || amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const newCart = cart.map(product => product.id === productId ? {
        ...product,
        amount
      } : product)

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart (): CartContextData {
  const context = useContext(CartContext);

  return context;
}
