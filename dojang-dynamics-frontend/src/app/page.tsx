'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Package,
  X,
  Upload,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { productsApi, uploadApi, type Product } from '@/lib/api';
import { formatPrice, slugify } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Schemas ────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password required'),
});

const ProductSchema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  description: z.string().min(10, 'Description required'),
  priceCents: z.coerce.number().int().positive('Must be positive'),
  category: z.string().min(1, 'Category required'),
  currency: z.string().default('usd'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  images: z.array(z.string()).min(1, 'At least one image required'),
});

type LoginForm = z.infer<typeof LoginSchema>;
type ProductForm = z.infer<typeof ProductSchema>;

// ─── Login ───────────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="font-display text-white text-2xl">D</span>
          </div>
          <h1 className="font-display text-4xl tracking-widest text-white">ADMIN</h1>
          <p className="text-white/30 font-mono text-xs mt-2">DOJANG DYNAMICS</p>
        </div>

        <div className="bg-obsidian-900 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1.5 w-full px-4 py-3 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 font-body"
                placeholder="admin@dojangdynamics.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-10 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white py-3.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Product Modal ───────────────────────────────────────────────────────────
interface ProductModalProps {
  product?: Product | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

function ProductModal({ product, token, onClose, onSaved }: ProductModalProps) {
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(ProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          priceCents: product.priceCents,
          category: product.category,
          currency: product.currency,
          featured: product.featured,
          active: product.active,
          images: product.images,
        }
      : { currency: 'usd', featured: false, active: true, images: [] },
  });

  const images = watch('images');
  const name = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!product && name) {
      setValue('slug', slugify(name));
    }
  }, [name, product, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await uploadApi.uploadImages(files, token);
      setValue('images', [...images, ...urls]);
    } catch {
      setToast({ type: 'error', msg: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      if (product) {
        await productsApi.update(product.id, data, token);
        setToast({ type: 'success', msg: 'Product updated' });
      } else {
        await productsApi.create(data, token);
        setToast({ type: 'success', msg: 'Product created' });
      }
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    } catch (err: unknown) {
      setToast({
        type: 'error',
        msg: (err as Error).message || 'Operation failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl bg-obsidian-900 border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="font-display tracking-widest text-lg text-white">
            {product ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-6 py-6 space-y-5">
            {toast && (
              <div
                className={cn(
                  'flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border',
                  toast.type === 'success'
                    ? 'text-jade-400 bg-jade-400/10 border-jade-400/20'
                    : 'text-red-400 bg-red-400/10 border-red-400/20'
                )}
              >
                {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {toast.msg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Name</label>
                <input
                  {...register('name')}
                  className="mt-1.5 w-full px-4 py-2.5 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Slug</label>
                <input
                  {...register('slug')}
                  className="mt-1.5 w-full px-4 py-2.5 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 font-mono"
                />
                {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Category</label>
                <input
                  {...register('category')}
                  className="mt-1.5 w-full px-4 py-2.5 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50"
                  placeholder="gi, rashguard, shorts…"
                />
                {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Price (cents)</label>
                <input
                  {...register('priceCents')}
                  type="number"
                  className="mt-1.5 w-full px-4 py-2.5 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 font-mono"
                  placeholder="18900"
                />
                {errors.priceCents && (
                  <p className="text-red-400 text-xs mt-1">{errors.priceCents.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Currency</label>
                <select
                  {...register('currency')}
                  className="mt-1.5 w-full px-4 py-2.5 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50"
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="mt-1.5 w-full px-4 py-2.5 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 resize-none"
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3">
                <Controller
                  name="featured"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          'w-10 h-5 rounded-full transition-colors relative',
                          field.value ? 'bg-accent' : 'bg-white/20'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                            field.value ? 'translate-x-5' : 'translate-x-0.5'
                          )}
                        />
                      </div>
                      <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Featured</span>
                    </label>
                  )}
                />
              </div>

              <div className="flex items-center gap-3">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          'w-10 h-5 rounded-full transition-colors relative',
                          field.value ? 'bg-jade-500' : 'bg-white/20'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                            field.value ? 'translate-x-5' : 'translate-x-0.5'
                          )}
                        />
                      </div>
                      <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Active</span>
                    </label>
                  )}
                />
              </div>

              {/* Images */}
              <div className="col-span-2">
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Images</label>
                {errors.images && (
                  <p className="text-red-400 text-xs mt-1">{errors.images.message}</p>
                )}

                {/* Image list */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setValue('images', images.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  ))}

                  {/* Upload button */}
                  <label className="w-16 h-16 rounded-lg border border-dashed border-white/20 hover:border-accent/50 flex items-center justify-center cursor-pointer transition-colors">
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin text-white/40" />
                    ) : (
                      <Upload size={14} className="text-white/40" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Or paste URL */}
                <input
                  type="text"
                  placeholder="Or paste image URL and press Enter"
                  className="mt-2 w-full px-4 py-2.5 bg-obsidian-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent/50 placeholder:text-white/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        setValue('images', [...images, val]);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard() {
  const { user, token, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await productsApi.getAllAdmin(token);
      setProducts(res.products);
    } catch (err) {
      console.error('Failed to fetch admin products:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await productsApi.delete(id, token);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-16 md:w-56 bg-obsidian-900 border-r border-white/5 flex flex-col z-10">
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="font-display text-white text-base">D</span>
          </div>
          <span className="hidden md:block ml-3 font-display tracking-wider text-sm text-white">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 p-3">
          <div className="flex md:flex-row flex-col items-center md:items-start gap-1 p-2 rounded-lg bg-accent/10 border border-accent/20">
            <Package size={16} className="text-accent flex-shrink-0" />
            <span className="hidden md:block text-sm text-accent font-medium ml-2">Products</span>
          </div>
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start gap-2 p-2 text-white/30 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5"
          >
            <LogOut size={14} />
            <span className="hidden md:block">Logout</span>
          </button>
          <p className="hidden md:block text-[10px] font-mono text-white/20 mt-2 px-2 truncate">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="ml-16 md:ml-56 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl tracking-widest text-white">PRODUCTS</h1>
            <p className="text-white/30 font-mono text-xs mt-1">{products.length} total</p>
          </div>
          <button
            onClick={() => {
              setEditProduct(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span>New Product</span>
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-obsidian-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-obsidian-900 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-xs font-mono text-white/30 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-mono text-white/30 uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-mono text-white/30 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-mono text-white/30 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-obsidian-800 flex-shrink-0">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-body text-white">{product.name}</p>
                            <p className="text-xs font-mono text-white/30">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-xs font-mono text-white/40 capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-display text-accent text-lg">
                          {formatPrice(product.priceCents, product.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs font-mono px-2 py-0.5 rounded-full',
                              product.active
                                ? 'bg-jade-500/20 text-jade-400'
                                : 'bg-white/10 text-white/30'
                            )}
                          >
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                          {product.featured && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditProduct(product);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-white/30 hover:text-white transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="py-16 text-center">
                <Package size={40} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/20 font-body text-sm">No products yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {modalOpen && token && (
          <ProductModal
            product={editProduct}
            token={token}
            onClose={() => setModalOpen(false)}
            onSaved={fetchProducts}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-obsidian-900 border border-red-400/20 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="font-display tracking-wider text-xl text-white mb-2">DELETE PRODUCT</h3>
              <p className="text-white/40 text-sm mb-6">
                This will deactivate the product. This action can be undone via the API.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-white/10 rounded-lg text-white/50 text-sm hover:border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-500 rounded-lg text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Admin Page ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <LoginPage />;
  return <Dashboard />;
}
