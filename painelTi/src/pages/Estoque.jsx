// src/components/Estoque.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const Estoque = () => {
  const [itens, setItens] = useState([]);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [quantidade, setQuantidade] = useState(0);
  const [selectedItem, setSelectedItem] = useState("");

  useEffect(() => {
    const fetchItens = async () => {
      const querySnapshot = await getDocs(collection(db, "estoque"));
      const itemList = [];
      querySnapshot.forEach((doc) => {
        itemList.push({ id: doc.id, ...doc.data() });
      });
      setItens(itemList);
    };

    fetchItens();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (quantidade) {
      if (selectedItem) {
        const existingItem = itens.find(item => item.id === selectedItem);
        const newQuantity = existingItem.quantidade + Number(quantidade);
        const itemRef = doc(db, "estoque", existingItem.id);
        await updateDoc(itemRef, { quantidade: newQuantity });

        setItens(itens.map(item =>
          item.id === existingItem.id ? { ...item, quantidade: newQuantity } : item
        ));
      } else if (nome && categoria) {
        const newItem = { nome, categoria, quantidade: Number(quantidade) };
        const docRef = await addDoc(collection(db, "estoque"), newItem);

        setItens([...itens, { id: docRef.id, ...newItem }]);
      }

      setNome("");
      setCategoria("");
      setQuantidade(0);
      setSelectedItem("");
    }
  };

  const handleRemoveOneUnit = async (id) => {
    const item = itens.find(item => item.id === id);
    if (item.quantidade > 1) {
      const newQuantity = item.quantidade - 1;
      const itemRef = doc(db, "estoque", id);
      await updateDoc(itemRef, { quantidade: newQuantity });
      setItens(itens.map(i =>
        i.id === id ? { ...i, quantidade: newQuantity } : i
      ));
    } else {
      await deleteDoc(doc(db, "estoque", id));
      setItens(itens.filter(item => item.id !== id));
    }
  };

  const categorias = [...new Set(itens.map(item => item.categoria))];

  return (
    <div className="container mx-auto p-4 pt-20">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Estoque</h1>
      <form onSubmit={handleAddItem} className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Nome do Item</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              disabled={selectedItem}
              required={!selectedItem}
            />
          </div>
          <div>
            <label className="block mb-1">Categoria</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              disabled={selectedItem}
              required={!selectedItem}
            />
          </div>
          <div>
            <label className="block mb-1">Quantidade</label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block mb-1">Selecionar Item Existente</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itens.map(item => (
              <label key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedItem === item.id}
                  onChange={() => setSelectedItem(selectedItem === item.id ? "" : item.id)}
                  className="mr-2"
                />
                {item.nome} ({item.categoria}) - {item.quantidade}
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
        >
          Adicionar Item
        </button>
      </form>

      <div>
        {categorias.map((cat) => (
          <div key={cat} className="mb-4">
            <h2 className="text-xl font-bold mb-2">{cat}</h2>
            <ul>
              {itens.filter(item => item.categoria === cat).map(item => (
                <li key={item.id} className="flex justify-between items-center p-2 border-b">
                  <span>{item.nome} - {item.quantidade}</span>
                  <button
                    onClick={() => handleRemoveOneUnit(item.id)}
                    className="bg-red-500 text-white p-1 rounded"
                  >
                    Remover 1 Unidade
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Estoque;
