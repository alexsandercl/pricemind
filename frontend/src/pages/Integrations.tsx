import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Store, ShoppingCart, RefreshCw, Trash2, Link as LinkIcon, Check, X } from 'lucide-react';

export default function Integrations({ onBack }: { onBack: () => void }) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShopifyModal, setShowShopifyModal] = useState(false);
  const [showWooModal, setShowWooModal] = useState(false);

  // Shopify form
  const [shopifyStore, setShopifyStore] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [connectingShopify, setConnectingShopify] = useState(false);

  // WooCommerce form
  const [wooUrl, setWooUrl] = useState('');
  const [wooKey, setWooKey] = useState('');
  const [wooSecret, setWooSecret] = useState('');
  const [connectingWoo, setConnectingWoo] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const [shopifyRes, wooRes] = await Promise.all([
        api.get('/shopify/integrations'),
        api.get('/woocommerce/integrations')
      ]);

      const all = [
        ...shopifyRes.data.integrations.map((i: any) => ({ ...i, platform: 'shopify' })),
        ...wooRes.data.integrations.map((i: any) => ({ ...i, platform: 'woocommerce' }))
      ];

      setIntegrations(all);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function connectShopify() {
    if (!shopifyStore || !shopifyToken) {
      alert('Preencha todos os campos');
      return;
    }

    setConnectingShopify(true);
    try {
      await api.post('/shopify/connect', {
        storeName: shopifyStore,
        accessToken: shopifyToken
      });

      alert('Shopify conectado com sucesso!');
      setShowShopifyModal(false);
      setShopifyStore('');
      setShopifyToken('');
      loadIntegrations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao conectar Shopify');
    } finally {
      setConnectingShopify(false);
    }
  }

  async function connectWooCommerce() {
    if (!wooUrl || !wooKey || !wooSecret) {
      alert('Preencha todos os campos');
      return;
    }

    setConnectingWoo(true);
    try {
      await api.post('/woocommerce/connect', {
        storeUrl: wooUrl,
        consumerKey: wooKey,
        consumerSecret: wooSecret
      });

      alert('WooCommerce conectado com sucesso!');
      setShowWooModal(false);
      setWooUrl('');
      setWooKey('');
      setWooSecret('');
      loadIntegrations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao conectar WooCommerce');
    } finally {
      setConnectingWoo(false);
    }
  }

  async function syncIntegration(id: string) {
    try {
      await api.post(`/shopify/sync/${id}`);
      alert('Sincronização iniciada!');
      loadIntegrations();
    } catch (error) {
      alert('Erro ao sincronizar');
    }
  }

  async function deleteIntegration(id: string, platform: string) {
    if (!confirm('Desconectar esta loja?')) return;

    try {
      if (platform === 'shopify') {
        await api.delete(`/shopify/disconnect/${id}`);
      } else {
        await api.delete(`/woocommerce/disconnect/${id}`);
      }
      loadIntegrations();
    } catch (error) {
      alert('Erro ao desconectar');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Carregando integrações...
      </div>
    );
  }

  return (
    <>
      <div className="gold-bg" />
      
      <div className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 pb-12 sm:pb-20 text-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <LinkIcon className="text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Integrações E-commerce</h1>
                <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full font-bold">
                  🔗 BUSINESS EXCLUSIVO
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Conecte suas lojas e sincronize preços automaticamente
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full sm:w-auto text-sm text-zinc-400 hover:text-yellow-400 transition"
          >
            ← Voltar
          </button>
        </div>

        {/* Botões de Conexão */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-5xl mx-auto">
          <button
            onClick={() => setShowShopifyModal(true)}
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-green-500/50 transition text-left"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">Shopify</h3>
                <p className="text-xs sm:text-sm text-zinc-400">Conectar loja Shopify</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500">
              Sincronize produtos e atualize preços diretamente na sua loja Shopify
            </p>
          </button>

          <button
            onClick={() => setShowWooModal(true)}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 transition text-left"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">WooCommerce</h3>
                <p className="text-xs sm:text-sm text-zinc-400">Conectar loja WooCommerce</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500">
              Integre seu WordPress + WooCommerce e gerencie preços facilmente
            </p>
          </button>
        </div>

        {/* Integrações Ativas */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Lojas Conectadas</h2>

          {integrations.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-8 sm:p-12 text-center">
              <p className="text-zinc-400">Nenhuma loja conectada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop */}
              <div className="hidden lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Plataforma</th>
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Loja</th>
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Última Sinc</th>
                      <th className="text-right p-4 text-sm font-semibold text-zinc-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((integration) => (
                      <tr key={integration.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                        <td className="p-4">
                          {integration.platform === 'shopify' ? (
                            <div className="flex items-center gap-2">
                              <Store className="text-green-400" size={20} />
                              <span>Shopify</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="text-purple-400" size={20} />
                              <span>WooCommerce</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 break-words">
                          {integration.platform === 'shopify' 
                            ? integration.storeName 
                            : integration.storeUrl}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            integration.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {integration.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-zinc-400">
                          {integration.lastSync 
                            ? new Date(integration.lastSync).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => syncIntegration(integration.id)}
                              className="p-2 hover:bg-zinc-800 rounded-lg transition"
                              title="Sincronizar"
                            >
                              <RefreshCw size={18} />
                            </button>
                            <button
                              onClick={() => deleteIntegration(integration.id, integration.platform)}
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                              title="Desconectar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="lg:hidden space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {integration.platform === 'shopify' ? (
                          <>
                            <Store className="text-green-400" size={20} />
                            <span className="font-bold">Shopify</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="text-purple-400" size={20} />
                            <span className="font-bold">WooCommerce</span>
                          </>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        integration.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {integration.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-300 mb-2 break-words">
                      {integration.platform === 'shopify' 
                        ? integration.storeName 
                        : integration.storeUrl}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">
                        Última sinc: {integration.lastSync 
                          ? new Date(integration.lastSync).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => syncIntegration(integration.id)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => deleteIntegration(integration.id, integration.platform)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL SHOPIFY */}
        {showShopifyModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">Conectar Shopify</h3>
                <button
                  onClick={() => setShowShopifyModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Nome da Loja</label>
                  <input
                    type="text"
                    value={shopifyStore}
                    onChange={(e) => setShopifyStore(e.target.value)}
                    placeholder="minhaloja.myshopify.com"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-green-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Access Token</label>
                  <input
                    type="password"
                    value={shopifyToken}
                    onChange={(e) => setShopifyToken(e.target.value)}
                    placeholder="shpat_xxxxx"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-green-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <button
                  onClick={connectShopify}
                  disabled={connectingShopify}
                  className="w-full py-3 sm:py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {connectingShopify ? 'Conectando...' : 'Conectar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL WOOCOMMERCE */}
        {showWooModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">Conectar WooCommerce</h3>
                <button
                  onClick={() => setShowWooModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-300 mb-2">URL da Loja</label>
                  <input
                    type="url"
                    value={wooUrl}
                    onChange={(e) => setWooUrl(e.target.value)}
                    placeholder="https://minhaloja.com.br"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-purple-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Consumer Key</label>
                  <input
                    type="text"
                    value={wooKey}
                    onChange={(e) => setWooKey(e.target.value)}
                    placeholder="ck_xxxxx"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-purple-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Consumer Secret</label>
                  <input
                    type="password"
                    value={wooSecret}
                    onChange={(e) => setWooSecret(e.target.value)}
                    placeholder="cs_xxxxx"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-purple-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <button
                  onClick={connectWooCommerce}
                  disabled={connectingWoo}
                  className="w-full py-3 sm:py-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {connectingWoo ? 'Conectando...' : 'Conectar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}