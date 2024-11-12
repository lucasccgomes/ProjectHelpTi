import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Importe o caminho correto do AuthContext

const EtiquetaPersonalizada = () => {
  const { currentUser } = useAuth(); // Usa o contexto para obter o usuário logado
  const remetente = currentUser ? currentUser.user : 'Usuário não logado'; // Nome do remetente
  const VITE_ETIQUETA_API_URL = import.meta.env.VITE_ETIQUETA;

  const [formData, setFormData] = useState({
    data: '',
    loja: '',
    cidade: '',
    ac: '',
    itens: [{ nome: '', quantidade: '' }],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.itens];
    newItems[index][field] = value;
    setFormData({ ...formData, itens: newItems });
  };

  const addItem = () => {
    if (formData.itens.length < 4) {
      setFormData({ ...formData, itens: [...formData.itens, { nome: '', quantidade: '' }] });
    }
  };

  const removeItem = (index) => {
    const newItems = formData.itens.filter((_, i) => i !== index);
    setFormData({ ...formData, itens: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(VITE_ETIQUETA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, remetente }), // Inclui o remetente automaticamente
      });
      const data = await response.json();

    } catch (error) {
  
    }
  };

  return (
    <div className="container mx-auto p-4 mt-20">
      <h2 className="text-2xl text-center shadow-md font-bold mb-4 bg-primaryBlueDark text-white p-4 rounded-md">Etiqueta Para Envio</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold text-white">Data</label>
          <input
            type="date"
            name="data"
            value={formData.data}
            onChange={handleChange}
            className="border rounded-md shadow-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-white">Destinatário</label>
          <input
            type="text"
            name="loja"
            value={formData.loja}
            onChange={handleChange}
            className="border p-2 w-full rounded-md shadow-md"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-white">Cidade</label>
          <input
            type="text"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            className="border p-2 w-full rounded-md shadow-md"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-white">A/C</label>
          <input
            type="text"
            name="ac"
            value={formData.ac}
            onChange={handleChange}
            className="border p-2 w-full rounded-md shadow-md"
            required
          />
        </div>

        {formData.itens.map((item, index) => (
          <div key={index} className="flex space-x-2 items-center">
            <input
              type="text"
              placeholder="Nome do Item"
              value={item.nome}
              onChange={(e) => handleItemChange(index, 'nome', e.target.value)}
              className="border p-2 w-full rounded-md shadow-md"
              required
            />
            <input
              type="number"
              placeholder="Quantidade"
              value={item.quantidade}
              onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
              className="border p-2 w-24 rounded-md shadow-md"
              required
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="bg-red-500 text-white rounded p-2"
            >
              Remover
            </button>
          </div>
        ))}
        <div className="flex justify-between">
          {formData.itens.length < 4 && (
            <button
              type="button"
              onClick={addItem}
              className="bg-green-500 shadow-md text-white p-2 rounded"
            >
              + Adicionar Item
            </button>
          )}

          <button type="submit" className="bg-primaryBlueDark shadow-md text-white py-2 px-4 rounded">
            Enviar Impressão
          </button>
        </div>
      </form>
    </div>
  );
};

export default EtiquetaPersonalizada;
