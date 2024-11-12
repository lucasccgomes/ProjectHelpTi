import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Funções para Firestore
import { db } from "../../firebase"; // Importa sua configuração do Firebase

export default function WebPanfleto() {
  const [titulo, setTitulo] = useState("");
  const [foto, setFoto] = useState("");
  const [imagens, setImagens] = useState([""]);

  // Função para carregar os dados do Firestore
  async function fetchData() {
    try {
      const docRef = doc(db, "webPanfleto", "drogaliraWebPanfleto");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitulo(data.Titulo01);
        setFoto(data.foto);
        setImagens(data.imagens || [""]);
      } else {
        console.log("Documento não encontrado!");
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  }

  // Carrega os dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, []);

  // Função para salvar as alterações no Firestore
  async function saveData() {
    try {
      const docRef = doc(db, "webPanfleto", "drogaliraWebPanfleto");
      await updateDoc(docRef, {
        Titulo01: titulo,
        foto: foto,
        imagens: imagens,
      });
      alert("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados.");
    }
  }

  // Função para adicionar um novo campo de URL da imagem
  function addImageField() {
    setImagens([...imagens, ""]);
  }

  // Função para remover um campo de URL da imagem
  function removeImageField(index) {
    const newImages = imagens.filter((_, i) => i !== index);
    setImagens(newImages);
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md mt-24">
      <h2 className="text-2xl font-semibold text-center mb-4">Editar Dados</h2>
      
      {/* Campo de Título */}
      <label className="block mb-2 text-sm font-medium text-gray-700">Título</label>
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {/* Campo de URL da Foto */}
      <label className="block mb-2 text-sm font-medium text-gray-700">URL da Foto</label>
      <input
        type="text"
        value={foto}
        onChange={(e) => setFoto(e.target.value)}
        className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {/* Campos de URLs das Imagens */}
      <label className="block mb-2 text-sm font-medium text-gray-700">URLs das Imagens</label>
      {imagens.map((image, index) => (
        <div key={index} className="flex items-center mb-2">
          <input
            type="text"
            value={image}
            onChange={(e) => {
              const newImages = [...imagens];
              newImages[index] = e.target.value;
              setImagens(newImages);
            }}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`URL da Imagem ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => removeImageField(index)}
            className="ml-2 px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            -
          </button>
        </div>
      ))}
      
      {/* Botão para adicionar nova URL de imagem */}
      <button
        type="button"
        onClick={addImageField}
        className="w-full py-2 px-4 mb-4 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        + Adicionar Imagem
      </button>
      
      {/* Botão de Salvar */}
      <button
        onClick={saveData}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Salvar
      </button>
    </div>
  );
}
