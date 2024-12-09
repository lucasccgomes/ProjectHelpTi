import React, { useState } from "react";
import Papa from "papaparse";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Substitua pelo caminho correto para sua configuração do Firebase

const ImportContatos = () => {
  const [arquivo, setArquivo] = useState(null);
  const [status, setStatus] = useState("");

  const handleArquivoChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  const handleImportar = () => {
    if (!arquivo) {
      setStatus("Por favor, selecione um arquivo.");
      console.log("Nenhum arquivo selecionado.");
      return;
    }

    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: true,
      complete: async (resultado) => {
        const contatos = resultado.data;

        console.log("Dados processados do arquivo CSV:", contatos);

        setStatus("Importando...");

        try {
          const promises = contatos.map(async (contato) => {
            // Mapeia os campos do CSV para os campos usados no Firebase
            const nome = contato["First Name"] || contato["Nome"];
            const telefone = contato["Phone 1 - Value"] || contato["Telefone"];

            if (nome && telefone) {
              const docRef = await addDoc(collection(db, "webPanfleto"), {
                nome,
                telefone,
              });

              // Log para cada contato salvo
              console.log(`Contato salvo: ID=${docRef.id}, Nome=${nome}, Telefone=${telefone}`);
            } else {
              console.warn("Contato inválido (faltando Nome ou Telefone):", contato);
            }
          });

          await Promise.all(promises);

          setStatus("Importação concluída com sucesso!");
          console.log("Todos os contatos foram importados com sucesso.");
        } catch (error) {
          console.error("Erro ao salvar os contatos no Firebase:", error);
          setStatus("Erro ao importar os contatos. Verifique o console.");
        }
      },
      error: (error) => {
        console.error("Erro ao processar o arquivo CSV:", error);
        setStatus("Erro ao processar o arquivo. Verifique o console.");
      },
    });
  };

  return (
    <div className="p-4 bg-primaryBlueDark m-4 shadow-md rounded-md">
      <h2 className="text-lg font-bold mb-4 text-white">Importar Contatos</h2>
      <div className="flex flex-row justify-between gap-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleArquivoChange}
          className="border border-gray-300 bg-white p-2 rounded-md"
        />
        <button
          onClick={handleImportar}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Importar Contatos
        </button>
        {status && <p className="text-sm text-gray-700 mt-2">{status}</p>}
      </div>
    </div>
  );
};

export default ImportContatos;
