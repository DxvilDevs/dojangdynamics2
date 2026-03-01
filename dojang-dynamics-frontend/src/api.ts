const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData: { error?: string; details?: unknown } = {};
    try {
      errorData = await res.json();
    } catch {}
    throw new ApiError(res.status, errorData.error || `HTTP ${res.status}`, errorData.details);
  }

  return res.json() as Promise<T>;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<{ id: string; email: string; role: string }>('/auth/me', {}, token),
};

// Products
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[];
  category: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
}

export const productsApi = {
  getAll: (params?: {
    category?: string;
    featured?: boolean;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.featured !== undefined) query.set('featured', String(params.featured));
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.order) query.set('order', params.order);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    return request<ProductsResponse>(`/products?${query.toString()}`);
  },

  getBySlug: (slug: string) => request<Product>(`/products/${slug}`),

  getAllAdmin: (token: string) =>
    request<ProductsResponse>('/products/admin/all', {}, token),

  create: (data: Partial<Product>, token: string) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }, token),

  update: (id: string, data: Partial<Product>, token: string) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }, token),
};

// Orders
export interface CartItem {
  productId: string;
  quantity: number;
}

export const ordersApi = {
  createCheckoutSession: (cart: CartItem[], customerEmail?: string) =>
    request<{ url: string; sessionId: string }>('/orders/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ cart, customerEmail }),
    }),

  getAll: (token: string) =>
    request<{ orders: unknown[] }>('/orders', {}, token),
};

// Upload
export const uploadApi = {
  uploadImages: async (files: File[], token: string): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new ApiError(res.status, err.error || 'Upload failed');
    }

    const data = await res.json();
    return data.urls as string[];
  },
};

export { ApiError };
